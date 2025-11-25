/**
 * 测试提醒调度器
 * 用于验证基于规则的提醒发送功能
 */

const scheduler = require('./src/services/notificationSchedulerEnhanced');
const { query } = require('./src/config/database');

async function testScheduler() {
  console.log('=== 测试提醒调度器 ===\n');

  try {
    // 1. 查看当前的提醒规则
    console.log('1. 查看提醒规则:');
    const rules = await query('SELECT * FROM notification_rules WHERE is_enabled = 1');
    console.log(`找到 ${rules.length} 条启用的规则:`);
    rules.forEach(rule => {
      console.log(`  - ${rule.rule_name}: ${rule.rule_type}, 提前${rule.threshold_value}${rule.threshold_unit}`);
    });
    console.log('');

    // 2. 查看即将到期的节点
    console.log('2. 查看即将到期的节点:');
    const upcomingNodes = await query(`
      SELECT 
        pn.id,
        pn.node_name,
        pn.deadline,
        pn.status,
        c.case_number,
        julianday(pn.deadline) - julianday('now') as days_left
      FROM process_nodes pn
      LEFT JOIN cases c ON pn.case_id = c.id
      WHERE pn.status IN ('待处理', '进行中')
      AND pn.deadline IS NOT NULL
      AND julianday(pn.deadline) - julianday('now') <= 7
      AND julianday(pn.deadline) - julianday('now') > 0
      ORDER BY pn.deadline
    `);
    
    console.log(`找到 ${upcomingNodes.length} 个即将到期的节点:`);
    upcomingNodes.forEach(node => {
      const daysLeft = Math.ceil(node.days_left);
      console.log(`  - ${node.case_number} | ${node.node_name} | ${node.deadline} (${daysLeft}天后)`);
    });
    console.log('');

    // 3. 查看超期节点
    console.log('3. 查看超期节点:');
    const overdueNodes = await query(`
      SELECT 
        pn.id,
        pn.node_name,
        pn.deadline,
        pn.status,
        c.case_number,
        julianday('now') - julianday(pn.deadline) as days_overdue
      FROM process_nodes pn
      LEFT JOIN cases c ON pn.case_id = c.id
      WHERE pn.status IN ('待处理', '进行中')
      AND pn.deadline IS NOT NULL
      AND julianday('now') > julianday(pn.deadline)
      ORDER BY pn.deadline
    `);
    
    console.log(`找到 ${overdueNodes.length} 个超期节点:`);
    overdueNodes.forEach(node => {
      const daysOverdue = Math.floor(node.days_overdue);
      console.log(`  - ${node.case_number} | ${node.node_name} | ${node.deadline} (超期${daysOverdue}天)`);
    });
    console.log('');

    // 4. 查看当前的提醒任务
    console.log('4. 查看现有提醒任务:');
    const existingNotifications = await query(`
      SELECT 
        nt.*,
        datetime(nt.created_at, 'localtime') as created_at_local
      FROM notification_tasks nt
      WHERE nt.created_at > datetime('now', '-7 days')
      ORDER BY nt.created_at DESC
      LIMIT 10
    `);
    
    console.log(`最近7天内的提醒任务 (显示最新10条):`);
    existingNotifications.forEach(notif => {
      console.log(`  - [${notif.task_type}] ${notif.content.substring(0, 50)}... (${notif.status})`);
    });
    console.log('');

    // 5. 执行手动检查
    console.log('5. 执行手动检查:');
    console.log('开始检查并创建提醒...\n');
    await scheduler.manualCheck();
    console.log('');

    // 6. 查看新创建的提醒
    console.log('6. 查看新创建的提醒:');
    const newNotifications = await query(`
      SELECT 
        nt.*,
        datetime(nt.created_at, 'localtime') as created_at_local
      FROM notification_tasks nt
      WHERE nt.created_at > datetime('now', '-1 minutes')
      ORDER BY nt.created_at DESC
    `);
    
    console.log(`刚刚创建的提醒 (1分钟内):`);
    if (newNotifications.length === 0) {
      console.log('  (无新提醒)');
    } else {
      newNotifications.forEach(notif => {
        console.log(`  - [${notif.task_type}] ${notif.content}`);
      });
    }
    console.log('');

    // 7. 统计信息
    console.log('7. 统计信息:');
    const stats = await query(`
      SELECT 
        task_type,
        status,
        COUNT(*) as count
      FROM notification_tasks
      WHERE created_at > datetime('now', '-7 days')
      GROUP BY task_type, status
      ORDER BY task_type, status
    `);
    
    console.log('最近7天提醒统计:');
    stats.forEach(stat => {
      console.log(`  - ${stat.task_type} (${stat.status}): ${stat.count}条`);
    });

    console.log('\n=== 测试完成 ===');
  } catch (error) {
    console.error('测试失败:', error);
  }
}

// 运行测试
testScheduler().then(() => {
  console.log('\n程序执行完毕');
  process.exit(0);
}).catch(error => {
  console.error('程序执行失败:', error);
  process.exit(1);
});
