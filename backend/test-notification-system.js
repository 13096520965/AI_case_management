/**
 * 提醒预警系统测试脚本
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';
let authToken = '';

// 测试用户凭证
const testUser = {
  username: 'testuser',
  password: 'password123'
};

/**
 * 登录获取 token
 */
async function login() {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, testUser);
    authToken = response.data.data.token;
    console.log('✓ 登录成功');
    return true;
  } catch (error) {
    console.error('✗ 登录失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 创建提醒规则
 */
async function createNotificationRule() {
  try {
    const ruleData = {
      rule_name: '节点截止提醒规则',
      rule_type: 'node_deadline',
      trigger_condition: 'before_deadline',
      threshold_value: 3,
      threshold_unit: 'days',
      frequency: 'daily',
      recipients: ['user1@example.com', 'user2@example.com'],
      is_enabled: true,
      description: '在节点截止日期前3天发送提醒'
    };

    const response = await axios.post(
      `${API_BASE_URL}/notifications/rules`,
      ruleData,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    console.log('✓ 创建提醒规则成功:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('✗ 创建提醒规则失败:', error.response?.data || error.message);
    return null;
  }
}

/**
 * 获取提醒规则列表
 */
async function getNotificationRules() {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/notifications/rules`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    console.log('✓ 获取提醒规则列表成功:', response.data.data.length, '条规则');
    return response.data.data;
  } catch (error) {
    console.error('✗ 获取提醒规则列表失败:', error.response?.data || error.message);
    return [];
  }
}

/**
 * 创建提醒任务
 */
async function createNotificationTask() {
  try {
    const taskData = {
      related_id: 1,
      related_type: 'process_node',
      task_type: 'node_deadline',
      scheduled_time: new Date().toISOString(),
      content: '测试提醒：流程节点即将到期'
    };

    const response = await axios.post(
      `${API_BASE_URL}/notifications`,
      taskData,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    console.log('✓ 创建提醒任务成功:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('✗ 创建提醒任务失败:', error.response?.data || error.message);
    return null;
  }
}

/**
 * 获取提醒任务列表
 */
async function getNotifications() {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/notifications`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    console.log('✓ 获取提醒任务列表成功:', response.data.data.length, '条提醒');
    return response.data.data;
  } catch (error) {
    console.error('✗ 获取提醒任务列表失败:', error.response?.data || error.message);
    return [];
  }
}

/**
 * 标记提醒为已读
 */
async function markNotificationAsRead(notificationId) {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/notifications/${notificationId}/read`,
      {},
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    console.log('✓ 标记提醒为已读成功:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('✗ 标记提醒为已读失败:', error.response?.data || error.message);
    return null;
  }
}

/**
 * 获取未读提醒数量
 */
async function getUnreadCount() {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/notifications/unread-count`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    console.log('✓ 获取未读提醒数量成功:', response.data.data.unread_count, '条未读');
    return response.data.data.unread_count;
  } catch (error) {
    console.error('✗ 获取未读提醒数量失败:', error.response?.data || error.message);
    return 0;
  }
}

/**
 * 手动触发提醒检查
 */
async function triggerManualCheck() {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/notifications/trigger-check`,
      {},
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    console.log('✓ 手动触发提醒检查成功:', response.data.message);
    return true;
  } catch (error) {
    console.error('✗ 手动触发提醒检查失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 发送提醒
 */
async function sendNotification(notificationId) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/notifications/${notificationId}/send`,
      { sendSystem: true },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    console.log('✓ 发送提醒成功:', response.data.message);
    return response.data.data;
  } catch (error) {
    console.error('✗ 发送提醒失败:', error.response?.data || error.message);
    return null;
  }
}

/**
 * 获取发送历史
 */
async function getSendHistory(notificationId) {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/notifications/${notificationId}/send-history`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    console.log('✓ 获取发送历史成功:', response.data.data.length, '条记录');
    return response.data.data;
  } catch (error) {
    console.error('✗ 获取发送历史失败:', error.response?.data || error.message);
    return [];
  }
}

/**
 * 更新提醒规则
 */
async function updateNotificationRule(ruleId) {
  try {
    const updateData = {
      threshold_value: 5,
      description: '更新后的规则描述'
    };

    const response = await axios.put(
      `${API_BASE_URL}/notifications/rules/${ruleId}`,
      updateData,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    console.log('✓ 更新提醒规则成功:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('✗ 更新提醒规则失败:', error.response?.data || error.message);
    return null;
  }
}

/**
 * 启用/禁用规则
 */
async function toggleRule(ruleId, enabled) {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/notifications/rules/${ruleId}/toggle`,
      { is_enabled: enabled },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    console.log(`✓ ${enabled ? '启用' : '禁用'}规则成功:`, response.data.data);
    return response.data.data;
  } catch (error) {
    console.error(`✗ ${enabled ? '启用' : '禁用'}规则失败:`, error.response?.data || error.message);
    return null;
  }
}

/**
 * 运行所有测试
 */
async function runTests() {
  console.log('\n========== 提醒预警系统测试 ==========\n');

  // 1. 登录
  console.log('1. 测试用户登录');
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n测试终止：登录失败');
    return;
  }
  console.log('');

  // 2. 创建提醒规则
  console.log('2. 测试创建提醒规则');
  const rule = await createNotificationRule();
  console.log('');

  // 3. 获取提醒规则列表
  console.log('3. 测试获取提醒规则列表');
  await getNotificationRules();
  console.log('');

  // 4. 更新提醒规则
  if (rule) {
    console.log('4. 测试更新提醒规则');
    await updateNotificationRule(rule.id);
    console.log('');

    // 5. 禁用规则
    console.log('5. 测试禁用规则');
    await toggleRule(rule.id, false);
    console.log('');

    // 6. 启用规则
    console.log('6. 测试启用规则');
    await toggleRule(rule.id, true);
    console.log('');
  }

  // 7. 创建提醒任务
  console.log('7. 测试创建提醒任务');
  const notification = await createNotificationTask();
  console.log('');

  // 8. 获取提醒任务列表
  console.log('8. 测试获取提醒任务列表');
  await getNotifications();
  console.log('');

  // 9. 获取未读提醒数量
  console.log('9. 测试获取未读提醒数量');
  await getUnreadCount();
  console.log('');

  // 10. 发送提醒
  if (notification) {
    console.log('10. 测试发送提醒');
    await sendNotification(notification.id);
    console.log('');

    // 11. 获取发送历史
    console.log('11. 测试获取发送历史');
    await getSendHistory(notification.id);
    console.log('');

    // 12. 标记为已读
    console.log('12. 测试标记提醒为已读');
    await markNotificationAsRead(notification.id);
    console.log('');
  }

  // 13. 手动触发提醒检查
  console.log('13. 测试手动触发提醒检查');
  await triggerManualCheck();
  console.log('');

  console.log('========== 测试完成 ==========\n');
}

// 运行测试
runTests().catch(error => {
  console.error('测试执行出错:', error);
  process.exit(1);
});
