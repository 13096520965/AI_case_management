/**
 * 测试诉讼主体历史案件查询
 */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'database/legal_case.db');

async function testPartyHistory() {
  console.log('='.repeat(60));
  console.log('测试诉讼主体历史案件查询');
  console.log('='.repeat(60));
  
  try {
    const SQL = await initSqlJs();
    const buffer = fs.readFileSync(DB_PATH);
    const db = new SQL.Database(buffer);
    
    // 1. 查询所有诉讼主体
    console.log('\n1. 查询诉讼主体...');
    const partiesResult = db.exec('SELECT DISTINCT name FROM litigation_parties LIMIT 5');
    
    if (partiesResult.length === 0 || partiesResult[0].values.length === 0) {
      console.log('没有诉讼主体数据');
      return;
    }
    
    const parties = partiesResult[0].values.map(row => row[0]);
    console.log('找到诉讼主体:', parties);
    
    // 2. 查询第一个主体的历史案件
    const testPartyName = parties[0];
    console.log(`\n2. 查询 "${testPartyName}" 的历史案件...`);
    
    const sql = `
      SELECT DISTINCT 
        c.id,
        c.case_number,
        c.case_type,
        c.case_cause,
        c.court,
        c.filing_date,
        c.status,
        c.created_at
      FROM cases c
      INNER JOIN litigation_parties lp ON c.id = lp.case_id
      WHERE lp.name = ?
      ORDER BY c.created_at DESC
    `;
    
    const stmt = db.prepare(sql);
    stmt.bind([testPartyName]);
    
    console.log('\n历史案件列表:');
    console.log('-'.repeat(60));
    
    let count = 0;
    while (stmt.step()) {
      const row = stmt.getAsObject();
      count++;
      console.log(`\n案件 ${count}:`);
      console.log(`  ID: ${row.id}`);
      console.log(`  案号: ${row.case_number || '无'}`);
      console.log(`  案件类型: ${row.case_type || '无'}`);
      console.log(`  案由: ${row.case_cause || '无'}`);
      console.log(`  法院: ${row.court || '无'}`);
      console.log(`  立案日期: ${row.filing_date || '未设置'} ${row.filing_date ? '✅' : '❌'}`);
      console.log(`  状态: ${row.status || '无'}`);
      console.log(`  创建时间: ${row.created_at}`);
    }
    
    stmt.free();
    
    if (count === 0) {
      console.log('该主体没有历史案件');
    } else {
      console.log('\n' + '-'.repeat(60));
      console.log(`总计: ${count} 个案件`);
    }
    
    // 3. 检查所有案件的立案日期
    console.log('\n3. 检查所有案件的立案日期...');
    const allCasesResult = db.exec(`
      SELECT 
        id,
        case_number,
        filing_date,
        CASE 
          WHEN filing_date IS NULL THEN '未设置'
          ELSE '已设置'
        END as date_status
      FROM cases
      ORDER BY id DESC
      LIMIT 10
    `);
    
    if (allCasesResult.length > 0) {
      console.log('\n最近10个案件的立案日期状态:');
      allCasesResult[0].values.forEach(row => {
        console.log(`  案件 ${row[0]}: ${row[1]} - 立案日期: ${row[2] || '未设置'} (${row[3]})`);
      });
    }
    
    // 4. 统计立案日期设置情况
    const statsResult = db.exec(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN filing_date IS NOT NULL THEN 1 ELSE 0 END) as has_date,
        SUM(CASE WHEN filing_date IS NULL THEN 1 ELSE 0 END) as no_date
      FROM cases
    `);
    
    if (statsResult.length > 0) {
      const stats = statsResult[0].values[0];
      console.log('\n4. 立案日期统计:');
      console.log(`  总案件数: ${stats[0]}`);
      console.log(`  已设置立案日期: ${stats[1]} (${((stats[1]/stats[0])*100).toFixed(1)}%)`);
      console.log(`  未设置立案日期: ${stats[2]} (${((stats[2]/stats[0])*100).toFixed(1)}%)`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✓ 测试完成');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('测试失败:', error);
  }
}

testPartyHistory();
