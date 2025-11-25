const db = require('./src/config/database');
const fs = require('fs');
const path = require('path');

async function createTables() {
  console.log('============================================================');
  console.log('创建标的处理详情和汇款记录表');
  console.log('============================================================\n');

  try {
    const sql = fs.readFileSync(
      path.join(__dirname, 'database/migrations/007_create_target_amount_tables.sql'),
      'utf8'
    );
    
    const statements = sql.split(';').filter(s => s.trim());
    
    console.log(`执行 ${statements.length} 条SQL语句...\n`);
    
    for (const stmt of statements) {
      if (stmt.trim()) {
        await db.run(stmt);
      }
    }
    
    console.log('✓ SQL执行成功\n');
    
    // 验证表是否创建
    const tables = await db.query(
      `SELECT name FROM sqlite_master WHERE type='table' AND name IN ('target_amount_details', 'payment_records')`
    );
    
    console.log('已创建的表:');
    tables.forEach(t => console.log(`  ✓ ${t.name}`));
    
    // 查看表结构
    console.log('\n标的处理详情表结构:');
    const detailCols = await db.query('PRAGMA table_info(target_amount_details)');
    detailCols.forEach(col => {
      console.log(`  - ${col.name} (${col.type})`);
    });
    
    console.log('\n汇款记录表结构:');
    const paymentCols = await db.query('PRAGMA table_info(payment_records)');
    paymentCols.forEach(col => {
      console.log(`  - ${col.name} (${col.type})`);
    });
    
    console.log('\n============================================================');
    console.log('✓ 表创建完成！');
    console.log('============================================================');
    console.log('\n提示: 请重启后端服务器以加载新的数据库结构');
    
  } catch (error) {
    console.error('\n❌ 创建失败:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createTables();
