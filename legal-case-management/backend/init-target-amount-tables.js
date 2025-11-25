/**
 * 初始化标的处理详情和汇款记录表
 * 此脚本会在服务器启动前自动运行
 */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'database/legal_case.db');
const MIGRATION_FILE = path.join(__dirname, 'database/migrations/007_create_target_amount_tables.sql');

async function initTables() {
  try {
    // 初始化 SQL.js
    const SQL = await initSqlJs();
    
    // 加载数据库
    let db;
    if (fs.existsSync(DB_PATH)) {
      const buffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(buffer);
    } else {
      console.log('数据库文件不存在，跳过初始化');
      return;
    }
    
    // 检查表是否已存在
    const tables = db.exec(
      `SELECT name FROM sqlite_master WHERE type='table' AND name IN ('target_amount_details', 'payment_records')`
    );
    
    if (tables.length > 0 && tables[0].values.length === 2) {
      console.log('✓ 标的处理详情表已存在');
      return;
    }
    
    console.log('创建标的处理详情表...');
    
    // 读取并执行迁移SQL
    const sql = fs.readFileSync(MIGRATION_FILE, 'utf8');
    const statements = sql.split(';').filter(s => s.trim());
    
    for (const stmt of statements) {
      if (stmt.trim()) {
        db.run(stmt);
      }
    }
    
    // 保存数据库
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
    
    console.log('✓ 标的处理详情表创建成功');
    
  } catch (error) {
    console.error('初始化标的处理详情表失败:', error.message);
    // 不抛出错误，允许服务器继续启动
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initTables().then(() => {
    console.log('初始化完成');
    process.exit(0);
  }).catch(err => {
    console.error('初始化失败:', err);
    process.exit(1);
  });
}

module.exports = initTables;
