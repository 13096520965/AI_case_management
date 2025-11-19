/**
 * 测试流程节点 CRUD API
 * 测试任务 7.1 的所有接口
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
let authToken = '';
let testCaseId = null;
let testNodeId = null;

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
  try {
    console.log('\n=== 1. 用户登录 ===');
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
  try {
    console.log('\n=== 2. 创建测试案件 ===');
    const response = await api.post('/cases', {
      case_type: '民事',
      case_cause: '合同纠纷',
      court: '北京市朝阳区人民法院',
      target_amount: 100000,
      filing_date: '2024-01-15',
      status: 'active'
    });
    
    testCaseId = response.data.data.case.id;
    console.log('✓ 案件创建成功');
    console.log('案件 ID:', testCaseId);
    console.log('案件编号:', response.data.data.case.internal_number);
    return true;
  } catch (error) {
    console.error('✗ 创建案件失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试创建流程节点 - POST /api/cases/:caseId/nodes
 */
async function testCreateNode() {
  try {
    console.log('\n=== 3. 创建流程节点 (POST /api/cases/:caseId/nodes) ===');
    const response = await api.post(`/cases/${testCaseId}/nodes`, {
      node_type: '立案',
      node_name: '提交立案材料',
      handler: '张律师',
      start_time: '2024-01-15 09:00:00',
      deadline: '2024-01-20 17:00:00',
      status: 'in_progress',
      progress: '已准备立案材料，待提交',
      node_order: 1
    });
    
    testNodeId = response.data.data.node.id;
    console.log('✓ 流程节点创建成功');
    console.log('节点 ID:', testNodeId);
    console.log('节点名称:', response.data.data.node.node_name);
    console.log('节点类型:', response.data.data.node.node_type);
    console.log('处理人:', response.data.data.node.handler);
    return true;
  } catch (error) {
    console.error('✗ 创建流程节点失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试获取流程节点列表 - GET /api/cases/:caseId/nodes
 */
async function testGetNodes() {
  try {
    console.log('\n=== 4. 获取流程节点列表 (GET /api/cases/:caseId/nodes) ===');
    
    // 创建第二个节点
    await api.post(`/cases/${testCaseId}/nodes`, {
      node_type: '开庭',
      node_name: '第一次庭审',
      handler: '李律师',
      start_time: '2024-02-01 14:00:00',
      deadline: '2024-02-01 17:00:00',
      status: 'pending',
      progress: '等待开庭通知',
      node_order: 2
    });
    
    const response = await api.get(`/cases/${testCaseId}/nodes`);
    
    console.log('✓ 获取流程节点列表成功');
    console.log('节点总数:', response.data.data.nodes.length);
    response.data.data.nodes.forEach((node, index) => {
      console.log(`\n节点 ${index + 1}:`);
      console.log('  ID:', node.id);
      console.log('  名称:', node.node_name);
      console.log('  类型:', node.node_type);
      console.log('  状态:', node.status);
      console.log('  处理人:', node.handler);
    });
    return true;
  } catch (error) {
    console.error('✗ 获取流程节点列表失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试更新节点状态 - PUT /api/nodes/:id
 */
async function testUpdateNode() {
  try {
    console.log('\n=== 5. 更新节点状态 (PUT /api/nodes/:id) ===');
    const response = await api.put(`/nodes/${testNodeId}`, {
      status: 'completed',
      completion_time: '2024-01-18 15:30:00',
      progress: '立案材料已提交，法院已受理'
    });
    
    console.log('✓ 节点状态更新成功');
    console.log('节点 ID:', response.data.data.node.id);
    console.log('更新后状态:', response.data.data.node.status);
    console.log('完成时间:', response.data.data.node.completion_time);
    console.log('进展:', response.data.data.node.progress);
    return true;
  } catch (error) {
    console.error('✗ 更新节点状态失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试删除节点 - DELETE /api/nodes/:id
 */
async function testDeleteNode() {
  try {
    console.log('\n=== 6. 删除节点 (DELETE /api/nodes/:id) ===');
    
    // 先创建一个临时节点用于删除测试
    const createResponse = await api.post(`/cases/${testCaseId}/nodes`, {
      node_type: '测试',
      node_name: '临时测试节点',
      handler: '测试人员',
      start_time: '2024-01-01 09:00:00',
      deadline: '2024-01-02 17:00:00',
      status: 'pending',
      node_order: 99
    });
    
    const tempNodeId = createResponse.data.data.node.id;
    console.log('创建临时节点 ID:', tempNodeId);
    
    // 删除节点
    const deleteResponse = await api.delete(`/nodes/${tempNodeId}`);
    
    console.log('✓ 节点删除成功');
    console.log('删除消息:', deleteResponse.data.message);
    
    // 验证节点已被删除
    try {
      await api.get(`/nodes/${tempNodeId}/detail`);
      console.log('✗ 警告: 节点仍然存在');
      return false;
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✓ 验证通过: 节点已被删除');
        return true;
      }
      throw error;
    }
  } catch (error) {
    console.error('✗ 删除节点失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('========================================');
  console.log('流程节点 CRUD API 测试');
  console.log('任务 7.1: 实现流程节点 CRUD 接口');
  console.log('========================================');
  
  const results = {
    login: false,
    createCase: false,
    createNode: false,
    getNodes: false,
    updateNode: false,
    deleteNode: false
  };
  
  // 执行测试
  results.login = await login();
  if (!results.login) {
    console.log('\n✗ 登录失败，无法继续测试');
    return;
  }
  
  results.createCase = await createTestCase();
  if (!results.createCase) {
    console.log('\n✗ 创建测试案件失败，无法继续测试');
    return;
  }
  
  results.createNode = await testCreateNode();
  results.getNodes = await testGetNodes();
  results.updateNode = await testUpdateNode();
  results.deleteNode = await testDeleteNode();
  
  // 输出测试结果
  console.log('\n========================================');
  console.log('测试结果汇总');
  console.log('========================================');
  console.log('1. 用户登录:', results.login ? '✓ 通过' : '✗ 失败');
  console.log('2. 创建测试案件:', results.createCase ? '✓ 通过' : '✗ 失败');
  console.log('3. POST /api/cases/:caseId/nodes:', results.createNode ? '✓ 通过' : '✗ 失败');
  console.log('4. GET /api/cases/:caseId/nodes:', results.getNodes ? '✓ 通过' : '✗ 失败');
  console.log('5. PUT /api/nodes/:id:', results.updateNode ? '✓ 通过' : '✗ 失败');
  console.log('6. DELETE /api/nodes/:id:', results.deleteNode ? '✓ 通过' : '✗ 失败');
  
  const allPassed = Object.values(results).every(result => result === true);
  
  console.log('\n========================================');
  if (allPassed) {
    console.log('✓ 所有测试通过！任务 7.1 实现完成。');
  } else {
    console.log('✗ 部分测试失败，请检查实现。');
  }
  console.log('========================================\n');
}

// 运行测试
runAllTests().catch(error => {
  console.error('测试执行出错:', error);
  process.exit(1);
});
