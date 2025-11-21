const db = require('../config/database');

class CostAttachment {
  /**
   * 创建附件记录
   */
  static async create(attachmentData) {
    const sql = `
      INSERT INTO cost_attachments (
        cost_id, file_name, file_path, file_size, file_type, description
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      attachmentData.cost_id,
      attachmentData.file_name,
      attachmentData.file_path,
      attachmentData.file_size,
      attachmentData.file_type,
      attachmentData.description || null
    ];
    
    const result = await db.run(sql, params);
    return result.lastID;
  }

  /**
   * 根据成本记录ID获取附件列表
   */
  static async findByCostId(costId) {
    const sql = `
      SELECT * FROM cost_attachments
      WHERE cost_id = ?
      ORDER BY created_at DESC
    `;
    
    return await db.query(sql, [costId]);
  }

  /**
   * 根据ID获取附件
   */
  static async findById(id) {
    const sql = `SELECT * FROM cost_attachments WHERE id = ?`;
    return await db.get(sql, [id]);
  }

  /**
   * 删除附件
   */
  static async delete(id) {
    const sql = `DELETE FROM cost_attachments WHERE id = ?`;
    const result = await db.run(sql, [id]);
    return result.changes;
  }

  /**
   * 初始化表
   */
  static async initTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS cost_attachments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cost_id INTEGER NOT NULL,
        file_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER,
        file_type TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cost_id) REFERENCES cost_records(id) ON DELETE CASCADE
      )
    `;
    
    await db.run(sql);
    console.log('cost_attachments 表初始化成功');
  }
}

module.exports = CostAttachment;
