const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

// 数据库文件路径
const DB_PATH = path.join(__dirname, '../../database/legal_case.db');

let SQL = null;
let dbInstance = null;

/**
 * 初始化 SQL.js
 */
async function initSQL() {
  if (!SQL) {
    SQL = await initSqlJs();
  }
  return SQL;
}

/**
 * 获取数据库连接
 * @returns {Promise<Object>} 数据库实例
 */
async function getDatabase() {
  await initSQL();
  
  if (dbInstance) {
    return dbInstance;
  }
  
  try {
    if (fs.existsSync(DB_PATH)) {
      const buffer = fs.readFileSync(DB_PATH);
      dbInstance = new SQL.Database(buffer);
    } else {
      dbInstance = new SQL.Database();
    }
    return dbInstance;
  } catch (err) {
    console.error('数据库连接失败:', err.message);
    throw err;
  }
}

/**
 * 保存数据库到文件
 */
function saveDatabase() {
  if (dbInstance) {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

/**
 * 执行 SQL 查询（Promise 封装）
 * @param {string} sql - SQL 语句
 * @param {Array} params - 参数
 * @returns {Promise<any>} 查询结果
 */
async function query(sql, params = []) {
  try {
    const db = await getDatabase();
    const result = db.exec(sql, params);
    saveDatabase();
    
    if (result.length === 0) {
      return [];
    }
    
    const columns = result[0].columns;
    const values = result[0].values;
    
    return values.map(row => {
      const obj = {};
      columns.forEach((col, index) => {
        obj[col] = row[index];
      });
      return obj;
    });
  } catch (err) {
    throw err;
  }
}

/**
 * 执行 SQL 语句（INSERT, UPDATE, DELETE）
 * @param {string} sql - SQL 语句
 * @param {Array} params - 参数
 * @returns {Promise<Object>} 执行结果
 */
async function run(sql, params = []) {
  try {
    const db = await getDatabase();
    
    // 执行 SQL 语句
    db.run(sql, params);
    
    // 获取最后插入的 ID 和影响的行数
    const lastIdResult = db.exec("SELECT last_insert_rowid() as lastID");
    const changesResult = db.exec("SELECT changes() as changes");
    
    const lastID = lastIdResult[0]?.values[0]?.[0] || null;
    const changes = changesResult[0]?.values[0]?.[0] || 0;
    
    // 保存数据库
    saveDatabase();
    
    return { lastID, changes };
  } catch (err) {
    console.error('SQL execution error:', err);
    throw err;
  }
}

/**
 * 获取单条记录
 * @param {string} sql - SQL 语句
 * @param {Array} params - 参数
 * @returns {Promise<any>} 查询结果
 */
async function get(sql, params = []) {
  try {
    const rows = await query(sql, params);
    return rows.length > 0 ? rows[0] : undefined;
  } catch (err) {
    throw err;
  }
}

module.exports = {
  getDatabase,
  query,
  run,
  get,
  saveDatabase,
  DB_PATH
};
