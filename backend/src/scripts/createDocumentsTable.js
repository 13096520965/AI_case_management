/**
 * 创建documents表的迁移脚本
 */

const db = require('../config/database');

async function createDocumentsTable() {
  try {
    console.log('开始创建documents表...');

    // 创建smart_documents表
    await db.run(`
      CREATE TABLE IF NOT EXISTS smart_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        case_id INTEGER NOT NULL,
        document_type VARCHAR(50),
        document_name VARCHAR(200) NOT NULL,
        content TEXT NOT NULL,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    console.log('✓ smart_documents表创建成功');

    // 创建索引
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

    console.log('\n数据库迁移完成！');
    process.exit(0);
  } catch (error) {
    console.error('创建表失败:', error);
    process.exit(1);
  }
}

createDocumentsTable();
