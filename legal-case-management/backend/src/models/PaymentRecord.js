const db = require('../config/database');

class PaymentRecord {
  /**
   * 创建汇款记录
   */
  static async create(data) {
    const {
      case_id,
      payment_date,
      amount,
      payer,
      payee,
      payment_method,
      status,
      notes
    } = data;

    const result = await db.run(
      `INSERT INTO payment_records (
        case_id, payment_date, amount, payer, payee, 
        payment_method, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [case_id, payment_date, amount, payer, payee, payment_method, status, notes]
    );

    return result.lastID;
  }

  /**
   * 根据ID查询汇款记录
   */
  static async findById(id) {
    return await db.get(
      'SELECT * FROM payment_records WHERE id = ?',
      [id]
    );
  }

  /**
   * 根据案件ID查询所有汇款记录
   */
  static async findByCaseId(caseId) {
    return await db.query(
      `SELECT * FROM payment_records 
       WHERE case_id = ? 
       ORDER BY payment_date DESC, created_at DESC`,
      [caseId]
    );
  }

  /**
   * 更新汇款记录
   */
  static async update(id, data) {
    const fields = [];
    const values = [];

    if (data.payment_date !== undefined) {
      fields.push('payment_date = ?');
      values.push(data.payment_date);
    }
    if (data.amount !== undefined) {
      fields.push('amount = ?');
      values.push(data.amount);
    }
    if (data.payer !== undefined) {
      fields.push('payer = ?');
      values.push(data.payer);
    }
    if (data.payee !== undefined) {
      fields.push('payee = ?');
      values.push(data.payee);
    }
    if (data.payment_method !== undefined) {
      fields.push('payment_method = ?');
      values.push(data.payment_method);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }
    if (data.notes !== undefined) {
      fields.push('notes = ?');
      values.push(data.notes);
    }

    if (fields.length === 0) {
      return 0;
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const result = await db.run(
      `UPDATE payment_records SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result.changes;
  }

  /**
   * 删除汇款记录
   */
  static async delete(id) {
    const result = await db.run(
      'DELETE FROM payment_records WHERE id = ?',
      [id]
    );
    return result.changes;
  }

  /**
   * 统计案件的汇款总额
   */
  static async sumByCaseId(caseId, status = null) {
    let sql = 'SELECT COALESCE(SUM(amount), 0) as total FROM payment_records WHERE case_id = ?';
    const params = [caseId];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    const result = await db.get(sql, params);
    return result.total;
  }
}

module.exports = PaymentRecord;
