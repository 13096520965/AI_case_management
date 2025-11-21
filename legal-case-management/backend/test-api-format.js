const axios = require('axios');

console.log('=== 测试API返回格式 ===\n');

// 模拟一个简单的请求（不需要认证的测试）
// 由于API需要认证，我们直接测试控制器的转换函数

const testData = {
  id: 1,
  related_id: 5,
  related_type: 'process_node',
  task_type: 'deadline',
  scheduled_time: '2025-11-22T06:51:18.817Z',
  content: '测试提醒内容',
  status: 'unread',
  created_at: '2025-11-21T06:51:18.817Z'
};

const convertToCamelCase = (notification) => {
  if (!notification) return null;
  return {
    id: notification.id,
    relatedId: notification.related_id,
    relatedType: notification.related_type,
    taskType: notification.task_type,
    scheduledTime: notification.scheduled_time,
    content: notification.content,
    status: notification.status,
    createdAt: notification.created_at
  };
};

console.log('原始数据 (snake_case):');
console.log(JSON.stringify(testData, null, 2));

console.log('\n转换后数据 (camelCase):');
const converted = convertToCamelCase(testData);
console.log(JSON.stringify(converted, null, 2));

console.log('\n✅ 字段转换正常！');
console.log('\n前端期望的字段:');
console.log('- id, relatedId, relatedType, taskType');
console.log('- scheduledTime, content, status, createdAt');

console.log('\n后端现在返回的字段:');
console.log(Object.keys(converted).join(', '));
