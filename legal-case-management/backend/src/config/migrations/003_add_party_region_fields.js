/**
 * Migration: Add region_code and detail_address to litigation_parties table
 * 为诉讼主体表添加地区编码和详细地址字段
 */

const { getDatabase, query, saveDatabase } = require('../database');

async function up() {
  const db = await getDatabase();
  
  console.log('开始迁移: 为 litigation_parties 表添加地区字段...');
  
  try {
    // 检查表是否存在
    const tableCheck = await query("SELECT name FROM sqlite_master WHERE type='table' AND name='litigation_parties'");
    
    if (tableCheck.length === 0) {
      console.log('litigation_parties 表不存在，跳过迁移');
      return;
    }

    // 获取现有列
    const columnsResult = db.exec("PRAGMA table_info(litigation_parties)");
    const columns = columnsResult[0]?.values.map(row => row[1]) || [];

    console.log('现有列:', columns);

    // 检查是否需要迁移
    if (columns.includes('region_code') && columns.includes('detail_address')) {
      console.log('表结构已是最新，无需迁移');
      return;
    }

    // 创建新表
    db.run(`
      CREATE TABLE litigation_parties_new (
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
      )
    `);

    console.log('新表创建成功');

    // 迁移数据
    db.run(`
      INSERT INTO litigation_parties_new (
        id, case_id, party_type, entity_type, name,
        unified_credit_code, legal_representative, id_number,
        contact_phone, contact_email, address, created_at
      )
      SELECT 
        id, case_id, party_type, entity_type, name,
        unified_credit_code, legal_representative, id_number,
        contact_phone, contact_email, address, created_at
      FROM litigation_parties
    `);

    console.log('数据迁移成功');

    // 删除旧表
    db.run('DROP TABLE litigation_parties');
    console.log('旧表删除成功');

    // 重命名新表
    db.run('ALTER TABLE litigation_parties_new RENAME TO litigation_parties');
    console.log('表重命名成功');

    // 重建索引
    db.run('CREATE INDEX IF NOT EXISTS idx_litigation_parties_case_id ON litigation_parties(case_id)');
    console.log('索引创建成功');

    saveDatabase();
    console.log('✓ litigation_parties 表结构更新完成');
    
  } catch (error) {
    console.error('迁移失败:', error);
    throw error;
  }
}

async function down() {
  const db = await getDatabase();
  
  console.log('开始回滚: 移除 litigation_parties 表的地区字段...');
  
  try {
    // 创建旧表结构
    db.run(`
      CREATE TABLE litigation_parties_old (
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
      )
    `);

    // 迁移数据回旧格式
    db.run(`
      INSERT INTO litigation_parties_old (
        id, case_id, party_type, entity_type, name,
        unified_credit_code, legal_representative, id_number,
        contact_phone, contact_email, address, created_at
      )
      SELECT 
        id, case_id, party_type, entity_type, name,
        unified_credit_code, legal_representative, id_number,
        contact_phone, contact_email, address, created_at
      FROM litigation_parties
    `);

    // 删除新表
    db.run('DROP TABLE litigation_parties');

    // 重命名
    db.run('ALTER TABLE litigation_parties_old RENAME TO litigation_parties');

    saveDatabase();
    console.log('✓ litigation_parties 表结构回滚完成');
    
  } catch (error) {
    console.error('回滚失败:', error);
    throw error;
  }
}

module.exports = { up, down };
