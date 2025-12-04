const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'database', 'legal_case.db');

console.log('验证 party_history 表数据...\n');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
    process.exit(1);
  }
});

// 查询最近的历史记录
db.all(`
  SELECT 
    ph.*,
    lp.name as party_name,
    lp.party_type,
    c.case_number
  FROM party_history ph
  LEFT JOIN litigation_parties lp ON ph.party_id = lp.id
  LEFT JOIN cases c ON ph.case_id = c.id
  ORDER BY ph.changed_at DESC
  LIMIT 10
`, (err, rows) => {
  if (err) {
    console.error('查询失败:', err.message);
    db.close();
    return;
  }

  console.log(`找到 ${rows.length} 条历史记录:\n`);
  
  rows.forEach((row, index) => {
    console.log(`${index + 1}. 操作: ${row.action}`);
    console.log(`   主体: ${row.party_name || '(已删除)'} (${row.party_type || 'N/A'})`);
    console.log(`   案件: ${row.case_number || '(已删除)'}`);
    console.log(`   操作人: ${row.changed_by}`);
    console.log(`   时间: ${row.changed_at}`);
    
    if (row.changed_fields) {
      try {
        const fields = JSON.parse(row.changed_fields);
        console.log(`   变更内容:`, JSON.stringify(fields, null, 4));
      } catch (e) {
        console.log(`   变更内容: ${row.changed_fields}`);
      }
    }
    console.log('');
  });

  // 统计各类操作的数量
  db.all(`
    SELECT action, COUNT(*) as count
    FROM party_history
    GROUP BY action
  `, (err, stats) => {
    if (err) {
      console.error('统计失败:', err.message);
    } else {
      console.log('操作统计:');
      stats.forEach(stat => {
        console.log(`  ${stat.action}: ${stat.count} 次`);
      });
    }
    
    db.close();
  });
});
