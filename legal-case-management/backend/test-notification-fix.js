const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

// 测试用户凭证
const testUser = {
  username: 'admin',
  password: 'admin123'
};

let authToken = '';

// 登录获取token
async function login() {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, testUser);
    authToken = response.data.data?.token || response.data.token;
    console.log('✓ 登录成功, Token:', authToken ? '已获取' : '未获取');
    console.log('登录响应:', JSON.stringify(response.data, null, 2));
    return authToken ? true : false;
  } catch (error) {
    console.error('✗ 登录失败:', error.response?.data || error.message);
    return false;
  }
}

// 创建测试通知
async function createTestNotifications() {
  try {
    const notifications = [
      {
        related_id: 1,
        related_type: 'process_node',
        task_type: 'overdue',
        scheduled_time: new Date().toISOString(),
        content: '节点"立案审查"已超期，请及时处理'
      },
      {
        related_id: 2,
        related_type: 'process_node',
        task_type: 'deadline',
        scheduled_time: new Date().toISOString(),
        content: '节点"证据收集"即将到期，请注意'
      },
      {
        related_id: 3,
        related_type: 'process_node',
        task_type: 'overdue',
        scheduled_time: new Date().toISOString(),
        content: '节点"开庭准备"已超期3天'
      }
    ];

    for (const notification of notifications) {
      const response = await axios.post(
        `${API_BASE_URL}/notifications`,
        notification,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      console.log('✓ 创建通知成功:', notification.content);
    }
    return true;
  } catch (error) {
    console.error('✗ 创建通知失败:', error.response?.data || error.message);
    return false;
  }
}

// 测试获取通知列表
async function testGetNotifications() {
  try {
    const response = await axios.get(`${API_BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('\n=== 通知列表 ===');
    console.log('返回格式:', JSON.stringify(response.data, null, 2).substring(0, 200));
    console.log('通知数量:', response.data?.data?.length || 0);
    
    if (response.data?.success && response.data?.data) {
      console.log('✓ 获取通知列表成功');
      return response.data.data;
    } else {
      console.log('✗ 返回格式不正确');
      return [];
    }
  } catch (error) {
    console.error('✗ 获取通知列表失败:', error.response?.data || error.message);
    return [];
  }
}

// 测试获取未读数量
async function testGetUnreadCount() {
  try {
    const response = await axios.get(`${API_BASE_URL}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('\n=== 未读数量 ===');
    console.log('返回数据:', JSON.stringify(response.data, null, 2));
    
    if (response.data?.success) {
      console.log('✓ 获取未读数量成功:', response.data.data?.unread_count);
      return response.data.data?.unread_count || 0;
    } else {
      console.log('✗ 返回格式不正确');
      return 0;
    }
  } catch (error) {
    console.error('✗ 获取未读数量失败:', error.response?.data || error.message);
    return 0;
  }
}

// 测试超期节点API
async function testOverdueNodes() {
  try {
    const response = await axios.get(`${API_BASE_URL}/nodes/overdue`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('\n=== 超期节点 ===');
    console.log('返回格式:', JSON.stringify(response.data, null, 2).substring(0, 300));
    
    if (response.data?.success && response.data?.data) {
      console.log('✓ 获取超期节点成功');
      console.log('节点数量:', response.data.data.length);
      
      // 检查是否包含案件名称
      if (response.data.data.length > 0) {
        const firstNode = response.data.data[0];
        console.log('第一个节点:', {
          id: firstNode.id,
          case_id: firstNode.case_id,
          case_name: firstNode.case_name,
          node_name: firstNode.node_name
        });
        
        if (firstNode.case_name) {
          console.log('✓ 节点包含案件名称');
        } else {
          console.log('✗ 节点缺少案件名称');
        }
      }
      return response.data.data;
    } else {
      console.log('✗ 返回格式不正确');
      return [];
    }
  } catch (error) {
    console.error('✗ 获取超期节点失败:', error.response?.data || error.message);
    return [];
  }
}

// 测试即将到期节点API
async function testUpcomingNodes() {
  try {
    const response = await axios.get(`${API_BASE_URL}/nodes/upcoming`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('\n=== 即将到期节点 ===');
    console.log('返回格式:', JSON.stringify(response.data, null, 2).substring(0, 300));
    
    if (response.data?.success) {
      const nodes = response.data.data?.nodes || response.data.data || [];
      console.log('✓ 获取即将到期节点成功');
      console.log('节点数量:', nodes.length);
      
      // 检查是否包含案件名称
      if (nodes.length > 0) {
        const firstNode = nodes[0];
        console.log('第一个节点:', {
          id: firstNode.id,
          case_id: firstNode.case_id,
          case_name: firstNode.case_name,
          node_name: firstNode.node_name
        });
        
        if (firstNode.case_name) {
          console.log('✓ 节点包含案件名称');
        } else {
          console.log('✗ 节点缺少案件名称');
        }
      }
      return nodes;
    } else {
      console.log('✗ 返回格式不正确');
      return [];
    }
  } catch (error) {
    console.error('✗ 获取即将到期节点失败:', error.response?.data || error.message);
    return [];
  }
}

// 主测试函数
async function runTests() {
  console.log('开始测试通知系统修复...\n');
  
  // 1. 登录
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n测试终止：登录失败');
    return;
  }
  
  // 2. 创建测试通知
  console.log('\n--- 创建测试通知 ---');
  await createTestNotifications();
  
  // 3. 测试获取通知列表
  console.log('\n--- 测试获取通知列表 ---');
  const notifications = await testGetNotifications();
  
  // 4. 测试获取未读数量
  console.log('\n--- 测试获取未读数量 ---');
  const unreadCount = await testGetUnreadCount();
  
  // 5. 测试超期节点API
  console.log('\n--- 测试超期节点API ---');
  await testOverdueNodes();
  
  // 6. 测试即将到期节点API
  console.log('\n--- 测试即将到期节点API ---');
  await testUpcomingNodes();
  
  console.log('\n=== 测试完成 ===');
  console.log(`通知总数: ${notifications.length}`);
  console.log(`未读数量: ${unreadCount}`);
}

// 运行测试
runTests().catch(console.error);
