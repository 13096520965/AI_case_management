const { run } = require('../database');

/**
 * 添加案件背景字段
 */
async function addCaseBackgroundField() {
  try {
    console.log('开始添加案件背景字段...');
    
    // 添加 case_background 字段
    await run(`
      ALTER TABLE cases 
      ADD COLUMN case_background TEXT
    `);
    
    console.log('✓ 案件背景字段添加成功');
    
    return true;
  } catch (error) {
    // 如果字段已存在，忽略错误
    if (error.message && error.message.includes('duplicate column name')) {
      console.log('✓ 案件背景字段已存在');
      return true;
    }
    console.error('添加案件背景字段失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  addCaseBackgroundField()
    .then(() => {
      console.log('迁移完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('迁移失败:', error);
      process.exit(1);
    });
}

module.exports = { addCaseBackgroundField };
