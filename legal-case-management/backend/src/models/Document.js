const { query, run, get } = require('../config/database');

/**
 * Document 模型 - 文书管理
 */
class Document {
  /**
   * 创建文书记录
   * @param {Object} documentData - 文书数据
   * @returns {Promise<number>} 新创建文书的 ID
   */
  static async create(documentData) {
    const {
      case_id,
      document_type,
      file_name,
      storage_path,
      extracted_content,
      description
    } = documentData;

    // 支持自定义 uploaded_at 字段（如传入北京时间）
    const sql = `
      INSERT INTO documents (
        case_id, document_type, file_name, storage_path, extracted_content, description, uploaded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await run(sql, [
      case_id ?? null,
      document_type ?? null,
      file_name ?? null,
      storage_path ?? null,
      extracted_content ?? null,
      description ?? null,
      documentData.uploaded_at ?? null
    ]);
    return result.lastID;
  }

  /**
   * 根据 ID 获取文书
   * @param {number} id - 文书 ID
   * @returns {Promise<Object|null>} 文书对象
   */
  static async findById(id) {
    const sql = 'SELECT * FROM documents WHERE id = ?';
    return await get(sql, [id]);
  }

  /**
   * 根据案件 ID 获取所有文书
   * @param {number} caseId - 案件 ID
   * @param {string} documentType - 文书类型（可选）
   * @returns {Promise<Array>} 文书列表
   */
  static async findByCaseId(caseId, documentType = null) {
    let sql = 'SELECT * FROM documents WHERE case_id = ?';
    const params = [caseId];

    if (documentType) {
      sql += ' AND document_type = ?';
      params.push(documentType);
    }

    sql += ' ORDER BY uploaded_at DESC';

    return await query(sql, params);
  }

  /**
   * 更新文书信息
   * @param {number} id - 文书 ID
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

    const sql = `UPDATE documents SET ${fields.join(', ')} WHERE id = ?`;
    const result = await run(sql, params);
    return result.changes;
  }

  /**
   * 删除文书
   * @param {number} id - 文书 ID
   * @returns {Promise<number>} 影响的行数
   */
  static async delete(id) {
    const sql = 'DELETE FROM documents WHERE id = ?';
    const result = await run(sql, [id]);
    return result.changes;
  }

  /**
   * 搜索文书（根据文件名或提取内容）
   * @param {number} caseId - 案件 ID
   * @param {string} keyword - 关键词
   * @returns {Promise<Array>} 文书列表
   */
  static async search(caseId, keyword) {
    const sql = `
      SELECT * FROM documents 
      WHERE case_id = ? AND (file_name LIKE ? OR extracted_content LIKE ?)
      ORDER BY uploaded_at DESC
    `;
    const searchPattern = `%${keyword}%`;
    return await query(sql, [caseId, searchPattern, searchPattern]);
  }
}

module.exports = Document;
