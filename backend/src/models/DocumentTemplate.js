const { query, run, get } = require('../config/database');

/**
 * DocumentTemplate 模型 - 文书模板管理
 */
class DocumentTemplate {
  /**
   * 创建文书模板
   * @param {Object} templateData - 模板数据
   * @returns {Promise<number>} 新创建模板的 ID
   */
  static async create(templateData) {
    const {
      template_name,
      document_type,
      content,
      variables,
      description
    } = templateData;

    const sql = `
      INSERT INTO document_templates (
        template_name, document_type, content, variables, description
      ) VALUES (?, ?, ?, ?, ?)
    `;

    const result = await run(sql, [
      template_name,
      document_type,
      content,
      JSON.stringify(variables || []),
      description
    ]);

    return result.lastID;
  }

  /**
   * 根据 ID 获取模板
   * @param {number} id - 模板 ID
   * @returns {Promise<Object|null>} 模板对象
   */
  static async findById(id) {
    const sql = 'SELECT * FROM document_templates WHERE id = ?';
    const template = await get(sql, [id]);
    
    if (template && template.variables) {
      template.variables = JSON.parse(template.variables);
    }
    
    return template;
  }

  /**
   * 获取所有模板
   * @param {string} documentType - 文书类型（可选）
   * @returns {Promise<Array>} 模板列表
   */
  static async findAll(documentType = null) {
    let sql = 'SELECT * FROM document_templates';
    const params = [];

    if (documentType) {
      sql += ' WHERE document_type = ?';
      params.push(documentType);
    }

    sql += ' ORDER BY created_at DESC';

    const templates = await query(sql, params);
    
    return templates.map(template => {
      if (template.variables) {
        template.variables = JSON.parse(template.variables);
      }
      return template;
    });
  }

  /**
   * 更新模板
   * @param {number} id - 模板 ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<number>} 影响的行数
   */
  static async update(id, updateData) {
    const fields = [];
    const params = [];

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        if (key === 'variables') {
          fields.push(`${key} = ?`);
          params.push(JSON.stringify(updateData[key]));
        } else {
          fields.push(`${key} = ?`);
          params.push(updateData[key]);
        }
      }
    });

    params.push(id);

    const sql = `UPDATE document_templates SET ${fields.join(', ')} WHERE id = ?`;
    const result = await run(sql, params);
    return result.changes;
  }

  /**
   * 删除模板
   * @param {number} id - 模板 ID
   * @returns {Promise<number>} 影响的行数
   */
  static async delete(id) {
    const sql = 'DELETE FROM document_templates WHERE id = ?';
    const result = await run(sql, [id]);
    return result.changes;
  }
}

module.exports = DocumentTemplate;
