/**
 * 迁移脚本：为 case_knowledge 表添加 ocr_content 字段
 * 用于存储上传案例的OCR识别内容
 */

const { run, get } = require('../database');

async function up() {
  try {
    // 检查字段是否已存在
    const tableInfo = await new Promise((resolve, reject) => {
      const sqlite3 = require('sqlite3').verbose();
      const { DB_PATH } = require('../database');
      const db = new sqlite3.Database(DB_PATH);
      db.all("PRAGMA table_info('case_knowledge')", (err, rows) => {
        db.close();
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const hasOcrContent = tableInfo.some(col => col.name === 'ocr_content');

    if (!hasOcrContent) {
      await run('ALTER TABLE case_knowledge ADD COLUMN ocr_content TEXT');
      console.log('✓ 已为 case_knowledge 表添加 ocr_content 字段');
    } else {
      console.log('✓ case_knowledge 表已存在 ocr_content 字段');
    }

    return true;
  } catch (error) {
    console.error('迁移失败:', error);
    throw error;
  }
}

async function down() {
  // SQLite 不支持直接删除列，需要重建表
  console.log('SQLite 不支持删除列，跳过回滚');
  return true;
}

module.exports = { up, down };
