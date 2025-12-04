/**
 * Script to run the party enhancement migration
 * 运行主体表增强迁移脚本
 */

const migration = require('./src/config/migrations/007_enhance_party_tables');

async function runMigration() {
  console.log('========================================');
  console.log('运行案件主体信息增强迁移');
  console.log('========================================\n');
  
  try {
    await migration.up();
    console.log('\n========================================');
    console.log('✓ 迁移成功完成！');
    console.log('========================================\n');
    process.exit(0);
  } catch (error) {
    console.error('\n========================================');
    console.error('✗ 迁移失败:', error);
    console.error('========================================\n');
    process.exit(1);
  }
}

runMigration();
