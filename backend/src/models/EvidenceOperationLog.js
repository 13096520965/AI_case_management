const { query, run } = require('../config/database');

/**
 * EvidenceOperationLog 模型 - 证据操作日志管理
 */
class EvidenceOperationLog {
  /**
   * 创建操作日志
   * @param {Object} logData - 日志数据
   * @returns {Promise<number>} 新创建日志的 ID
   */
  static async create(logData) {
    const {
      evidence_id,
      operation_type,
      operator,
      ip_address,
      details
    } = logData;

    const sql = `
      INSERT INTO evidence_operation_logs (
        evidence_id, operation_type, operator, ip_address, details
      ) VALUES (?, ?, ?, ?, ?)
    `;

    const result = await run(sql, [
      evidence_id,
      operation_type,
      operator,
      ip_address || null,
      details || null
    ]);

    return result.lastID;
  }

  /**
   * 获取证据的操作日志
   * @param {number} evidenceId - 证据 ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 操作日志列表
   */
  static async findByEvidenceId(evidenceId, options = {}) {
    const { limit = 100, offset = 0 } = options;

    const sql = `
      SELECT * FROM evidence_operation_logs 
      WHERE evidence_id = ? 
      ORDER BY operation_time DESC
      LIMIT ? OFFSET ?
    `;

    return await query(sql, [evidenceId, limit, offset]);
  }

  /**
   * 获取案件所有证据的操作日志
   * @param {number} caseId - 案件 ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 操作日志列表
   */
  static async findByCaseId(caseId, options = {}) {
    const { limit = 100, offset = 0 } = options;

    const sql = `
      SELECT eol.*, e.file_name, e.case_id
      FROM evidence_operation_logs eol
      JOIN evidence e ON eol.evidence_id = e.id
      WHERE e.case_id = ?
      ORDER BY eol.operation_time DESC
      LIMIT ? OFFSET ?
    `;

    return await query(sql, [caseId, limit, offset]);
  }

  /**
   * 获取用户的操作日志
   * @param {string} operator - 操作人
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 操作日志列表
   */
  static async findByOperator(operator, options = {}) {
    const { limit = 100, offset = 0 } = options;

    const sql = `
      SELECT * FROM evidence_operation_logs 
      WHERE operator = ? 
      ORDER BY operation_time DESC
      LIMIT ? OFFSET ?
    `;

    return await query(sql, [operator, limit, offset]);
  }

  /**
   * 统计操作类型
   * @param {number} evidenceId - 证据 ID
   * @returns {Promise<Array>} 操作统计
   */
  static async getOperationStats(evidenceId) {
    const sql = `
      SELECT operation_type, COUNT(*) as count
      FROM evidence_operation_logs
      WHERE evidence_id = ?
      GROUP BY operation_type
    `;

    return await query(sql, [evidenceId]);
  }
}

module.exports = EvidenceOperationLog;
