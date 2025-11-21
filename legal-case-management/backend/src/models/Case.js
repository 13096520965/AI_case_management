const { query, run, get } = require('../config/database');

/**
 * Case 模型 - 案件管理
 */
class Case {
  /**
   * 创建案件
   * @param {Object} caseData - 案件数据
   * @returns {Promise<number>} 新创建案件的 ID
   */
  static async create(caseData) {
    const {
      case_number,
      internal_number,
      case_type,
      case_cause,
      court,
      target_amount,
      filing_date,
      status = 'active',
      team_id
    } = caseData;

    const sql = `
      INSERT INTO cases (
        case_number, internal_number, case_type, case_cause, 
        court, target_amount, filing_date, status, team_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // 将 undefined 转换为 null，避免 SQL 绑定错误
    const result = await run(sql, [
      case_number ?? null,
      internal_number ?? null,
      case_type ?? null,
      case_cause ?? null,
      court ?? null,
      target_amount ?? null,
      filing_date ?? null,
      status ?? 'active',
      team_id ?? null
    ]);

    return result.lastID;
  }

  /**
   * 根据 ID 获取案件
   * @param {number} id - 案件 ID
   * @returns {Promise<Object|null>} 案件对象
   */
  static async findById(id) {
    const sql = 'SELECT * FROM cases WHERE id = ?';
    return await get(sql, [id]);
  }

  /**
   * 获取所有案件（支持分页和筛选）
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 案件列表
   */
  static async findAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      status,
      case_type,
      search,
      party_name
    } = options;

    let sql = 'SELECT DISTINCT c.* FROM cases c';
    const params = [];
    
    // 如果搜索当事人，需要 JOIN litigation_parties 表
    if (party_name) {
      sql += ' LEFT JOIN litigation_parties lp ON c.id = lp.case_id';
    }
    
    sql += ' WHERE 1=1';

    if (status) {
      sql += ' AND c.status = ?';
      params.push(status);
    }

    if (case_type) {
      sql += ' AND c.case_type = ?';
      params.push(case_type);
    }

    if (search) {
      sql += ' AND (c.internal_number LIKE ? OR c.case_number LIKE ? OR c.case_cause LIKE ? OR c.court LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }
    
    // 按当事人姓名/名称搜索
    if (party_name) {
      sql += ' AND lp.name LIKE ?';
      params.push(`%${party_name}%`);
    }

    sql += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);

    return await query(sql, params);
  }

  /**
   * 更新案件
   * @param {number} id - 案件 ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<number>} 影响的行数
   */
  static async update(id, updateData) {
    const fields = [];
    const params = [];

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(updateData[key]);
      }
    });

    fields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const sql = `UPDATE cases SET ${fields.join(', ')} WHERE id = ?`;
    const result = await run(sql, params);
    return result.changes;
  }

  /**
   * 删除案件
   * @param {number} id - 案件 ID
   * @returns {Promise<number>} 影响的行数
   */
  static async delete(id) {
    const sql = 'DELETE FROM cases WHERE id = ?';
    const result = await run(sql, [id]);
    return result.changes;
  }

  /**
   * 统计案件数量
   * @param {Object} filters - 筛选条件
   * @returns {Promise<number>} 案件数量
   */
  static async count(filters = {}) {
    let sql = 'SELECT COUNT(DISTINCT c.id) as count FROM cases c';
    const params = [];
    
    // 如果搜索当事人，需要 JOIN litigation_parties 表
    if (filters.party_name) {
      sql += ' LEFT JOIN litigation_parties lp ON c.id = lp.case_id';
    }
    
    sql += ' WHERE 1=1';

    if (filters.status) {
      sql += ' AND c.status = ?';
      params.push(filters.status);
    }

    if (filters.case_type) {
      sql += ' AND c.case_type = ?';
      params.push(filters.case_type);
    }

    if (filters.search) {
      sql += ' AND (c.internal_number LIKE ? OR c.case_number LIKE ? OR c.case_cause LIKE ? OR c.court LIKE ?)';
      const searchPattern = `%${filters.search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }
    
    // 按当事人姓名/名称搜索
    if (filters.party_name) {
      sql += ' AND lp.name LIKE ?';
      params.push(`%${filters.party_name}%`);
    }

    const result = await get(sql, params);
    return result.count;
  }

  /**
   * 根据案号查找案件
   * @param {string} caseNumber - 案号
   * @returns {Promise<Object|null>} 案件对象
   */
  static async findByCaseNumber(caseNumber) {
    const sql = 'SELECT * FROM cases WHERE case_number = ?';
    return await get(sql, [caseNumber]);
  }

  /**
   * 根据内部编号查找案件
   * @param {string} internalNumber - 内部编号
   * @returns {Promise<Object|null>} 案件对象
   */
  static async findByInternalNumber(internalNumber) {
    const sql = 'SELECT * FROM cases WHERE internal_number = ?';
    return await get(sql, [internalNumber]);
  }

  /**
   * 查找指定前缀的最后一个案件（用于生成编号）
   * @param {string} prefix - 编号前缀
   * @returns {Promise<Object|null>} 案件对象
   */
  static async findLastByPrefix(prefix) {
    const sql = `
      SELECT * FROM cases 
      WHERE internal_number LIKE ? 
      ORDER BY internal_number DESC 
      LIMIT 1
    `;
    return await get(sql, [`${prefix}%`]);
  }

  /**
   * 添加操作日志
   * @param {number} caseId - 案件 ID
   * @param {string} operator - 操作人
   * @param {string} action - 操作内容
   * @returns {Promise<number>} 日志 ID
   */
  static async addLog(caseId, operator, action) {
    // 获取北京时间 (UTC+8)
    const now = new Date();
    const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
    const timestamp = beijingTime.toISOString().replace('T', ' ').substring(0, 19);
    
    const sql = `
      INSERT INTO case_logs (case_id, operator, action, created_at)
      VALUES (?, ?, ?, ?)
    `;
    const result = await run(sql, [caseId, operator, action, timestamp]);
    return result.lastID;
  }

  /**
   * 获取案件操作日志
   * @param {number} caseId - 案件 ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 日志列表
   */
  static async getLogs(caseId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const sql = `
      SELECT 
        id,
        operator,
        action,
        created_at
      FROM case_logs
      WHERE case_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    return await query(sql, [caseId, limit, offset]);
  }

  /**
   * 统计案件日志数量
   * @param {number} caseId - 案件 ID
   * @returns {Promise<number>} 日志数量
   */
  static async countLogs(caseId) {
    const sql = 'SELECT COUNT(*) as count FROM case_logs WHERE case_id = ?';
    const result = await get(sql, [caseId]);
    return result ? result.count : 0;
  }
}

module.exports = Case;
