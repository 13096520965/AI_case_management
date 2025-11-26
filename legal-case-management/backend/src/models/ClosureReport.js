const { query, run, get } = require('../config/database');

/**
 * ClosureReport 模型 - 结案报告管理
 */
class ClosureReport {
  /**
   * 创建结案报告
   * @param {Object} reportData - 报告数据
   * @returns {Promise<number>} 新创建报告的 ID
   */
  static async create(reportData) {
    const {
      case_id,
      case_summary,
      case_result,
      experience_summary,
      risk_warnings,
      lessons_learned,
      created_by,
      approval_status = 'draft'
    } = reportData;

    const sql = `
      INSERT INTO closure_reports (
        case_id, case_summary, case_result, experience_summary,
        risk_warnings, lessons_learned, created_by, approval_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await run(sql, [
      case_id,
      case_summary,
      case_result,
      experience_summary,
      risk_warnings,
      lessons_learned,
      created_by,
      approval_status
    ]);

    return result.lastID;
  }

  /**
   * 根据 ID 获取结案报告
   * @param {number} id - 报告 ID
   * @returns {Promise<Object|null>} 报告对象
   */
  static async findById(id) {
    const sql = 'SELECT * FROM closure_reports WHERE id = ?';
    return await get(sql, [id]);
  }

  /**
   * 根据案件 ID 获取结案报告
   * @param {number} caseId - 案件 ID
   * @returns {Promise<Object|null>} 报告对象
   */
  static async findByCaseId(caseId) {
    const sql = 'SELECT * FROM closure_reports WHERE case_id = ?';
    return await get(sql, [caseId]);
  }

  /**
   * 更新结案报告
   * @param {number} id - 报告 ID
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

    // 使用后端北京时间更新 updated_at
    const { beijingNow } = require('../utils/time');
    fields.push('updated_at = ?');
    params.push(beijingNow());
    params.push(id);

    const sql = `UPDATE closure_reports SET ${fields.join(', ')} WHERE id = ?`;
    const result = await run(sql, params);
    return result.changes;
  }

  /**
   * 删除结案报告
   * @param {number} id - 报告 ID
   * @returns {Promise<number>} 影响的行数
   */
  static async delete(id) {
    const sql = 'DELETE FROM closure_reports WHERE id = ?';
    const result = await run(sql, [id]);
    return result.changes;
  }

  /**
   * 获取所有结案报告（支持分页和筛选）
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 报告列表
   */
  static async findAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      approval_status
    } = options;

    let sql = 'SELECT * FROM closure_reports WHERE 1=1';
    const params = [];

    if (approval_status) {
      sql += ' AND approval_status = ?';
      params.push(approval_status);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);

    return await query(sql, params);
  }

  /**
   * 统计结案报告数量
   * @param {Object} filters - 筛选条件
   * @returns {Promise<number>} 报告数量
   */
  static async count(filters = {}) {
    let sql = 'SELECT COUNT(*) as count FROM closure_reports WHERE 1=1';
    const params = [];

    if (filters.approval_status) {
      sql += ' AND approval_status = ?';
      params.push(filters.approval_status);
    }

    const result = await get(sql, params);
    return result.count;
  }
}

module.exports = ClosureReport;
