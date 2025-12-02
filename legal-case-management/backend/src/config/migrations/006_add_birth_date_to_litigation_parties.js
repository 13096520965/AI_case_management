/**
 * Migration: Add birth_date column to litigation_parties table
 */

const { getDatabase, saveDatabase } = require('../database');

async function up() {
  const db = await getDatabase();
  console.log('开始迁移: 为 litigation_parties 表添加 birth_date 字段...');

  try {
    // 检查表是否存在
    const tableCheck = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='litigation_parties'");
    if (tableCheck.length === 0) {
      console.log('litigation_parties 表不存在，跳过迁移');
      return;
    }

    // 获取现有列
    const columnsResult = db.exec("PRAGMA table_info(litigation_parties)");
    const columns = columnsResult[0]?.values.map(row => row[1]) || [];

    // 如果已经存在 birth_date，则跳过
    if (columns.includes('birth_date')) {
      console.log('birth_date 字段已存在，跳过迁移');
      return;
    }

    // 添加 birth_date 字段
    db.run('ALTER TABLE litigation_parties ADD COLUMN birth_date DATE');
    console.log('✓ birth_date 字段添加成功');

    saveDatabase();
    console.log('✓ litigation_parties 表 birth_date 字段添加完成');
  } catch (error) {
    console.error('迁移失败:', error);
    throw error;
  }
}

async function down() {
  const db = await getDatabase();
  console.log('开始回滚: 删除 litigation_parties 表的 birth_date 字段...');

  try {
    const columnsResult = db.exec("PRAGMA table_info(litigation_parties)");
    const columns = columnsResult[0]?.values.map(row => row[1]) || [];

    if (!columns.includes('birth_date')) {
      console.log('birth_date 字段不存在，跳过回滚');
      return;
    }

    // SQLite 不支持删除列，需重建表（回滚会导致 birth_date 数据丢失）
    db.run(`
      CREATE TABLE litigation_parties_temp (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        case_id INTEGER NOT NULL,
        party_type VARCHAR(50) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        name VARCHAR(200) NOT NULL,
        unified_credit_code VARCHAR(100),
        legal_representative VARCHAR(100),
        id_number VARCHAR(50),
        contact_phone VARCHAR(50),
        contact_email VARCHAR(100),
        address TEXT,
        region_code VARCHAR(100),
        detail_address TEXT,
        created_at DATETIME DEFAULT (datetime('now', '+8 hours')),
        FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
      )
    `);

    db.run(`
      INSERT INTO litigation_parties_temp (
        id, case_id, party_type, entity_type, name, unified_credit_code,
        legal_representative, id_number, contact_phone, contact_email,
        address, region_code, detail_address, created_at
      )
      SELECT
        id, case_id, party_type, entity_type, name, unified_credit_code,
        legal_representative, id_number, contact_phone, contact_email,
        address, region_code, detail_address, created_at
      FROM litigation_parties
    `);

    db.run('DROP TABLE litigation_parties');
    db.run('ALTER TABLE litigation_parties_temp RENAME TO litigation_parties');

    saveDatabase();
    console.log('✓ 回滚完成: birth_date 字段已删除（数据将丢失）');
  } catch (error) {
    console.error('回滚失败:', error);
    throw error;
  }
}

module.exports = { up, down };
