-- 标的处理详情表
CREATE TABLE IF NOT EXISTS target_amount_details (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER NOT NULL UNIQUE,
  total_amount REAL DEFAULT 0,
  penalty_amount REAL DEFAULT 0,
  litigation_cost REAL DEFAULT 0,
  cost_bearer TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- 汇款记录表
CREATE TABLE IF NOT EXISTS payment_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER NOT NULL,
  payment_date DATE NOT NULL,
  amount REAL NOT NULL,
  payer TEXT NOT NULL,
  payee TEXT NOT NULL,
  payment_method TEXT,
  status TEXT DEFAULT '待汇款',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_target_amount_case_id ON target_amount_details(case_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_case_id ON payment_records(case_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_date ON payment_records(payment_date);
CREATE INDEX IF NOT EXISTS idx_payment_records_status ON payment_records(status);
