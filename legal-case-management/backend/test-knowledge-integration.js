/**
 * 案例知识库集成测试
 * 测试知识库作为一级模块的所有功能
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
const TEST_USER = {
  username: 'testuser',
  password: 'password123'
};

let authToken = '';
let testKnowledgeId = null;

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  console.log(`\n${colors.blue}[测试] ${testName}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

// 登录获取 token
async function login() {
  logTest('用户登录');
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, TEST_USER);
    authToken = response.data.data.token;
    logSuccess('登录成功，获取到 token');
    return true;
  } catch (error) {
    logError(`登录失败: ${error.response?.data?.error?.message || error.message}`);
    return false;
  }
}

// 创建 axios 实例
function createAuthClient() {
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });
}

// 测试 1: 通过新 API 路径获取知识列表
async function testGetKnowledgeListNewAPI() {
  logTest('测试 1: 通过新 API 路径 /api/knowledge 获取知识列表');
  const client = createAuthClient();
  
  try {
    const response = await client.get('/knowledge', {
      params: { page: 1, limit: 10 }
    });
    
    if (response.data.data && Array.isArray(response.data.data.knowledge)) {
      logSuccess(`成功获取知识列表，共 ${response.data.data.knowledge.length} 条记录`);
      if (response.data.data.pagination) {
        logSuccess(`分页信息: 第 ${response.data.data.pagination.page} 页，共 ${response.data.data.pagination.total} 条`);
      }
      return true;
    } else {
      logError('返回数据格式不正确');
      return false;
    }
  } catch (error) {
    logError(`请求失败: ${error.response?.data?.error?.message || error.message}`);
    return false;
  }
}

// 测试 2: 通过旧 API 路径获取知识列表（向后兼容性）
async function testGetKnowledgeListOldAPI() {
  logTest('测试 2: 通过旧 API 路径 /api/archive/knowledge 获取知识列表（向后兼容）');
  const client = createAuthClient();
  
  try {
    const response = await client.get('/archive/knowledge', {
      params: { page: 1, limit: 10 }
    });
    
    if (response.data.data && Array.isArray(response.data.data.knowledge)) {
      logSuccess('旧 API 路径仍然可用，向后兼容性正常');
      return true;
    } else {
      logError('返回数据格式不正确');
      return false;
    }
  } catch (error) {
    logError(`请求失败: ${error.response?.data?.error?.message || error.message}`);
    return false;
  }
}

// 测试 3: 创建新的知识条目
async function testCreateKnowledge() {
  logTest('测试 3: 创建新的知识条目');
  const client = createAuthClient();
  
  const testData = {
    case_cause: '劳动争议',
    dispute_focus: '加班费计算标准',
    legal_issues: '劳动法第四十四条关于加班费的规定',
    case_result: '原告胜诉',
    key_evidence: '考勤记录、工资条、劳动合同',
    legal_basis: '《劳动法》第四十四条、《劳动合同法》第三十一条',
    case_analysis: '用人单位应当按照法定标准支付加班费',
    practical_significance: '明确了加班费计算标准，为类似案件提供参考',
    keywords: '加班费,劳动争议,工资',
    tags: '劳动法,加班,工资',
    win_rate_reference: '85%'
  };
  
  try {
    const response = await client.post('/knowledge', testData);
    
    if (response.status === 201 && response.data.message) {
      logSuccess('成功创建知识条目');
      
      // 如果响应中包含知识对象，使用它
      if (response.data.data && response.data.data.knowledge) {
        testKnowledgeId = response.data.data.knowledge.id;
        logSuccess(`ID: ${testKnowledgeId}`);
      } else {
        // 否则，通过列表查询获取最新创建的记录
        logWarning('响应中未包含知识对象，尝试从列表获取');
        const listResponse = await client.get('/knowledge', { params: { page: 1, limit: 1 } });
        if (listResponse.data.data.knowledge.length > 0) {
          testKnowledgeId = listResponse.data.data.knowledge[0].id;
          logSuccess(`从列表获取到 ID: ${testKnowledgeId}`);
        }
      }
      
      return true;
    } else {
      logError('返回数据格式不正确');
      console.log('响应数据:', JSON.stringify(response.data, null, 2));
      return false;
    }
  } catch (error) {
    logError(`创建失败: ${error.response?.data?.error?.message || error.message}`);
    if (error.response?.data) {
      console.log('错误响应:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

// 测试 4: 获取知识详情
async function testGetKnowledgeById() {
  logTest('测试 4: 获取知识详情');
  
  if (!testKnowledgeId) {
    logWarning('跳过测试：没有可用的测试知识 ID');
    return false;
  }
  
  const client = createAuthClient();
  
  try {
    const response = await client.get(`/knowledge/${testKnowledgeId}`);
    
    if (response.data.data && response.data.data.knowledge) {
      const knowledge = response.data.data.knowledge;
      logSuccess(`成功获取知识详情，ID: ${knowledge.id}`);
      logSuccess(`案由: ${knowledge.case_cause}`);
      logSuccess(`争议焦点: ${knowledge.dispute_focus}`);
      logSuccess(`法律依据: ${knowledge.legal_basis || '无'}`);
      return true;
    } else {
      logError('返回数据格式不正确');
      return false;
    }
  } catch (error) {
    logError(`获取失败: ${error.response?.data?.error?.message || error.message}`);
    return false;
  }
}

// 测试 5: 更新知识条目
async function testUpdateKnowledge() {
  logTest('测试 5: 更新知识条目');
  
  if (!testKnowledgeId) {
    logWarning('跳过测试：没有可用的测试知识 ID');
    return false;
  }
  
  const client = createAuthClient();
  
  const updateData = {
    case_analysis: '更新后的案例分析：用人单位应当按照法定标准支付加班费，包括平时加班、休息日加班和法定节假日加班',
    practical_significance: '更新后的实践意义：为类似劳动争议案件提供了明确的裁判标准',
    win_rate_reference: '90%'
  };
  
  try {
    const response = await client.put(`/knowledge/${testKnowledgeId}`, updateData);
    
    if (response.data.message) {
      logSuccess('成功更新知识条目');
      
      // 验证更新结果
      const verifyResponse = await client.get(`/knowledge/${testKnowledgeId}`);
      const updated = verifyResponse.data.data.knowledge;
      
      if (updated.case_analysis === updateData.case_analysis) {
        logSuccess('验证更新成功：案例分析已更新');
      }
      if (updated.win_rate_reference === updateData.win_rate_reference) {
        logSuccess('验证更新成功：胜率参考已更新');
      }
      
      return true;
    } else {
      logError('更新响应格式不正确');
      return false;
    }
  } catch (error) {
    logError(`更新失败: ${error.response?.data?.error?.message || error.message}`);
    return false;
  }
}

// 测试 6: 搜索和筛选功能
async function testSearchKnowledge() {
  logTest('测试 6: 搜索和筛选功能');
  const client = createAuthClient();
  
  try {
    // 测试按案由搜索
    log('  6.1 按案由搜索...', 'blue');
    const response1 = await client.get('/knowledge/search', {
      params: { case_cause: '劳动' }
    });
    
    if (response1.data.data && Array.isArray(response1.data.data.knowledge)) {
      logSuccess(`按案由搜索成功，找到 ${response1.data.data.knowledge.length} 条记录`);
    }
    
    // 测试按关键词搜索
    log('  6.2 按关键词搜索...', 'blue');
    const response2 = await client.get('/knowledge/search', {
      params: { keywords: '加班' }
    });
    
    if (response2.data.data && Array.isArray(response2.data.data.knowledge)) {
      logSuccess(`按关键词搜索成功，找到 ${response2.data.data.knowledge.length} 条记录`);
    }
    
    // 测试组合搜索
    log('  6.3 组合条件搜索...', 'blue');
    const response3 = await client.get('/knowledge/search', {
      params: { 
        case_cause: '劳动',
        keywords: '加班'
      }
    });
    
    if (response3.data.data && Array.isArray(response3.data.data.knowledge)) {
      logSuccess(`组合搜索成功，找到 ${response3.data.data.knowledge.length} 条记录`);
    }
    
    return true;
  } catch (error) {
    logError(`搜索失败: ${error.response?.data?.error?.message || error.message}`);
    return false;
  }
}

// 测试 7: 分页功能
async function testPagination() {
  logTest('测试 7: 分页功能');
  const client = createAuthClient();
  
  try {
    // 获取第一页
    log('  7.1 获取第一页...', 'blue');
    const page1 = await client.get('/knowledge', {
      params: { page: 1, limit: 5 }
    });
    
    if (page1.data.data.pagination) {
      const p = page1.data.data.pagination;
      logSuccess(`第一页: ${page1.data.data.knowledge.length} 条记录`);
      logSuccess(`分页信息: 第 ${p.page}/${p.totalPages} 页，共 ${p.total} 条`);
    }
    
    // 如果有多页，获取第二页
    if (page1.data.data.pagination.totalPages > 1) {
      log('  7.2 获取第二页...', 'blue');
      const page2 = await client.get('/knowledge', {
        params: { page: 2, limit: 5 }
      });
      
      if (page2.data.data.knowledge.length > 0) {
        logSuccess(`第二页: ${page2.data.data.knowledge.length} 条记录`);
      }
    } else {
      logWarning('数据不足，无法测试多页');
    }
    
    return true;
  } catch (error) {
    logError(`分页测试失败: ${error.response?.data?.error?.message || error.message}`);
    return false;
  }
}

// 测试 8: 删除知识条目
async function testDeleteKnowledge() {
  logTest('测试 8: 删除知识条目');
  
  if (!testKnowledgeId) {
    logWarning('跳过测试：没有可用的测试知识 ID');
    return false;
  }
  
  const client = createAuthClient();
  
  try {
    const response = await client.delete(`/knowledge/${testKnowledgeId}`);
    
    if (response.data.message) {
      logSuccess('成功删除知识条目');
      
      // 验证删除结果
      try {
        await client.get(`/knowledge/${testKnowledgeId}`);
        logError('删除验证失败：记录仍然存在');
        return false;
      } catch (error) {
        if (error.response?.status === 404) {
          logSuccess('验证删除成功：记录已不存在');
          return true;
        } else {
          logError(`删除验证失败: ${error.message}`);
          return false;
        }
      }
    } else {
      logError('删除响应格式不正确');
      return false;
    }
  } catch (error) {
    logError(`删除失败: ${error.response?.data?.error?.message || error.message}`);
    return false;
  }
}

// 测试 9: 必填字段验证
async function testRequiredFieldsValidation() {
  logTest('测试 9: 必填字段验证');
  const client = createAuthClient();
  
  try {
    // 尝试创建缺少必填字段的知识条目
    const invalidData = {
      case_cause: '测试案由'
      // 缺少 dispute_focus
    };
    
    await client.post('/knowledge', invalidData);
    logError('验证失败：应该拒绝缺少必填字段的请求');
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      logSuccess('必填字段验证正常：正确拒绝了无效请求');
      return true;
    } else {
      logError(`验证测试失败: ${error.message}`);
      return false;
    }
  }
}

// 测试 10: 认证保护
async function testAuthenticationProtection() {
  logTest('测试 10: 认证保护');
  
  try {
    // 不带 token 访问
    await axios.get(`${BASE_URL}/knowledge`);
    logError('认证保护失败：未认证请求应该被拒绝');
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      logSuccess('认证保护正常：未认证请求被正确拒绝');
      return true;
    } else {
      logError(`认证测试失败: ${error.message}`);
      return false;
    }
  }
}

// 主测试流程
async function runTests() {
  log('\n========================================', 'blue');
  log('案例知识库集成测试开始', 'blue');
  log('========================================\n', 'blue');
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };
  
  // 登录
  if (!await login()) {
    logError('登录失败，无法继续测试');
    return;
  }
  
  // 运行所有测试
  const tests = [
    { name: '新 API 路径获取列表', fn: testGetKnowledgeListNewAPI },
    { name: '旧 API 路径兼容性', fn: testGetKnowledgeListOldAPI },
    { name: '创建知识条目', fn: testCreateKnowledge },
    { name: '获取知识详情', fn: testGetKnowledgeById },
    { name: '更新知识条目', fn: testUpdateKnowledge },
    { name: '搜索和筛选', fn: testSearchKnowledge },
    { name: '分页功能', fn: testPagination },
    { name: '删除知识条目', fn: testDeleteKnowledge },
    { name: '必填字段验证', fn: testRequiredFieldsValidation },
    { name: '认证保护', fn: testAuthenticationProtection }
  ];
  
  for (const test of tests) {
    results.total++;
    const passed = await test.fn();
    if (passed) {
      results.passed++;
    } else {
      results.failed++;
    }
    
    // 测试之间稍作延迟
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // 输出测试总结
  log('\n========================================', 'blue');
  log('测试总结', 'blue');
  log('========================================', 'blue');
  log(`总测试数: ${results.total}`);
  log(`通过: ${results.passed}`, 'green');
  log(`失败: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log(`成功率: ${((results.passed / results.total) * 100).toFixed(2)}%`, 
      results.failed === 0 ? 'green' : 'yellow');
  log('========================================\n', 'blue');
  
  if (results.failed === 0) {
    log('✓ 所有测试通过！', 'green');
  } else {
    log(`✗ ${results.failed} 个测试失败`, 'red');
  }
}

// 运行测试
runTests().catch(error => {
  logError(`测试执行出错: ${error.message}`);
  console.error(error);
});
