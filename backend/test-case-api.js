/**
 * 测试案件管理 API
 * 这个脚本测试案件和诉讼主体的 CRUD 操作
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
let authToken = '';
let testCaseId = null;
let testPartyId = null;

// 创建 axios 实例
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 添加请求拦截器，自动添加 token
api.interceptors.request.use(config => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// 测试用户登录
async function testLogin() {
  console.log('\n=== 测试用户登录 ===');
  try {
    const response = await api.post('/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    authToken = response.data.data.token;
    console.log('✓ 登录成功');
    console.log('Token:', authToken.substring(0, 20) + '...');
    return true;
  } catch (error) {
    console.error('✗ 登录失败:', error.response?.data || error.message);
    return false;
  }
}

// 测试创建案件
async function testCreateCase() {
  console.log('\n=== 测试创建案件 ===');
  try {
    const response = await api.post('/cases', {
      case_type: '民事',
      case_cause: '合同纠纷',
      court: '北京市朝阳区人民法院',
      target_amount: 500000,
      filing_date: '2024-11-01',
      status: 'active'
    });
    testCaseId = response.data.data.case.id;
    console.log('✓ 案件创建成功');
    console.log('案件ID:', testCaseId);
    console.log('内部编号:', response.data.data.case.internal_number);
    return true;
  } catch (error) {
    console.error('✗ 创建案件失败:', error.response?.data || error.message);
    return false;
  }
}

// 测试获取案件列表
async function testGetCases() {
  console.log('\n=== 测试获取案件列表 ===');
  try {
    const response = await api.get('/cases?page=1&limit=10');
    console.log('✓ 获取案件列表成功');
    console.log('案件数量:', response.data.data.cases.length);
    console.log('总数:', response.data.data.pagination.total);
    return true;
  } catch (error) {
    console.error('✗ 获取案件列表失败:', error.response?.data || error.message);
    return false;
  }
}

// 测试获取案件详情
async function testGetCaseById() {
  console.log('\n=== 测试获取案件详情 ===');
  try {
    const response = await api.get(`/cases/${testCaseId}`);
    console.log('✓ 获取案件详情成功');
    console.log('案件类型:', response.data.data.case.case_type);
    console.log('案由:', response.data.data.case.case_cause);
    return true;
  } catch (error) {
    console.error('✗ 获取案件详情失败:', error.response?.data || error.message);
    return false;
  }
}

// 测试更新案件
async function testUpdateCase() {
  console.log('\n=== 测试更新案件 ===');
  try {
    const response = await api.put(`/cases/${testCaseId}`, {
      target_amount: 600000,
      status: 'in_progress'
    });
    console.log('✓ 案件更新成功');
    console.log('新标的额:', response.data.data.case.target_amount);
    console.log('新状态:', response.data.data.case.status);
    return true;
  } catch (error) {
    console.error('✗ 更新案件失败:', error.response?.data || error.message);
    return false;
  }
}

// 测试添加诉讼主体
async function testCreateParty() {
  console.log('\n=== 测试添加诉讼主体 ===');
  try {
    const response = await api.post(`/cases/${testCaseId}/parties`, {
      party_type: '原告',
      entity_type: '企业',
      name: '北京科技有限公司',
      unified_credit_code: '91110000123456789X',
      legal_representative: '张三',
      contact_phone: '13800138000',
      address: '北京市朝阳区某某街道'
    });
    testPartyId = response.data.data.party.id;
    console.log('✓ 诉讼主体添加成功');
    console.log('主体ID:', testPartyId);
    console.log('主体名称:', response.data.data.party.name);
    return true;
  } catch (error) {
    console.error('✗ 添加诉讼主体失败:', error.response?.data || error.message);
    return false;
  }
}

// 测试获取诉讼主体列表
async function testGetParties() {
  console.log('\n=== 测试获取诉讼主体列表 ===');
  try {
    const response = await api.get(`/cases/${testCaseId}/parties`);
    console.log('✓ 获取诉讼主体列表成功');
    console.log('主体数量:', response.data.data.parties.length);
    return true;
  } catch (error) {
    console.error('✗ 获取诉讼主体列表失败:', error.response?.data || error.message);
    return false;
  }
}

// 测试更新诉讼主体
async function testUpdateParty() {
  console.log('\n=== 测试更新诉讼主体 ===');
  try {
    const response = await api.put(`/parties/${testPartyId}`, {
      contact_phone: '13900139000',
      contact_email: 'contact@example.com'
    });
    console.log('✓ 诉讼主体更新成功');
    console.log('新电话:', response.data.data.party.contact_phone);
    console.log('新邮箱:', response.data.data.party.contact_email);
    return true;
  } catch (error) {
    console.error('✗ 更新诉讼主体失败:', error.response?.data || error.message);
    return false;
  }
}

// 测试查询主体历史案件
async function testGetPartyHistory() {
  console.log('\n=== 测试查询主体历史案件 ===');
  try {
    const response = await api.get('/parties/history?name=北京科技有限公司');
    console.log('✓ 查询主体历史案件成功');
    console.log('历史案件数量:', response.data.data.total);
    return true;
  } catch (error) {
    console.error('✗ 查询主体历史案件失败:', error.response?.data || error.message);
    return false;
  }
}

// 测试搜索案件
async function testSearchCases() {
  console.log('\n=== 测试搜索案件 ===');
  try {
    const response = await api.get('/cases?search=合同');
    console.log('✓ 搜索案件成功');
    console.log('搜索结果数量:', response.data.data.cases.length);
    return true;
  } catch (error) {
    console.error('✗ 搜索案件失败:', error.response?.data || error.message);
    return false;
  }
}

// 清理测试数据
async function cleanup() {
  console.log('\n=== 清理测试数据 ===');
  try {
    // 删除诉讼主体
    if (testPartyId) {
      await api.delete(`/parties/${testPartyId}`);
      console.log('✓ 诉讼主体删除成功');
    }
    
    // 删除案件
    if (testCaseId) {
      await api.delete(`/cases/${testCaseId}`);
      console.log('✓ 案件删除成功');
    }
    return true;
  } catch (error) {
    console.error('✗ 清理失败:', error.response?.data || error.message);
    return false;
  }
}

// 运行所有测试
async function runTests() {
  console.log('开始测试案件管理 API...');
  
  const tests = [
    testLogin,
    testCreateCase,
    testGetCases,
    testGetCaseById,
    testUpdateCase,
    testCreateParty,
    testGetParties,
    testUpdateParty,
    testGetPartyHistory,
    testSearchCases,
    cleanup
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = await test();
    if (result) {
      passed++;
    } else {
      failed++;
    }
    // 等待一小段时间，避免请求过快
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n=== 测试结果 ===');
  console.log(`通过: ${passed}`);
  console.log(`失败: ${failed}`);
  console.log(`总计: ${passed + failed}`);
}

// 启动测试
runTests().catch(error => {
  console.error('测试执行出错:', error);
  process.exit(1);
});

