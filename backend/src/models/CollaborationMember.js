const db = require('../config/database');

/**
 * 协作成员模型
 */
class CollaborationMember {
  /**
   * 添加协作成员
   */
  static create(memberData) {
    return new Promise((resolve, reject) => {
      const { case_id, user_id, role, permissions } = memberData;
      const permissionsJson = permissions ? JSON.stringify(permissions) : null;
      
      const sql = `
        INSERT INTO collaboration_members (case_id, user_id, role, permissions)
        VALUES (?, ?, ?, ?)
      `;
      
      db.run(sql, [case_id, user_id, role, permissionsJson], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, ...memberData });
        }
      });
    });
  }

  /**
   * 获取案件的所有协作成员
   */
  static findByCaseId(caseId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          cm.id,
          cm.case_id,
          cm.user_id,
          cm.role,
          cm.permissions,
          cm.joined_at,
          u.username,
          u.real_name,
          u.email
        FROM collaboration_members cm
        LEFT JOIN users u ON cm.user_id = u.id
        WHERE cm.case_id = ?
        ORDER BY cm.joined_at DESC
      `;
      
      db.all(sql, [caseId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          // 解析 permissions JSON
          const members = rows.map(row => ({
            ...row,
            permissions: row.permissions ? JSON.parse(row.permissions) : null
          }));
          resolve(members);
        }
      });
    });
  }

  /**
   * 根据 ID 获取协作成员
   */
  static findById(id) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          cm.id,
          cm.case_id,
          cm.user_id,
          cm.role,
          cm.permissions,
          cm.joined_at,
          u.username,
          u.real_name,
          u.email
        FROM collaboration_members cm
        LEFT JOIN users u ON cm.user_id = u.id
        WHERE cm.id = ?
      `;
      
      db.get(sql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else if (!row) {
          resolve(null);
        } else {
          resolve({
            ...row,
            permissions: row.permissions ? JSON.parse(row.permissions) : null
          });
        }
      });
    });
  }

  /**
   * 更新协作成员
   */
  static update(id, memberData) {
    return new Promise((resolve, reject) => {
      const { role, permissions } = memberData;
      const permissionsJson = permissions ? JSON.stringify(permissions) : null;
      
      const sql = `
        UPDATE collaboration_members
        SET role = ?, permissions = ?
        WHERE id = ?
      `;
      
      db.run(sql, [role, permissionsJson, id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id, changes: this.changes });
        }
      });
    });
  }

  /**
   * 删除协作成员
   */
  static delete(id) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM collaboration_members WHERE id = ?';
      
      db.run(sql, [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id, changes: this.changes });
        }
      });
    });
  }

  /**
   * 检查用户是否是案件的协作成员
   */
  static checkMembership(caseId, userId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT id, role, permissions
        FROM collaboration_members
        WHERE case_id = ? AND user_id = ?
      `;
      
      db.get(sql, [caseId, userId], (err, row) => {
        if (err) {
          reject(err);
        } else if (!row) {
          resolve(null);
        } else {
          resolve({
            ...row,
            permissions: row.permissions ? JSON.parse(row.permissions) : null
          });
        }
      });
    });
  }
}

module.exports = CollaborationMember;
