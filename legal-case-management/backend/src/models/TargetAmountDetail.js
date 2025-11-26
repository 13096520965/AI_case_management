const db = require('../config/database');

class TargetAmountDetail {
  /**
   * 创建标的处理详情
   */
  static async create(data) {
    const {
      case_id,
      total_amount,
      penalty_amount,
      litigation_cost,
      cost_bearer,
      notes
    } = data;

    const result = await db.run(
      `INSERT INTO target_amount_details (
        case_id, total_amount, penalty_amount, litigation_cost, 
        cost_bearer, notes
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [case_id, total_amount, penalty_amount, litigation_cost, cost_bearer, notes]
    );

    return result.lastID;
  }

  /**
   * 根据案件ID查询标的处理详情
   */
  static async findByCaseId(caseId) {
    return await db.get(
      `SELECT * FROM target_amount_details WHERE case_id = ?`,
      [caseId]
    );
  }

  /**
   * 更新标的处理详情
   */
  static async update(caseId, data) {
    const fields = [];
    const values = [];

    if (data.total_amount !== undefined) {
      fields.push('total_amount = ?');
      values.push(data.total_amount);
    }
    if (data.penalty_amount !== undefined) {
      fields.push('penalty_amount = ?');
      values.push(data.penalty_amount);
    }
    if (data.litigation_cost !== undefined) {
      fields.push('litigation_cost = ?');
      values.push(data.litigation_cost);
    }
    if (data.cost_bearer !== undefined) {
      fields.push('cost_bearer = ?');
      values.push(data.cost_bearer);
    }
    if (data.notes !== undefined) {
      fields.push('notes = ?');
      values.push(data.notes);
    }

    if (fields.length === 0) {
      return 0;
    }

  const { beijingNow } = require('../utils/time');
  fields.push('updated_at = ?');
  values.push(beijingNow());
  values.push(caseId);

    const result = await db.run(
      `UPDATE target_amount_details SET ${fields.join(', ')} WHERE case_id = ?`,
      values
    );

    return result.changes;
  }

  /**
   * 删除标的处理详情
   */
  static async delete(caseId) {
    const result = await db.run(
      'DELETE FROM target_amount_details WHERE case_id = ?',
      [caseId]
    );
    return result.changes;
  }
}

module.exports = TargetAmountDetail;
