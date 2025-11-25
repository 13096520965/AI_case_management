# 首页待办事项未读状态统一

## 问题描述

待办事项展示的应该是未读提醒，数据及数据状态需要保持一致。

## 解决方案

### 1. 修改API请求参数

**修改前：**
```typescript
const response = await notificationApi.getNotifications({ 
  page: currentPage.value,
  pageSize: pageSize.value,
  status: 'pending'  // ❌ 错误：pending 不是未读状态
})
```

**修改后：**
```typescript
const response = await notificationApi.getNotifications({ 
  page: currentPage.value,
  pageSize: pageSize.value,
  status: 'unread'  // ✅ 正确：获取未读提醒
})
```

### 2. 修改状态判断

**模板中的状态判断：**

```html
<!-- 修改前 -->
<div 
  class="todo-item"
  :class="{ 'is-unread': item.status === 'pending' }"
>
  <div class="item-dot" v-if="item.status === 'pending'"></div>
  ...
</div>

<!-- 修改后 -->
<div 
  class="todo-item"
  :class="{ 'is-unread': item.status === 'unread' }"
>
  <div class="item-dot" v-if="item.status === 'unread'"></div>
  ...
</div>
```

### 3. 点击处理逻辑

点击提醒时的处理流程：

```typescript
const handleAlertClick = async (alert: AlertItem) => {
  try {
    // 1. 标记为已读
    await notificationApi.markAsRead(alert.id)
    
    // 2. 从列表中移除（因为只显示未读）
    alertList.value = alertList.value.filter(item => item.id !== alert.id)
    
    // 3. 更新计数
    totalAlerts.value = Math.max(0, totalAlerts.value - 1)
    dashboardData.value.pendingTasks = totalAlerts.value
    
    // 4. 跳转到相关页面
    if (alert.caseId) {
      router.push(`/cases/${alert.caseId}`)
    } else {
      router.push('/notifications/alerts')
    }
  } catch (error) {
    console.error('Failed to handle alert click:', error)
  }
}
```

## 数据状态说明

### 提醒状态类型

| 状态 | 说明 | 显示位置 |
|------|------|----------|
| `unread` | 未读 | 待办事项卡片、通知中心 |
| `read` | 已读 | 通知中心（历史记录） |
| `pending` | 待处理 | ❌ 不应该用于提醒状态 |

### 状态转换流程

```
创建提醒
  ↓
status = 'unread'
  ↓
显示在待办事项卡片
  ↓
用户点击
  ↓
调用 markAsRead(id)
  ↓
status = 'read'
  ↓
从待办事项列表移除
  ↓
只在通知中心历史记录中显示
```

## 与其他组件的一致性

### NotificationPopover

NotificationPopover 也应该只显示未读提醒：

```typescript
// 获取未读提醒
const response = await notificationApi.getNotifications({ 
  status: 'unread'
})

// 显示未读数量
const unreadCount = computed(() => {
  return notifications.value.filter(n => n.status === 'unread').length
})
```

### NotificationCenter

通知中心可以显示所有状态的提醒，并提供筛选：

```typescript
// 全部提醒
const response = await notificationApi.getNotifications()

// 或按状态筛选
const response = await notificationApi.getNotifications({ 
  status: filterStatus.value  // 'unread' | 'read' | undefined
})
```

## 数据一致性保证

### 1. 统一状态值

所有组件使用相同的状态值：
- ✅ `'unread'` - 未读
- ✅ `'read'` - 已读
- ❌ `'pending'` - 不使用

### 2. 统一API调用

```typescript
// 获取未读提醒
notificationApi.getNotifications({ status: 'unread' })

// 标记为已读
notificationApi.markAsRead(id)

// 标记全部为已读
notificationApi.markAllAsRead()
```

### 3. 统一本地更新

标记为已读后，立即更新本地状态：

```typescript
// 从未读列表移除
alertList.value = alertList.value.filter(item => item.id !== alert.id)

// 更新计数
totalAlerts.value = Math.max(0, totalAlerts.value - 1)
```

## 测试要点

1. ✅ 待办事项只显示未读提醒（status='unread'）
2. ✅ 点击提醒后标记为已读
3. ✅ 已读提醒从待办事项列表移除
4. ✅ 未读数量徽章正确更新
5. ✅ 刷新后只获取未读提醒
6. ✅ 与NotificationPopover显示的数据一致
7. ✅ 与通知中心的未读筛选一致

## 后端支持

确保后端 `/api/notifications` 接口支持 `status` 参数：

```javascript
// backend/src/controllers/notificationController.js
exports.getNotifications = async (req, res) => {
  const { status, page, pageSize } = req.query;
  
  const filters = {};
  if (status) {
    filters.status = status;  // 'unread' 或 'read'
  }
  
  const notifications = await NotificationTask.findAll(filters);
  // ...
}
```

## 注意事项

1. **状态命名统一**: 使用 `'unread'` 和 `'read'`，不使用 `'pending'`
2. **立即更新**: 标记为已读后立即从列表移除，提供即时反馈
3. **计数同步**: 确保未读数量在所有组件中保持一致
4. **API一致性**: 所有组件使用相同的API参数和返回格式
5. **用户体验**: 点击后跳转到相关页面，避免用户迷失
