const { run } = require('../database');

/**
 * 添加产业板块字段到案件表
 */
async function addIndustrySegment() {
  try {
    console.log('开始添加产业板块字段...');
    
    // 添加 industry_segment 字段
    await run(`
      ALTER TABLE cases 
      ADD COLUMN industry_segment VARCHAR(50)
    `);
    
    console.log('✓ 产业板块字段添加成功');
    
    // 创建索引以提高查询性能
    await run(`
      CREATE INDEX IF NOT EXISTS idx_cases_industry_segment 
      ON cases(industry_segment)
    `);
    
    console.log('✓ 产业板块索引创建成功');
    
    return true;
  } catch (error) {
    // 如果字段已存在，忽略错误
    if (error.message && error.message.includes('duplicate column name')) {
      console.log('产业板块字段已存在，跳过');
      return true;
    }
    console.error('添加产业板块字段失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  addIndustrySegment()
    .then(() => {
      console.log('迁移完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('迁移失败:', error);
      process.exit(1);
    });
}

module.exports = { addIndustrySegment };
