const cron = require('node-cron');
const NotificationTask = require('../models/NotificationTask');
const { query } = require('../config/database');
const { beijingNow, beijingFromMs, formatToBeijing } = require('../utils/time');

/**
 * 格式化日期为 YYYY-MM-DD HH:mm:ss 格式
 */
function formatDateTime(dateString) {
  return formatToBeijing(new Date(dateString));
}

/**
 * 增强版提醒调度服务
 * 支持基于规则的自动提醒发送
 */
class NotificationSchedulerEnhanced {
  constructor() {
    this.tasks = [];
  }

  /**
   * 启动调度器
   */
  start() {
    console.log('启动增强版提醒调度器...');

    // 每天早上 9:00 检查节点截止日期提醒
    const deadlineCheckTask = cron.schedule('0 9 * * *', async () => {
      console.log('执行节点截止日期检查...');
      await this.checkNodeDeadlines();
    });

    // 每小时检查一次超期节点
    const overdueCheckTask = cron.schedule('0 * * * *', async () => {
      console.log('检查超期节点...');
      await this.checkOverdueNodes();
    });

    // 每天检查费用支付提醒
    const costCheckTask = cron.schedule('0 9 * * *', async () => {
      console.log('检查费用支付提醒...');
      await this.checkCostPayments();
    });

    this.tasks.push(deadlineCheckTask, overdueCheckTask, costCheckTask);

    console.log('增强版提醒调度器已启动');
    console.log('- 节点截止检查: 每天 9:00');
    console.log('- 超期节点检查: 每小时');
    console.log('- 费用支付检查: 每天 9:00');
  }

  /**
   * 停止调度器
   */
  stop() {
    console.log('停止提醒调度器...');
    this.tasks.forEach(task => task.stop());
    this.tasks = [];
    console.log('提醒调度器已停止');
  }

  /**
   * 检查节点截止日期提醒
   * 根据规则设置，在截止日期前N天发送提醒
   */
  async checkNodeDeadlines() {
    try {
      // 获取所有启用的截止日期提醒规则
      const rules = await query(`
        SELECT * FROM notification_rules 
        WHERE rule_type = 'deadline' 
        AND is_enabled = 1
      `);

      console.log(`找到 ${rules.length} 条截止日期提醒规则`);

      for (const rule of rules) {
        await this.processDeadlineRule(rule);
      }
    } catch (error) {
      console.error('检查节点截止日期失败:', error);
    }
  }

  /**
   * 处理单个截止日期规则
   */
  async processDeadlineRule(rule) {
    try {
      const { threshold_value, threshold_unit, frequency } = rule;
      
      // 计算提前天数
      let daysAhead = 0;
      if (threshold_unit === 'days' || threshold_unit === '天') {
        daysAhead = threshold_value;
      } else if (threshold_unit === 'hours' || threshold_unit === '小时') {
        daysAhead = threshold_value / 24;
      }

      console.log(`处理规则: 提前 ${daysAhead} 天提醒，频率: ${frequency}`);

      // 查询符合条件的节点
      // 截止日期在 daysAhead 天后，且还未完成，且必须有关联的案件
      const nodes = await query(`
        SELECT 
          pn.*,
          c.case_number,
          c.internal_number,
          c.handler,
          c.id as caseId
        FROM process_nodes pn
        LEFT JOIN cases c ON pn.case_id = c.id
        WHERE pn.status IN ('待处理', '进行中', 'pending', 'in_progress')
        AND pn.deadline IS NOT NULL
        AND julianday(pn.deadline) - julianday('now') <= ?
        AND julianday(pn.deadline) - julianday('now') > 0
        AND pn.case_id IS NOT NULL
        AND c.id IS NOT NULL
      `, [daysAhead]);

      console.log(`找到 ${nodes.length} 个即将到期的节点`);

      for (const node of nodes) {
        // 根据频率检查是否应该创建新的提醒
        const shouldCreate = await this.shouldCreateNotification(
          node.id,
          'process_node',
          'deadline',
          frequency
        );

        if (shouldCreate) {
          // 计算剩余天数
          const daysLeft = Math.ceil(
            (new Date(node.deadline) - new Date()) / (1000 * 60 * 60 * 24)
          );

          // 创建提醒
          const formattedDeadline = formatDateTime(node.deadline);
          const caseNumberPart = node.case_number ? `${node.case_number}` : '';
          const content = `${caseNumberPart}案件节点"${node.node_name}"将在 ${daysLeft} 天后到期（截止日期：${formattedDeadline}），请及时处理。`;
          
          await NotificationTask.create({
            related_id: node.id,
            related_type: 'process_node',
            task_type: 'deadline',
            // 使用后端统一的北京时间
            scheduled_time: beijingNow(),
            content: content,
            status: 'unread'
          });

          console.log(`✓ 创建截止提醒: ${node.case_number} - ${node.node_name} (${daysLeft}天后到期)`);
        } else {
          console.log(`⊘ 跳过提醒: ${node.case_number} - ${node.node_name} (已在${frequency}内发送过)`);
        }
      }
    } catch (error) {
      console.error('处理截止日期规则失败:', error);
    }
  }

  /**
   * 检查超期节点
   */
  async checkOverdueNodes() {
    try {
      // 获取超期规则的频率设置
      const overdueRules = await query(`
        SELECT * FROM notification_rules 
        WHERE rule_type = 'overdue' 
        AND is_enabled = 1
      `);

      const frequency = overdueRules.length > 0 ? overdueRules[0].frequency : 'daily';

      // 查询已超期的节点，且必须有关联的案件
      const nodes = await query(`
        SELECT 
          pn.*,
          c.case_number,
          c.internal_number,
          c.handler,
          c.id as caseId
        FROM process_nodes pn
        LEFT JOIN cases c ON pn.case_id = c.id
        WHERE pn.status IN ('待处理', '进行中', 'pending', 'in_progress')
        AND pn.deadline IS NOT NULL
        AND julianday('now') > julianday(pn.deadline)
        AND pn.case_id IS NOT NULL
        AND c.id IS NOT NULL
      `);

      console.log(`找到 ${nodes.length} 个超期节点，频率: ${frequency}`);

      for (const node of nodes) {
        // 根据频率检查是否应该创建新的提醒
        const shouldCreate = await this.shouldCreateNotification(
          node.id,
          'process_node',
          'overdue',
          frequency
        );

        if (shouldCreate) {
          // 计算超期天数
          const overdueDays = Math.floor(
            (new Date() - new Date(node.deadline)) / (1000 * 60 * 60 * 24)
          );

          // 创建超期提醒
          const formattedDeadline = formatDateTime(node.deadline);
          const caseNumberPart = node.case_number ? `${node.case_number}` : '';
          const content = `【超期警告】${caseNumberPart}案件节点"${node.node_name}"已超期 ${overdueDays} 天（截止日期：${formattedDeadline}），请尽快处理。`;
          
          await NotificationTask.create({
            related_id: node.id,
            related_type: 'process_node',
            task_type: 'overdue',
            scheduled_time: beijingNow(),
            content: content,
            status: 'unread'
          });

          console.log(`✓ 创建超期提醒: ${node.case_number} - ${node.node_name} (超期${overdueDays}天)`);
        } else {
          console.log(`⊘ 跳过超期提醒: ${node.case_number} - ${node.node_name} (已在${frequency}内发送过)`);
        }
      }
    } catch (error) {
      console.error('检查超期节点失败:', error);
    }
  }

  /**
   * 检查费用支付提醒
   */
  async checkCostPayments() {
    try {
      // 获取费用支付规则的频率设置
      const paymentRules = await query(`
        SELECT * FROM notification_rules 
        WHERE rule_type = 'payment' 
        AND is_enabled = 1
      `);

      const frequency = paymentRules.length > 0 ? paymentRules[0].frequency : 'daily';

      // 查询7天内到期的未支付费用，且必须有关联的案件
      const costs = await query(`
        SELECT 
          cr.*,
          c.case_number,
          c.internal_number,
          c.id as caseId
        FROM cost_records cr
        LEFT JOIN cases c ON cr.case_id = c.id
        WHERE cr.status = '未支付'
        AND cr.due_date IS NOT NULL
        AND julianday(cr.due_date) - julianday('now') <= 7
        AND julianday(cr.due_date) - julianday('now') >= 0
        AND cr.case_id IS NOT NULL
        AND c.id IS NOT NULL
      `);

      console.log(`找到 ${costs.length} 笔即将到期的费用，频率: ${frequency}`);

      for (const cost of costs) {
        const shouldCreate = await this.shouldCreateNotification(
          cost.id,
          'cost_record',
          'payment',
          frequency
        );

        if (shouldCreate) {
          const daysLeft = Math.ceil(
            (new Date(cost.due_date) - new Date()) / (1000 * 60 * 60 * 24)
          );

          const formattedDueDate = formatDateTime(cost.due_date);
          const caseNumberPart = cost.case_number ? `${cost.case_number}` : '';
          const content = `${caseNumberPart}案件费用"${cost.cost_type}"将在 ${daysLeft} 天后到期（截止日期：${formattedDueDate}），金额：¥${cost.amount}，请及时支付。`;
          
          await NotificationTask.create({
            related_id: cost.id,
            related_type: 'cost_record',
            task_type: 'payment',
            scheduled_time: beijingNow(),
            content: content,
            status: 'unread'
          });

          console.log(`✓ 创建费用提醒: ${cost.case_number} - ${cost.cost_type} (${daysLeft}天后到期)`);
        } else {
          console.log(`⊘ 跳过费用提醒: ${cost.case_number} - ${cost.cost_type} (已在${frequency}内发送过)`);
        }
      }
    } catch (error) {
      console.error('检查费用支付提醒失败:', error);
    }
  }

  /**
   * 检查是否存在相同的提醒（避免重复发送）
   */
  async checkExistingNotification(relatedId, relatedType, taskType, hoursWindow = 24) {
    try {
  const cutoffTime = beijingFromMs(Date.now() - hoursWindow * 60 * 60 * 1000);
      
      const existing = await query(`
        SELECT * FROM notification_tasks
        WHERE related_id = ?
        AND related_type = ?
        AND task_type = ?
        AND created_at > ?
      `, [relatedId, relatedType, taskType, cutoffTime]);

      return existing.length > 0;
    } catch (error) {
      console.error('检查已存在提醒失败:', error);
      return false;
    }
  }

  /**
   * 根据频率判断是否应该创建新的提醒
   * @param {number} relatedId - 关联对象ID
   * @param {string} relatedType - 关联对象类型
   * @param {string} taskType - 任务类型
   * @param {string} frequency - 提醒频率 (once, daily, weekly, monthly)
   * @returns {Promise<boolean>} 是否应该创建新的提醒
   */
  async shouldCreateNotification(relatedId, relatedType, taskType, frequency = 'once') {
    try {
      // 获取所有相关的提醒
      const existing = await query(`
        SELECT * FROM notification_tasks
        WHERE related_id = ?
        AND related_type = ?
        AND task_type = ?
        ORDER BY created_at DESC
      `, [relatedId, relatedType, taskType]);

      // 如果没有任何提醒，则创建
      if (existing.length === 0) {
        return true;
      }

      // 获取最近的提醒
      const latestNotification = existing[0];
      const latestCreatedAt = new Date(latestNotification.created_at);
      const now = new Date();

      // 根据频率判断是否应该创建新的提醒
      switch (frequency) {
        case 'once':
          // 仅一次：如果已存在任何提醒，则不创建
          return false;

        case 'daily': {
          // 每天：检查最近的提醒是否是今天创建的
          // 使用北京时间进行日期比较
          const todayBeijing = beijingNow().split(' ')[0]; // YYYY-MM-DD
          const latestDateBeijing = formatToBeijing(latestCreatedAt).split(' ')[0]; // YYYY-MM-DD
          
          // 如果最近的提醒是今天创建的，则不创建；否则创建
          return todayBeijing !== latestDateBeijing;
        }

        case 'weekly': {
          // 每周：检查最近的提醒是否是本周创建的
          const now = new Date();
          const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return latestCreatedAt < oneWeekAgo;
        }

        case 'monthly': {
          // 每月：检查最近的提醒是否是本月创建的
          const now = new Date();
          const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return latestCreatedAt < oneMonthAgo;
        }

        default:
          // 默认按每天处理
          const todayBeijing = beijingNow().split(' ')[0];
          const latestDateBeijing = formatToBeijing(latestCreatedAt).split(' ')[0];
          return todayBeijing !== latestDateBeijing;
      }
    } catch (error) {
      console.error('检查是否应该创建提醒失败:', error);
      return true; // 出错时允许创建
    }
  }

  /**
   * 手动触发检查（用于测试）
   */
  async manualCheck() {
    console.log('=== 手动触发提醒检查 ===');
    await this.checkNodeDeadlines();
    await this.checkOverdueNodes();
    await this.checkCostPayments();
    console.log('=== 手动检查完成 ===');
  }

  /**
   * 为特定节点创建提醒（流程流转时调用）
   * 只有节点有关联案件时才创建提醒
   */
  async createNodeNotification(nodeId, notificationType = 'task') {
    try {
      // 获取节点信息，且必须有关联的案件
      const nodes = await query(`
        SELECT 
          pn.*,
          c.case_number,
          c.internal_number,
          c.handler,
          c.id as caseId
        FROM process_nodes pn
        LEFT JOIN cases c ON pn.case_id = c.id
        WHERE pn.id = ?
        AND pn.case_id IS NOT NULL
        AND c.id IS NOT NULL
      `, [nodeId]);

      if (nodes.length === 0) {
        console.log(`节点 ${nodeId} 不存在或没有关联案件，跳过创建提醒`);
        return;
      }

      const node = nodes[0];
      const caseNumberPart = node.case_number ? `${node.case_number}` : '';
      let content = '';
      let taskType = notificationType;

      switch (notificationType) {
        case 'created':
          content = `${caseNumberPart}案件新节点"${node.node_name}"已创建，截止日期：${node.deadline}`;
          taskType = 'task';
          break;
        case 'updated':
          content = `${caseNumberPart}案件节点"${node.node_name}"已更新`;
          taskType = 'task';
          break;
        case 'completed':
          content = `${caseNumberPart}案件节点"${node.node_name}"已完成`;
          taskType = 'task';
          break;
        default:
          content = `${caseNumberPart}案件节点"${node.node_name}"有新动态`;
          taskType = 'task';
      }

      // 创建提醒（使用北京时间）
      await NotificationTask.create({
        related_id: nodeId,
        related_type: 'process_node',
        task_type: taskType,
        scheduled_time: beijingNow(),
        content: content,
        status: 'unread'
      });

      console.log(`✓ 创建节点提醒: ${node.case_number} - ${node.node_name} (${notificationType})`);
    } catch (error) {
      console.error('创建节点提醒失败:', error);
    }
  }
}

// 创建单例
const enhancedScheduler = new NotificationSchedulerEnhanced();

module.exports = enhancedScheduler;
