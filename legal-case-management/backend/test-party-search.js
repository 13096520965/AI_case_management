/**
 * 测试按当事人搜索案件功能
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

// 测试用户凭证（需要先登录获取token）
let authToken = '';

/**
 * 登录获取token
 */
async function login() {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    if (response.data && response.data.data && response.data.data.token) {
      authToken = response.data.data.token;
      console.log('✓ 登录成功');
      return true;
    }
    return false;
  } catch (error) {
    console.error('✗ 登录失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试获取案件列表（不带当事人筛选）
 */
async function testGetCasesWithoutParty() {
  try {
    console.log('\n--- 测试1: 获取案件列表（不带当事人筛选） ---');
    const response = await axios.get(`${API_BASE_URL}/cases`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      },
      params: {
        page: 1,
        limit: 10
      }
    });
    
    console.log('✓ 请求成功');
    console.log(`  总案件数: ${response.data.data.pagination.total}`);
    console.log(`  返回案件数: ${response.data.data.cases.length}`);
    
    if (response.data.data.cases.length > 0) {
      const firstCase = response.data.data.cases[0];
      console.log(`  第一个案件: ${firstCase.internal_number} - ${firstCase.case_cause}`);
    }
    
    return true;
  } catch (error) {
    console.error('✗ 请求失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试按当事人搜索案件
 */
async function testSearchByPartyName(partyName) {
  try {
    console.log(`\n--- 测试2: 按当事人搜索案件 (当事人: "${partyName}") ---`);
    const response = await axios.get(`${API_BASE_URL}/cases`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      },
      params: {
        page: 1,
        limit: 10,
        party_name: partyName
      }
    });
    
    console.log('✓ 请求成功');
    console.log(`  匹配案件数: ${response.data.data.pagination.total}`);
    console.log(`  返回案件数: ${response.data.data.cases.length}`);
    
    if (response.data.data.cases.length > 0) {
      console.log('  匹配的案件:');
      response.data.data.cases.forEach((caseItem, index) => {
        console.log(`    ${index + 1}. ${caseItem.internal_number} - ${caseItem.case_cause}`);
      });
    } else {
      console.log('  未找到匹配的案件');
    }
    
    return true;
  } catch (error) {
    console.error('✗ 请求失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试组合搜索（关键词 + 当事人）
 */
async function testCombinedSearch(keyword, partyName) {
  try {
    console.log(`\n--- 测试3: 组合搜索 (关键词: "${keyword}", 当事人: "${partyName}") ---`);
    const response = await axios.get(`${API_BASE_URL}/cases`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      },
      params: {
        page: 1,
        limit: 10,
        search: keyword,
        party_name: partyName
      }
    });
    
    console.log('✓ 请求成功');
    console.log(`  匹配案件数: ${response.data.data.pagination.total}`);
    console.log(`  返回案件数: ${response.data.data.cases.length}`);
    
    if (response.data.data.cases.length > 0) {
      console.log('  匹配的案件:');
      response.data.data.cases.forEach((caseItem, index) => {
        console.log(`    ${index + 1}. ${caseItem.internal_number} - ${caseItem.case_cause}`);
      });
    } else {
      console.log('  未找到匹配的案件');
    }
    
    return true;
  } catch (error) {
    console.error('✗ 请求失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试按案件类型和当事人搜索
 */
async function testSearchByCaseTypeAndParty(caseType, partyName) {
  try {
    console.log(`\n--- 测试4: 按案件类型和当事人搜索 (类型: "${caseType}", 当事人: "${partyName}") ---`);
    const response = await axios.get(`${API_BASE_URL}/cases`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      },
      params: {
        page: 1,
        limit: 10,
        case_type: caseType,
        party_name: partyName
      }
    });
    
    console.log('✓ 请求成功');
    console.log(`  匹配案件数: ${response.data.data.pagination.total}`);
    console.log(`  返回案件数: ${response.data.data.cases.length}`);
    
    if (response.data.data.cases.length > 0) {
      console.log('  匹配的案件:');
      response.data.data.cases.forEach((caseItem, index) => {
        console.log(`    ${index + 1}. ${caseItem.internal_number} - ${caseItem.case_type} - ${caseItem.case_cause}`);
      });
    } else {
      console.log('  未找到匹配的案件');
    }
    
    return true;
  } catch (error) {
    console.error('✗ 请求失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 主测试函数
 */
async function runTests() {
  console.log('========================================');
  console.log('  按当事人搜索案件功能测试');
  console.log('========================================');
  
  // 登录
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.error('\n测试终止: 登录失败');
    return;
  }
  
  // 测试1: 获取案件列表（不带当事人筛选）
  await testGetCasesWithoutParty();
  
  // 测试2: 按当事人搜索（使用常见姓名进行测试）
  await testSearchByPartyName('张三');
  await testSearchByPartyName('李四');
  await testSearchByPartyName('公司');
  
  // 测试3: 组合搜索
  await testCombinedSearch('劳动', '张三');
  
  // 测试4: 按案件类型和当事人搜索
  await testSearchByCaseTypeAndParty('民事', '张三');
  
  console.log('\n========================================');
  console.log('  测试完成');
  console.log('========================================');
}

// 运行测试
runTests().catch(error => {
  console.error('测试执行出错:', error);
  process.exit(1);
});
