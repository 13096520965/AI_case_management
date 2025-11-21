/**
 * 更新smart_documents表结构，使content字段可空
 */

const db = require('../config/database');

async function updateDocumentsTableSchema() {
  try {
    console.log('开始更新smart_documents表结构...');

    // 1. 创建新表
    await db.run(`
      CREATE TABLE IF NOT EXISTS smart_documents_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        case_id INTEGER NOT NULL,
        document_type VARCHAR(50),
        document_name VARCHAR(200) NOT NULL,
        content TEXT,
        file_name VARCHAR(255),
        file_path VARCHAR(500),
        file_size INTEGER,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);
    console.log('✓ 新表创建成功');

    // 2. 复制数据
    await db.run(`
      INSERT INTO smart_documents_new 
      SELECT id, case_id, document_type, document_name, content, 
             file_name, file_path, file_size, created_by, created_at, updated_at
      FROM smart_documents
    `);
    console.log('✓ 数据复制成功');

    // 3. 删除旧表
    await db.run('DROP TABLE smart_documents');
    console.log('✓ 旧表删除成功');

    // 4. 重命名新表
    await db.run('ALTER TABLE smart_documents_new RENAME TO smart_documents');
    console.log('✓ 表重命名成功');

    // 5. 重建索引
    await db.run(`
      CREATE INDEX IF NOT EXISTS idx_smart_documents_case_id 
      ON smart_documents(case_id)
    `);
    console.log('✓ case_id索引创建成功');

    await db.run(`
      CREATE INDEX IF NOT EXISTS idx_smart_documents_type 
      ON smart_documents(document_type)
    `);
    console.log('✓ document_type索引创建成功');

    console.log('\n数据库表结构更新完成！');
    process.exit(0);
  } catch (error) {
    console.error('更新表结构失败:', error);
    process.exit(1);
  }
}

updateDocumentsTableSchema();
