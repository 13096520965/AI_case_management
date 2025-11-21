const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'legal_case_management.db');
const db = new sqlite3.Database(dbPath);

console.log('=== 提醒中心功能测试 ===\n');

// 1. 查询所有提醒
db.all('SELECT * FROM notification_tasks ORDER BY scheduled_time DESC', (err, rows) => {
  if (err) {
    console.error('查询失败:', err);
    return;
  }

  console.log(`1. 总提醒数量: ${rows.length}`);
  console.log('');

  // 2. 统计未读提醒
  const unreadCount = rows.filter(r => r.status === 'unread').length;
  const readCount = rows.filter(r => r.status === 'read').length;
  
  console.log(`2. 提醒状态统计:`);
  console.log(`   - 未读: ${unreadCount}`);
  console.log(`   - 已读: ${readCount}`);
  console.log('');

  // 3. 按类型统计
  const typeStats = {};
  rows.forEach(r => {
    typeStats[r.task_type] = (typeStats[r.task_type] || 0) + 1;
  });

  console.log(`3. 提醒类型统计:`);
  Object.entries(typeStats).forEach(([type, count]) => {
    const typeLabel = {
      'deadline': '节点到期',
      'overdue': '节点超期',
      'payment': '费用支付',
      'task': '协作任务',
      'system': '系统通知'
    }[type] || type;
    console.log(`   - ${typeLabel}: ${count}`);
  });
  console.log('');

  // 4. 显示最近5条未读提醒
  const recentUnread = rows.filter(r => r.status === 'unread').slice(0, 5);
  console.log(`4. 最近未读提醒 (前5条):`);
  recentUnread.forEach((r, i) => {
    console.log(`   ${i + 1}. [${r.task_type}] ${r.content.substring(0, 40)}...`);
    console.log(`      时间: ${r.scheduled_time}`);
  });
  console.log('');

  // 5. 测试数据完整性
  console.log(`5. 数据完整性检查:`);
  const hasAllFields = rows.every(r => 
    r.id && r.related_id && r.related_type && r.task_type && 
    r.scheduled_time && r.content && r.status
  );
  console.log(`   - 所有记录字段完整: ${hasAllFields ? '✓' : '✗'}`);
  
  const validStatuses = rows.every(r => ['unread', 'read', 'pending'].includes(r.status));
  console.log(`   - 状态值有效: ${validStatuses ? '✓' : '✗'}`);
  
  const validTypes = rows.every(r => 
    ['deadline', 'overdue', 'payment', 'task', 'system'].includes(r.task_type)
  );
  console.log(`   - 类型值有效: ${validTypes ? '✓' : '✗'}`);
  console.log('');

  console.log('=== 测试完成 ===');
  
  db.close();
});
