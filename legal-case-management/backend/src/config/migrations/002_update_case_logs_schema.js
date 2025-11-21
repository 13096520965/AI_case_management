/**
 * Migration: Update case_logs table schema
 * Adds new columns for enhanced logging functionality
 */

const { getDatabase, query, saveDatabase } = require('../database');

async function up() {
  const db = await getDatabase();
  
  console.log('开始迁移: 更新 case_logs 表结构...');
  
  try {
    // 检查表是否存在
    const tableCheck = await query("SELECT name FROM sqlite_master WHERE type='table' AND name='case_logs'");
    
    if (tableCheck.length === 0) {
      console.log('case_logs 表不存在，跳过迁移');
      return;
    }

    // 获取现有列
    const columnsResult = db.exec("PRAGMA table_info(case_logs)");
    const columns = columnsResult[0]?.values.map(row => row[1]) || [];

    console.log('现有列:', columns);

    // 检查是否需要迁移
    if (columns.includes('action_type')) {
      console.log('表结构已是最新，无需迁移');
      return;
    }

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

    console.log('新表创建成功');

    // 迁移数据 - 将旧的 operator 和 action 映射到新字段
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

    console.log('数据迁移成功');

    // 删除旧表
    db.run('DROP TABLE case_logs');
    console.log('旧表删除成功');

    // 重命名新表
    db.run('ALTER TABLE case_logs_new RENAME TO case_logs');
    console.log('表重命名成功');

    // 重建索引
    db.run('CREATE INDEX IF NOT EXISTS idx_case_logs_case_id ON case_logs(case_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_case_logs_action_type ON case_logs(action_type)');
    console.log('索引创建成功');

    saveDatabase();
    console.log('✓ case_logs 表结构更新完成');
    
  } catch (error) {
    console.error('迁移失败:', error);
    throw error;
  }
}

async function down() {
  const db = await getDatabase();
  
  console.log('开始回滚: 恢复 case_logs 表结构...');
  
  try {
    // 创建旧表结构
    db.run(`
      CREATE TABLE case_logs_old (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        case_id INTEGER NOT NULL,
        operator VARCHAR(100) NOT NULL,
        action TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
      )
    `);

    // 迁移数据回旧格式
    db.run(`
      INSERT INTO case_logs_old (id, case_id, operator, action, created_at)
      SELECT 
        id, case_id, 
        COALESCE(operator_name, operator, 'unknown'),
        COALESCE(action_description, action, 'unknown'),
        created_at
      FROM case_logs
    `);

    // 删除新表
    db.run('DROP TABLE case_logs');

    // 重命名
    db.run('ALTER TABLE case_logs_old RENAME TO case_logs');

    saveDatabase();
    console.log('✓ case_logs 表结构回滚完成');
    
  } catch (error) {
    console.error('回滚失败:', error);
    throw error;
  }
}

module.exports = { up, down };
