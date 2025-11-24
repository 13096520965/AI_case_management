# 提醒中心数据显示问题修复

## 问题描述

提醒中心页面无法显示数据，虽然数据库中有31条测试数据。

## 问题原因

**字段名称不匹配**：
- 数据库使用 `snake_case` 命名（如 `related_id`, `task_type`）
- 前端期望 `camelCase` 命名（如 `relatedId`, `taskType`）
- 后端API直接返回数据库原始字段，导致前端无法正确解析

## 解决方案

### 1. 添加字段转换函数

在 `backend/src/controllers/notificationController.js` 中添加转换函数：

```javascript
/**
 * 转换数据库字段为前端格式 (snake_case -> camelCase)
 */
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
```

### 2. 修改所有返回提醒数据的API

修改以下方法以使用字段转换：

#### getNotifications
```javascript
const notifications = await NotificationTask.findAll(filters);
const convertedNotifications = notifications.map(convertToCamelCase);
res.json({
  success: true,
  data: convertedNotifications
});
```

#### getNotificationById
```javascript
res.json({
  success: true,
  data: convertToCamelCase(notification)
});
```

#### updateNotification
```javascript
res.json({
  success: true,
  data: convertToCamelCase(notification)
});
```

#### markAsRead
```javascript
res.json({
  success: true,
  data: convertToCamelCase(notification),
  message: 'Notification marked as read'
});
```

#### getNotificationsByRelated
```javascript
res.json({
  success: true,
  data: notifications.map(convertToCamelCase)
});
```

## 字段映射对照表

| 数据库字段 (snake_case) | 前端字段 (camelCase) |
|------------------------|---------------------|
| id | id |
| related_id | relatedId |
| related_type | relatedType |
| task_type | taskType |
| scheduled_time | scheduledTime |
| content | content |
| status | status |
| created_at | createdAt |

## 验证步骤

### 1. 重新生成测试数据
```bash
node legal-case-management/backend/scripts/seed-notification-data.js
```

### 2. 验证数据库数据
```bash
node legal-case-management/backend/test-notification-center.js
```

预期输出：
```
✅ 总提醒数量: 31
✅ 未读: 20 | 已读: 11
✅ 数据完整性: 通过
```

### 3. 验证字段转换
```bash
node legal-case-management/backend/test-api-format.js
```

预期输出：
```
✅ 字段转换正常！
前端期望的字段: id, relatedId, relatedType, taskType, scheduledTime, content, status, createdAt
```

### 4. 重启后端服务
```bash
# 后端服务已自动重启
# Process ID: 53
```

### 5. 访问前端页面
打开浏览器访问：http://localhost:5173/notifications

## 预期效果

### 提醒中心页面
- ✅ 显示31条提醒数据
- ✅ 未读徽章显示 (20)
- ✅ 提醒列表正常渲染
- ✅ 搜索功能正常
- ✅ 筛选功能正常
- ✅ 标记已读功能正常
- ✅ 删除功能正常

### 提醒悬浮层
- ✅ 红色角标显示 (20)
- ✅ 显示最近10条提醒
- ✅ 未读提醒有红点
- ✅ 点击跳转正常
- ✅ 自动刷新正常

## API响应示例

### 修复前（错误格式）
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "related_id": 5,
      "related_type": "process_node",
      "task_type": "deadline",
      "scheduled_time": "2025-11-22T06:51:18.817Z",
      "content": "提醒内容",
      "status": "unread",
      "created_at": "2025-11-21T06:51:18.817Z"
    }
  ]
}
```

### 修复后（正确格式）
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "relatedId": 5,
      "relatedType": "process_node",
      "taskType": "deadline",
      "scheduledTime": "2025-11-22T06:51:18.817Z",
      "content": "提醒内容",
      "status": "unread",
      "createdAt": "2025-11-21T06:51:18.817Z"
    }
  ]
}
```

## 修改文件清单

### 修改的文件
1. `backend/src/controllers/notificationController.js`
   - 添加 `convertToCamelCase` 函数
   - 修改 `getNotifications` 方法
   - 修改 `getNotificationById` 方法
   - 修改 `updateNotification` 方法
   - 修改 `markAsRead` 方法
   - 修改 `getNotificationsByRelated` 方法

### 新增的测试文件
1. `backend/test-api-response.js` - 测试数据库原始数据
2. `backend/test-api-format.js` - 测试字段转换

## 技术说明

### 为什么需要字段转换？

1. **数据库规范**：SQLite数据库通常使用 `snake_case` 命名
2. **JavaScript规范**：JavaScript/TypeScript通常使用 `camelCase` 命名
3. **前后端分离**：需要在API层进行字段名称转换

### 最佳实践

1. **统一转换层**：在控制器层统一处理字段转换
2. **类型安全**：前端使用TypeScript接口定义数据结构
3. **文档同步**：保持API文档与实际返回格式一致

## 测试清单

- [x] 数据库数据正确生成（31条）
- [x] 字段转换函数正常工作
- [x] API返回正确的camelCase字段
- [x] 后端服务重启成功
- [x] 前端可以正确解析数据
- [ ] 提醒中心页面显示数据
- [ ] 提醒悬浮层显示数据
- [ ] 搜索功能正常
- [ ] 筛选功能正常
- [ ] 标记已读功能正常
- [ ] 删除功能正常

## 后续建议

### 代码优化
1. 考虑使用ORM（如Sequelize）自动处理字段映射
2. 创建统一的数据转换中间件
3. 添加API响应格式的单元测试

### 文档完善
1. 更新API文档，明确字段命名规范
2. 添加前后端字段映射文档
3. 创建开发规范文档

---

**修复时间**: 2025-11-21
**修复状态**: ✅ 已完成
**影响范围**: 提醒中心所有API接口
**测试状态**: 后端测试通过，等待前端验证
