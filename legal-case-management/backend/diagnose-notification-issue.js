/**
 * 诊断提醒问题
 * 检查案件 AN202511000007 为什么没有收到提醒
 */

const { query } = require('./src/config/database');

async function diagnose() {
  console.log('=== 提醒问题诊断 ===\n');
  console.log('案件内部编号: AN202511000007');
  console.log('截止日期: 2025-11-26');
  console.log('当前日期:', new Date().toISOString().split('T')[0]);
  console.log('');

  try {
    // 1. 查找案件
    console.log('1. 查找案件...');
    const cases = await query(`
      SELECT * FROM cases 
      WHERE case_number LIKE '%AN202511000007%' 
      OR case_number = 'AN202511000007'
    `);
    
    if (cases.length === 0) {
      console.log('❌ 未找到案件 AN202511000007');
      console.log('');
      
      // 显示所有案件
      console.log('数据库中的案件列表:');
      const allCases = await query('SELECT id, case_number, handler FROM cases ORDER BY id DESC LIMIT 10');
      allCases.forEach(c => {
        console.log(`  - ID: ${c.id}, 案号: ${c.case_number}, 经办人: ${c.handler}`);
      });
      return;
    }
    
    const caseInfo = cases[0];
    console.log(`✓ 找到案件: ID=${caseInfo.id}, 案号=${caseInfo.case_number}`);
    console.log('');

    // 2. 查找该案件的流程节点
    console.log('2. 查找流程节点...');
    const nodes = await query(`
      SELECT * FROM process_nodes 
      WHERE case_id = ?
      ORDER BY id
    `, [caseInfo.id]);
    
    if (nodes.length === 0) {
      console.log('❌ 该案件没有流程节点');
      return;
    }
    
    console.log(`✓ 找到 ${nodes.length} 个流程节点:`);
    nodes.forEach(node => {
      console.log(`  - ID: ${node.id}, 节点: ${node.node_name}, 截止: ${node.deadline}, 状态: ${node.status}`);
    });
    console.log('');

    // 3. 查找立案受理节点
    console.log('3. 查找立案受理节点...');
    const filingNode = nodes.find(n => n.node_name === '立案受理' || n.node_name.includes('立案'));
    
    if (!filingNode) {
      console.log('❌ 未找到立案受理节点');
      return;
    }
    
    console.log(`✓ 找到立案受理节点: ID=${filingNode.id}`);
    console.log(`  - 节点名称: ${filingNode.node_name}`);
    console.log(`  - 截止日期: ${filingNode.deadline}`);
    console.log(`  - 状态: ${filingNode.status}`);
    console.log('');

    // 4. 检查截止日期
    console.log('4. 检查截止日期...');
    if (filingNode.deadline !== '2025-11-26') {
      console.log(`⚠️  截止日期不匹配: 期望 2025-11-26, 实际 ${filingNode.deadline}`);
    } else {
      console.log('✓ 截止日期正确: 2025-11-26');
    }
    
    const now = new Date();
    const deadline = new Date(filingNode.deadline);
    const daysUntilDeadline = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    console.log(`  - 距离截止日期: ${daysUntilDeadline} 天`);
    console.log('');

    // 5. 检查提醒规则
    console.log('5. 检查提醒规则...');
    const rules = await query(`
      SELECT * FROM notification_rules 
      WHERE rule_type IN ('deadline', 'node_deadline')
      AND is_enabled = 1
    `);
    
    if (rules.length === 0) {
      console.log('❌ 没有启用的截止日期提醒规则');
      console.log('');
      console.log('建议: 创建提醒规则');
      console.log(`
INSERT INTO notification_rules (
  rule_name, rule_type, threshold_value, threshold_unit, 
  frequency, recipients, is_enabled
) VALUES (
  '节点截止提前3天提醒', 'deadline', 3, 'days', 
  'daily', 'handler', 1
);
      `);
      return;
    }
    
    console.log(`✓ 找到 ${rules.length} 条启用的规则:`);
    rules.forEach(rule => {
      console.log(`  - ${rule.rule_name}: 提前${rule.threshold_value}${rule.threshold_unit}`);
    });
    console.log('');

    // 6. 检查是否应该触发提醒
    console.log('6. 检查是否应该触发提醒...');
    const rule = rules[0];
    const thresholdDays = rule.threshold_unit === 'days' ? rule.threshold_value : rule.threshold_value / 24;
    
    if (daysUntilDeadline <= thresholdDays && daysUntilDeadline > 0) {
      console.log(`✓ 应该触发提醒 (距离截止${daysUntilDeadline}天 <= 阈值${thresholdDays}天)`);
    } else if (daysUntilDeadline <= 0) {
      console.log(`⚠️  节点已超期 (超期${Math.abs(daysUntilDeadline)}天)`);
    } else {
      console.log(`⚠️  还未到提醒时间 (距离截止${daysUntilDeadline}天 > 阈值${thresholdDays}天)`);
    }
    console.log('');

    // 7. 检查已有的提醒
    console.log('7. 检查已有的提醒...');
    const notifications = await query(`
      SELECT * FROM notification_tasks 
      WHERE related_id = ? 
      AND related_type = 'process_node'
      ORDER BY created_at DESC
    `, [filingNode.id]);
    
    if (notifications.length === 0) {
      console.log('❌ 没有找到任何提醒记录');
    } else {
      console.log(`✓ 找到 ${notifications.length} 条提醒记录:`);
      notifications.forEach(notif => {
        console.log(`  - [${notif.task_type}] ${notif.content.substring(0, 50)}... (${notif.status})`);
        console.log(`    创建时间: ${notif.created_at}`);
      });
    }
    console.log('');

    // 8. 检查调度器状态
    console.log('8. 检查调度器状态...');
    console.log('⚠️  无法直接检查调度器是否运行');
    console.log('建议: 检查服务器日志或手动运行调度器');
    console.log('');

    // 9. 诊断结论
    console.log('=== 诊断结论 ===');
    console.log('');
    
    if (notifications.length === 0 && daysUntilDeadline <= thresholdDays && daysUntilDeadline > 0) {
      console.log('❌ 问题确认: 应该有提醒但没有创建');
      console.log('');
      console.log('可能原因:');
      console.log('1. 调度器未启动');
      console.log('2. 调度器运行出错');
      console.log('3. notification_rules 表不存在或规则未正确配置');
      console.log('');
      console.log('解决方案:');
      console.log('1. 手动运行调度器: node test-notification-scheduler.js');
      console.log('2. 检查服务器日志');
      console.log('3. 确保 app.js 中启动了调度器');
    } else if (notifications.length > 0) {
      console.log('✓ 已有提醒记录，请检查前端是否正确显示');
    }

  } catch (error) {
    console.error('诊断失败:', error);
    console.error('');
    console.error('可能的问题:');
    console.error('1. 数据库连接失败');
    console.error('2. 表结构不正确');
    console.error('3. notification_rules 表不存在');
  }
}

// 运行诊断
diagnose().then(() => {
  console.log('\n诊断完成');
  process.exit(0);
}).catch(error => {
  console.error('诊断失败:', error);
  process.exit(1);
});
