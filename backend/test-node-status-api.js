/**
 * 测试节点状态计算 API 集成
 * 
 * 测试以下 API 端点：
 * 1. GET /api/cases/:caseId/nodes?updateStatus=true - 获取并更新节点状态
 * 2. POST /api/nodes/update-status - 批量更新所有节点状态
 * 3. GET /api/nodes/overdue/statistics - 获取超期节点统计
 * 4. GET /api/nodes/upcoming?days=3 - 获取即将到期的节点
 * 5. GET /api/nodes/:id/detail - 获取节点详情（包含超期信息）
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
let authToken = '';
let testCaseId = null;
let testNodeId = null;

// 辅助函数：登录获取 token
async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'testuser',
      password: 'password123'
    });
    authToken = response.data.data.token;
    console.log('✓ 登录成功\n');
    return true;
  } catch (error) {
    console.error('✗ 登录失败:', error.response?.data || error.message);
    return false;
  }
}

// 辅助函数：创建测试案件
async function createTestCase() {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/cases`,
      {
        case_type: '民事',
        case_cause: '合同纠纷',
        court: '测试法院',
        target_amount: 100000,
        filing_date: '2024-11-01',
        status: 'active'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    testCaseId = response.data.data.case.id;
    console.log(`✓ 创建测试案件成功 (ID: ${testCaseId})\n`);
    return true;
  } catch (error) {
    console.error('✗ 创建测试案件失败:', error.response?.data || error.message);
    return false;
  }
}

// 辅助函数：创建测试节点
async function createTestNodes() {
  try {
    // 创建一个超期节点
    const overdueResponse = await axios.post(
      `${BASE_URL}/api/cases/${testCaseId}/nodes`,
      {
        node_type: '立案',
        node_name: '立案审查',
        handler: '张法官',
        start_time: '2024-10-01 09:00:00',
        deadline: '2024-10-10 17:00:00',
        status: 'in_progress',
        node_order: 1
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    testNodeId = overdueResponse.data.data.node.id;
    console.log(`✓ 创建超期节点成功 (ID: ${testNodeId})`);

    // 创建一个进行中的节点
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    await axios.post(
      `${BASE_URL}/api/cases/${testCaseId}/nodes`,
      {
        node_type: '审理',
        node_name: '开庭审理',
        handler: '李法官',
        start_time: new Date().toISOString(),
        deadline: futureDate.toISOString(),
        status: 'pending',
        node_order: 2
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    console.log('✓ 创建进行中节点成功');

    // 创建一个即将到期的节点
    const soonDate = new Date();
    soonDate.setDate(soonDate.getDate() + 2);
    await axios.post(
      `${BASE_URL}/api/cases/${testCaseId}/nodes`,
      {
        node_type: '证据交换',
        node_name: '证据交换',
        handler: '王书记员',
        start_time: new Date().toISOString(),
        deadline: soonDate.toISOString(),
        status: 'in_progress',
        node_order: 3
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    console.log('✓ 创建即将到期节点成功\n');
    return true;
  } catch (error) {
    console.error('✗ 创建测试节点失败:', error.response?.data || error.message);
    return false;
  }
}

// 测试 1: 获取节点列表并自动更新状态
async function testGetNodesWithStatusUpdate() {
  console.log('测试 1: 获取节点列表并自动更新状态');
  try {
    const response = await axios.get(
      `${BASE_URL}/api/cases/${testCaseId}/nodes?updateStatus=true`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    const nodes = response.data.data.nodes;
    console.log(`获取到 ${nodes.length} 个节点`);
    
    // 检查状态是否正确计算
    const overdueNode = nodes.find(n => n.deadline === '2024-10-10 17:00:00');
    const inProgressNode = nodes.find(n => n.node_name === '开庭审理');
    
    console.log(`超期节点状态: ${overdueNode?.status} (期望: overdue)`);
    console.log(`进行中节点状态: ${inProgressNode?.status} (期望: in_progress)`);
    
    if (overdueNode?.status === 'overdue' && inProgressNode?.status === 'in_progress') {
      console.log('✓ 测试通过\n');
      return true;
    } else {
      console.log('✗ 测试失败\n');
      return false;
    }
  } catch (error) {
    console.error('✗ 测试失败:', error.response?.data || error.message, '\n');
    return false;
  }
}

// 测试 2: 批量更新所有节点状态
async function testUpdateAllNodesStatus() {
  console.log('测试 2: 批量更新所有节点状态');
  try {
    const response = await axios.post(
      `${BASE_URL}/api/nodes/update-status`,
      {},
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    console.log(`更新结果: ${response.data.message}`);
    console.log(`更新数量: ${response.data.data.updated}`);
    console.log('✓ 测试通过\n');
    return true;
  } catch (error) {
    console.error('✗ 测试失败:', error.response?.data || error.message, '\n');
    return false;
  }
}

// 测试 3: 获取超期节点统计
async function testGetOverdueStatistics() {
  console.log('测试 3: 获取超期节点统计');
  try {
    const response = await axios.get(
      `${BASE_URL}/api/nodes/overdue/statistics`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    const stats = response.data.data;
    console.log(`超期节点总数: ${stats.total}`);
    console.log(`影响案件数: ${stats.affectedCases}`);
    console.log(`超期节点列表: ${stats.nodes.length} 个`);
    
    if (stats.total > 0) {
      console.log('✓ 测试通过\n');
      return true;
    } else {
      console.log('✗ 测试失败: 应该有超期节点\n');
      return false;
    }
  } catch (error) {
    console.error('✗ 测试失败:', error.response?.data || error.message, '\n');
    return false;
  }
}

// 测试 4: 获取即将到期的节点
async function testGetUpcomingNodes() {
  console.log('测试 4: 获取即将到期的节点');
  try {
    const response = await axios.get(
      `${BASE_URL}/api/nodes/upcoming?days=3`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    const nodes = response.data.data.nodes;
    console.log(`即将到期节点数: ${nodes.length}`);
    console.log(`阈值: ${response.data.data.threshold} 天`);
    
    if (nodes.length > 0) {
      console.log('✓ 测试通过\n');
      return true;
    } else {
      console.log('✗ 测试失败: 应该有即将到期的节点\n');
      return false;
    }
  } catch (error) {
    console.error('✗ 测试失败:', error.response?.data || error.message, '\n');
    return false;
  }
}

// 测试 5: 获取节点详情（包含超期信息）
async function testGetNodeWithOverdueInfo() {
  console.log('测试 5: 获取节点详情（包含超期信息）');
  try {
    const response = await axios.get(
      `${BASE_URL}/api/nodes/${testNodeId}/detail`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    const node = response.data.data.node;
    console.log(`节点名称: ${node.node_name}`);
    console.log(`计算状态: ${node.calculatedStatus}`);
    console.log(`是否超期: ${node.overdueInfo.isOverdue}`);
    console.log(`超期天数: ${node.overdueInfo.overdueDays}`);
    
    if (node.overdueInfo.isOverdue && node.calculatedStatus === 'overdue') {
      console.log('✓ 测试通过\n');
      return true;
    } else {
      console.log('✗ 测试失败\n');
      return false;
    }
  } catch (error) {
    console.error('✗ 测试失败:', error.response?.data || error.message, '\n');
    return false;
  }
}

// 主测试流程
async function runTests() {
  console.log('=== 开始节点状态计算 API 集成测试 ===\n');
  
  // 登录
  if (!await login()) {
    console.log('无法继续测试，请确保服务器正在运行且测试用户存在');
    return;
  }

  // 创建测试数据
  if (!await createTestCase()) {
    console.log('无法继续测试');
    return;
  }

  if (!await createTestNodes()) {
    console.log('无法继续测试');
    return;
  }

  // 运行测试
  const results = [];
  results.push(await testGetNodesWithStatusUpdate());
  results.push(await testUpdateAllNodesStatus());
  results.push(await testGetOverdueStatistics());
  results.push(await testGetUpcomingNodes());
  results.push(await testGetNodeWithOverdueInfo());

  // 统计结果
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log('=== 测试完成 ===');
  console.log(`通过: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('✓ 所有测试通过！');
  } else {
    console.log('✗ 部分测试失败');
  }
}

// 运行测试
runTests().catch(error => {
  console.error('测试执行错误:', error);
});
