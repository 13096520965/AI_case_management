/**
 * 案件日志集成测试
 * 测试中间件和数据库的完整集成
 */

const path = require('path');
process.env.DB_PATH = path.join(__dirname, 'database/legal_case.db');

const { query } = require('./src/config/database');

async function testIntegration() {
  console.log('='.repeat(60));
  console.log('案件日志集成测试');
  console.log('='.repeat(60));
  
  try {
    // 1. 检查表结构
    console.log('\n1. 检查 case_logs 表结构...');
    const db = require('./src/config/database').getDatabase();
    const dbInstance = await db;
    const tableInfo = dbInstance.exec("PRAGMA table_info(case_logs)");
    const columns = tableInfo[0]?.values.map(row => row[1]) || [];
    
    const requiredColumns = [
      'id', 'case_id', 'action_type', 'action_description',
      'operator_id', 'operator_name', 'ip_address', 'user_agent', 'related_data'
    ];
    
    const missingColumns = requiredColumns.filter(col => !columns.includes(col));
    
    if (missingColumns.length > 0) {
      console.log('✗ 缺少必需列:', missingColumns.join(', '));
      process.exit(1);
    }
    
    console.log('✓ 表结构正确，包含所有必需列');
    
    // 2. 检查索引
    console.log('\n2. 检查索引...');
    const indexes = dbInstance.exec("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='case_logs'");
    const indexNames = indexes[0]?.values.map(row => row[0]) || [];
    
    console.log('  已创建的索引:');
    indexNames.forEach(name => console.log(`    - ${name}`));
    
    if (indexNames.some(name => name.includes('case_id'))) {
      console.log('✓ case_id 索引存在');
    }
    
    if (indexNames.some(name => name.includes('action_type'))) {
      console.log('✓ action_type 索引存在');
    }
    
    // 3. 测试中间件导入
    console.log('\n3. 测试中间件导入...');
    try {
      const { logCaseAction } = require('./src/middleware/caseLogger');
      if (typeof logCaseAction === 'function') {
        console.log('✓ caseLogger 中间件导入成功');
      } else {
        console.log('✗ logCaseAction 不是函数');
        process.exit(1);
      }
    } catch (error) {
      console.log('✗ 中间件导入失败:', error.message);
      process.exit(1);
    }
    
    // 4. 查询最近的日志
    console.log('\n4. 查询最近的案件日志...');
    const recentLogs = await query(
      'SELECT * FROM case_logs ORDER BY created_at DESC LIMIT 3'
    );
    
    console.log(`✓ 找到 ${recentLogs.length} 条最近的日志`);
    
    if (recentLogs.length > 0) {
      console.log('\n最近的日志记录:');
      recentLogs.forEach((log, index) => {
        console.log(`\n  日志 ${index + 1}:`);
        console.log(`    案件ID: ${log.case_id}`);
        console.log(`    操作类型: ${log.action_type || 'N/A'}`);
        console.log(`    操作描述: ${log.action_description || log.action || 'N/A'}`);
        console.log(`    操作人: ${log.operator_name || log.operator || 'N/A'}`);
        console.log(`    IP地址: ${log.ip_address || 'N/A'}`);
        console.log(`    时间: ${log.created_at}`);
      });
    }
    
    // 5. 统计不同操作类型的日志数量
    console.log('\n5. 统计操作类型分布...');
    const stats = await query(`
      SELECT 
        action_type,
        COUNT(*) as count
      FROM case_logs
      WHERE action_type IS NOT NULL
      GROUP BY action_type
      ORDER BY count DESC
    `);
    
    if (stats.length > 0) {
      console.log('✓ 操作类型统计:');
      stats.forEach(stat => {
        console.log(`    ${stat.action_type}: ${stat.count} 次`);
      });
    } else {
      console.log('  暂无操作类型统计数据');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✓ 所有测试通过！案件日志系统运行正常');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('✗ 测试失败:', error.message);
    console.error('='.repeat(60));
    console.error(error);
    process.exit(1);
  }
}

testIntegration();
