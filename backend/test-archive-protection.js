/**
 * 测试案件归档状态保护机制
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

// 测试用的认证 token（需要先登录获取）
let authToken = '';

// 测试案件ID
let testCaseId = null;

async function login() {
  try {
    console.log('\n=== 1. 登录获取 Token ===');
    const response = await axios.post(`${API_BASE}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    authToken = response.data.data.token;
    console.log('✅ 登录成功');
    return true;
  } catch (error) {
    console.error('❌ 登录失败:', error.response?.data || error.message);
    return false;
  }
}

async function testCreateArchivedCase() {
  try {
    console.log('\n=== 2. 测试: 尝试直接创建"已归档"状态的案件 ===');
    await axios.post(`${API_BASE}/cases`, {
      case_type: '民事',
      case_cause: '测试案件 - 尝试直接归档',
      court: '测试法院',
      status: '已归档'  // 尝试直接设置为已归档
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('❌ 测试失败: 应该被拒绝但成功创建了');
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ 测试通过: 正确拒绝了直接创建已归档案件');
      console.log('   错误信息:', error.response.data.error.message);
      return true;
    } else {
      console.error('❌ 意外错误:', error.response?.data || error.message);
      return false;
    }
  }
}

async function createNormalCase() {
  try {
    console.log('\n=== 3. 创建正常案件（已结案状态）===');
    const response = await axios.post(`${API_BASE}/cases`, {
      case_type: '民事',
      case_cause: '测试案件 - 归档保护测试',
      court: '测试法院',
      status: '已结案'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    testCaseId = response.data.data.case.id;
    console.log('✅ 案件创建成功, ID:', testCaseId);
    console.log('   状态:', response.data.data.case.status);
    return true;
  } catch (error) {
    console.error('❌ 创建案件失败:', error.response?.data || error.message);
    return false;
  }
}

async function testManualArchive() {
  try {
    console.log('\n=== 4. 测试: 尝试手动将案件状态改为"已归档" ===');
    await axios.put(`${API_BASE}/cases/${testCaseId}`, {
      status: '已归档'  // 尝试手动设置为已归档
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('❌ 测试失败: 应该被拒绝但成功修改了');
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ 测试通过: 正确拒绝了手动设置已归档状态');
      console.log('   错误信息:', error.response.data.error.message);
      return true;
    } else {
      console.error('❌ 意外错误:', error.response?.data || error.message);
      return false;
    }
  }
}

async function createArchivePackage() {
  try {
    console.log('\n=== 5. 创建归档包（应该自动将案件标记为已归档）===');
    const response = await axios.post(`${API_BASE}/archives/packages`, {
      case_id: testCaseId,
      archived_by: '测试管理员',
      notes: '测试归档保护机制'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ 归档包创建成功');
    console.log('   归档编号:', response.data.data.package.archive_number);
    console.log('   响应消息:', response.data.message);
    return true;
  } catch (error) {
    console.error('❌ 创建归档包失败:', error.response?.data || error.message);
    return false;
  }
}

async function verifyCaseArchived() {
  try {
    console.log('\n=== 6. 验证案件状态是否已自动更新为"已归档" ===');
    const response = await axios.get(`${API_BASE}/cases/${testCaseId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const status = response.data.data.case.status;
    if (status === '已归档') {
      console.log('✅ 验证通过: 案件状态已自动更新为"已归档"');
      return true;
    } else {
      console.log('❌ 验证失败: 案件状态为', status, '而不是"已归档"');
      return false;
    }
  } catch (error) {
    console.error('❌ 获取案件信息失败:', error.response?.data || error.message);
    return false;
  }
}

async function testModifyArchivedCase() {
  try {
    console.log('\n=== 7. 测试: 尝试修改已归档案件的状态 ===');
    await axios.put(`${API_BASE}/cases/${testCaseId}`, {
      status: '审理中'  // 尝试将已归档案件改为审理中
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('❌ 测试失败: 应该被拒绝但成功修改了');
    return false;
  } catch (error) {
    if (error.response?.status === 403) {
      console.log('✅ 测试通过: 正确拒绝了修改已归档案件的状态');
      console.log('   错误信息:', error.response.data.error.message);
      return true;
    } else {
      console.error('❌ 意外错误:', error.response?.data || error.message);
      return false;
    }
  }
}

async function checkCaseLog() {
  try {
    console.log('\n=== 8. 检查案件日志（验证自动归档记录）===');
    const response = await axios.get(`${API_BASE}/cases/${testCaseId}/logs`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const logs = response.data.data.logs;
    const archiveLog = logs.find(log => 
      log.action_type === 'CASE_STATUS_CHANGE' && 
      log.description.includes('自动标记为已归档')
    );
    
    if (archiveLog) {
      console.log('✅ 找到自动归档日志记录');
      console.log('   描述:', archiveLog.description);
      console.log('   数据:', JSON.stringify(archiveLog.data, null, 2));
      return true;
    } else {
      console.log('❌ 未找到自动归档日志记录');
      return false;
    }
  } catch (error) {
    console.error('❌ 获取案件日志失败:', error.response?.data || error.message);
    return false;
  }
}

async function cleanup() {
  try {
    console.log('\n=== 9. 清理测试数据 ===');
    // 注意: 实际环境中可能需要先删除归档包才能删除案件
    // 这里仅作演示
    console.log('   测试案件ID:', testCaseId);
    console.log('   (保留测试数据以便手动验证)');
    return true;
  } catch (error) {
    console.error('❌ 清理失败:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('========================================');
  console.log('   案件归档状态保护机制测试');
  console.log('========================================');
  
  const results = [];
  
  // 执行测试
  results.push(await login());
  if (!results[0]) {
    console.log('\n❌ 登录失败，无法继续测试');
    return;
  }
  
  results.push(await testCreateArchivedCase());
  results.push(await createNormalCase());
  if (!results[2]) {
    console.log('\n❌ 创建测试案件失败，无法继续测试');
    return;
  }
  
  results.push(await testManualArchive());
  results.push(await createArchivePackage());
  if (!results[4]) {
    console.log('\n❌ 创建归档包失败，无法继续测试');
    return;
  }
  
  results.push(await verifyCaseArchived());
  results.push(await testModifyArchivedCase());
  results.push(await checkCaseLog());
  results.push(await cleanup());
  
  // 统计结果
  console.log('\n========================================');
  console.log('   测试结果汇总');
  console.log('========================================');
  const passed = results.filter(r => r).length;
  const total = results.length;
  console.log(`总计: ${total} 项测试`);
  console.log(`通过: ${passed} 项`);
  console.log(`失败: ${total - passed} 项`);
  
  if (passed === total) {
    console.log('\n🎉 所有测试通过！归档状态保护机制工作正常。');
  } else {
    console.log('\n⚠️  部分测试失败，请检查实现。');
  }
  
  console.log('========================================\n');
}

// 运行测试
runTests().catch(error => {
  console.error('测试执行出错:', error);
  process.exit(1);
});
