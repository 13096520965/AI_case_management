/**
 * 检查document_templates表结构
 */

const { query } = require('./src/config/database');

async function checkTableStructure() {
  try {
    console.log('检查document_templates表结构...\n');
    
    const columns = await query("PRAGMA table_info(document_templates)");
    
    if (columns.length === 0) {
      console.log('❌ 表不存在');
    } else {
      console.log('✅ 表存在，列信息：\n');
      columns.forEach(col => {
        console.log(`  ${col.cid}. ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('检查失败:', error);
    process.exit(1);
  }
}

checkTableStructure();
