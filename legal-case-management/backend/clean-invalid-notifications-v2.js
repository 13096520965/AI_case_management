const { query } = require('./src/config/database');

async function cleanInvalidNotifications() {
  try {
    console.log('=== 清理无效提醒 ===\n');

    // 查询所有提醒
    const allNotifications = await query('SELECT * FROM notification_tasks');
    console.log(`总共 ${allNotifications.length} 条提醒\n`);

    const invalidIds = [];

    for (const notification of allNotifications) {
      let isValid = true;

      if (notification.related_type === 'process_node') {
        // 查询节点
        const nodes = await query(
          'SELECT pn.*, c.id as caseId FROM process_nodes pn LEFT JOIN cases c ON pn.case_id = c.id WHERE pn.id = ?',
          [notification.related_id]
        );

        if (nodes.length === 0 || !nodes[0].caseId) {
          isValid = false;
        }
      } else if (notification.related_type === 'cost_record') {
        // 查询费用记录
        const costs = await query(
          'SELECT cr.*, c.id as caseId FROM cost_records cr LEFT JOIN cases c ON cr.case_id = c.id WHERE cr.id = ?',
          [notification.related_id]
        );

        if (costs.length === 0 || !costs[0].caseId) {
          isValid = false;
        }
      }

      if (!isValid) {
        invalidIds.push(notification.id);
      }
    }

    console.log(`找到 ${invalidIds.length} 条无效提醒\n`);

    if (invalidIds.length > 0) {
      // 删除无效提醒
      for (const id of invalidIds) {
        await query('DELETE FROM notification_tasks WHERE id = ?', [id]);
      }
      console.log(`✓ 已删除 ${invalidIds.length} 条无效提醒`);
      console.log(`删除的ID: ${invalidIds.join(', ')}`);
    } else {
      console.log('没有无效提醒需要清理');
    }

    // 验证清理结果
    const remainingNotifications = await query('SELECT COUNT(*) as count FROM notification_tasks');
    console.log(`\n清理后剩余 ${remainingNotifications[0].count} 条提醒`);

  } catch (error) {
    console.error('清理失败:', error);
  }
}

cleanInvalidNotifications();
