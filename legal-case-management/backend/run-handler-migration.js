/**
 * 运行 handler 字段迁移脚本
 */

const migration = require('./src/config/migrations/004_add_handler_to_cases');

async function runMigration() {
  console.log('============================================================');
  console.log('运行迁移: 添加承办人员字段');
  console.log('============================================================\n');

  try {
    await migration.up();
    console.log('\n✓ 迁移成功完成！');
    console.log('\n现在可以在案件表中使用 handler 字段了。');
  } catch (error) {
    console.error('\n❌ 迁移失败:', error.message);
    process.exit(1);
  }
}

runMigration();
