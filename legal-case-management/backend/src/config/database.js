const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库文件路径
const DB_PATH = path.join(__dirname, '../../database/legal_case.db');

/**
 * 获取数据库连接
 * @returns {sqlite3.Database} 数据库实例
 */
function getDatabase() {
  return new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('数据库连接失败:', err.message);
      throw err;
    }
  });
}

/**
 * 执行 SQL 查询（Promise 封装）
 * @param {string} sql - SQL 语句
 * @param {Array} params - 参数
 * @returns {Promise<any>} 查询结果
 */
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.all(sql, params, (err, rows) => {
      db.close();
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

/**
 * 执行 SQL 语句（INSERT, UPDATE, DELETE）
 * @param {string} sql - SQL 语句
 * @param {Array} params - 参数
 * @returns {Promise<Object>} 执行结果
 */
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.run(sql, params, function(err) {
      db.close();
      if (err) {
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
}

/**
 * 获取单条记录
 * @param {string} sql - SQL 语句
 * @param {Array} params - 参数
 * @returns {Promise<any>} 查询结果
 */
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.get(sql, params, (err, row) => {
      db.close();
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

/**
 * 保存数据库（用于某些需要显式保存的场景）
 * 注意：SQLite 默认自动保存，此函数主要用于兼容性
 * Placeholder saver for compatibility with migration scripts that expect a
 * `saveDatabase` helper. SQLite writes are already durable on disk, so simply
 * resolve immediately to keep the existing interface intact.
 */
function saveDatabase() {
  return Promise.resolve();
}

module.exports = {
  getDatabase,
  query,
  run,
  get,
  saveDatabase,
  DB_PATH
};
