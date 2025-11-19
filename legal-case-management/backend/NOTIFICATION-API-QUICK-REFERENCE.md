# 提醒预警系统 API 快速参考

## 认证
所有接口都需要在请求头中包含 JWT token：
```
Authorization: Bearer <token>
```

## 提醒任务 API

### 获取提醒列表
```http
GET /api/notifications
Query Parameters:
  - status: pending|sent|read
  - task_type: node_deadline|node_overdue|cost_payment
  - related_type: process_node|cost_record|case
  - related_id: number
```

### 获取单个提醒
```http
GET /api/notifications/:id
```

### 创建提醒任务
```http
POST /api/notifications
Body: {
  "related_id": 1,
  "related_type": "process_node",
  "task_type": "node_deadline",
  "scheduled_time": "2025-11-15T09:00:00Z",
  "content": "提醒内容"
}
```

### 更新提醒任务
```http
PUT /api/notifications/:id
Body: {
  "content": "更新后的内容",
  "status": "pending"
}
```

### 标记为已读
```http
PUT /api/notifications/:id/read
```

### 批量标记为已读
```http
POST /api/notifications/mark-read
Body: {
  "ids": [1, 2, 3]
}
```

### 删除提醒
```http
DELETE /api/notifications/:id
```

### 获取未读数量
```http
GET /api/notifications/unread-count
Query Parameters:
  - related_type: process_node|cost_record|case
  - related_id: number
```

### 根据关联对象获取提醒
```http
GET /api/notifications/related/:relatedType/:relatedId
Example: GET /api/notifications/related/process_node/1
```

### 发送单个提醒
```http
POST /api/notifications/:id/send
Body: {
  "sendSystem": true,
  "phoneNumber": "13800138000",  // 可选
  "email": "user@example.com"    // 可选
}
```

### 批量发送待发送的提醒
```http
POST /api/notifications/send-pending
```

### 获取发送历史
```http
GET /api/notifications/:id/send-history
```

### 重新发送提醒
```http
POST /api/notifications/:id/resend
```

### 手动触发提醒检查
```http
POST /api/notifications/trigger-check
```

## 提醒规则 API

### 获取规则列表
```http
GET /api/notifications/rules
Query Parameters:
  - rule_type: node_deadline|node_overdue|cost_payment
  - is_enabled: true|false
```

### 获取单个规则
```http
GET /api/notifications/rules/:id
```

### 创建规则
```http
POST /api/notifications/rules
Body: {
  "rule_name": "节点截止提醒规则",
  "rule_type": "node_deadline",
  "trigger_condition": "before_deadline",
  "threshold_value": 3,
  "threshold_unit": "days",
  "frequency": "daily",
  "recipients": ["user1@example.com", "user2@example.com"],
  "is_enabled": true,
  "description": "在节点截止日期前3天发送提醒"
}
```

### 更新规则
```http
PUT /api/notifications/rules/:id
Body: {
  "threshold_value": 5,
  "description": "更新后的描述"
}
```

### 启用/禁用规则
```http
PUT /api/notifications/rules/:id/toggle
Body: {
  "is_enabled": true
}
```

### 删除规则
```http
DELETE /api/notifications/rules/:id
```

### 获取启用的规则
```http
GET /api/notifications/rules/enabled
Query Parameters:
  - rule_type: node_deadline|node_overdue|cost_payment
```

### 根据类型获取规则
```http
GET /api/notifications/rules/type/:type
Example: GET /api/notifications/rules/type/node_deadline
```

## 响应格式

### 成功响应
```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}
```

### 错误响应
```json
{
  "success": false,
  "error": "错误信息"
}
```

## 提醒类型说明

### task_type
- `node_deadline` - 节点截止日期提醒
- `node_overdue` - 节点超期预警
- `cost_payment` - 费用支付提醒

### related_type
- `process_node` - 关联到流程节点
- `cost_record` - 关联到成本记录
- `case` - 关联到案件

### status
- `pending` - 待处理
- `sent` - 已发送
- `read` - 已读

## 调度器说明

### 自动调度任务
1. **每日提醒检查** - 每天 9:00
   - 根据规则创建提醒任务
   
2. **超期节点检查** - 每小时
   - 检查并创建超期预警
   
3. **费用支付检查** - 每天 9:00
   - 检查7天内到期的费用

### 手动触发
可以通过 API 手动触发提醒检查：
```http
POST /api/notifications/trigger-check
```

## 使用示例

### 示例 1: 创建并发送提醒
```javascript
// 1. 创建提醒任务
const response = await axios.post('/api/notifications', {
  related_id: 1,
  related_type: 'process_node',
  task_type: 'node_deadline',
  scheduled_time: new Date().toISOString(),
  content: '流程节点即将到期'
}, {
  headers: { Authorization: `Bearer ${token}` }
});

const notificationId = response.data.data.id;

// 2. 发送提醒
await axios.post(`/api/notifications/${notificationId}/send`, {
  sendSystem: true
}, {
  headers: { Authorization: `Bearer ${token}` }
});
```

### 示例 2: 配置提醒规则
```javascript
// 创建规则
await axios.post('/api/notifications/rules', {
  rule_name: '节点截止提醒',
  rule_type: 'node_deadline',
  trigger_condition: 'before_deadline',
  threshold_value: 3,
  threshold_unit: 'days',
  frequency: 'daily',
  recipients: ['admin@example.com'],
  is_enabled: true,
  description: '节点截止前3天提醒'
}, {
  headers: { Authorization: `Bearer ${token}` }
});
```

### 示例 3: 获取未读提醒
```javascript
// 获取所有未读提醒
const response = await axios.get('/api/notifications', {
  params: { status: 'pending' },
  headers: { Authorization: `Bearer ${token}` }
});

const unreadNotifications = response.data.data;

// 获取未读数量
const countResponse = await axios.get('/api/notifications/unread-count', {
  headers: { Authorization: `Bearer ${token}` }
});

const unreadCount = countResponse.data.data.unread_count;
```

## 注意事项

1. 所有时间字段使用 ISO 8601 格式
2. 调度器会自动避免24小时内重复创建相同提醒
3. 短信和邮件功能需要配置第三方服务
4. 建议定期清理已读的历史提醒
5. 规则的 recipients 字段存储为 JSON 数组
