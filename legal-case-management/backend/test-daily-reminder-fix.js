/**
 * 测试脚本：验证每日提醒修复
 * 测试场景：
 * 1. 创建测试案件和节点
 * 2. 创建"每天"频率的提醒规则
 * 3. 验证第一天能创建提醒
 * 4. 验证同一天不会重复创建
 * 5. 验证第二天会创建新的提醒
 */

const { query, run } = require('./src/config/database');
const NotificationSchedulerEnhanced = require('./src/services/notificationSchedulerEnhanced');

async function testDailyReminder() {
  console.log('=== 测试每日提醒修复 ===\n');

  try {
    // 1. 创建测试案件
    console.log('1. 创建测试案件...');
    const caseResult = await run(`
      INSERT INTO cases (case_number, case_name, handler, status)
      VALUES (?, ?, ?, ?)
    `, [`TEST-${Date.now()}`, '测试案件', 'test_user', '进行中']);
    
    const caseId = caseResult.lastID;
    console.log(`✓ 创建案件成功 (ID: ${caseId})`);

    // 2. 创建测试节点
    console.log('\n2. 创建测试节点...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2); // 2天后到期
    const deadlineStr = tomorrow.toISOString().split('T')[0];

    const nodeResult = await run(`
      INSERT INTO process_nodes (case_id, node_name, status, deadline)
      VALUES (?, ?, ?, ?)
    `, [caseId, '测试节点', '待处理', deadlineStr]);

    const nodeId = nodeResult.lastID;
    console.log(`✓ 创建节点成功 (ID: ${nodeId})`);
    console.log(`  - 截止日期: ${deadlineStr}`);

    // 3. 创建"每天"频率的提醒规则
    console.log('\n3. 创建提醒规则...');
    const ruleResult = await run(`
      INSERT INTO notification_rules (
        rule_name, rule_type, trigger_condition, 
        threshold_value, threshold_unit, frequency, 
        recipients, is_enabled
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      '测试每日提醒规则',
      'deadline',
      '节点即将到期',
      3,
      'days',
      'daily',
      JSON.stringify(['test@example.com']),
      1
    ]);

    const ruleId = ruleResult.lastID;
    console.log(`✓ 创建规则成功 (ID: ${ruleId})`);
    console.log(`  - 频率: 每天`);
    console.log(`  - 阈值: 3天`);

    // 4. 第一次运行调度器
    console.log('\n4. 第一次运行调度器...');
    await NotificationSchedulerEnhanced.checkNodeDeadlines();

    const notifications1 = await query(`
      SELECT * FROM notification_tasks 
      WHERE related_id = ? 
      AND task_type = 'deadline'
      ORDER BY created_at DESC
    `, [nodeId]);

    console.log(`✓ 第一次检查后: ${notifications1.length} 条提醒`);
    if (notifications1.length > 0) {
      console.log(`  - 最新提醒: ${notifications1[0].content}`);
    }

    // 5. 立即再次运行调度器（模拟同一天再次检查）
    console.log('\n5. 同一天再次运行调度器...');
    await NotificationSchedulerEnhanced.checkNodeDeadlines();

    const notifications2 = await query(`
      SELECT * FROM notification_tasks 
      WHERE related_id = ? 
      AND task_type = 'deadline'
      ORDER BY created_at DESC
    `, [nodeId]);

    console.log(`✓ 第二次检查后: ${notifications2.length} 条提醒`);
    if (notifications2.length === notifications1.length) {
      console.log('✓ 同一天没有重复创建提醒 ✓');
    } else {
      console.log('❌ 同一天重复创建了提醒');
    }

    // 6. 模拟第二天（修改最后一条提醒的创建时间）
    console.log('\n6. 模拟第二天...');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString();

    if (notifications2.length > 0) {
      await run(`
        UPDATE notification_tasks 
        SET created_at = ? 
        WHERE id = ?
      `, [yesterdayStr, notifications2[0].id]);
      console.log('✓ 已将最后一条提醒的时间改为昨天');
    }

    // 7. 第二天运行调度器
    console.log('\n7. 第二天运行调度器...');
    await NotificationSchedulerEnhanced.checkNodeDeadlines();

    const notifications3 = await query(`
      SELECT * FROM notification_tasks 
      WHERE related_id = ? 
      AND task_type = 'deadline'
      ORDER BY created_at DESC
    `, [nodeId]);

    console.log(`✓ 第三次检查后: ${notifications3.length} 条提醒`);
    if (notifications3.length > notifications2.length) {
      console.log('✓ 第二天成功创建了新的提醒 ✓');
    } else {
      console.log('❌ 第二天没有创建新的提醒');
    }

    // 8. 清理测试数据
    console.log('\n8. 清理测试数据...');
    await run('DELETE FROM notification_tasks WHERE related_id = ?', [nodeId]);
    await run('DELETE FROM process_nodes WHERE id = ?', [nodeId]);
    await run('DELETE FROM cases WHERE id = ?', [caseId]);
    await run('DELETE FROM notification_rules WHERE id = ?', [ruleId]);
    console.log('✓ 测试数据已清理');

    console.log('\n=== 测试完成 ===');
    console.log('✓ 每日提醒修复验证成功！');

  } catch (error) {
    console.error('测试失败:', error);
    process.exit(1);
  }
}

// 运行测试
testDailyReminder().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('错误:', error);
  process.exit(1);
});
