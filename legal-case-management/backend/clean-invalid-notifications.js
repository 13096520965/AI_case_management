/**
 * 清理无效的提醒数据
 * 删除关联的节点或费用记录不存在的通知，以及关联的案件已被删除的通知
 */

const { query, run } = require('./src/config/database');

async function cleanInvalidNotifications() {
  try {
    console.log('开始清理无效的提醒数据...\n');

    // 1. 删除关联节点不存在的 process_node 类型通知
    console.log('1. 检查 process_node 类型的通知...');
    const invalidProcessNodeNotifications = await query(`
      SELECT nt.id, nt.related_id, nt.content
      FROM notification_tasks nt
      WHERE nt.related_type = 'process_node'
      AND nt.related_id NOT IN (SELECT id FROM process_nodes)
    `);

    if (invalidProcessNodeNotifications && invalidProcessNodeNotifications.length > 0) {
      console.log(`   找到 ${invalidProcessNodeNotifications.length} 条无效的 process_node 通知（节点不存在）:`);
      invalidProcessNodeNotifications.forEach((row, index) => {
        const contentPreview = row.content.length > 60 
          ? row.content.substring(0, 60) + '...' 
          : row.content;
        console.log(`   ${index + 1}. ID: ${row.id}, 关联ID: ${row.related_id}, 内容: ${contentPreview}`);
      });

      // 删除这些通知
      const deleteResult = await run(`
        DELETE FROM notification_tasks
        WHERE related_type = 'process_node'
        AND related_id NOT IN (SELECT id FROM process_nodes)
      `);
      console.log(`   ✓ 已删除 ${deleteResult.changes} 条无效通知\n`);
    } else {
      console.log('   ✓ 没有无效的 process_node 通知（节点不存在）\n');
    }

    // 1.5. 删除关联的案件已被删除的 process_node 类型通知
    console.log('1.5. 检查关联案件已被删除的 process_node 通知...');
    const orphanedNodeNotifications = await query(`
      SELECT nt.id, nt.related_id, pn.node_name, pn.case_id, nt.content
      FROM notification_tasks nt
      JOIN process_nodes pn ON nt.related_id = pn.id
      WHERE nt.related_type = 'process_node'
      AND pn.case_id NOT IN (SELECT id FROM cases)
    `);

    if (orphanedNodeNotifications && orphanedNodeNotifications.length > 0) {
      console.log(`   找到 ${orphanedNodeNotifications.length} 条无效的 process_node 通知（关联案件已删除）:`);
      orphanedNodeNotifications.forEach((row, index) => {
        const contentPreview = row.content.length > 60 
          ? row.content.substring(0, 60) + '...' 
          : row.content;
        console.log(`   ${index + 1}. ID: ${row.id}, 节点ID: ${row.related_id}, 节点名: ${row.node_name}, 案件ID: ${row.case_id}, 内容: ${contentPreview}`);
      });

      // 删除这些通知
      const deleteResult = await run(`
        DELETE FROM notification_tasks
        WHERE related_type = 'process_node'
        AND related_id IN (
          SELECT pn.id FROM process_nodes pn
          WHERE pn.case_id NOT IN (SELECT id FROM cases)
        )
      `);
      console.log(`   ✓ 已删除 ${deleteResult.changes} 条无效通知\n`);
    } else {
      console.log('   ✓ 没有无效的 process_node 通知（关联案件已删除）\n');
    }

    // 2. 删除关联费用记录不存在的 cost_record 类型通知
    console.log('2. 检查 cost_record 类型的通知...');
    const invalidCostRecordNotifications = await query(`
      SELECT nt.id, nt.related_id, nt.content
      FROM notification_tasks nt
      WHERE nt.related_type = 'cost_record'
      AND nt.related_id NOT IN (SELECT id FROM cost_records)
    `);

    if (invalidCostRecordNotifications && invalidCostRecordNotifications.length > 0) {
      console.log(`   找到 ${invalidCostRecordNotifications.length} 条无效的 cost_record 通知:`);
      invalidCostRecordNotifications.forEach((row, index) => {
        const contentPreview = row.content.length > 60 
          ? row.content.substring(0, 60) + '...' 
          : row.content;
        console.log(`   ${index + 1}. ID: ${row.id}, 关联ID: ${row.related_id}, 内容: ${contentPreview}`);
      });

      // 删除这些通知
      const deleteResult = await run(`
        DELETE FROM notification_tasks
        WHERE related_type = 'cost_record'
        AND related_id NOT IN (SELECT id FROM cost_records)
      `);
      console.log(`   ✓ 已删除 ${deleteResult.changes} 条无效通知\n`);
    } else {
      console.log('   ✓ 没有无效的 cost_record 通知\n');
    }

    // 3. 统计清理后的通知数量
    console.log('3. 统计清理后的通知数量...');
    const totalNotifications = await query('SELECT COUNT(*) as count FROM notification_tasks');
    const systemNotifications = await query("SELECT COUNT(*) as count FROM notification_tasks WHERE task_type = 'system'");
    const processNodeNotifications = await query("SELECT COUNT(*) as count FROM notification_tasks WHERE related_type = 'process_node'");
    const costRecordNotifications = await query("SELECT COUNT(*) as count FROM notification_tasks WHERE related_type = 'cost_record'");

    console.log(`   总通知数: ${totalNotifications[0].count}`);
    console.log(`   系统通知: ${systemNotifications[0].count}`);
    console.log(`   节点通知: ${processNodeNotifications[0].count}`);
    console.log(`   费用通知: ${costRecordNotifications[0].count}\n`);

    console.log('✓ 清理完成！');
  } catch (error) {
    console.error('清理失败:', error);
    process.exit(1);
  }
}

// 运行清理
cleanInvalidNotifications().then(() => {
  process.exit(0);
});
