const { query, run, get } = require('../config/database');
const bcrypt = require('bcryptjs');

/**
 * User 模型 - 用户管理
 */
class User {
  /**
   * 创建用户
   * @param {Object} userData - 用户数据
   * @returns {Promise<number>} 新创建用户的 ID
   */
  static async create(userData) {
    const {
      username,
      password,
      real_name,
      email,
      role = 'user'
    } = userData;

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO users (
        username, password, real_name, email, role
      ) VALUES (?, ?, ?, ?, ?)
    `;

    const result = await run(sql, [
      username,
      hashedPassword,
      real_name,
      email,
      role
    ]);

    return result.lastID;
  }

  /**
   * 根据 ID 获取用户
   * @param {number} id - 用户 ID
   * @returns {Promise<Object|null>} 用户对象（不包含密码）
   */
  static async findById(id) {
    const sql = 'SELECT id, username, real_name, email, role, created_at FROM users WHERE id = ?';
    return await get(sql, [id]);
  }

  /**
   * 根据用户名获取用户
   * @param {string} username - 用户名
   * @returns {Promise<Object|null>} 用户对象
   */
  static async findByUsername(username) {
    const sql = 'SELECT * FROM users WHERE username = ?';
    return await get(sql, [username]);
  }

  /**
   * 根据邮箱获取用户
   * @param {string} email - 邮箱
   * @returns {Promise<Object|null>} 用户对象
   */
  static async findByEmail(email) {
    const sql = 'SELECT * FROM users WHERE email = ?';
    return await get(sql, [email]);
  }

  /**
   * 获取所有用户
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 用户列表（不包含密码）
   */
  static async findAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      role
    } = options;

    let sql = 'SELECT id, username, real_name, email, role, created_at FROM users WHERE 1=1';
    const params = [];

    if (role) {
      sql += ' AND role = ?';
      params.push(role);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);

    return await query(sql, params);
  }

  /**
   * 更新用户信息
   * @param {number} id - 用户 ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<number>} 影响的行数
   */
  static async update(id, updateData) {
    const fields = [];
    const params = [];

    // 如果更新密码，需要加密
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(updateData[key]);
      }
    });

    params.push(id);

    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    const result = await run(sql, params);
    return result.changes;
  }

  /**
   * 删除用户
   * @param {number} id - 用户 ID
   * @returns {Promise<number>} 影响的行数
   */
  static async delete(id) {
    const sql = 'DELETE FROM users WHERE id = ?';
    const result = await run(sql, [id]);
    return result.changes;
  }

  /**
   * 验证用户密码
   * @param {string} username - 用户名
   * @param {string} password - 密码
   * @returns {Promise<Object|null>} 验证成功返回用户对象（不包含密码），失败返回 null
   */
  static async authenticate(username, password) {
    const user = await this.findByUsername(username);
    
    if (!user) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      return null;
    }

    // 返回用户信息，不包含密码
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * 检查用户名是否存在
   * @param {string} username - 用户名
   * @returns {Promise<boolean>} 存在返回 true，否则返回 false
   */
  static async usernameExists(username) {
    const sql = 'SELECT COUNT(*) as count FROM users WHERE username = ?';
    const result = await get(sql, [username]);
    return result.count > 0;
  }

  /**
   * 检查邮箱是否存在
   * @param {string} email - 邮箱
   * @returns {Promise<boolean>} 存在返回 true，否则返回 false
   */
  static async emailExists(email) {
    const sql = 'SELECT COUNT(*) as count FROM users WHERE email = ?';
    const result = await get(sql, [email]);
    return result.count > 0;
  }

  /**
   * 统计用户数量
   * @param {Object} filters - 筛选条件
   * @returns {Promise<number>} 用户数量
   */
  static async count(filters = {}) {
    let sql = 'SELECT COUNT(*) as count FROM users WHERE 1=1';
    const params = [];

    if (filters.role) {
      sql += ' AND role = ?';
      params.push(filters.role);
    }

    const result = await get(sql, params);
    return result.count;
  }
}

module.exports = User;
