/**
 * Migration: Add case_result column to cases table
 */

const { getDatabase, saveDatabase } = require('../database');

async function up() {
  const db = await getDatabase();
  console.log('开始迁移: 为 cases 表添加 case_result 字段...');

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

    // 如果已经存在 case_result，则跳过
    if (columns.includes('case_result')) {
      console.log('case_result 字段已存在，跳过迁移');
      return;
    }

    // 添加 case_result 字段
    db.run('ALTER TABLE cases ADD COLUMN case_result VARCHAR(200)');
    console.log('✓ case_result 字段添加成功');

    saveDatabase();
    console.log('✓ cases 表 case_result 字段添加完成');
  } catch (error) {
    console.error('迁移失败:', error);
    throw error;
  }
}

async function down() {
  const db = await getDatabase();
  console.log('开始回滚: 删除 cases 表的 case_result 字段...');

  try {
    // SQLite 不支持直接删除列，需要重建表（此回滚会丢失 case_result 数据）
    const columnsResult = db.exec("PRAGMA table_info(cases)");
    const columns = columnsResult[0]?.values.map(row => row[1]) || [];

    if (!columns.includes('case_result')) {
      console.log('case_result 字段不存在，跳过回滚');
      return;
    }

    // 创建临时表（不包含 case_result）
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
        industry_segment VARCHAR(50),
        handler VARCHAR(100),
        is_external_agent BOOLEAN DEFAULT 0,
        law_firm_name VARCHAR(200),
        agent_lawyer VARCHAR(100),
        agent_contact VARCHAR(100),
        case_background TEXT,
        created_at DATETIME DEFAULT (datetime('now', '+8 hours')),
        updated_at DATETIME DEFAULT (datetime('now', '+8 hours'))
      )
    `);

    // 复制数据（不包括 case_result）
    db.run(`
      INSERT INTO cases_temp (
        id, case_number, internal_number, case_type, case_cause,
        court, target_amount, filing_date, status, team_id, industry_segment,
        handler, is_external_agent, law_firm_name, agent_lawyer, agent_contact,
        case_background, created_at, updated_at
      )
      SELECT 
        id, case_number, internal_number, case_type, case_cause,
        court, target_amount, filing_date, status, team_id, industry_segment,
        handler, is_external_agent, law_firm_name, agent_lawyer, agent_contact,
        case_background, created_at, updated_at
      FROM cases
    `);

    db.run('DROP TABLE cases');
    db.run('ALTER TABLE cases_temp RENAME TO cases');

    saveDatabase();
    console.log('✓ 回滚完成: case_result 字段已删除（数据已迁移，case_result 数据将丢失）');
  } catch (error) {
    console.error('回滚失败:', error);
    throw error;
  }
}

module.exports = { up, down };
