const { run } = require('../database');

/**
 * 添加 days_from_start 字段到 process_template_nodes 表
 */
async function migrate() {
  try {
    console.log('开始迁移：添加 days_from_start 字段...');
    
    // 检查字段是否已存在
    const checkSql = `
      SELECT COUNT(*) as count 
      FROM pragma_table_info('process_template_nodes') 
      WHERE name = 'days_from_start'
    `;
    
    const result = await run(checkSql);
    
    if (result.count === 0) {
      // 添加新字段
      const alterSql = `
        ALTER TABLE process_template_nodes 
        ADD COLUMN days_from_start INTEGER DEFAULT 0
      `;
      
      await run(alterSql);
      console.log('✓ 成功添加 days_from_start 字段');
    } else {
      console.log('✓ days_from_start 字段已存在，跳过');
    }
    
    console.log('迁移完成！');
  } catch (error) {
    console.error('迁移失败:', error);
    throw error;
  }
}

// 如果直接运行此文件
if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { migrate };
