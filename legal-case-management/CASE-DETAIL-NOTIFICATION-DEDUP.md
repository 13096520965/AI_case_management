# 案件详情页面提醒消息去重

## 需求

案件详情中的提醒消息每个节点只展示一条即可，其他页面维持不变。

## 实现

### 修改文件

- `frontend/src/views/case/CaseDetail.vue`

### 修改内容

在 `fetchCaseNotifications` 函数中添加去重逻辑：

1. **使用 Map 数据结构**：以 `relatedId`（节点ID）为键，存储每个节点的提醒
2. **保留最新提醒**：当同一个节点有多条提醒时，比较 `createdAt` 时间戳，保留最新的一条
3. **转换为数组**：最后将 Map 转换为数组，赋值给 `caseNotifications`

### 核心逻辑

```typescript
const nodeNotificationMap = new Map<number, any>(); // 用于去重，每个节点只保留一条

for (const notification of allNotifications) {
  if (notification.caseId === caseId) {
    const relatedId = notification.relatedId;
    
    if (!nodeNotificationMap.has(relatedId)) {
      // 第一次遇到这个节点的提醒，直接存储
      nodeNotificationMap.set(relatedId, notificationWithNode);
    } else {
      // 已存在该节点的提醒，比较时间戳，保留更新的
      const existing = nodeNotificationMap.get(relatedId);
      const existingTime = new Date(existing.createdAt).getTime();
      const newTime = new Date(notification.createdAt).getTime();
      if (newTime > existingTime) {
        nodeNotificationMap.set(relatedId, notificationWithNode);
      }
    }
  }
}

caseNotifications.value = Array.from(nodeNotificationMap.values());
```

## 影响范围

- ✅ **案件详情页面** (`CaseDetail.vue`) - 每个节点只展示一条提醒
- ✅ **通知中心** (`NotificationCenter.vue`) - 维持不变，展示所有提醒
- ✅ **通知弹出框** (`NotificationPopover.vue`) - 维持不变，展示最近的提醒

## 测试

1. 打开案件详情页面
2. 查看提醒消息卡片
3. 验证每个节点只展示一条提醒（最新的）
4. 检查其他页面的提醒展示是否正常
