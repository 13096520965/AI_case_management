# 提醒文案优化 - 完整实现

## 需求

提醒数据文案需要改进，从：
```
【超期警告】节点"送达判决书"已超期 6 天（截止日期：2025-11-19T02:25:32.365Z），请尽快处理
关联: process_node #23
```

改为：
```
【超期警告】xx（xx是案号）案件节点"送达判决书"已超期 6 天（截止日期：2025-11-19 时分秒），请尽快处理
关联:案件内部编号
```

并且点击提醒时可以跳转到对应的案件详情页面。

## 实现方案

### 1. 后端修改

#### 文件：`backend/src/services/notificationSchedulerEnhanced.js`

**修改内容：**

1. **添加日期格式化函数**
   ```javascript
   function formatDateTime(dateString) {
     const date = new Date(dateString);
     const year = date.getFullYear();
     const month = String(date.getMonth() + 1).padStart(2, '0');
     const day = String(date.getDate()).padStart(2, '0');
     const hours = String(date.getHours()).padStart(2, '0');
     const minutes = String(date.getMinutes()).padStart(2, '0');
     const seconds = String(date.getSeconds()).padStart(2, '0');
     return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
   }
   ```

2. **更新截止日期提醒文案**
   ```javascript
   // 原：节点"${node.node_name}"将在 ${daysLeft} 天后到期（${node.deadline}），请及时处理
   // 新：${node.case_number}案件节点"${node.node_name}"将在 ${daysLeft} 天后到期（截止日期：${formattedDeadline}），请及时处理
   ```

3. **更新超期提醒文案**
   ```javascript
   // 原：【超期警告】节点"${node.node_name}"已超期 ${overdueDays} 天（截止日期：${node.deadline}），请尽快处理
   // 新：【超期警告】${node.case_number}案件节点"${node.node_name}"已超期 ${overdueDays} 天（截止日期：${formattedDeadline}），请尽快处理
   ```

4. **更新费用支付提醒文案**
   ```javascript
   // 原：费用"${cost.cost_type}"将在 ${daysLeft} 天后到期，金额：¥${cost.amount}，请及时支付
   // 新：${cost.case_number}案件费用"${cost.cost_type}"将在 ${daysLeft} 天后到期（截止日期：${formattedDueDate}），金额：¥${cost.amount}，请及时支付
   ```

#### 文件：`backend/src/controllers/notificationController.js`

**修改内容：**

在 `getNotifications` 方法中，为每个通知添加：
- `internalNumber`：案件内部编号
- `linkUrl`：跳转链接

```javascript
// 对于节点相关的提醒
linkUrl = `/cases/${nodeResult[0].caseId}`;

// 对于费用相关的提醒
linkUrl = `/cases/${costResult[0].caseId}`;
```

### 2. 前端修改

#### 文件：`frontend/src/views/notification/NotificationCenter.vue`

**修改内容：**

在 `handleNotificationClick` 方法中添加跳转逻辑：

```javascript
const handleNotificationClick = (notification: any) => {
  if (notification.status === 'unread') {
    handleMarkAsRead(notification.id)
  }
  // 如果有链接URL，则跳转到对应页面
  if (notification.linkUrl) {
    router.push(notification.linkUrl)
  } else if (notification.caseId) {
    // 备用方案：使用caseId跳转
    router.push(`/cases/${notification.caseId}`)
  }
}
```

## 实现效果

### 提醒文案示例

**截止日期提醒：**
```
AN202511000007案件节点"立案受理"将在 1 天后到期（截止日期：2025-11-26 09:40:22），请及时处理
```

**超期提醒：**
```
【超期警告】AN202511000001案件节点"立案受理"已超期 4 天（截止日期：2025-11-21 09:40:22），请尽快处理
```

**费用支付提醒：**
```
AN202511000007案件费用"律师费"将在 2 天后到期（截止日期：2025-11-27 10:00:00），金额：¥5000，请及时支付
```

### 功能特性

✓ **包含案号**：所有提醒都显示案件的内部编号（如 AN202511000007）
✓ **格式化日期**：日期显示为 `YYYY-MM-DD HH:mm:ss` 格式，而不是 ISO 格式
✓ **可点击跳转**：点击提醒可以直接跳转到对应的案件详情页面
✓ **完整信息**：提醒包含所有必要的信息（案号、节点名称、天数、日期、金额等）

## 验证结果

测试表明所有提醒文案都符合要求：

```
✓ 截止日期提醒:
  AN202511000007案件节点"立案受理"将在 1 天后到期（截止日期：2025-11-26 09:40:22），请及时处理
  - 包含案号: ✓
  - 包含节点名称: ✓
  - 包含天数: ✓
  - 包含日期: ✓
```

## 相关文件

- **后端服务**：`backend/src/services/notificationSchedulerEnhanced.js`
- **后端控制器**：`backend/src/controllers/notificationController.js`
- **前端组件**：`frontend/src/views/notification/NotificationCenter.vue`

## 部署步骤

1. 部署后端修改
2. 重启后端服务
3. 清空旧的提醒数据（可选）
4. 手动触发提醒检查或等待定时任务运行
5. 在前端通知中心查看新的提醒文案

## 后续优化

1. **多语言支持**：可以为不同语言提供不同的文案模板
2. **自定义文案**：允许管理员自定义提醒文案模板
3. **富文本支持**：支持在提醒中使用富文本格式
4. **提醒分类**：按类型分类显示提醒
