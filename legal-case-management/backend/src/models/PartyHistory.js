const { query, run, get } = require('../config/database');

/**
 * PartyHistory 模型 - 主体修改历史管理
 */
class PartyHistory {
  /**
   * 创建主体历史记录
   * @param {Object} historyData - 历史记录数据
   * @returns {Promise<number>} 新创建记录的 ID
   */
  static async create(historyData) {
    const {
      party_id,
      case_id,
      action,
      changed_fields,
      changed_by
    } = historyData;

    const { beijingNow } = require('../utils/time');
    const sql = `
      INSERT INTO party_history (
        party_id, case_id, action, changed_fields, changed_by, changed_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    const now = beijingNow();
    const result = await run(sql, [
      party_id ?? null,
      case_id ?? null,
      action ?? null,
      changed_fields ? JSON.stringify(changed_fields) : null,
      changed_by ?? null,
      now
    ]);

    return result.lastID;
  }

  /**
   * 根据主体 ID 获取历史记录
   * @param {number} partyId - 主体 ID
   * @returns {Promise<Array>} 历史记录列表
   */
  static async findByPartyId(partyId) {
    const sql = `
      SELECT * FROM party_history 
      WHERE party_id = ? 
      ORDER BY changed_at DESC
    `;
    const records = await query(sql, [partyId]);
    
    // 解析 JSON 字段
    return records.map(record => ({
      ...record,
      changed_fields: record.changed_fields ? JSON.parse(record.changed_fields) : null
    }));
  }

  /**
   * 根据案件 ID 获取历史记录
   * @param {number} caseId - 案件 ID
   * @returns {Promise<Array>} 历史记录列表
   */
  static async findByCaseId(caseId) {
    const sql = `
      SELECT ph.*, lp.name as party_name, lp.party_type
      FROM party_history ph
      LEFT JOIN litigation_parties lp ON ph.party_id = lp.id
      WHERE ph.case_id = ? 
      ORDER BY ph.changed_at DESC
    `;
    const records = await query(sql, [caseId]);
    
    // 解析 JSON 字段
    return records.map(record => ({
      ...record,
      changed_fields: record.changed_fields ? JSON.parse(record.changed_fields) : null
    }));
  }

  /**
   * 删除主体的所有历史记录
   * @param {number} partyId - 主体 ID
   * @returns {Promise<number>} 影响的行数
   */
  static async deleteByPartyId(partyId) {
    const sql = 'DELETE FROM party_history WHERE party_id = ?';
    const result = await run(sql, [partyId]);
    return result.changes;
  }
}

module.exports = PartyHistory;
