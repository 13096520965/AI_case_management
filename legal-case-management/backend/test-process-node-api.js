/**
 * 流程节点 API 测试脚本
 * 
 * 使用方法:
 * 1. 确保后端服务正在运行 (npm run dev)
 * 2. 运行此脚本: node test-process-node-api.js
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';
let authToken = '';
let testCaseId = null;
let testNodeId = null;
let testTemplateId = null;

// 创建 axios 实例
const api = axios.create({
  baseURL: API_BASE_URL,
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
 * 测试用户登录
 */
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

/**
 * 创建测试案件
 */
async function createTestCase() {
  console.log('\n=== 创建测试案件 ===');
  try {
    const response = await api.post('/cases', {
      case_number: '(2024)京0101民初' + Date.now(),
      case_type: '民事',
      case_cause: '合同纠纷',
      court: '北京市东城区人民法院',
      target_amount: 100000,
      filing_date: '2024-01-15'
    });
    
    testCaseId = response.data.data.case.id;
    console.log('✓ 案件创建成功');
    console.log('案件ID:', testCaseId);
    return true;
  } catch (error) {
    console.error('✗ 创建案件失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试创建流程节点
 */
async function testCreateNode() {
  console.log('\n=== 测试创建流程节点 ===');
  try {
    const response = await api.post(`/cases/${testCaseId}/nodes`, {
      node_type: '立案',
      node_name: '立案受理',
      handler: '张法官',
      start_time: new Date().toISOString(),
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      node_order: 1,
      progress: '案件已受理，等待分配法官'
    });
    
    testNodeId = response.data.data.node.id;
    console.log('✓ 流程节点创建成功');
    console.log('节点ID:', testNodeId);
    console.log('节点名称:', response.data.data.node.node_name);
    console.log('节点状态:', response.data.data.node.status);
    return true;
  } catch (error) {
    console.error('✗ 创建流程节点失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试获取流程节点列表
 */
async function testGetNodes() {
  console.log('\n=== 测试获取流程节点列表 ===');
  try {
    const response = await api.get(`/cases/${testCaseId}/nodes`);
    
    console.log('✓ 获取流程节点列表成功');
    console.log('节点数量:', response.data.data.nodes.length);
    response.data.data.nodes.forEach(node => {
      console.log(`  - ${node.node_name} (${node.status})`);
    });
    return true;
  } catch (error) {
    console.error('✗ 获取流程节点列表失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试更新节点状态
 */
async function testUpdateNode() {
  console.log('\n=== 测试更新节点状态 ===');
  try {
    const response = await api.put(`/nodes/${testNodeId}`, {
      status: 'in_progress',
      progress: '法官已分配，开始审理'
    });
    
    console.log('✓ 节点状态更新成功');
    console.log('更新后状态:', response.data.data.node.status);
    console.log('进展:', response.data.data.node.progress);
    return true;
  } catch (error) {
    console.error('✗ 更新节点状态失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试初始化默认模板
 */
async function testInitializeTemplates() {
  console.log('\n=== 测试初始化默认模板 ===');
  try {
    const response = await api.post('/templates/initialize');
    
    console.log('✓ 默认模板初始化成功');
    console.log('消息:', response.data.message);
    return true;
  } catch (error) {
    console.error('✗ 初始化默认模板失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试获取流程模板列表
 */
async function testGetTemplates() {
  console.log('\n=== 测试获取流程模板列表 ===');
  try {
    const response = await api.get('/templates');
    
    console.log('✓ 获取流程模板列表成功');
    console.log('模板数量:', response.data.data.templates.length);
    response.data.data.templates.forEach(template => {
      console.log(`  - ${template.template_name} (${template.case_type}) ${template.is_default ? '[默认]' : ''}`);
      if (template.case_type === '民事' && template.is_default) {
        testTemplateId = template.id;
      }
    });
    return true;
  } catch (error) {
    console.error('✗ 获取流程模板列表失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试获取模板详情
 */
async function testGetTemplateDetail() {
  console.log('\n=== 测试获取模板详情 ===');
  try {
    const response = await api.get(`/templates/${testTemplateId}`);
    
    console.log('✓ 获取模板详情成功');
    console.log('模板名称:', response.data.data.template.template_name);
    console.log('节点数量:', response.data.data.template.nodes.length);
    console.log('节点列表:');
    response.data.data.template.nodes.forEach(node => {
      console.log(`  ${node.node_order}. ${node.node_name} (${node.deadline_days}天)`);
    });
    return true;
  } catch (error) {
    console.error('✗ 获取模板详情失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试应用流程模板
 */
async function testApplyTemplate() {
  console.log('\n=== 测试应用流程模板 ===');
  try {
    // 创建新案件用于测试模板应用
    const caseResponse = await api.post('/cases', {
      case_number: '(2024)京0102民初' + Date.now(),
      case_type: '民事',
      case_cause: '借款纠纷',
      court: '北京市朝阳区人民法院',
      target_amount: 50000,
      filing_date: '2024-01-20'
    });
    
    const newCaseId = caseResponse.data.data.case.id;
    console.log('创建新案件ID:', newCaseId);
    
    // 应用模板
    const response = await api.post(`/templates/apply/${newCaseId}`, {
      case_type: '民事'
    });
    
    console.log('✓ 流程模板应用成功');
    console.log('创建的节点数量:', response.data.data.nodes.length);
    response.data.data.nodes.forEach(node => {
      console.log(`  ${node.node_order}. ${node.node_name} - 截止: ${node.deadline || '无'}`);
    });
    return true;
  } catch (error) {
    console.error('✗ 应用流程模板失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试节点状态计算
 */
async function testNodeStatusCalculation() {
  console.log('\n=== 测试节点状态计算 ===');
  try {
    // 创建一个超期节点
    const overdueResponse = await api.post(`/cases/${testCaseId}/nodes`, {
      node_type: '举证',
      node_name: '举证期限',
      handler: '李律师',
      start_time: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      node_order: 2
    });
    
    const overdueNodeId = overdueResponse.data.data.node.id;
    console.log('创建超期节点ID:', overdueNodeId);
    
    // 获取节点详情（包含超期信息）
    const detailResponse = await api.get(`/nodes/${overdueNodeId}/detail`);
    
    console.log('✓ 节点状态计算成功');
    console.log('节点名称:', detailResponse.data.data.node.node_name);
    console.log('当前状态:', detailResponse.data.data.node.status);
    console.log('计算状态:', detailResponse.data.data.node.calculatedStatus);
    console.log('是否超期:', detailResponse.data.data.node.overdueInfo.isOverdue);
    console.log('超期天数:', detailResponse.data.data.node.overdueInfo.overdueDays);
    return true;
  } catch (error) {
    console.error('✗ 节点状态计算失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试获取超期节点统计
 */
async function testOverdueStatistics() {
  console.log('\n=== 测试获取超期节点统计 ===');
  try {
    const response = await api.get('/nodes/overdue/statistics');
    
    console.log('✓ 获取超期节点统计成功');
    console.log('超期节点总数:', response.data.data.total);
    console.log('涉及案件数:', response.data.data.affectedCases);
    return true;
  } catch (error) {
    console.error('✗ 获取超期节点统计失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试更新所有节点状态
 */
async function testUpdateAllNodesStatus() {
  console.log('\n=== 测试更新所有节点状态 ===');
  try {
    const response = await api.post('/nodes/update-status');
    
    console.log('✓ 更新所有节点状态成功');
    console.log('更新数量:', response.data.data.updated);
    return true;
  } catch (error) {
    console.error('✗ 更新所有节点状态失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('========================================');
  console.log('流程节点管理 API 测试');
  console.log('========================================');
  
  // 登录
  if (!await testLogin()) {
    console.log('\n测试终止：登录失败');
    return;
  }
  
  // 创建测试案件
  if (!await createTestCase()) {
    console.log('\n测试终止：创建案件失败');
    return;
  }
  
  // 测试流程节点 CRUD
  await testCreateNode();
  await testGetNodes();
  await testUpdateNode();
  
  // 测试流程模板
  await testInitializeTemplates();
  await testGetTemplates();
  if (testTemplateId) {
    await testGetTemplateDetail();
    await testApplyTemplate();
  }
  
  // 测试节点状态计算
  await testNodeStatusCalculation();
  await testOverdueStatistics();
  await testUpdateAllNodesStatus();
  
  console.log('\n========================================');
  console.log('测试完成');
  console.log('========================================');
}

// 运行测试
runAllTests().catch(error => {
  console.error('测试执行出错:', error);
  process.exit(1);
});
