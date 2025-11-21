/**
 * Migration: Add handler field to cases table
 * 添加承办人员字段到案件表
 */

const { getDatabase, saveDatabase } = require('../database');

async function up() {
  const db = await getDatabase();
  
  console.log('开始迁移: 添加 handler 字段到 cases 表...');
  
  try {
    // 检查表是否存在
    const tableCheck = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='cases'");
    
    if (tableCheck.length === 0) {
      console.log('cases 表不存在，跳过迁移');
      return;
    }

    // 获取现有列
    const columnsResult = db.exec("PRAGMA table_info(cases)");
    const columns = columnsResult[0]?.values.map(row => row[1]) || [];

    // 检查 handler 字段是否已存在
    if (columns.includes('handler')) {
      console.log('handler 字段已存在，跳过迁移');
      return;
    }

    // 添加 handler 字段
    db.run('ALTER TABLE cases ADD COLUMN handler VARCHAR(100)');
    console.log('✓ handler 字段添加成功');

    saveDatabase();
    console.log('✓ cases 表 handler 字段添加完成');
    
  } catch (error) {
    console.error('迁移失败:', error);
    throw error;
  }
}

async function down() {
  const db = await getDatabase();
  
  console.log('开始回滚: 删除 handler 字段...');
  
  try {
    // SQLite 不支持直接删除列，需要重建表
    // 创建临时表
    db.run(`
      CREATE TABLE cases_temp (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        case_number VARCHAR(100) UNIQUE,
        internal_number VARCHAR(100) UNIQUE,
        case_type VARCHAR(50),
        case_cause VARCHAR(200),
        court VARCHAR(200),
        target_amount DECIMAL(15,2),
        filing_date DATE,
        status VARCHAR(50) DEFAULT 'active',
        team_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 复制数据（不包括 handler）
    db.run(`
      INSERT INTO cases_temp (
        id, case_number, internal_number, case_type, case_cause, 
        court, target_amount, filing_date, status, team_id, 
        created_at, updated_at
      )
      SELECT 
        id, case_number, internal_number, case_type, case_cause, 
        court, target_amount, filing_date, status, team_id, 
        created_at, updated_at
      FROM cases
    `);

    // 删除旧表
    db.run('DROP TABLE cases');

    // 重命名临时表
    db.run('ALTER TABLE cases_temp RENAME TO cases');

    saveDatabase();
    console.log('✓ handler 字段删除完成');
    
  } catch (error) {
    console.error('回滚失败:', error);
    throw error;
  }
}

module.exports = { up, down };
