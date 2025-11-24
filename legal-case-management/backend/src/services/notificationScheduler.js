const cron = require('node-cron');
const NotificationTask = require('../models/NotificationTask');
const NotificationRule = require('../models/NotificationRule');
const ProcessNode = require('../models/ProcessNode');
const CostRecord = require('../models/CostRecord');

/**
 * 提醒调度服务
 */
class NotificationScheduler {
  constructor() {
    this.tasks = [];
  }

  /**
   * 启动调度器
   */
  start() {
    console.log('启动提醒调度器...');

    // 每天早上 9:00 检查待发送的提醒
    const dailyCheckTask = cron.schedule('0 9 * * *', async () => {
      console.log('执行每日提醒检查...');
      await this.checkAndCreateNotifications();
    });

    // 每小时检查一次超期节点
    const hourlyCheckTask = cron.schedule('0 * * * *', async () => {
      console.log('检查超期节点...');
      await this.checkOverdueNodes();
    });

    // 每天检查费用支付提醒
    const costCheckTask = cron.schedule('0 9 * * *', async () => {
      console.log('检查费用支付提醒...');
      await this.checkCostPaymentReminders();
    });

    this.tasks.push(dailyCheckTask, hourlyCheckTask, costCheckTask);

    console.log('提醒调度器已启动');
    console.log('- 每日提醒检查: 每天 9:00');
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
   * 检查并创建提醒任务
   */
  async checkAndCreateNotifications() {
    try {
      // 获取所有启用的规则
      const rules = await NotificationRule.findEnabledRules();

      for (const rule of rules) {
        await this.processRule(rule);
      }

      console.log(`处理了 ${rules.length} 条提醒规则`);
    } catch (error) {
      console.error('检查提醒任务失败:', error);
    }
  }

  /**
   * 处理单个规则
   */
  async processRule(rule) {
    try {
      switch (rule.rule_type) {
        case 'node_deadline':
          await this.processNodeDeadlineRule(rule);
          break;
        case 'cost_payment':
          await this.processCostPaymentRule(rule);
          break;
        case 'node_overdue':
          await this.processNodeOverdueRule(rule);
          break;
        default:
          console.log(`未知的规则类型: ${rule.rule_type}`);
      }
    } catch (error) {
      console.error(`处理规则 ${rule.id} 失败:`, error);
    }
  }

  /**
   * 处理节点截止日期规则
   * 注意：node_deadline 类型已废弃，改用 deadline 类型
   */
  async processNodeDeadlineRule(rule) {
    // 注释掉 node_deadline 类型的生成逻辑
    // 业务中不需要这种类型的提醒，改用 deadline 类型
    console.log('node_deadline 类型已禁用，请使用 deadline 类型');
    
    /*
    try {
      const { threshold_value, threshold_unit } = rule;
      
      // 计算提醒时间点
      const thresholdDays = threshold_unit === 'days' ? threshold_value : 
                           threshold_unit === 'hours' ? threshold_value / 24 : 0;

      // 查询即将到期的节点
      const { query } = require('../config/database');
      const sql = `
        SELECT * FROM process_nodes 
        WHERE status IN ('pending', 'in_progress')
        AND deadline IS NOT NULL
        AND julianday(deadline) - julianday('now') <= ?
        AND julianday(deadline) - julianday('now') > 0
      `;
      
      const nodes = await query(sql, [thresholdDays]);

      for (const node of nodes) {
        // 检查是否已存在相同的提醒
        const existingNotifications = await NotificationTask.findByRelated('process_node', node.id);
        const hasRecentNotification = existingNotifications.some(n => 
          n.status === 'pending' && 
          new Date(n.scheduled_time) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        );

        if (!hasRecentNotification) {
          // 创建提醒任务
          await NotificationTask.create({
            related_id: node.id,
            related_type: 'process_node',
            task_type: 'node_deadline',
            scheduled_time: new Date().toISOString(),
            content: `流程节点"${node.node_name}"即将到期，截止时间：${node.deadline}`,
            status: 'pending'
          });

          console.log(`创建节点截止提醒: ${node.node_name}`);
        }
      }
    } catch (error) {
      console.error('处理节点截止日期规则失败:', error);
    }
    */
  }

  /**
   * 处理费用支付规则
   */
  async processCostPaymentRule(rule) {
    try {
      const { threshold_value, threshold_unit } = rule;
      
      const thresholdDays = threshold_unit === 'days' ? threshold_value : 
                           threshold_unit === 'hours' ? threshold_value / 24 : 0;

      // 查询即将到期的费用
      const { query } = require('../config/database');
      const sql = `
        SELECT * FROM cost_records 
        WHERE status = 'unpaid'
        AND due_date IS NOT NULL
        AND julianday(due_date) - julianday('now') <= ?
        AND julianday(due_date) - julianday('now') > 0
      `;
      
      const costs = await query(sql, [thresholdDays]);

      for (const cost of costs) {
        // 检查是否已存在相同的提醒
        const existingNotifications = await NotificationTask.findByRelated('cost_record', cost.id);
        const hasRecentNotification = existingNotifications.some(n => 
          n.status === 'pending' && 
          new Date(n.scheduled_time) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        );

        if (!hasRecentNotification) {
          // 创建提醒任务
          await NotificationTask.create({
            related_id: cost.id,
            related_type: 'cost_record',
            task_type: 'cost_payment',
            scheduled_time: new Date().toISOString(),
            content: `费用"${cost.cost_type}"即将到期，金额：${cost.amount}元，到期日期：${cost.due_date}`,
            status: 'pending'
          });

          console.log(`创建费用支付提醒: ${cost.cost_type} - ${cost.amount}元`);
        }
      }
    } catch (error) {
      console.error('处理费用支付规则失败:', error);
    }
  }

  /**
   * 处理节点超期规则
   */
  async processNodeOverdueRule(rule) {
    try {
      // 查询已超期的节点
      const { query } = require('../config/database');
      const sql = `
        SELECT * FROM process_nodes 
        WHERE status IN ('pending', 'in_progress')
        AND deadline IS NOT NULL
        AND julianday('now') > julianday(deadline)
      `;
      
      const nodes = await query(sql);

      for (const node of nodes) {
        // 检查是否已存在相同的提醒
        const existingNotifications = await NotificationTask.findByRelated('process_node', node.id);
        const hasRecentNotification = existingNotifications.some(n => 
          n.task_type === 'node_overdue' &&
          n.status === 'pending' && 
          new Date(n.scheduled_time) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        );

        if (!hasRecentNotification) {
          // 计算超期天数
          const overdueDays = Math.floor(
            (new Date() - new Date(node.deadline)) / (1000 * 60 * 60 * 24)
          );

          // 创建提醒任务
          await NotificationTask.create({
            related_id: node.id,
            related_type: 'process_node',
            task_type: 'node_overdue',
            scheduled_time: new Date().toISOString(),
            content: `流程节点"${node.node_name}"已超期 ${overdueDays} 天，截止时间：${node.deadline}`,
            status: 'pending'
          });

          console.log(`创建节点超期预警: ${node.node_name} (超期 ${overdueDays} 天)`);
        }
      }
    } catch (error) {
      console.error('处理节点超期规则失败:', error);
    }
  }

  /**
   * 检查超期节点（独立任务）
   * 注意：node_overdue 类型已废弃，改用 overdue 类型
   */
  async checkOverdueNodes() {
    try {
      const { query } = require('../config/database');
      const sql = `
        SELECT * FROM process_nodes 
        WHERE status IN ('pending', 'in_progress')
        AND deadline IS NOT NULL
        AND julianday('now') > julianday(deadline)
      `;
      
      const nodes = await query(sql);

      // 注释掉 node_overdue 类型的生成逻辑
      // 业务中不需要这种类型的提醒
      /*
      for (const node of nodes) {
        // 检查是否已存在最近的超期提醒
        const existingNotifications = await NotificationTask.findByRelated('process_node', node.id);
        const hasRecentOverdueNotification = existingNotifications.some(n => 
          n.task_type === 'node_overdue' &&
          n.status === 'pending' && 
          new Date(n.scheduled_time) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        );

        if (!hasRecentOverdueNotification) {
          const overdueDays = Math.floor(
            (new Date() - new Date(node.deadline)) / (1000 * 60 * 60 * 24)
          );

          await NotificationTask.create({
            related_id: node.id,
            related_type: 'process_node',
            task_type: 'node_overdue',
            scheduled_time: new Date().toISOString(),
            content: `【超期预警】流程节点"${node.node_name}"已超期 ${overdueDays} 天`,
            status: 'pending'
          });

          console.log(`创建超期预警: ${node.node_name} (超期 ${overdueDays} 天)`);
        }
      }
      */

      console.log(`检查到 ${nodes.length} 个超期节点（node_overdue 类型已禁用）`);
    } catch (error) {
      console.error('检查超期节点失败:', error);
    }
  }

  /**
   * 检查费用支付提醒（独立任务）
   */
  async checkCostPaymentReminders() {
    try {
      const { query } = require('../config/database');
      
      // 查询7天内到期的未支付费用
      const sql = `
        SELECT * FROM cost_records 
        WHERE status = 'unpaid'
        AND due_date IS NOT NULL
        AND julianday(due_date) - julianday('now') <= 7
        AND julianday(due_date) - julianday('now') >= 0
      `;
      
      const costs = await query(sql);

      for (const cost of costs) {
        const existingNotifications = await NotificationTask.findByRelated('cost_record', cost.id);
        const hasRecentNotification = existingNotifications.some(n => 
          n.status === 'pending' && 
          new Date(n.scheduled_time) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        );

        if (!hasRecentNotification) {
          const daysUntilDue = Math.ceil(
            (new Date(cost.due_date) - new Date()) / (1000 * 60 * 60 * 24)
          );

          await NotificationTask.create({
            related_id: cost.id,
            related_type: 'cost_record',
            task_type: 'cost_payment',
            scheduled_time: new Date().toISOString(),
            content: `费用"${cost.cost_type}"将在 ${daysUntilDue} 天后到期，金额：${cost.amount}元`,
            status: 'pending'
          });

          console.log(`创建费用支付提醒: ${cost.cost_type} (${daysUntilDue}天后到期)`);
        }
      }

      console.log(`检查到 ${costs.length} 笔即将到期的费用`);
    } catch (error) {
      console.error('检查费用支付提醒失败:', error);
    }
  }

  /**
   * 手动触发检查（用于测试）
   */
  async manualCheck() {
    console.log('手动触发提醒检查...');
    await this.checkAndCreateNotifications();
    await this.checkOverdueNodes();
    await this.checkCostPaymentReminders();
    console.log('手动检查完成');
  }
}

// 创建单例
const scheduler = new NotificationScheduler();

module.exports = scheduler;
