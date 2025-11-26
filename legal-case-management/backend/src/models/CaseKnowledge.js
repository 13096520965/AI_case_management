const { query, run, get } = require('../config/database');

/**
 * CaseKnowledge 模型 - 案例知识库管理
 */
class CaseKnowledge {
  /**
   * 创建案例知识
   * @param {Object} knowledgeData - 知识数据
   * @returns {Promise<number>} 新创建知识的 ID
   */
  static async create(knowledgeData) {
    const {
      case_id,
      archive_package_id,
      case_cause,
      dispute_focus,
      legal_issues,
      case_result,
      key_evidence,
      legal_basis,
      case_analysis,
      practical_significance,
      keywords,
      tags,
      win_rate_reference,
      created_by
    } = knowledgeData;

    const sql = `
      INSERT INTO case_knowledge (
        case_id, archive_package_id, case_cause, dispute_focus,
        legal_issues, case_result, key_evidence, legal_basis,
        case_analysis, practical_significance, keywords, tags,
        win_rate_reference, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await run(sql, [
      case_id,
      archive_package_id,
      case_cause,
      dispute_focus,
      legal_issues,
      case_result,
      key_evidence,
      legal_basis,
      case_analysis,
      practical_significance,
      keywords,
      tags,
      win_rate_reference,
      created_by
    ]);

    return result.lastID;
  }

  /**
   * 根据 ID 获取案例知识
   * @param {number} id - 知识 ID
   * @returns {Promise<Object|null>} 知识对象
   */
  static async findById(id) {
    const sql = 'SELECT * FROM case_knowledge WHERE id = ?';
    return await get(sql, [id]);
  }

  /**
   * 根据案件 ID 获取案例知识
   * @param {number} caseId - 案件 ID
   * @returns {Promise<Object|null>} 知识对象
   */
  static async findByCaseId(caseId) {
    const sql = 'SELECT * FROM case_knowledge WHERE case_id = ?';
    return await get(sql, [caseId]);
  }

  /**
   * 搜索案例知识库（支持多维度检索）
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 知识列表
   */
  static async search(options = {}) {
    const {
      page = 1,
      limit = 10,
      case_cause,
      dispute_focus,
      keywords,
      tags,
      case_result
    } = options;

    let sql = `
      SELECT ck.*, c.case_number, c.internal_number, c.court
      FROM case_knowledge ck
      LEFT JOIN cases c ON ck.case_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (case_cause) {
      sql += ' AND ck.case_cause LIKE ?';
      params.push(`%${case_cause}%`);
    }

    if (dispute_focus) {
      sql += ' AND ck.dispute_focus LIKE ?';
      params.push(`%${dispute_focus}%`);
    }

    if (keywords) {
      sql += ' AND (ck.keywords LIKE ? OR ck.case_analysis LIKE ? OR ck.legal_issues LIKE ?)';
      const keywordPattern = `%${keywords}%`;
      params.push(keywordPattern, keywordPattern, keywordPattern);
    }

    if (tags) {
      sql += ' AND ck.tags LIKE ?';
      params.push(`%${tags}%`);
    }

    if (case_result) {
      sql += ' AND ck.case_result = ?';
      params.push(case_result);
    }

    sql += ' ORDER BY ck.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);

    return await query(sql, params);
  }

  /**
   * 按案由分类统计
   * @returns {Promise<Array>} 分类统计结果
   */
  static async groupByCaseCause() {
    const sql = `
      SELECT case_cause, COUNT(*) as count
      FROM case_knowledge
      GROUP BY case_cause
      ORDER BY count DESC
    `;
    return await query(sql);
  }

  /**
   * 统计案例知识数量
   * @param {Object} filters - 筛选条件
   * @returns {Promise<number>} 知识数量
   */
  static async count(filters = {}) {
    let sql = 'SELECT COUNT(*) as count FROM case_knowledge WHERE 1=1';
    const params = [];

    if (filters.case_cause) {
      sql += ' AND case_cause LIKE ?';
      params.push(`%${filters.case_cause}%`);
    }

    if (filters.dispute_focus) {
      sql += ' AND dispute_focus LIKE ?';
      params.push(`%${filters.dispute_focus}%`);
    }

    if (filters.keywords) {
      sql += ' AND (keywords LIKE ? OR case_analysis LIKE ? OR legal_issues LIKE ?)';
      const keywordPattern = `%${filters.keywords}%`;
      params.push(keywordPattern, keywordPattern, keywordPattern);
    }

    if (filters.tags) {
      sql += ' AND tags LIKE ?';
      params.push(`%${filters.tags}%`);
    }

    if (filters.case_result) {
      sql += ' AND case_result = ?';
      params.push(filters.case_result);
    }

    const result = await get(sql, params);
    return result.count;
  }

  /**
   * 更新案例知识
   * @param {number} id - 知识 ID
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

    const sql = `UPDATE case_knowledge SET ${fields.join(', ')} WHERE id = ?`;
    const result = await run(sql, params);
    return result.changes;
  }

  /**
   * 删除案例知识
   * @param {number} id - 知识 ID
   * @returns {Promise<number>} 影响的行数
   */
  static async delete(id) {
    const sql = 'DELETE FROM case_knowledge WHERE id = ?';
    const result = await run(sql, [id]);
    return result.changes;
  }
}

module.exports = CaseKnowledge;
