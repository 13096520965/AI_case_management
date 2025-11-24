const db = require('./src/config/database');
const fs = require('fs');
const path = require('path');

const MIGRATION_FILE = path.join(__dirname, 'database/migrations/007_create_target_amount_tables.sql');

async function runMigration() {
  console.log('============================================================');
  console.log('运行标的处理详情和汇款记录表迁移');
  console.log('============================================================\n');

  try {
    // 读取迁移SQL文件
    const sql = fs.readFileSync(MIGRATION_FILE, 'utf8');
    
    // 分割SQL语句并执行
    const statements = sql.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await db.run(statement);
      }
    }

    console.log('✓ 数据库表创建成功\n');

    // 验证表是否创建成功
    const tables = await db.query(
      `SELECT name FROM sqlite_master WHERE type='table' AND name IN ('target_amount_details', 'payment_records')`
    );

    console.log('已创建的表:');
    tables.forEach(table => {
      console.log(`  ✓ ${table.name}`);
    });

    // 查看表结构
    console.log('\n标的处理详情表结构:');
    const detailColumns = await db.query('PRAGMA table_info(target_amount_details)');
    detailColumns.forEach(col => {
      console.log(`  - ${col.name} (${col.type})`);
    });

    console.log('\n汇款记录表结构:');
    const paymentColumns = await db.query('PRAGMA table_info(payment_records)');
    paymentColumns.forEach(col => {
      console.log(`  - ${col.name} (${col.type})`);
    });

    console.log('\n============================================================');
    console.log('✓ 迁移完成！');
    console.log('============================================================');
  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
    console.error(error);
    throw error;
  }
}

// 运行迁移
runMigration().catch(err => {
  console.error('迁移过程出错:', err);
  process.exit(1);
});
