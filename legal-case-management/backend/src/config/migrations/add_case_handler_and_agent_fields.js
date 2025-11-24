const { run } = require('../database');

/**
 * 添加案件承接人和外部代理相关字段
 */
async function addCaseHandlerAndAgentFields() {
  try {
    console.log('开始添加案件承接人和外部代理字段...');
    
    // 添加案件承接人字段
    try {
      await run(`ALTER TABLE cases ADD COLUMN handler VARCHAR(100)`);
      console.log('✓ handler 字段添加成功');
    } catch (error) {
      if (error.message && error.message.includes('duplicate column name')) {
        console.log('handler 字段已存在，跳过');
      } else {
        throw error;
      }
    }
    
    // 添加是否外部代理字段
    try {
      await run(`ALTER TABLE cases ADD COLUMN is_external_agent BOOLEAN DEFAULT 0`);
      console.log('✓ is_external_agent 字段添加成功');
    } catch (error) {
      if (error.message && error.message.includes('duplicate column name')) {
        console.log('is_external_agent 字段已存在，跳过');
      } else {
        throw error;
      }
    }
    
    // 添加律所名称字段
    try {
      await run(`ALTER TABLE cases ADD COLUMN law_firm_name VARCHAR(200)`);
      console.log('✓ law_firm_name 字段添加成功');
    } catch (error) {
      if (error.message && error.message.includes('duplicate column name')) {
        console.log('law_firm_name 字段已存在，跳过');
      } else {
        throw error;
      }
    }
    
    // 添加代理律师字段
    try {
      await run(`ALTER TABLE cases ADD COLUMN agent_lawyer VARCHAR(100)`);
      console.log('✓ agent_lawyer 字段添加成功');
    } catch (error) {
      if (error.message && error.message.includes('duplicate column name')) {
        console.log('agent_lawyer 字段已存在，跳过');
      } else {
        throw error;
      }
    }
    
    // 添加联系方式字段
    try {
      await run(`ALTER TABLE cases ADD COLUMN agent_contact VARCHAR(100)`);
      console.log('✓ agent_contact 字段添加成功');
    } catch (error) {
      if (error.message && error.message.includes('duplicate column name')) {
        console.log('agent_contact 字段已存在，跳过');
      } else {
        throw error;
      }
    }
    
    // 创建索引
    try {
      await run(`CREATE INDEX IF NOT EXISTS idx_cases_handler ON cases(handler)`);
      console.log('✓ handler 索引创建成功');
    } catch (error) {
      console.log('handler 索引创建跳过');
    }
    
    try {
      await run(`CREATE INDEX IF NOT EXISTS idx_cases_is_external_agent ON cases(is_external_agent)`);
      console.log('✓ is_external_agent 索引创建成功');
    } catch (error) {
      console.log('is_external_agent 索引创建跳过');
    }
    
    console.log('迁移完成');
    return true;
  } catch (error) {
    console.error('迁移失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  addCaseHandlerAndAgentFields()
    .then(() => {
      console.log('所有字段添加完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('迁移失败:', error);
      process.exit(1);
    });
}

module.exports = { addCaseHandlerAndAgentFields };
