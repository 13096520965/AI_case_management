const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'legal_case_management.db');
const db = new sqlite3.Database(dbPath);

console.log('=== 测试API数据格式 ===\n');

// 查询前3条数据
db.all('SELECT * FROM notification_tasks ORDER BY scheduled_time DESC LIMIT 3', (err, rows) => {
  if (err) {
    console.error('查询失败:', err);
    db.close();
    return;
  }

  console.log('数据库字段名称:');
  if (rows.length > 0) {
    console.log(Object.keys(rows[0]));
  }
  
  console.log('\n原始数据 (前3条):');
  rows.forEach((row, i) => {
    console.log(`\n${i + 1}. ID: ${row.id}`);
    console.log(`   related_id: ${row.related_id}`);
    console.log(`   related_type: ${row.related_type}`);
    console.log(`   task_type: ${row.task_type}`);
    console.log(`   status: ${row.status}`);
    console.log(`   content: ${row.content.substring(0, 50)}...`);
    console.log(`   scheduled_time: ${row.scheduled_time}`);
  });

  console.log('\n\n转换为前端格式 (camelCase):');
  const converted = rows.map(row => ({
    id: row.id,
    relatedId: row.related_id,
    relatedType: row.related_type,
    taskType: row.task_type,
    scheduledTime: row.scheduled_time,
    content: row.content,
    status: row.status,
    createdAt: row.created_at
  }));

  console.log(JSON.stringify(converted, null, 2));

  db.close();
});
