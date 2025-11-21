const db = require('../config/database');

class CaseLog {
  /**
   * 创建案件日志
   */
  static async create(logData) {
    const sql = `
      INSERT INTO case_logs (
        case_id, action_type, action_description, operator_id, 
        operator_name, ip_address, user_agent, related_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      logData.case_id,
      logData.action_type,
      logData.action_description,
      logData.operator_id || null,
      logData.operator_name || null,
      logData.ip_address || null,
      logData.user_agent || null,
      logData.related_data ? JSON.stringify(logData.related_data) : null
    ];
    
    const result = await db.run(sql, params);
    return result.lastID;
  }

  /**
   * 根据案件ID获取日志列表
   */
  static async findByCaseId(caseId, options = {}) {
    const { page = 1, limit = 50, action_type } = options;
    const offset = (page - 1) * limit;
    
    let sql = `
      SELECT * FROM case_logs
      WHERE case_id = ?
    `;
    const params = [caseId];
    
    if (action_type) {
      sql += ` AND action_type = ?`;
      params.push(action_type);
    }
    
    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    const logs = await db.query(sql, params);
    
    // 解析 related_data JSON
    return logs.map(log => ({
      ...log,
      related_data: log.related_data ? JSON.parse(log.related_data) : null
    }));
  }

  /**
   * 统计案件日志总数
   */
  static async countByCaseId(caseId, action_type = null) {
    let sql = `SELECT COUNT(*) as count FROM case_logs WHERE case_id = ?`;
    const params = [caseId];
    
    if (action_type) {
      sql += ` AND action_type = ?`;
      params.push(action_type);
    }
    
    const result = await db.get(sql, params);
    return result.count;
  }

  /**
   * 根据操作人获取日志
   */
  static async findByOperator(operatorId, options = {}) {
    const { page = 1, limit = 50 } = options;
    const offset = (page - 1) * limit;
    
    const sql = `
      SELECT cl.*, c.case_number, c.case_name
      FROM case_logs cl
      LEFT JOIN cases c ON cl.case_id = c.id
      WHERE cl.operator_id = ?
      ORDER BY cl.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const logs = await db.query(sql, [operatorId, limit, offset]);
    
    return logs.map(log => ({
      ...log,
      related_data: log.related_data ? JSON.parse(log.related_data) : null
    }));
  }

  /**
   * 获取案件操作统计
   */
  static async getActionStatistics(caseId) {
    const sql = `
      SELECT 
        action_type,
        COUNT(*) as count,
        MAX(created_at) as last_action_time
      FROM case_logs
      WHERE case_id = ?
      GROUP BY action_type
      ORDER BY count DESC
    `;
    
    return await db.query(sql, [caseId]);
  }

  /**
   * 初始化表
   */
  static async initTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS case_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        case_id INTEGER NOT NULL,
        action_type TEXT NOT NULL,
        action_description TEXT NOT NULL,
        operator_id INTEGER,
        operator_name TEXT,
        ip_address TEXT,
        user_agent TEXT,
        related_data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
      )
    `;
    
    await db.run(sql);
    
    // 创建索引以提高查询性能
    await db.run(`CREATE INDEX IF NOT EXISTS idx_case_logs_case_id ON case_logs(case_id)`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_case_logs_operator_id ON case_logs(operator_id)`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_case_logs_action_type ON case_logs(action_type)`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_case_logs_created_at ON case_logs(created_at)`);
    
    console.log('case_logs 表初始化成功');
  }
}

module.exports = CaseLog;
