const { query, run, get } = require('../config/database');

/**
 * LitigationParty 模型 - 诉讼主体管理
 */
class LitigationParty {
  /**
   * 创建诉讼主体
   * @param {Object} partyData - 诉讼主体数据
   * @returns {Promise<number>} 新创建主体的 ID
   */
  static async create(partyData) {
    const {
      case_id,
      party_type,
      entity_type,
      name,
      unified_credit_code,
      legal_representative,
      id_number,
      contact_phone,
      contact_email,
      address
    } = partyData;

    const sql = `
      INSERT INTO litigation_parties (
        case_id, party_type, entity_type, name, unified_credit_code,
        legal_representative, id_number, contact_phone, contact_email, address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await run(sql, [
      case_id,
      party_type,
      entity_type,
      name,
      unified_credit_code,
      legal_representative,
      id_number,
      contact_phone,
      contact_email,
      address
    ]);

    return result.lastID;
  }

  /**
   * 根据 ID 获取诉讼主体
   * @param {number} id - 主体 ID
   * @returns {Promise<Object|null>} 主体对象
   */
  static async findById(id) {
    const sql = 'SELECT * FROM litigation_parties WHERE id = ?';
    return await get(sql, [id]);
  }

  /**
   * 根据案件 ID 获取所有诉讼主体
   * @param {number} caseId - 案件 ID
   * @returns {Promise<Array>} 主体列表
   */
  static async findByCaseId(caseId) {
    const sql = 'SELECT * FROM litigation_parties WHERE case_id = ? ORDER BY created_at ASC';
    return await query(sql, [caseId]);
  }

  /**
   * 更新诉讼主体
   * @param {number} id - 主体 ID
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

    const sql = `UPDATE litigation_parties SET ${fields.join(', ')} WHERE id = ?`;
    const result = await run(sql, params);
    return result.changes;
  }

  /**
   * 删除诉讼主体
   * @param {number} id - 主体 ID
   * @returns {Promise<number>} 影响的行数
   */
  static async delete(id) {
    const sql = 'DELETE FROM litigation_parties WHERE id = ?';
    const result = await run(sql, [id]);
    return result.changes;
  }

  /**
   * 根据主体名称查询历史案件
   * @param {string} name - 主体名称
   * @returns {Promise<Array>} 历史案件列表
   */
  static async findHistoryCases(name) {
    const sql = `
      SELECT DISTINCT 
        c.id,
        c.case_number as caseNumber,
        c.internal_number as internalNumber,
        c.case_type as caseType,
        c.case_cause as caseCause,
        c.court,
        c.target_amount as targetAmount,
        c.filing_date as filingDate,
        c.status,
        c.created_at as createdAt,
        c.updated_at as updatedAt
      FROM cases c
      INNER JOIN litigation_parties lp ON c.id = lp.case_id
      WHERE lp.name = ?
      ORDER BY c.created_at DESC
    `;
    return await query(sql, [name]);
  }
}

module.exports = LitigationParty;
