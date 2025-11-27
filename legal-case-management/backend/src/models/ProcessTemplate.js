const { query, run, get } = require('../config/database');

/**
 * ProcessTemplate 模型 - 流程模板管理
 */
class ProcessTemplate {
  /**
   * 创建流程模板
   * @param {Object} templateData - 模板数据
   * @returns {Promise<number>} 新创建模板的 ID
   */
  static async create(templateData) {
    const {
      template_name,
      case_type,
      description,
      is_default = 0
    } = templateData;

    const sql = `
      INSERT INTO process_templates (
        template_name, case_type, description, is_default
      ) VALUES (?, ?, ?, ?)
    `;

    const result = await run(sql, [
      template_name,
      case_type,
      description,
      is_default
    ]);

    return result.lastID;
  }

  /**
   * 根据 ID 获取流程模板
   * @param {number} id - 模板 ID
   * @returns {Promise<Object|null>} 模板对象
   */
  static async findById(id) {
    const sql = 'SELECT * FROM process_templates WHERE id = ?';
    return await get(sql, [id]);
  }

  /**
   * 获取所有流程模板
   * @returns {Promise<Array>} 模板列表
   */
  static async findAll() {
    const sql = 'SELECT * FROM process_templates ORDER BY case_type, created_at DESC';
    return await query(sql);
  }

  /**
   * 根据案件类型获取模板
   * @param {string} caseType - 案件类型
   * @returns {Promise<Array>} 模板列表
   */
  static async findByCaseType(caseType) {
    const sql = 'SELECT * FROM process_templates WHERE case_type = ? ORDER BY is_default DESC, created_at DESC';
    return await query(sql, [caseType]);
  }

  /**
   * 获取默认模板
   * @param {string} caseType - 案件类型
   * @returns {Promise<Object|null>} 默认模板
   */
  static async findDefaultByCaseType(caseType) {
    const sql = 'SELECT * FROM process_templates WHERE case_type = ? AND is_default = 1 LIMIT 1';
    return await get(sql, [caseType]);
  }

  /**
   * 更新流程模板
   * @param {number} id - 模板 ID
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

    const sql = `UPDATE process_templates SET ${fields.join(', ')} WHERE id = ?`;
    const result = await run(sql, params);
    return result.changes;
  }

  /**
   * 删除流程模板
   * @param {number} id - 模板 ID
   * @returns {Promise<number>} 影响的行数
   */
  static async delete(id) {
    const sql = 'DELETE FROM process_templates WHERE id = ?';
    const result = await run(sql, [id]);
    return result.changes;
  }

  /**
   * 设置默认模板
   * @param {number} id - 模板 ID
   * @param {string} caseType - 案件类型
   * @returns {Promise<void>}
   */
  static async setDefault(id, caseType) {
    // 先取消该案件类型的所有默认模板
    await run('UPDATE process_templates SET is_default = 0 WHERE case_type = ?', [caseType]);
    // 设置新的默认模板
    await run('UPDATE process_templates SET is_default = 1 WHERE id = ?', [id]);
  }
}

/**
 * ProcessTemplateNode 模型 - 流程模板节点管理
 */
class ProcessTemplateNode {
  /**
   * 创建模板节点
   * @param {Object} nodeData - 节点数据
   * @returns {Promise<number>} 新创建节点的 ID
   */
  static async create(nodeData) {
    const {
      template_id,
      node_type,
      node_name,
      deadline_days,
      node_order,
      description
    } = nodeData;

    const sql = `
      INSERT INTO process_template_nodes (
        template_id, node_type, node_name, deadline_days, node_order, description
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    const result = await run(sql, [
      template_id,
      node_type,
      node_name,
      deadline_days,
      node_order,
      description || null
    ]);

    return result.lastID;
  }

  /**
   * 根据模板 ID 获取所有节点
   * @param {number} templateId - 模板 ID
   * @returns {Promise<Array>} 节点列表
   */
  static async findByTemplateId(templateId) {
    const sql = 'SELECT * FROM process_template_nodes WHERE template_id = ? ORDER BY node_order ASC';
    return await query(sql, [templateId]);
  }

  /**
   * 更新模板节点
   * @param {number} id - 节点 ID
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

    const sql = `UPDATE process_template_nodes SET ${fields.join(', ')} WHERE id = ?`;
    const result = await run(sql, params);
    return result.changes;
  }

  /**
   * 删除模板节点
   * @param {number} id - 节点 ID
   * @returns {Promise<number>} 影响的行数
   */
  static async delete(id) {
    const sql = 'DELETE FROM process_template_nodes WHERE id = ?';
    const result = await run(sql, [id]);
    return result.changes;
  }

  /**
   * 删除模板的所有节点
   * @param {number} templateId - 模板 ID
   * @returns {Promise<number>} 影响的行数
   */
  static async deleteByTemplateId(templateId) {
    const sql = 'DELETE FROM process_template_nodes WHERE template_id = ?';
    const result = await run(sql, [templateId]);
    return result.changes;
  }

  /**
   * 批量创建模板节点
   * @param {Array} nodes - 节点数组
   * @returns {Promise<Array>} 创建的节点 ID 数组
   */
  static async createBatch(nodes) {
    const ids = [];
    for (const node of nodes) {
      const id = await this.create(node);
      ids.push(id);
    }
    return ids;
  }
}

module.exports = {
  ProcessTemplate,
  ProcessTemplateNode
};
