/**
 * 诊断脚本：检查为什么没有收到每日提醒
 * 案件编号: AN202511000007
 * 截止日期: 2025-11-26
 * 提醒规则: 提前3天每天提示
 */

const { query, run } = require('./src/config/database');

async function diagnose() {
  console.log('=== 诊断每日提醒问题 ===\n');

  try {
    // 1. 查找案件
    console.log('1. 查找案件 AN202511000007...');
    const cases = await query(`
      SELECT * FROM cases WHERE case_number = ?
    `, ['AN202511000007']);

    if (cases.length === 0) {
      console.log('❌ 案件不存在');
      return;
    }

    const caseData = cases[0];
    console.log(`✓ 找到案件: ${caseData.case_name} (ID: ${caseData.id})`);

    // 2. 查找立案受理节点
    console.log('\n2. 查找立案受理节点...');
    const nodes = await query(`
      SELECT * FROM process_nodes 
      WHERE case_id = ? 
      AND node_name LIKE '%立案受理%'
    `, [caseData.id]);

    if (nodes.length === 0) {
      console.log('❌ 未找到立案受理节点');
      return;
    }

    const node = nodes[0];
    console.log(`✓ 找到节点: ${node.node_name}`);
    console.log(`  - 截止日期: ${node.deadline}`);
    console.log(`  - 状态: ${node.status}`);
    console.log(`  - 节点ID: ${node.id}`);

    // 3. 检查提醒规则
    console.log('\n3. 检查提醒规则...');
    const rules = await query(`
      SELECT * FROM notification_rules 
      WHERE rule_type = 'deadline' 
      AND is_enabled = 1
    `);

    if (rules.length === 0) {
      console.log('❌ 没有启用的截止日期提醒规则');
      return;
    }

    const rule = rules[0];
    console.log(`✓ 找到规则: ${rule.rule_name}`);
    console.log(`  - 规则类型: ${rule.rule_type}`);
    console.log(`  - 阈值: ${rule.threshold_value} ${rule.threshold_unit}`);
    console.log(`  - 频率: ${rule.frequency}`);
    console.log(`  - 启用状态: ${rule.is_enabled ? '是' : '否'}`);

    // 4. 计算应该发送提醒的日期
    console.log('\n4. 计算提醒时间...');
    const deadline = new Date(node.deadline);
    const today = new Date();
    const daysUntilDeadline = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
    const thresholdDays = rule.threshold_value;

    console.log(`  - 截止日期: ${node.deadline}`);
    console.log(`  - 今天: ${today.toISOString().split('T')[0]}`);
    console.log(`  - 距离截止日期: ${daysUntilDeadline} 天`);
    console.log(`  - 提醒阈值: ${thresholdDays} 天`);

    if (daysUntilDeadline <= thresholdDays && daysUntilDeadline > 0) {
      console.log(`✓ 应该发送提醒（在阈值范围内）`);
    } else if (daysUntilDeadline <= 0) {
      console.log(`⚠ 已过截止日期`);
    } else {
      console.log(`⚠ 还未到提醒时间（距离还有 ${daysUntilDeadline - thresholdDays} 天）`);
    }

    // 5. 检查已发送的提醒
    console.log('\n5. 检查已发送的提醒...');
    const notifications = await query(`
      SELECT * FROM notification_tasks 
      WHERE related_id = ? 
      AND related_type = 'process_node'
      AND task_type = 'deadline'
      ORDER BY created_at DESC
    `, [node.id]);

    if (notifications.length === 0) {
      console.log('❌ 没有发送过任何提醒');
    } else {
      console.log(`✓ 找到 ${notifications.length} 条提醒记录:`);
      notifications.forEach((notif, index) => {
        const createdDate = new Date(notif.created_at).toISOString().split('T')[0];
        console.log(`  ${index + 1}. [${createdDate}] ${notif.content}`);
        console.log(`     - 状态: ${notif.status}`);
        console.log(`     - 创建时间: ${notif.created_at}`);
      });
    }

    // 6. 检查今天是否已发送过提醒
    console.log('\n6. 检查今天的提醒...');
    const today_str = today.toISOString().split('T')[0];
    const todayNotifications = notifications.filter(n => {
      const notifDate = new Date(n.created_at).toISOString().split('T')[0];
      return notifDate === today_str;
    });

    if (todayNotifications.length > 0) {
      console.log(`✓ 今天已发送 ${todayNotifications.length} 条提醒`);
    } else {
      console.log(`❌ 今天没有发送提醒`);
    }

    // 7. 诊断建议
    console.log('\n7. 诊断建议:');
    if (daysUntilDeadline > thresholdDays) {
      console.log('⚠ 原因: 还未到提醒时间');
      console.log(`  建议: 等待 ${daysUntilDeadline - thresholdDays} 天后会自动发送提醒`);
    } else if (daysUntilDeadline <= 0) {
      console.log('⚠ 原因: 已过截止日期');
      console.log('  建议: 检查节点状态是否应该更新为已完成');
    } else if (notifications.length === 0) {
      console.log('❌ 原因: 调度器可能未运行或规则配置有问题');
      console.log('  建议: ');
      console.log('    1. 检查后端服务是否正常运行');
      console.log('    2. 检查数据库中的规则配置');
      console.log('    3. 手动触发提醒检查: POST /api/notifications/trigger-manual-check');
    } else if (todayNotifications.length === 0 && rule.frequency === 'daily') {
      console.log('❌ 原因: 虽然规则设置为每天提醒，但今天还没有发送');
      console.log('  建议: ');
      console.log('    1. 检查调度器是否在今天运行过');
      console.log('    2. 手动触发提醒检查: POST /api/notifications/trigger-manual-check');
    }

  } catch (error) {
    console.error('诊断失败:', error);
  }
}

// 运行诊断
diagnose().then(() => {
  console.log('\n=== 诊断完成 ===');
  process.exit(0);
}).catch(error => {
  console.error('错误:', error);
  process.exit(1);
});
