const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const { DB_PATH } = require('./database');

/**
 * 数据库初始化脚本
 */
const initSQL = `
-- 案件表
CREATE TABLE IF NOT EXISTS cases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_number VARCHAR(100) UNIQUE,
  internal_number VARCHAR(100) UNIQUE,
  case_type VARCHAR(50),
  case_cause VARCHAR(200),
  court VARCHAR(200),
  target_amount DECIMAL(15,2),
  filing_date DATE,
  status VARCHAR(50) DEFAULT 'active',
  team_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 诉讼主体表
CREATE TABLE IF NOT EXISTS litigation_parties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER NOT NULL,
  party_type VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  name VARCHAR(200) NOT NULL,
  unified_credit_code VARCHAR(100),
  legal_representative VARCHAR(100),
  id_number VARCHAR(50),
  contact_phone VARCHAR(50),
  contact_email VARCHAR(100),
  address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- 流程节点表
CREATE TABLE IF NOT EXISTS process_nodes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER NOT NULL,
  node_type VARCHAR(50) NOT NULL,
  node_name VARCHAR(100) NOT NULL,
  handler VARCHAR(100),
  start_time DATETIME,
  deadline DATETIME,
  completion_time DATETIME,
  status VARCHAR(50) DEFAULT 'pending',
  progress TEXT,
  node_order INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- 流程模板表
CREATE TABLE IF NOT EXISTS process_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_name VARCHAR(100) NOT NULL,
  case_type VARCHAR(50) NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 流程模板节点表
CREATE TABLE IF NOT EXISTS process_template_nodes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER NOT NULL,
  node_type VARCHAR(50) NOT NULL,
  node_name VARCHAR(100) NOT NULL,
  deadline_days INTEGER,
  node_order INTEGER NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES process_templates(id) ON DELETE CASCADE
);

-- 证据表
CREATE TABLE IF NOT EXISTS evidence (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50),
  file_size INTEGER,
  storage_path VARCHAR(500) NOT NULL,
  category VARCHAR(50),
  tags TEXT,
  uploaded_by VARCHAR(100),
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  version INTEGER DEFAULT 1,
  parent_id INTEGER,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES evidence(id) ON DELETE SET NULL
);

-- 证据版本历史表
CREATE TABLE IF NOT EXISTS evidence_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  evidence_id INTEGER NOT NULL,
  version INTEGER NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50),
  file_size INTEGER,
  storage_path VARCHAR(500) NOT NULL,
  category VARCHAR(50),
  tags TEXT,
  uploaded_by VARCHAR(100),
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (evidence_id) REFERENCES evidence(id) ON DELETE CASCADE
);

-- 证据操作日志表
CREATE TABLE IF NOT EXISTS evidence_operation_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  evidence_id INTEGER NOT NULL,
  operation_type VARCHAR(50) NOT NULL,
  operator VARCHAR(100) NOT NULL,
  operation_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(50),
  details TEXT,
  FOREIGN KEY (evidence_id) REFERENCES evidence(id) ON DELETE CASCADE
);

-- 文书表
CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER NOT NULL,
  document_type VARCHAR(50),
  file_name VARCHAR(255) NOT NULL,
  storage_path VARCHAR(500) NOT NULL,
  extracted_content TEXT,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- 文书模板表
CREATE TABLE IF NOT EXISTS document_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_name VARCHAR(100) NOT NULL,
  document_type VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  variables TEXT,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 成本记录表
CREATE TABLE IF NOT EXISTS cost_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER NOT NULL,
  cost_type VARCHAR(50) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  payment_date DATE,
  payment_method VARCHAR(50),
  voucher_number VARCHAR(100),
  payer VARCHAR(100),
  payee VARCHAR(100),
  status VARCHAR(50) DEFAULT 'unpaid',
  due_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- 提醒任务表
CREATE TABLE IF NOT EXISTS notification_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  related_id INTEGER,
  related_type VARCHAR(50),
  task_type VARCHAR(50) NOT NULL,
  scheduled_time DATETIME NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 提醒规则表
CREATE TABLE IF NOT EXISTS notification_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rule_name VARCHAR(100) NOT NULL,
  rule_type VARCHAR(50) NOT NULL,
  trigger_condition VARCHAR(100) NOT NULL,
  threshold_value INTEGER,
  threshold_unit VARCHAR(20),
  frequency VARCHAR(50),
  recipients TEXT,
  is_enabled BOOLEAN DEFAULT 1,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 提醒发送历史表
CREATE TABLE IF NOT EXISTS notification_send_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  notification_id INTEGER NOT NULL,
  send_method VARCHAR(50) NOT NULL,
  send_status VARCHAR(50) NOT NULL,
  send_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  details TEXT,
  FOREIGN KEY (notification_id) REFERENCES notification_tasks(id) ON DELETE CASCADE
);

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  real_name VARCHAR(100),
  email VARCHAR(100),
  role VARCHAR(50) DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 协作成员表
CREATE TABLE IF NOT EXISTS collaboration_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  role VARCHAR(50) NOT NULL,
  permissions TEXT,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(case_id, user_id)
);

-- 协作任务表
CREATE TABLE IF NOT EXISTS collaboration_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER NOT NULL,
  task_title VARCHAR(200) NOT NULL,
  task_description TEXT,
  assigned_to INTEGER,
  assigned_by INTEGER,
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(50) DEFAULT 'pending',
  due_date DATETIME,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 结案报告表
CREATE TABLE IF NOT EXISTS closure_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER NOT NULL UNIQUE,
  case_summary TEXT,
  case_result VARCHAR(100),
  experience_summary TEXT,
  risk_warnings TEXT,
  lessons_learned TEXT,
  created_by VARCHAR(100),
  approved_by VARCHAR(100),
  approval_status VARCHAR(50) DEFAULT 'draft',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- 归档包表
CREATE TABLE IF NOT EXISTS archive_packages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER NOT NULL UNIQUE,
  archive_number VARCHAR(100) UNIQUE NOT NULL,
  archive_date DATE NOT NULL,
  archive_location VARCHAR(200),
  package_size INTEGER,
  package_path VARCHAR(500),
  archived_by VARCHAR(100),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- 案例知识库表
CREATE TABLE IF NOT EXISTS case_knowledge (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER,
  archive_package_id INTEGER,
  case_cause VARCHAR(200) NOT NULL,
  dispute_focus TEXT,
  legal_issues TEXT,
  case_result VARCHAR(100),
  key_evidence TEXT,
  legal_basis TEXT,
  case_analysis TEXT,
  practical_significance TEXT,
  keywords TEXT,
  tags TEXT,
  win_rate_reference DECIMAL(5,2),
  created_by VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE SET NULL,
  FOREIGN KEY (archive_package_id) REFERENCES archive_packages(id) ON DELETE SET NULL
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_cases_case_number ON cases(case_number);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_litigation_parties_case_id ON litigation_parties(case_id);
CREATE INDEX IF NOT EXISTS idx_process_nodes_case_id ON process_nodes(case_id);
CREATE INDEX IF NOT EXISTS idx_process_templates_case_type ON process_templates(case_type);
CREATE INDEX IF NOT EXISTS idx_process_template_nodes_template_id ON process_template_nodes(template_id);
CREATE INDEX IF NOT EXISTS idx_evidence_case_id ON evidence(case_id);
CREATE INDEX IF NOT EXISTS idx_evidence_versions_evidence_id ON evidence_versions(evidence_id);
CREATE INDEX IF NOT EXISTS idx_evidence_operation_logs_evidence_id ON evidence_operation_logs(evidence_id);
CREATE INDEX IF NOT EXISTS idx_documents_case_id ON documents(case_id);
CREATE INDEX IF NOT EXISTS idx_document_templates_document_type ON document_templates(document_type);
CREATE INDEX IF NOT EXISTS idx_cost_records_case_id ON cost_records(case_id);
CREATE INDEX IF NOT EXISTS idx_notification_tasks_status ON notification_tasks(status);
CREATE INDEX IF NOT EXISTS idx_notification_rules_rule_type ON notification_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_notification_rules_is_enabled ON notification_rules(is_enabled);
CREATE INDEX IF NOT EXISTS idx_notification_send_history_notification_id ON notification_send_history(notification_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_collaboration_members_case_id ON collaboration_members(case_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_members_user_id ON collaboration_members(user_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_tasks_case_id ON collaboration_tasks(case_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_tasks_assigned_to ON collaboration_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_collaboration_tasks_status ON collaboration_tasks(status);
CREATE INDEX IF NOT EXISTS idx_closure_reports_case_id ON closure_reports(case_id);
CREATE INDEX IF NOT EXISTS idx_closure_reports_approval_status ON closure_reports(approval_status);
CREATE INDEX IF NOT EXISTS idx_archive_packages_case_id ON archive_packages(case_id);
CREATE INDEX IF NOT EXISTS idx_archive_packages_archive_number ON archive_packages(archive_number);
CREATE INDEX IF NOT EXISTS idx_case_knowledge_case_cause ON case_knowledge(case_cause);
CREATE INDEX IF NOT EXISTS idx_case_knowledge_case_id ON case_knowledge(case_id);
CREATE INDEX IF NOT EXISTS idx_case_knowledge_archive_package_id ON case_knowledge(archive_package_id);
`;

/**
 * 初始化数据库
 * @returns {Promise<void>}
 */
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    // 确保 database 目录存在
    const dbDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('数据库连接失败:', err.message);
        reject(err);
        return;
      }
      console.log('数据库连接成功');
    });

    // 启用外键约束
    db.run('PRAGMA foreign_keys = ON', (err) => {
      if (err) {
        console.error('启用外键约束失败:', err.message);
        reject(err);
        return;
      }
    });

    // 执行初始化 SQL
    db.exec(initSQL, (err) => {
      if (err) {
        console.error('数据库初始化失败:', err.message);
        db.close();
        reject(err);
        return;
      }
      
      console.log('数据库表创建成功');
      
      db.close((err) => {
        if (err) {
          console.error('关闭数据库连接失败:', err.message);
          reject(err);
        } else {
          console.log('数据库初始化完成');
          resolve();
        }
      });
    });
  });
}

module.exports = {
  initializeDatabase
};
