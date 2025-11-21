/**
 * 直接迁移实际使用的数据库文件
 */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'database/legal_case.db');

async function migrate() {
  console.log('='.repeat(50));
  console.log('迁移数据库:', DB_PATH);
  console.log('='.repeat(50));
  
  try {
    // 初始化 SQL.js
    const SQL = await initSqlJs();
    
    // 读取数据库
    const buffer = fs.readFileSync(DB_PATH);
    const db = new SQL.Database(buffer);
    
    console.log('\n检查当前表结构...');
    
    // 获取现有列
    const columnsResult = db.exec("PRAGMA table_info(case_logs)");
    const columns = columnsResult[0]?.values.map(row => row[1]) || [];
    
    console.log('现有列:', columns);
    
    // 检查是否需要迁移
    if (columns.includes('action_type')) {
      console.log('\n✓ 表结构已是最新，无需迁移');
      return;
    }
    
    console.log('\n开始迁移...');
    
    // 创建新表
    db.run(`
      CREATE TABLE case_logs_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        case_id INTEGER NOT NULL,
        action_type VARCHAR(50),
        action_description TEXT,
        operator_id INTEGER,
        operator_name VARCHAR(100),
        operator VARCHAR(100),
        action TEXT,
        ip_address VARCHAR(50),
        user_agent TEXT,
        related_data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ 新表创建成功');
    
    // 迁移数据
    db.run(`
      INSERT INTO case_logs_new (
        id, case_id, operator_name, action_description, 
        operator, action, created_at
      )
      SELECT 
        id, case_id, operator, action,
        operator, action, created_at
      FROM case_logs
    `);
    console.log('✓ 数据迁移成功');
    
    // 删除旧表
    db.run('DROP TABLE case_logs');
    console.log('✓ 旧表删除成功');
    
    // 重命名新表
    db.run('ALTER TABLE case_logs_new RENAME TO case_logs');
    console.log('✓ 表重命名成功');
    
    // 重建索引
    db.run('CREATE INDEX IF NOT EXISTS idx_case_logs_case_id ON case_logs(case_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_case_logs_action_type ON case_logs(action_type)');
    console.log('✓ 索引创建成功');
    
    // 保存数据库
    const data = db.export();
    const newBuffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, newBuffer);
    console.log('✓ 数据库保存成功');
    
    // 验证新结构
    const newColumnsResult = db.exec("PRAGMA table_info(case_logs)");
    const newColumns = newColumnsResult[0]?.values.map(row => row[1]) || [];
    
    console.log('\n新表结构:');
    newColumns.forEach(col => console.log('  -', col));
    
    console.log('\n' + '='.repeat(50));
    console.log('✓ 迁移成功完成！');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('\n' + '='.repeat(50));
    console.error('✗ 迁移失败:', error.message);
    console.error('='.repeat(50));
    console.error(error);
    process.exit(1);
  }
}

migrate();
