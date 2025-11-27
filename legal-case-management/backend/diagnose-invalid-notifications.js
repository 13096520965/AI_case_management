const { query } = require('./src/config/database');

async function diagnose() {
  try {
    console.log('=== 诊断无效提醒 ===\n');

    // 查询所有提醒
    const allNotifications = await query('SELECT * FROM notification_tasks ORDER BY created_at DESC LIMIT 50');
    console.log(`总共 ${allNotifications.length} 条提醒\n`);

    // 检查每条提醒的关联对象
    const invalidNotifications = [];
    const validNotifications = [];

    for (const notification of allNotifications) {
      if (notification.related_type === 'process_node') {
        // 查询节点
        const nodes = await query(
          'SELECT pn.*, c.id as caseId, c.internal_number FROM process_nodes pn LEFT JOIN cases c ON pn.case_id = c.id WHERE pn.id = ?',
          [notification.related_id]
        );

        if (nodes.length === 0) {
          invalidNotifications.push({
            ...notification,
            reason: '节点不存在'
          });
        } else if (!nodes[0].caseId) {
          invalidNotifications.push({
            ...notification,
            reason: '节点没有关联案件',
            node: nodes[0]
          });
        } else {
          validNotifications.push({
            ...notification,
            caseId: nodes[0].caseId,
            internalNumber: nodes[0].internal_number
          });
        }
      } else if (notification.related_type === 'cost_record') {
        // 查询费用记录
        const costs = await query(
          'SELECT cr.*, c.id as caseId, c.internal_number FROM cost_records cr LEFT JOIN cases c ON cr.case_id = c.id WHERE cr.id = ?',
          [notification.related_id]
        );

        if (costs.length === 0) {
          invalidNotifications.push({
            ...notification,
            reason: '费用记录不存在'
          });
        } else if (!costs[0].caseId) {
          invalidNotifications.push({
            ...notification,
            reason: '费用记录没有关联案件',
            cost: costs[0]
          });
        } else {
          validNotifications.push({
            ...notification,
            caseId: costs[0].caseId,
            internalNumber: costs[0].internal_number
          });
        }
      } else {
        validNotifications.push(notification);
      }
    }

    console.log(`=== 有效提醒: ${validNotifications.length} 条 ===`);
    console.log(`=== 无效提醒: ${invalidNotifications.length} 条 ===\n`);

    if (invalidNotifications.length > 0) {
      console.log('无效提醒详情:');
      invalidNotifications.forEach((notif, index) => {
        console.log(`\n${index + 1}. ID: ${notif.id}`);
        console.log(`   类型: ${notif.task_type}`);
        console.log(`   关联类型: ${notif.related_type}`);
        console.log(`   关联ID: ${notif.related_id}`);
        console.log(`   原因: ${notif.reason}`);
        console.log(`   内容: ${notif.content.substring(0, 100)}...`);
      });
    }

    // 统计无效提醒的原因
    console.log('\n=== 无效提醒原因统计 ===');
    const reasonCount = {};
    invalidNotifications.forEach(notif => {
      reasonCount[notif.reason] = (reasonCount[notif.reason] || 0) + 1;
    });
    Object.entries(reasonCount).forEach(([reason, count]) => {
      console.log(`${reason}: ${count} 条`);
    });

  } catch (error) {
    console.error('诊断失败:', error);
  }
}

diagnose();
