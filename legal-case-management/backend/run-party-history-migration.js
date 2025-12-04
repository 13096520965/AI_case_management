const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'database', 'legal_case.db');

console.log('开始执行主体历史表迁移...');
console.log('数据库路径:', DB_PATH);

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
    process.exit(1);
  }
  console.log('数据库连接成功');
});

// 启用外键约束
db.run('PRAGMA foreign_keys = ON', (err) => {
  if (err) {
    console.error('启用外键约束失败:', err.message);
  } else {
    console.log('外键约束已启用');
  }
});

// 读取迁移 SQL 文件
const migrationSQL = fs.readFileSync(
  path.join(__dirname, 'database', 'migrations', '008_create_party_history_table.sql'),
  'utf8'
);

// 分割 SQL 语句
const statements = migrationSQL
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0);

console.log(`准备执行 ${statements.length} 条 SQL 语句...`);

// 执行迁移
let completed = 0;
statements.forEach((statement, index) => {
  db.run(statement, (err) => {
    if (err && !err.message.includes('already exists')) {
      console.error(`执行 SQL 语句 ${index + 1} 失败:`, err.message);
      console.error('SQL:', statement.substring(0, 100));
    } else {
      console.log(`✓ 语句 ${index + 1}/${statements.length} 执行成功`);
    }
    
    completed++;
    if (completed === statements.length) {
      // 验证表是否创建成功
      db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='party_history'", (err, rows) => {
        if (err) {
          console.error('验证表失败:', err.message);
        } else if (rows.length > 0) {
          console.log('✓ party_history 表创建成功');
          
          // 查看表结构
          db.all("PRAGMA table_info('party_history')", (err, columns) => {
            if (err) {
              console.error('查询表结构失败:', err.message);
            } else {
              console.log('\nparty_history 表结构:');
              columns.forEach(col => {
                console.log(`  - ${col.name}: ${col.type}`);
              });
            }
            
            db.close((err) => {
              if (err) {
                console.error('关闭数据库失败:', err.message);
              } else {
                console.log('\n迁移完成，数据库已关闭');
              }
            });
          });
        } else {
          console.log('✗ party_history 表未创建');
          db.close();
        }
      });
    }
  });
});
