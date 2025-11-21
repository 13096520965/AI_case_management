/**
 * 运行 case_logs 表结构迁移脚本
 */

const path = require('path');

// 使用实际的数据库路径
const dbPath = path.join(__dirname, 'database/legal_case.db');
console.log('数据库路径:', dbPath);

// 临时修改 database.js 中的路径
const fs = require('fs');
const databaseJsPath = path.join(__dirname, 'src/config/database.js');
const originalContent = fs.readFileSync(databaseJsPath, 'utf8');
const modifiedContent = originalContent.replace(
  "const DB_PATH = path.join(__dirname, '../../database/legal_case.db');",
  `const DB_PATH = '${dbPath}';`
);
fs.writeFileSync(databaseJsPath, modifiedContent);

const migration = require('./src/config/migrations/002_update_case_logs_schema');

async function runMigration() {
  console.log('='.repeat(50));
  console.log('开始执行 case_logs 表结构迁移');
  console.log('='.repeat(50));
  
  try {
    await migration.up();
    console.log('\n' + '='.repeat(50));
    console.log('✓ 迁移成功完成！');
    console.log('='.repeat(50));
    
    // 恢复原始文件
    fs.writeFileSync(databaseJsPath, originalContent);
    console.log('✓ 已恢复 database.js');
    
    process.exit(0);
  } catch (error) {
    console.error('\n' + '='.repeat(50));
    console.error('✗ 迁移失败:', error.message);
    console.error('='.repeat(50));
    console.error(error);
    
    // 恢复原始文件
    fs.writeFileSync(databaseJsPath, originalContent);
    console.log('✓ 已恢复 database.js');
    
    process.exit(1);
  }
}

runMigration();
