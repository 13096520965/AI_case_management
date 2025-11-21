/**
 * 验证 case_logs 表结构
 */

const path = require('path');
process.env.DB_PATH = path.join(__dirname, 'legal_case_management.db');

const { getDatabase } = require('./src/config/database');

async function verifySchema() {
  console.log('='.repeat(50));
  console.log('验证 case_logs 表结构');
  console.log('='.repeat(50));
  
  try {
    const db = await getDatabase();
    
    // 获取表结构
    const result = db.exec("PRAGMA table_info(case_logs)");
    
    if (result.length === 0) {
      console.log('✗ case_logs 表不存在');
      process.exit(1);
    }
    
    console.log('\n表结构:');
    console.log('-'.repeat(50));
    
    const columns = result[0].values;
    columns.forEach(col => {
      const [cid, name, type, notnull, dflt_value, pk] = col;
      console.log(`${name.padEnd(20)} ${type.padEnd(15)} ${pk ? 'PRIMARY KEY' : ''}`);
    });
    
    console.log('-'.repeat(50));
    
    // 检查必需的列
    const columnNames = columns.map(col => col[1]);
    const requiredColumns = [
      'id', 'case_id', 'action_type', 'action_description',
      'operator_id', 'operator_name', 'ip_address', 'user_agent',
      'related_data', 'created_at'
    ];
    
    console.log('\n检查必需列:');
    let allPresent = true;
    requiredColumns.forEach(col => {
      const present = columnNames.includes(col);
      console.log(`  ${present ? '✓' : '✗'} ${col}`);
      if (!present) allPresent = false;
    });
    
    if (allPresent) {
      console.log('\n✓ 所有必需列都存在！');
    } else {
      console.log('\n✗ 缺少某些必需列');
    }
    
    console.log('='.repeat(50));
    process.exit(allPresent ? 0 : 1);
    
  } catch (error) {
    console.error('验证失败:', error);
    process.exit(1);
  }
}

verifySchema();
