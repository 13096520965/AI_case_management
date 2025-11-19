const { query, run, get } = require('../config/database');

/**
 * CostRecord 模型 - 成本记录管理
 */
class CostRecord {
  /**
   * 创建成本记录
   * @param {Object} costData - 成本数据
   * @returns {Promise<number>} 新创建成本记录的 ID
   */
  static async create(costData) {
    const {
      case_id,
      cost_type,
      amount,
      payment_date,
      payment_method,
      voucher_number,
      payer,
      payee,
      status = 'unpaid',
      due_date
    } = costData;

    const sql = `
      INSERT INTO cost_records (
        case_id, cost_type, amount, payment_date, payment_method,
        voucher_number, payer, payee, status, due_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await run(sql, [
      case_id,
      cost_type,
      amount,
      payment_date,
      payment_method,
      voucher_number,
      payer,
      payee,
      status,
      due_date
    ]);

    return result.lastID;
  }

  /**
   * 根据 ID 获取成本记录
   * @param {number} id - 成本记录 ID
   * @returns {Promise<Object|null>} 成本记录对象
   */
  static async findById(id) {
    const sql = 'SELECT * FROM cost_records WHERE id = ?';
    return await get(sql, [id]);
  }

  /**
   * 根据案件 ID 获取所有成本记录
   * @param {number} caseId - 案件 ID
   * @param {Object} filters - 筛选条件
   * @returns {Promise<Array>} 成本记录列表
   */
  static async findByCaseId(caseId, filters = {}) {
    let sql = 'SELECT * FROM cost_records WHERE case_id = ?';
    const params = [caseId];

    if (filters.cost_type) {
      sql += ' AND cost_type = ?';
      params.push(filters.cost_type);
    }

    if (filters.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }

    sql += ' ORDER BY created_at DESC';

    return await query(sql, params);
  }

  /**
   * 更新成本记录
   * @param {number} id - 成本记录 ID
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

    const sql = `UPDATE cost_records SET ${fields.join(', ')} WHERE id = ?`;
    const result = await run(sql, params);
    return result.changes;
  }

  /**
   * 删除成本记录
   * @param {number} id - 成本记录 ID
   * @returns {Promise<number>} 影响的行数
   */
  static async delete(id) {
    const sql = 'DELETE FROM cost_records WHERE id = ?';
    const result = await run(sql, [id]);
    return result.changes;
  }

  /**
   * 计算案件总成本
   * @param {number} caseId - 案件 ID
   * @returns {Promise<number>} 总成本
   */
  static async getTotalCost(caseId) {
    const sql = 'SELECT SUM(amount) as total FROM cost_records WHERE case_id = ?';
    const result = await get(sql, [caseId]);
    return result.total || 0;
  }

  /**
   * 按类型统计成本
   * @param {number} caseId - 案件 ID
   * @returns {Promise<Array>} 成本统计列表
   */
  static async getCostByType(caseId) {
    const sql = `
      SELECT cost_type, SUM(amount) as total, COUNT(*) as count
      FROM cost_records 
      WHERE case_id = ?
      GROUP BY cost_type
      ORDER BY total DESC
    `;
    return await query(sql, [caseId]);
  }

  /**
   * 获取即将到期的费用
   * @param {number} days - 天数阈值
   * @returns {Promise<Array>} 即将到期的费用列表
   */
  static async findUpcomingPayments(days = 7) {
    const sql = `
      SELECT * FROM cost_records 
      WHERE status = 'unpaid' 
      AND due_date BETWEEN date('now') AND date('now', '+${days} days')
      ORDER BY due_date ASC
    `;
    return await query(sql);
  }

  /**
   * 获取超期未支付的费用
   * @returns {Promise<Array>} 超期费用列表
   */
  static async findOverduePayments() {
    const sql = `
      SELECT * FROM cost_records 
      WHERE status = 'unpaid' 
      AND due_date < date('now')
      ORDER BY due_date ASC
    `;
    return await query(sql);
  }
}

module.exports = CostRecord;
