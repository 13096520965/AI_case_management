const { query, run, get } = require('../config/database');

/**
 * 知识库数据访问层
 * 提供案例知识库的数据库操作方法
 */
class KnowledgeModel {
  /**
   * 查询所有知识条目（支持分页和多条件筛选）
   * @param {Object} options - 查询选项
   * @param {number} options.page - 页码，默认 1
   * @param {number} options.limit - 每页数量，默认 10
   * @param {string} options.case_cause - 案由筛选
   * @param {string} options.dispute_focus - 争议焦点筛选
   * @param {string} options.keywords - 关键词筛选
   * @param {string} options.tags - 标签筛选
   * @param {string} options.case_result - 案件结果筛选
   * @returns {Promise<Array>} 知识条目列表
   */
  async findAll(options = {}) {
    const { 
      page = 1, 
      limit = 10, 
      case_cause, 
      dispute_focus, 
      keywords,
      tags,
      case_result
    } = options;
    
    const offset = (page - 1) * limit;
    
    let sql = 'SELECT * FROM case_knowledge WHERE 1=1';
    const params = [];
    
    // 案由筛选
    if (case_cause) {
      sql += ' AND case_cause LIKE ?';
      params.push(`%${case_cause}%`);
    }
    
    // 争议焦点筛选
    if (dispute_focus) {
      sql += ' AND dispute_focus LIKE ?';
      params.push(`%${dispute_focus}%`);
    }
    
    // 关键词筛选（在多个字段中搜索）
    if (keywords) {
      sql += ' AND (keywords LIKE ? OR tags LIKE ? OR case_analysis LIKE ? OR legal_issues LIKE ?)';
      const keywordPattern = `%${keywords}%`;
      params.push(keywordPattern, keywordPattern, keywordPattern, keywordPattern);
    }
    
    // 标签筛选
    if (tags) {
      sql += ' AND tags LIKE ?';
      params.push(`%${tags}%`);
    }
    
    // 案件结果筛选
    if (case_result) {
      sql += ' AND case_result LIKE ?';
      params.push(`%${case_result}%`);
    }
    
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    return await query(sql, params);
  }

  /**
   * 根据 ID 查询单条知识记录
   * @param {number} id - 知识条目 ID
   * @returns {Promise<Object|undefined>} 知识条目对象，不存在则返回 undefined
   */
  async findById(id) {
    const sql = 'SELECT * FROM case_knowledge WHERE id = ?';
    return await get(sql, [id]);
  }

  /**
   * 创建新的知识条目
   * @param {Object} data - 知识条目数据
   * @param {number} data.case_id - 关联案件 ID（可选）
   * @param {number} data.archive_package_id - 关联归档包 ID（可选）
   * @param {string} data.case_cause - 案由（必填）
   * @param {string} data.dispute_focus - 争议焦点（必填）
   * @param {string} data.legal_issues - 法律问题（可选）
   * @param {string} data.case_result - 案件结果（可选）
   * @param {string} data.key_evidence - 关键证据（可选）
   * @param {string} data.legal_basis - 法律依据（可选）
   * @param {string} data.case_analysis - 案例分析（可选）
   * @param {string} data.practical_significance - 实践意义（可选）
   * @param {string} data.keywords - 关键词（可选）
   * @param {string} data.tags - 标签（可选）
   * @param {string} data.win_rate_reference - 胜率参考（可选）
   * @param {string} data.created_by - 创建人（可选）
   * @returns {Promise<number>} 新创建知识条目的 ID
   */
  async create(data) {
    const sql = `
      INSERT INTO case_knowledge (
        case_id, archive_package_id, case_cause, dispute_focus,
        legal_issues, case_result, key_evidence, legal_basis,
        case_analysis, practical_significance, keywords, tags,
        win_rate_reference, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      data.case_id || null,
      data.archive_package_id || null,
      data.case_cause,
      data.dispute_focus,
      data.legal_issues || null,
      data.case_result || null,
      data.key_evidence || null,
      data.legal_basis || null,
      data.case_analysis || null,
      data.practical_significance || null,
      data.keywords || null,
      data.tags || null,
      data.win_rate_reference || null,
      data.created_by || null
    ];
    
    const result = await run(sql, params);
    return result.lastID;
  }

  /**
   * 更新知识条目
   * @param {number} id - 知识条目 ID
   * @param {Object} data - 要更新的数据
   * @returns {Promise<number>} 影响的行数
   */
  async update(id, data) {
    const fields = [];
    const params = [];
    
    // 动态构建更新字段（只更新提供的字段）
    const allowedFields = [
      'case_id', 'archive_package_id', 'case_cause', 'dispute_focus',
      'legal_issues', 'case_result', 'key_evidence', 'legal_basis',
      'case_analysis', 'practical_significance', 'keywords', 'tags',
      'win_rate_reference', 'created_by'
    ];
    
    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        params.push(data[field]);
      }
    });
    
    if (fields.length === 0) {
      throw new Error('没有要更新的字段');
    }
    
    // 自动更新 updated_at 字段
    fields.push('updated_at = CURRENT_TIMESTAMP');
    
    params.push(id);
    const sql = `UPDATE case_knowledge SET ${fields.join(', ')} WHERE id = ?`;
    
    const result = await run(sql, params);
    return result.changes;
  }

  /**
   * 删除知识条目
   * @param {number} id - 知识条目 ID
   * @returns {Promise<number>} 影响的行数
   */
  async delete(id) {
    const sql = 'DELETE FROM case_knowledge WHERE id = ?';
    const result = await run(sql, [id]);
    return result.changes;
  }

  /**
   * 统计符合条件的记录数
   * @param {Object} filters - 筛选条件
   * @param {string} filters.case_cause - 案由筛选
   * @param {string} filters.dispute_focus - 争议焦点筛选
   * @param {string} filters.keywords - 关键词筛选
   * @param {string} filters.tags - 标签筛选
   * @param {string} filters.case_result - 案件结果筛选
   * @returns {Promise<number>} 记录数量
   */
  async count(filters = {}) {
    let sql = 'SELECT COUNT(*) as count FROM case_knowledge WHERE 1=1';
    const params = [];
    
    // 案由筛选
    if (filters.case_cause) {
      sql += ' AND case_cause LIKE ?';
      params.push(`%${filters.case_cause}%`);
    }
    
    // 争议焦点筛选
    if (filters.dispute_focus) {
      sql += ' AND dispute_focus LIKE ?';
      params.push(`%${filters.dispute_focus}%`);
    }
    
    // 关键词筛选
    if (filters.keywords) {
      sql += ' AND (keywords LIKE ? OR tags LIKE ? OR case_analysis LIKE ? OR legal_issues LIKE ?)';
      const keywordPattern = `%${filters.keywords}%`;
      params.push(keywordPattern, keywordPattern, keywordPattern, keywordPattern);
    }
    
    // 标签筛选
    if (filters.tags) {
      sql += ' AND tags LIKE ?';
      params.push(`%${filters.tags}%`);
    }
    
    // 案件结果筛选
    if (filters.case_result) {
      sql += ' AND case_result LIKE ?';
      params.push(`%${filters.case_result}%`);
    }
    
    const result = await get(sql, params);
    return result ? result.count : 0;
  }
}

// 导出单例实例
module.exports = new KnowledgeModel();
