const { query, run, get } = require('../config/database');

/**
 * Evidence 模型 - 证据管理
 */
class Evidence {
  /**
   * 创建证据记录
   * @param {Object} evidenceData - 证据数据
   * @returns {Promise<number>} 新创建证据的 ID
   */
  static async create(evidenceData) {
    const {
      case_id,
      file_name,
      file_type,
      file_size,
      storage_path,
      category,
      tags,
      uploaded_by,
      version = 1,
      description
    } = evidenceData;

    // 支持自定义 uploaded_at 字段（如传入北京时间）
    const sql = `
      INSERT INTO evidence (
        case_id, file_name, file_type, file_size, storage_path,
        category, tags, uploaded_by, version, description, uploaded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await run(sql, [
      case_id ?? null,
      file_name ?? null,
      file_type ?? null,
      file_size ?? null,
      storage_path ?? null,
      category ?? null,
      tags ?? null,
      uploaded_by ?? null,
      version ?? 1,
      description ?? null,
      evidenceData.uploaded_at ?? null
    ]);
    return result.lastID;
  }

  /**
   * 根据 ID 获取证据
   * @param {number} id - 证据 ID
   * @returns {Promise<Object|null>} 证据对象
   */
  static async findById(id) {
    const sql = 'SELECT * FROM evidence WHERE id = ?';
    return await get(sql, [id]);
  }

  /**
   * 根据案件 ID 获取所有证据
   * @param {number} caseId - 案件 ID
   * @param {Object} filters - 筛选条件
   * @returns {Promise<Array>} 证据列表
   */
  static async findByCaseId(caseId, filters = {}) {
    let sql = 'SELECT * FROM evidence WHERE case_id = ?';
    const params = [caseId];

    if (filters.category) {
      sql += ' AND category = ?';
      params.push(filters.category);
    }

    if (filters.file_type) {
      sql += ' AND file_type = ?';
      params.push(filters.file_type);
    }

    sql += ' ORDER BY uploaded_at DESC';

    return await query(sql, params);
  }

  /**
   * 更新证据信息
   * @param {number} id - 证据 ID
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

    params.push(id);

    const sql = `UPDATE evidence SET ${fields.join(', ')} WHERE id = ?`;
    const result = await run(sql, params);
    return result.changes;
  }

  /**
   * 删除证据
   * @param {number} id - 证据 ID
   * @returns {Promise<number>} 影响的行数
   */
  static async delete(id) {
    const sql = 'DELETE FROM evidence WHERE id = ?';
    const result = await run(sql, [id]);
    return result.changes;
  }

  /**
   * 根据标签搜索证据
   * @param {number} caseId - 案件 ID
   * @param {string} tag - 标签
   * @returns {Promise<Array>} 证据列表
   */
  static async findByTag(caseId, tag) {
    const sql = `
      SELECT * FROM evidence 
      WHERE case_id = ? AND tags LIKE ?
      ORDER BY uploaded_at DESC
    `;
    return await query(sql, [caseId, `%${tag}%`]);
  }
}

module.exports = Evidence;
