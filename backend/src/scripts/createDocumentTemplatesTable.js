/**
 * 创建document_templates表的迁移脚本
 */

const db = require('../config/database');

async function createDocumentTemplatesTable() {
  try {
    console.log('开始创建document_templates表...');

    // 创建document_templates表
    await db.run(`
      CREATE TABLE IF NOT EXISTS document_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(200) NOT NULL,
        document_type VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        variables TEXT,
        description TEXT,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    console.log('✓ document_templates表创建成功');

    // 创建索引
    await db.run(`
      CREATE INDEX IF NOT EXISTS idx_document_templates_type 
      ON document_templates(document_type)
    `);

    console.log('✓ document_type索引创建成功');

    console.log('\n数据库迁移完成！');
    process.exit(0);
  } catch (error) {
    console.error('创建表失败:', error);
    process.exit(1);
  }
}

createDocumentTemplatesTable();
