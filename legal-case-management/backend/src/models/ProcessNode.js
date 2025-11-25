const { query, run, get } = require('../config/database');

/**
 * ProcessNode 模型 - 流程节点管理
 */
class ProcessNode {
  /**
   * 创建流程节点
   * @param {Object} nodeData - 节点数据
   * @returns {Promise<number>} 新创建节点的 ID
   */
  static async create(nodeData) {
    const {
      case_id,
      node_type,
      node_name,
      handler,
      start_time,
      deadline,
      completion_time,
      status = 'pending',
      progress,
      node_order
    } = nodeData;

    const sql = `
      INSERT INTO process_nodes (
        case_id, node_type, node_name, handler, start_time,
        deadline, completion_time, status, progress, node_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // 将 undefined 转换为 null，避免 SQL 绑定错误
    const result = await run(sql, [
      case_id ?? null,
      node_type ?? null,
      node_name ?? null,
      handler ?? null,
      start_time ?? null,
      deadline ?? null,
      completion_time ?? null,
      status ?? 'pending',
      progress ?? null,
      node_order ?? null
    ]);

    return result.lastID;
  }

  /**
   * 根据 ID 获取流程节点
   * @param {number} id - 节点 ID
   * @returns {Promise<Object|null>} 节点对象
   */
  static async findById(id) {
    const sql = 'SELECT * FROM process_nodes WHERE id = ?';
    return await get(sql, [id]);
  }

  /**
   * 根据案件 ID 获取所有流程节点
   * @param {number} caseId - 案件 ID
   * @returns {Promise<Array>} 节点列表
   */
  static async findByCaseId(caseId) {
    const sql = 'SELECT * FROM process_nodes WHERE case_id = ? ORDER BY node_order ASC, created_at ASC';
    return await query(sql, [caseId]);
  }

  /**
   * 更新流程节点
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

    fields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const sql = `UPDATE process_nodes SET ${fields.join(', ')} WHERE id = ?`;
    const result = await run(sql, params);
    return result.changes;
  }

  /**
   * 删除流程节点
   * @param {number} id - 节点 ID
   * @returns {Promise<number>} 影响的行数
   */
  static async delete(id) {
    const sql = 'DELETE FROM process_nodes WHERE id = ?';
    const result = await run(sql, [id]);
    return result.changes;
  }

  /**
   * 获取超期节点
   * @returns {Promise<Array>} 超期节点列表
   */
  static async findOverdueNodes() {
    const sql = `
      SELECT 
        pn.*,
        c.case_number,
        c.case_cause as case_name
      FROM process_nodes pn
      LEFT JOIN cases c ON pn.case_id = c.id
      WHERE pn.status != 'completed' 
      AND pn.deadline < datetime('now')
      ORDER BY pn.deadline ASC
    `;
    return await query(sql);
  }

  /**
   * 获取即将到期的节点
   * @param {number} days - 天数阈值
   * @returns {Promise<Array>} 即将到期的节点列表
   */
  static async findUpcomingNodes(days = 3) {
    const sql = `
      SELECT 
        pn.*,
        c.case_number,
        c.case_cause as case_name
      FROM process_nodes pn
      LEFT JOIN cases c ON pn.case_id = c.id
      WHERE pn.status != 'completed' 
      AND pn.deadline BETWEEN datetime('now') AND datetime('now', '+${days} days')
      ORDER BY pn.deadline ASC
    `;
    return await query(sql);
  }
}

module.exports = ProcessNode;
