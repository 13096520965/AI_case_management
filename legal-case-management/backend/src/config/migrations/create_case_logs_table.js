const { run } = require('../database');

/**
 * 创建案件日志表
 */
async function createCaseLogsTable() {
  try {
    console.log('开始创建案件日志表...');
    
    // 先删除旧表（如果存在）
    await run(`DROP TABLE IF EXISTS case_logs`);
    
    await run(`
      CREATE TABLE IF NOT EXISTS case_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        case_id INTEGER NOT NULL,
        operator VARCHAR(100),
        action TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
      )
    `);
    
    console.log('✓ 案件日志表创建成功');
    
    // 创建索引
    await run(`
      CREATE INDEX IF NOT EXISTS idx_case_logs_case_id 
      ON case_logs(case_id)
    `);
    
    await run(`
      CREATE INDEX IF NOT EXISTS idx_case_logs_created_at 
      ON case_logs(created_at)
    `);
    
    console.log('✓ 案件日志索引创建成功');
    
    return true;
  } catch (error) {
    console.error('创建案件日志表失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  createCaseLogsTable()
    .then(() => {
      console.log('迁移完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('迁移失败:', error);
      process.exit(1);
    });
}

module.exports = { createCaseLogsTable };
