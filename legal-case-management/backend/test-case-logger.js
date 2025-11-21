/**
 * 测试案件日志记录功能
 */

const path = require('path');
process.env.DB_PATH = path.join(__dirname, 'database/legal_case.db');

const { run, query } = require('./src/config/database');

async function testCaseLogger() {
  console.log('='.repeat(50));
  console.log('测试案件日志记录');
  console.log('='.repeat(50));
  
  try {
    // 测试插入日志
    console.log('\n1. 测试插入案件日志...');
    
    const sql = `
      INSERT INTO case_logs (
        case_id, action_type, action_description, operator_id, 
        operator_name, ip_address, user_agent, related_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await run(sql, [
      1, // case_id
      'VIEW_CASE', // action_type
      '查看案件详情', // action_description
      null, // operator_id
      'test_user', // operator_name
      '127.0.0.1', // ip_address
      'Mozilla/5.0 Test', // user_agent
      JSON.stringify({ method: 'GET', path: '/api/cases/1' }) // related_data
    ]);
    
    console.log('✓ 日志插入成功, ID:', result.lastID);
    
    // 查询刚插入的日志
    console.log('\n2. 查询刚插入的日志...');
    const logs = await query('SELECT * FROM case_logs WHERE id = ?', [result.lastID]);
    
    if (logs.length > 0) {
      console.log('✓ 日志查询成功:');
      console.log(JSON.stringify(logs[0], null, 2));
    } else {
      console.log('✗ 未找到日志');
    }
    
    // 查询所有日志
    console.log('\n3. 查询所有案件日志...');
    const allLogs = await query('SELECT * FROM case_logs ORDER BY created_at DESC LIMIT 5');
    console.log(`✓ 找到 ${allLogs.length} 条日志`);
    
    allLogs.forEach((log, index) => {
      console.log(`\n日志 ${index + 1}:`);
      console.log(`  ID: ${log.id}`);
      console.log(`  案件ID: ${log.case_id}`);
      console.log(`  操作类型: ${log.action_type || 'N/A'}`);
      console.log(`  操作描述: ${log.action_description || log.action || 'N/A'}`);
      console.log(`  操作人: ${log.operator_name || log.operator || 'N/A'}`);
      console.log(`  时间: ${log.created_at}`);
    });
    
    console.log('\n' + '='.repeat(50));
    console.log('✓ 测试完成！');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('\n' + '='.repeat(50));
    console.error('✗ 测试失败:', error.message);
    console.error('='.repeat(50));
    console.error(error);
    process.exit(1);
  }
}

testCaseLogger();
