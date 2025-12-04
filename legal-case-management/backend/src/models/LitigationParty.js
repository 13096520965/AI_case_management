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
      birth_date,
      contact_phone,
      contact_email,
      address,
      region_code,
      detail_address,
      is_primary
    } = partyData;

    const { beijingNow } = require('../utils/time');
    const sql = `
      INSERT INTO litigation_parties (
        case_id, party_type, entity_type, name, unified_credit_code,
        legal_representative, id_number, birth_date, contact_phone, contact_email, 
        address, region_code, detail_address, is_primary, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // 将 undefined 转换为 null，避免 SQL 绑定错误
    const now = beijingNow();
    const result = await run(sql, [
      case_id ?? null,
      party_type ?? null,
      entity_type ?? null,
      name ?? null,
      unified_credit_code ?? null,
      legal_representative ?? null,
      id_number ?? null,
      birth_date ?? null,
      contact_phone ?? null,
      contact_email ?? null,
      address ?? null,
      region_code ?? null,
      detail_address ?? null,
      is_primary ?? 0,
      now
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
      SELECT DISTINCT c.* 
      FROM cases c
      INNER JOIN litigation_parties lp ON c.id = lp.case_id
      WHERE lp.name = ?
      ORDER BY c.created_at DESC
    `;
    return await query(sql, [name]);
  }

  /**
   * 检查主体是否被多个案件引用
   * @param {string} name - 主体名称
   * @param {string} entityType - 实体类型
   * @returns {Promise<Object>} 引用信息 { count, caseIds }
   */
  static async checkReferences(name, entityType) {
    const sql = `
      SELECT DISTINCT case_id
      FROM litigation_parties
      WHERE name = ? AND entity_type = ?
    `;
    const results = await query(sql, [name, entityType]);
    return {
      count: results.length,
      caseIds: results.map(r => r.case_id)
    };
  }

  /**
   * 根据主体名称和实体类型查找所有记录
   * @param {string} name - 主体名称
   * @param {string} entityType - 实体类型
   * @returns {Promise<Array>} 主体列表
   */
  static async findByNameAndType(name, entityType) {
    const sql = 'SELECT * FROM litigation_parties WHERE name = ? AND entity_type = ?';
    return await query(sql, [name, entityType]);
  }

  /**
   * 获取主体搜索建议
   * @param {string} keyword - 搜索关键词
   * @param {string} partyType - 主体类型（可选）
   * @returns {Promise<Array>} 建议列表，包含主体名称和案件数量
   */
  static async getSuggestions(keyword, partyType = null) {
    let sql = `
      SELECT 
        lp.name,
        COUNT(DISTINCT lp.case_id) as case_count,
        MAX(lp.id) as id
      FROM litigation_parties lp
      WHERE lp.name LIKE ?
    `;
    
    const params = [`%${keyword}%`];
    
    if (partyType) {
      sql += ' AND lp.party_type = ?';
      params.push(partyType);
    }
    
    sql += `
      GROUP BY lp.name
      ORDER BY case_count DESC, lp.name ASC
      LIMIT 10
    `;
    
    return await query(sql, params);
  }

  /**
   * 获取主体模板（用于快速录入）
   * 先从 party_templates 表查询，如果不存在则从 litigation_parties 表查询最近记录
   * @param {string} name - 主体名称
   * @returns {Promise<Object|null>} 模板对象
   */
  static async getTemplate(name) {
    // 先从模板表查找
    let sql = 'SELECT * FROM party_templates WHERE name = ? ORDER BY usage_count DESC, last_used_at DESC LIMIT 1';
    let template = await get(sql, [name]);
    
    if (!template) {
      // 从历史记录中查找最近使用的
      sql = `
        SELECT * FROM litigation_parties 
        WHERE name = ? 
        ORDER BY created_at DESC 
        LIMIT 1
      `;
      template = await get(sql, [name]);
    }
    
    if (template) {
      // 更新使用统计（如果是从模板表查询的）
      const { beijingNow } = require('../utils/time');
      const now = beijingNow();
      
      const updateSql = `
        INSERT INTO party_templates (name, entity_type, contact_phone, address, usage_count, last_used_at, created_at)
        VALUES (?, ?, ?, ?, 1, ?, ?)
        ON CONFLICT(name, entity_type) DO UPDATE SET
          usage_count = usage_count + 1,
          last_used_at = ?
      `;
      
      await run(updateSql, [
        template.name,
        template.entity_type || null,
        template.contact_phone || null,
        template.address || null,
        now,
        now,
        now
      ]);
    }
    
    return template;
  }
}

module.exports = LitigationParty;
