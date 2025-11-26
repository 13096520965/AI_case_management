const { query, run, get } = require('../config/database');

/**
 * NotificationTask 模型 - 提醒任务管理
 */
class NotificationTask {
  /**
   * 创建提醒任务
   * @param {Object} taskData - 提醒任务数据
   * @returns {Promise<number>} 新创建任务的 ID
   */
  static async create(taskData) {
    const {
      related_id,
      related_type,
      task_type,
      scheduled_time,
      content,
      status = 'pending'
    } = taskData;

    const sql = `
      INSERT INTO notification_tasks (
        related_id, related_type, task_type, scheduled_time, content, status
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    const result = await run(sql, [
      related_id,
      related_type,
      task_type,
      scheduled_time,
      content,
      status
    ]);

    return result.lastID;
  }

  /**
   * 根据 ID 获取提醒任务
   * @param {number} id - 任务 ID
   * @returns {Promise<Object|null>} 任务对象
   */
  static async findById(id) {
    const sql = 'SELECT * FROM notification_tasks WHERE id = ?';
    return await get(sql, [id]);
  }

  /**
   * 获取所有提醒任务（支持筛选）
   * @param {Object} filters - 筛选条件
   * @returns {Promise<Array>} 任务列表
   */
  static async findAll(filters = {}) {
    let sql = 'SELECT * FROM notification_tasks WHERE 1=1';
    const params = [];

    if (filters.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.task_type) {
      sql += ' AND task_type = ?';
      params.push(filters.task_type);
    }

    if (filters.related_type) {
      sql += ' AND related_type = ?';
      params.push(filters.related_type);
    }

    if (filters.related_id) {
      sql += ' AND related_id = ?';
      params.push(filters.related_id);
    }

    sql += ' ORDER BY scheduled_time DESC';

    return await query(sql, params);
  }

  /**
   * 更新提醒任务
   * @param {number} id - 任务 ID
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

    const sql = `UPDATE notification_tasks SET ${fields.join(', ')} WHERE id = ?`;
    const result = await run(sql, params);
    return result.changes;
  }

  /**
   * 删除提醒任务
   * @param {number} id - 任务 ID
   * @returns {Promise<number>} 影响的行数
   */
  static async delete(id) {
    const sql = 'DELETE FROM notification_tasks WHERE id = ?';
    const result = await run(sql, [id]);
    return result.changes;
  }

  /**
   * 标记任务为已读
   * @param {number} id - 任务 ID
   * @returns {Promise<number>} 影响的行数
   */
  static async markAsRead(id) {
    return await this.update(id, { status: 'read' });
  }

  /**
   * 获取待发送的提醒任务
   * @returns {Promise<Array>} 待发送任务列表
   */
  static async findPendingTasks() {
    const sql = `
      SELECT * FROM notification_tasks 
      WHERE status = 'pending' 
      AND scheduled_time <= datetime('now', '+8 hours')
      ORDER BY scheduled_time ASC
    `;
    return await query(sql);
  }

  /**
   * 获取未读提醒数量
   * @param {Object} filters - 筛选条件
   * @returns {Promise<number>} 未读数量
   */
  static async getUnreadCount(filters = {}) {
    let sql = 'SELECT COUNT(*) as count FROM notification_tasks WHERE status = ?';
    const params = ['unread'];

    if (filters.related_type) {
      sql += ' AND related_type = ?';
      params.push(filters.related_type);
    }

    if (filters.related_id) {
      sql += ' AND related_id = ?';
      params.push(filters.related_id);
    }

    const result = await get(sql, params);
    return result.count;
  }

  /**
   * 批量标记为已读
   * @param {Array<number>} ids - 任务 ID 数组
   * @returns {Promise<number>} 影响的行数
   */
  static async markMultipleAsRead(ids) {
    if (!ids || ids.length === 0) return 0;

    const placeholders = ids.map(() => '?').join(',');
    const sql = `UPDATE notification_tasks SET status = 'read' WHERE id IN (${placeholders})`;
    const result = await run(sql, ids);
    return result.changes;
  }

  /**
   * 根据关联对象获取提醒任务
   * @param {string} relatedType - 关联类型
   * @param {number} relatedId - 关联 ID
   * @returns {Promise<Array>} 任务列表
   */
  static async findByRelated(relatedType, relatedId) {
    const sql = `
      SELECT * FROM notification_tasks 
      WHERE related_type = ? AND related_id = ?
      ORDER BY scheduled_time DESC
    `;
    return await query(sql, [relatedType, relatedId]);
  }

  /**
   * 标记所有未读提醒为已读
   * @returns {Promise<number>} 影响的行数
   */
  static async markAllAsRead() {
    const sql = `UPDATE notification_tasks SET status = 'read' WHERE status = 'unread'`;
    const result = await run(sql);
    return result.changes;
  }
}

module.exports = NotificationTask;
