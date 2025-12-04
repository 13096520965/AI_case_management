const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'database', 'legal_case.db');

console.log('开始执行 is_primary 字段迁移...');
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
  path.join(__dirname, 'database', 'migrations', '009_add_is_primary_to_parties.sql'),
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
    if (err && !err.message.includes('duplicate column')) {
      console.error(`执行 SQL 语句 ${index + 1} 失败:`, err.message);
      console.error('SQL:', statement.substring(0, 100));
    } else {
      console.log(`✓ 语句 ${index + 1}/${statements.length} 执行成功`);
    }
    
    completed++;
    if (completed === statements.length) {
      // 验证字段是否添加成功
      db.all("PRAGMA table_info('litigation_parties')", (err, columns) => {
        if (err) {
          console.error('查询表结构失败:', err.message);
        } else {
          const hasPrimary = columns.some(col => col.name === 'is_primary');
          if (hasPrimary) {
            console.log('✓ is_primary 字段添加成功');
            
            // 查询设置为主要当事人的数量
            db.get("SELECT COUNT(*) as count FROM litigation_parties WHERE is_primary = 1", (err, row) => {
              if (err) {
                console.error('查询主要当事人数量失败:', err.message);
              } else {
                console.log(`✓ 已设置 ${row.count} 个主要当事人`);
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
            console.log('✗ is_primary 字段未添加');
            db.close();
          }
        }
      });
    }
  });
});
