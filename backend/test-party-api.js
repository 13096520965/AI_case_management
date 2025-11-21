/**
 * 诉讼主体管理 API 测试脚本
 * 测试所有诉讼主体相关的接口
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

/**
 * 用户登录
 */
async function login() {
  console.log('\n=== 1. 用户登录 ===');
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

/**
 * 创建测试案件
 */
async function createTestCase() {
  console.log('\n=== 2. 创建测试案件 ===');
  try {
    const response = await api.post('/cases', {
      case_number: 'TEST-PARTY-' + Date.now(),
      case_type: '民事',
      case_cause: '合同纠纷',
      court: '测试法院',
      target_amount: 100000,
      filing_date: '2024-01-15',
      status: 'active'
    });
    
    testCaseId = response.data.data.case.id;
    console.log('✓ 案件创建成功');
    console.log('案件 ID:', testCaseId);
    console.log('案号:', response.data.data.case.case_number);
    return true;
  } catch (error) {
    console.error('✗ 创建案件失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试添加诉讼主体 - 企业原告
 */
async function testCreatePartyCompany() {
  console.log('\n=== 3. 添加诉讼主体（企业原告）===');
  try {
    const response = await api.post(`/cases/${testCaseId}/parties`, {
      party_type: '原告',
      entity_type: '企业',
      name: '测试科技有限公司',
      unified_credit_code: '91110000MA01234567',
      legal_representative: '张三',
      contact_phone: '010-12345678',
      contact_email: 'test@company.com',
      address: '北京市朝阳区测试路123号'
    });
    
    testPartyId = response.data.data.party.id;
    console.log('✓ 企业主体添加成功');
    console.log('主体 ID:', testPartyId);
    console.log('主体名称:', response.data.data.party.name);
    console.log('主体类型:', response.data.data.party.party_type);
    return true;
  } catch (error) {
    console.error('✗ 添加企业主体失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试添加诉讼主体 - 个人被告
 */
async function testCreatePartyIndividual() {
  console.log('\n=== 4. 添加诉讼主体（个人被告）===');
  try {
    const response = await api.post(`/cases/${testCaseId}/parties`, {
      party_type: '被告',
      entity_type: '个人',
      name: '李四',
      id_number: '110101199001011234',
      contact_phone: '13800138000',
      address: '北京市海淀区测试街456号'
    });
    
    console.log('✓ 个人主体添加成功');
    console.log('主体 ID:', response.data.data.party.id);
    console.log('主体名称:', response.data.data.party.name);
    console.log('主体类型:', response.data.data.party.party_type);
    return true;
  } catch (error) {
    console.error('✗ 添加个人主体失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试获取诉讼主体列表
 */
async function testGetPartiesByCaseId() {
  console.log('\n=== 5. 获取诉讼主体列表 ===');
  try {
    const response = await api.get(`/cases/${testCaseId}/parties`);
    
    const parties = response.data.data.parties;
    console.log('✓ 获取主体列表成功');
    console.log('主体数量:', parties.length);
    parties.forEach((party, index) => {
      console.log(`\n主体 ${index + 1}:`);
      console.log('  ID:', party.id);
      console.log('  名称:', party.name);
      console.log('  类型:', party.party_type);
      console.log('  实体类型:', party.entity_type);
    });
    return true;
  } catch (error) {
    console.error('✗ 获取主体列表失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试更新诉讼主体
 */
async function testUpdateParty() {
  console.log('\n=== 6. 更新诉讼主体 ===');
  try {
    const response = await api.put(`/parties/${testPartyId}`, {
      contact_phone: '010-87654321',
      contact_email: 'updated@company.com',
      address: '北京市朝阳区更新路999号'
    });
    
    console.log('✓ 主体更新成功');
    console.log('更新后的联系电话:', response.data.data.party.contact_phone);
    console.log('更新后的邮箱:', response.data.data.party.contact_email);
    console.log('更新后的地址:', response.data.data.party.address);
    return true;
  } catch (error) {
    console.error('✗ 更新主体失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试查询主体历史案件
 */
async function testGetPartyHistory() {
  console.log('\n=== 7. 查询主体历史案件 ===');
  try {
    // 先创建另一个案件，使用相同的主体名称
    const case2Response = await api.post('/cases', {
      case_number: 'TEST-HISTORY-' + Date.now(),
      case_type: '民事',
      case_cause: '借款纠纷',
      court: '测试法院',
      target_amount: 50000,
      filing_date: '2024-02-01',
      status: 'active'
    });
    
    const case2Id = case2Response.data.data.case.id;
    
    // 在第二个案件中添加相同名称的主体
    await api.post(`/cases/${case2Id}/parties`, {
      party_type: '被告',
      entity_type: '企业',
      name: '测试科技有限公司',
      unified_credit_code: '91110000MA01234567',
      legal_representative: '张三'
    });
    
    // 查询历史案件
    const response = await api.get('/parties/history', {
      params: { name: '测试科技有限公司' }
    });
    
    console.log('✓ 查询历史案件成功');
    console.log('主体名称:', response.data.data.name);
    console.log('历史案件数量:', response.data.data.total);
    response.data.data.cases.forEach((caseItem, index) => {
      console.log(`\n案件 ${index + 1}:`);
      console.log('  案号:', caseItem.case_number);
      console.log('  案由:', caseItem.case_cause);
      console.log('  标的额:', caseItem.target_amount);
    });
    return true;
  } catch (error) {
    console.error('✗ 查询历史案件失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试删除诉讼主体
 */
async function testDeleteParty() {
  console.log('\n=== 8. 删除诉讼主体 ===');
  try {
    const response = await api.delete(`/parties/${testPartyId}`);
    
    console.log('✓ 主体删除成功');
    console.log('响应消息:', response.data.message);
    
    // 验证删除后无法再获取
    try {
      await api.get(`/cases/${testCaseId}/parties`);
      const parties = (await api.get(`/cases/${testCaseId}/parties`)).data.data.parties;
      console.log('删除后剩余主体数量:', parties.length);
    } catch (error) {
      console.log('验证删除失败');
    }
    
    return true;
  } catch (error) {
    console.error('✗ 删除主体失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试错误处理
 */
async function testErrorHandling() {
  console.log('\n=== 9. 测试错误处理 ===');
  
  // 测试不存在的案件
  console.log('\n9.1 测试添加主体到不存在的案件:');
  try {
    await api.post('/cases/99999/parties', {
      party_type: '原告',
      entity_type: '企业',
      name: '测试公司'
    });
    console.log('✗ 应该返回错误但成功了');
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('✓ 正确返回 404 错误');
    } else {
      console.log('✗ 错误状态码不正确:', error.response?.status);
    }
  }
  
  // 测试缺少必填字段
  console.log('\n9.2 测试缺少必填字段:');
  try {
    await api.post(`/cases/${testCaseId}/parties`, {
      party_type: '原告'
      // 缺少 entity_type 和 name
    });
    console.log('✗ 应该返回错误但成功了');
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✓ 正确返回 400 错误');
      console.log('错误消息:', error.response.data.error.message);
    } else {
      console.log('✗ 错误状态码不正确:', error.response?.status);
    }
  }
  
  // 测试更新不存在的主体
  console.log('\n9.3 测试更新不存在的主体:');
  try {
    await api.put('/parties/99999', {
      contact_phone: '123456'
    });
    console.log('✗ 应该返回错误但成功了');
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('✓ 正确返回 404 错误');
    } else {
      console.log('✗ 错误状态码不正确:', error.response?.status);
    }
  }
  
  // 测试删除不存在的主体
  console.log('\n9.4 测试删除不存在的主体:');
  try {
    await api.delete('/parties/99999');
    console.log('✗ 应该返回错误但成功了');
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('✓ 正确返回 404 错误');
    } else {
      console.log('✗ 错误状态码不正确:', error.response?.status);
    }
  }
  
  return true;
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('========================================');
  console.log('   诉讼主体管理 API 测试');
  console.log('========================================');
  
  const tests = [
    { name: '登录', fn: login },
    { name: '创建测试案件', fn: createTestCase },
    { name: '添加企业主体', fn: testCreatePartyCompany },
    { name: '添加个人主体', fn: testCreatePartyIndividual },
    { name: '获取主体列表', fn: testGetPartiesByCaseId },
    { name: '更新主体', fn: testUpdateParty },
    { name: '查询历史案件', fn: testGetPartyHistory },
    { name: '删除主体', fn: testDeleteParty },
    { name: '错误处理', fn: testErrorHandling }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`\n✗ 测试 "${test.name}" 抛出异常:`, error.message);
      failed++;
    }
  }
  
  console.log('\n========================================');
  console.log('   测试结果汇总');
  console.log('========================================');
  console.log(`总测试数: ${tests.length}`);
  console.log(`通过: ${passed}`);
  console.log(`失败: ${failed}`);
  console.log('========================================\n');
  
  process.exit(failed > 0 ? 1 : 0);
}

// 运行测试
runAllTests().catch(error => {
  console.error('测试执行失败:', error);
  process.exit(1);
});
