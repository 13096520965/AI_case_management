const db = require('../config/database');
const { beijingNow } = require('../utils/time');

/**
 * 协作任务模型
 */
class CollaborationTask {
  /**
   * 创建协作任务
   */
  static create(taskData) {
    return new Promise((resolve, reject) => {
      const {
        case_id,
        task_title,
        task_description,
        assigned_to,
        assigned_by,
        priority,
        status,
        due_date
      } = taskData;
      
      const sql = `
        INSERT INTO collaboration_tasks (
          case_id, task_title, task_description, assigned_to, 
          assigned_by, priority, status, due_date
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      db.run(
        sql,
        [
          case_id,
          task_title,
          task_description,
          assigned_to,
          assigned_by,
          priority || 'medium',
          status || 'pending',
          due_date
        ],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, ...taskData });
          }
        }
      );
    });
  }

  /**
   * 获取案件的所有协作任务
   */
  static findByCaseId(caseId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          ct.id,
          ct.case_id,
          ct.task_title,
          ct.task_description,
          ct.assigned_to,
          ct.assigned_by,
          ct.priority,
          ct.status,
          ct.due_date,
          ct.completed_at,
          ct.created_at,
          ct.updated_at,
          u1.username as assigned_to_username,
          u1.real_name as assigned_to_name,
          u2.username as assigned_by_username,
          u2.real_name as assigned_by_name
        FROM collaboration_tasks ct
        LEFT JOIN users u1 ON ct.assigned_to = u1.id
        LEFT JOIN users u2 ON ct.assigned_by = u2.id
        WHERE ct.case_id = ?
        ORDER BY ct.created_at DESC
      `;
      
      db.all(sql, [caseId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * 根据 ID 获取协作任务
   */
  static findById(id) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          ct.id,
          ct.case_id,
          ct.task_title,
          ct.task_description,
          ct.assigned_to,
          ct.assigned_by,
          ct.priority,
          ct.status,
          ct.due_date,
          ct.completed_at,
          ct.created_at,
          ct.updated_at,
          u1.username as assigned_to_username,
          u1.real_name as assigned_to_name,
          u2.username as assigned_by_username,
          u2.real_name as assigned_by_name
        FROM collaboration_tasks ct
        LEFT JOIN users u1 ON ct.assigned_to = u1.id
        LEFT JOIN users u2 ON ct.assigned_by = u2.id
        WHERE ct.id = ?
      `;
      
      db.get(sql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  /**
   * 更新协作任务
   */
  static update(id, taskData) {
    return new Promise((resolve, reject) => {
      const {
        task_title,
        task_description,
        assigned_to,
        priority,
        status,
        due_date,
        completed_at
      } = taskData;
      
      const updates = [];
      const values = [];
      
      if (task_title !== undefined) {
        updates.push('task_title = ?');
        values.push(task_title);
      }
      if (task_description !== undefined) {
        updates.push('task_description = ?');
        values.push(task_description);
      }
      if (assigned_to !== undefined) {
        updates.push('assigned_to = ?');
        values.push(assigned_to);
      }
      if (priority !== undefined) {
        updates.push('priority = ?');
        values.push(priority);
      }
      if (status !== undefined) {
        updates.push('status = ?');
        values.push(status);
        
        // 如果状态更新为 completed，自动设置完成时间
        if (status === 'completed' && !completed_at) {
          updates.push('completed_at = ?');
          values.push(beijingNow());
        }
      }
      if (due_date !== undefined) {
        updates.push('due_date = ?');
        values.push(due_date);
      }
      if (completed_at !== undefined) {
        updates.push('completed_at = ?');
        values.push(completed_at);
      }
      
  updates.push('updated_at = ?');
  values.push(beijingNow());
  values.push(id);
      
      const sql = `
        UPDATE collaboration_tasks
        SET ${updates.join(', ')}
        WHERE id = ?
      `;
      
      db.run(sql, values, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id, changes: this.changes });
        }
      });
    });
  }

  /**
   * 删除协作任务
   */
  static delete(id) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM collaboration_tasks WHERE id = ?';
      
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
   * 获取用户的所有任务
   */
  static findByUserId(userId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          ct.id,
          ct.case_id,
          ct.task_title,
          ct.task_description,
          ct.assigned_to,
          ct.assigned_by,
          ct.priority,
          ct.status,
          ct.due_date,
          ct.completed_at,
          ct.created_at,
          ct.updated_at,
          c.case_number,
          c.case_cause,
          u.username as assigned_by_username,
          u.real_name as assigned_by_name
        FROM collaboration_tasks ct
        LEFT JOIN cases c ON ct.case_id = c.id
        LEFT JOIN users u ON ct.assigned_by = u.id
        WHERE ct.assigned_to = ?
        ORDER BY ct.created_at DESC
      `;
      
      db.all(sql, [userId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
}

module.exports = CollaborationTask;
