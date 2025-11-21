/**
 * 为smart_documents表添加文件相关字段
 */

const db = require('../config/database');

async function addDocumentFileFields() {
  try {
    console.log('开始为smart_documents表添加文件相关字段...');

    // 检查字段是否已存在
    const tableInfo = await db.query("PRAGMA table_info(smart_documents)");
    const existingColumns = tableInfo.map(col => col.name);

    // 添加file_name字段
    if (!existingColumns.includes('file_name')) {
      await db.run(`
        ALTER TABLE smart_documents 
        ADD COLUMN file_name VARCHAR(255)
      `);
      console.log('✓ file_name字段添加成功');
    } else {
      console.log('• file_name字段已存在');
    }

    // 添加file_path字段
    if (!existingColumns.includes('file_path')) {
      await db.run(`
        ALTER TABLE smart_documents 
        ADD COLUMN file_path VARCHAR(500)
      `);
      console.log('✓ file_path字段添加成功');
    } else {
      console.log('• file_path字段已存在');
    }

    // 添加file_size字段
    if (!existingColumns.includes('file_size')) {
      await db.run(`
        ALTER TABLE smart_documents 
        ADD COLUMN file_size INTEGER
      `);
      console.log('✓ file_size字段添加成功');
    } else {
      console.log('• file_size字段已存在');
    }

    // 修改content字段为可空（因为上传文件时可能没有文本内容）
    console.log('\n注意：SQLite不支持直接修改列属性');
    console.log('如需将content字段改为可空，需要重建表');

    console.log('\n数据库迁移完成！');
    process.exit(0);
  } catch (error) {
    console.error('添加字段失败:', error);
    process.exit(1);
  }
}

addDocumentFileFields();
