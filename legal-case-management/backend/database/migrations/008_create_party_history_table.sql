-- 创建主体修改历史表
CREATE TABLE IF NOT EXISTS party_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  party_id INTEGER NOT NULL,
  case_id INTEGER NOT NULL,
  action VARCHAR(50) NOT NULL,
  changed_fields TEXT,
  changed_by VARCHAR(100),
  changed_at DATETIME DEFAULT (datetime('now', '+8 hours')),
  FOREIGN KEY (party_id) REFERENCES litigation_parties(id) ON DELETE CASCADE,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_party_history_party_id ON party_history(party_id);
CREATE INDEX IF NOT EXISTS idx_party_history_case_id ON party_history(case_id);
CREATE INDEX IF NOT EXISTS idx_party_history_action ON party_history(action);
