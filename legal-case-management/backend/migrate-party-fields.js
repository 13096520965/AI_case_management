/**
 * 运行诉讼主体表字段迁移脚本
 */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'database/legal_case.db');

async function migrate() {
  console.log('='.repeat(60));
  console.log('迁移数据库:', DB_PATH);
  console.log('='.repeat(60));
  
  try {
    // 初始化 SQL.js
    const SQL = await initSqlJs();
    
    // 读取数据库
    const buffer = fs.readFileSync(DB_PATH);
    const db = new SQL.Database(buffer);
    
    console.log('\n检查当前表结构...');
    
    // 获取现有列
    const columnsResult = db.exec("PRAGMA table_info(litigation_parties)");
    const columns = columnsResult[0]?.values.map(row => row[1]) || [];
    
    console.log('现有列:', columns);
    
    // 检查是否需要迁移
    if (columns.includes('region_code') && columns.includes('detail_address')) {
      console.log('\n✓ 表结构已是最新，无需迁移');
      return;
    }
    
    console.log('\n开始迁移...');
    
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
    console.log('✓ 新表创建成功');
    
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
    console.log('✓ 数据迁移成功');
    
    // 删除旧表
    db.run('DROP TABLE litigation_parties');
    console.log('✓ 旧表删除成功');
    
    // 重命名新表
    db.run('ALTER TABLE litigation_parties_new RENAME TO litigation_parties');
    console.log('✓ 表重命名成功');
    
    // 重建索引
    db.run('CREATE INDEX IF NOT EXISTS idx_litigation_parties_case_id ON litigation_parties(case_id)');
    console.log('✓ 索引创建成功');
    
    // 保存数据库
    const data = db.export();
    const newBuffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, newBuffer);
    console.log('✓ 数据库保存成功');
    
    // 验证新结构
    const newColumnsResult = db.exec("PRAGMA table_info(litigation_parties)");
    const newColumns = newColumnsResult[0]?.values.map(row => row[1]) || [];
    
    console.log('\n新表结构:');
    newColumns.forEach(col => console.log('  -', col));
    
    console.log('\n' + '='.repeat(60));
    console.log('✓ 迁移成功完成！');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('✗ 迁移失败:', error.message);
    console.error('='.repeat(60));
    console.error(error);
    process.exit(1);
  }
}

migrate();
