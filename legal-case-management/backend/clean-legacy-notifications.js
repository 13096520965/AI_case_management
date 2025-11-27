const { query } = require('./src/config/database');

async function cleanLegacyNotifications() {
  try {
    console.log('=== 清理遗留提醒数据 ===\n');

    // 查询所有提醒
    const allNotifications = await query('SELECT * FROM notification_tasks');
    console.log(`总共 ${allNotifications.length} 条提醒\n`);

    const invalidIds = [];
    const legacyIds = [];

    for (const notification of allNotifications) {
      let isValid = true;
      let isLegacy = false;

      // 检查是否是遗留数据（related_type 不是标准类型）
      if (notification.related_type === 'case') {
        // 旧的费用支付提醒，related_type 是 case
        isLegacy = true;
        legacyIds.push({
          id: notification.id,
          type: 'legacy_payment',
          reason: 'related_type 为 case（应为 cost_record）'
        });
      } else if (notification.related_type === 'task') {
        // 旧的协作任务提醒，related_type 是 task
        isLegacy = true;
        legacyIds.push({
          id: notification.id,
          type: 'legacy_task',
          reason: 'related_type 为 task（应为 process_node）'
        });
      } else if (notification.related_type === 'process_node') {
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

    console.log(`找到 ${legacyIds.length} 条遗留提醒`);
    console.log(`找到 ${invalidIds.length} 条无效提醒\n`);

    if (legacyIds.length > 0) {
      console.log('遗留提醒详情:');
      legacyIds.forEach(item => {
        console.log(`  ID: ${item.id} - ${item.type} - ${item.reason}`);
      });
    }

    // 删除所有无效提醒（包括遗留数据）
    const allInvalidIds = [...invalidIds, ...legacyIds.map(l => l.id)];
    
    if (allInvalidIds.length > 0) {
      console.log(`\n删除 ${allInvalidIds.length} 条无效/遗留提醒...`);
      
      for (const id of allInvalidIds) {
        await query('DELETE FROM notification_tasks WHERE id = ?', [id]);
      }
      
      console.log(`✓ 已删除 ${allInvalidIds.length} 条提醒`);
      console.log(`删除的ID: ${allInvalidIds.join(', ')}`);
    } else {
      console.log('没有无效或遗留提醒需要清理');
    }

    // 验证清理结果
    const remainingNotifications = await query('SELECT COUNT(*) as count FROM notification_tasks');
    console.log(`\n清理后剩余 ${remainingNotifications[0].count} 条提醒`);

    // 统计提醒类型
    const typeStats = await query(`
      SELECT task_type, COUNT(*) as count 
      FROM notification_tasks 
      GROUP BY task_type
    `);
    console.log('\n提醒类型统计:');
    typeStats.forEach(stat => {
      console.log(`  ${stat.task_type}: ${stat.count} 条`);
    });

  } catch (error) {
    console.error('清理失败:', error);
  }
}

cleanLegacyNotifications();
