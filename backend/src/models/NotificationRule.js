const { query, run, get } = require('../config/database');

/**
 * NotificationRule 模型 - 提醒规则配置
 */
class NotificationRule {
  /**
   * 创建提醒规则
   * @param {Object} ruleData - 规则数据
   * @returns {Promise<number>} 新创建规则的 ID
   */
  static async create(ruleData) {
    const {
      rule_name,
      rule_type,
      trigger_condition,
      threshold_value,
      threshold_unit,
      frequency,
      recipients,
      is_enabled = true,
      description
    } = ruleData;

    const sql = `
      INSERT INTO notification_rules (
        rule_name, rule_type, trigger_condition, threshold_value, 
        threshold_unit, frequency, recipients, is_enabled, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await run(sql, [
      rule_name,
      rule_type,
      trigger_condition,
      threshold_value,
      threshold_unit,
      frequency,
      JSON.stringify(recipients),
      is_enabled ? 1 : 0,
      description
    ]);

    return result.lastID;
  }

  /**
   * 根据 ID 获取规则
   * @param {number} id - 规则 ID
   * @returns {Promise<Object|null>} 规则对象
   */
  static async findById(id) {
    const sql = 'SELECT * FROM notification_rules WHERE id = ?';
    const rule = await get(sql, [id]);
    
    if (rule && rule.recipients) {
      try {
        rule.recipients = JSON.parse(rule.recipients);
      } catch (e) {
        rule.recipients = [];
      }
    }
    
    return rule;
  }

  /**
   * 获取所有规则
   * @param {Object} filters - 筛选条件
   * @returns {Promise<Array>} 规则列表
   */
  static async findAll(filters = {}) {
    let sql = 'SELECT * FROM notification_rules WHERE 1=1';
    const params = [];

    if (filters.rule_type) {
      sql += ' AND rule_type = ?';
      params.push(filters.rule_type);
    }

    if (filters.is_enabled !== undefined) {
      sql += ' AND is_enabled = ?';
      params.push(filters.is_enabled ? 1 : 0);
    }

    sql += ' ORDER BY created_at DESC';

    const rules = await query(sql, params);
    
    // 解析 recipients JSON
    return rules.map(rule => {
      if (rule.recipients) {
        try {
          rule.recipients = JSON.parse(rule.recipients);
        } catch (e) {
          rule.recipients = [];
        }
      }
      return rule;
    });
  }

  /**
   * 更新规则
   * @param {number} id - 规则 ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<number>} 影响的行数
   */
  static async update(id, updateData) {
    const fields = [];
    const params = [];

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        if (key === 'recipients') {
          fields.push(`${key} = ?`);
          params.push(JSON.stringify(updateData[key]));
        } else if (key === 'is_enabled') {
          fields.push(`${key} = ?`);
          params.push(updateData[key] ? 1 : 0);
        } else {
          fields.push(`${key} = ?`);
          params.push(updateData[key]);
        }
      }
    });

    if (fields.length === 0) return 0;

    fields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const sql = `UPDATE notification_rules SET ${fields.join(', ')} WHERE id = ?`;
    const result = await run(sql, params);
    return result.changes;
  }

  /**
   * 删除规则
   * @param {number} id - 规则 ID
   * @returns {Promise<number>} 影响的行数
   */
  static async delete(id) {
    const sql = 'DELETE FROM notification_rules WHERE id = ?';
    const result = await run(sql, [id]);
    return result.changes;
  }

  /**
   * 启用/禁用规则
   * @param {number} id - 规则 ID
   * @param {boolean} enabled - 是否启用
   * @returns {Promise<number>} 影响的行数
   */
  static async toggleEnabled(id, enabled) {
    return await this.update(id, { is_enabled: enabled });
  }

  /**
   * 获取启用的规则
   * @param {string} ruleType - 规则类型（可选）
   * @returns {Promise<Array>} 启用的规则列表
   */
  static async findEnabledRules(ruleType = null) {
    let sql = 'SELECT * FROM notification_rules WHERE is_enabled = 1';
    const params = [];

    if (ruleType) {
      sql += ' AND rule_type = ?';
      params.push(ruleType);
    }

    sql += ' ORDER BY created_at DESC';

    const rules = await query(sql, params);
    
    return rules.map(rule => {
      if (rule.recipients) {
        try {
          rule.recipients = JSON.parse(rule.recipients);
        } catch (e) {
          rule.recipients = [];
        }
      }
      return rule;
    });
  }

  /**
   * 根据规则类型获取规则
   * @param {string} ruleType - 规则类型
   * @returns {Promise<Array>} 规则列表
   */
  static async findByType(ruleType) {
    const sql = 'SELECT * FROM notification_rules WHERE rule_type = ? ORDER BY created_at DESC';
    const rules = await query(sql, [ruleType]);
    
    return rules.map(rule => {
      if (rule.recipients) {
        try {
          rule.recipients = JSON.parse(rule.recipients);
        } catch (e) {
          rule.recipients = [];
        }
      }
      return rule;
    });
  }
}

module.exports = NotificationRule;
