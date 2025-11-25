# 提醒系统案件关联功能实现

## 功能概述

提醒数据关联案件的流程节点，当流程流转时发送提醒，提醒列表中显示案件编码并支持点击跳转到案件详情。

## 数据流程

### 1. 提醒创建流程

```
流程节点变更
  ↓
触发提醒创建
  ↓
NotificationTask表
  - related_type: 'process_node'
  - related_id: 节点ID
  - task_type: 'deadline' | 'overdue' | 'task'
  - content: 提醒内容
  - status: 'unread'
```

### 2. 案件信息关联

**后端实现** (`notificationController.js`):

```javascript
// 获取提醒时关联案件信息
if (notification.related_type === 'process_node' && notification.related_id) {
  const nodeResult = await dbQuery(
    'SELECT pn.*, c.case_number, c.case_name 
     FROM process_nodes pn 
     LEFT JOIN cases c ON pn.case_id = c.id 
     WHERE pn.id = ?',
    [notification.related_id]
  );
  
  if (nodeResult && nodeResult.length > 0) {
    caseInfo = {
      caseId: nodeResult[0].case_id,
      caseNumber: nodeResult[0].case_number,
      caseName: nodeResult[0].case_name
    };
  }
}
```

### 3. 前端显示

**NotificationCenter.vue**:

```html
<div class="notification-footer">
  <span class="notification-related">
    关联: 
    <!-- 如果有案件编号，显示案件编号 -->
    <el-link 
      v-if="notification.caseNumber"
      type="primary" 
      :underline="false"
      @click.stop="handleViewCase(notification)"
    >
      {{ notification.caseNumber }}
    </el-link>
    <!-- 否则显示原始关联信息 -->
    <span v-else>
      {{ notification.relatedType }} #{{ notification.relatedId }}
    </span>
  </span>
</div>
```

**跳转逻辑**:

```typescript
const handleViewCase = (notification: any) => {
  if (notification.caseId) {
    router.push(`/cases/${notification.caseId}`)
  }
}
```

## 数据结构

### NotificationTask 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 提醒ID |
| related_id | INTEGER | 关联对象ID（节点ID） |
| related_type | TEXT | 关联类型（'process_node'） |
| task_type | TEXT | 任务类型（'deadline', 'overdue', 'task'） |
| scheduled_time | TEXT | 计划时间 |
| content | TEXT | 提醒内容 |
| status | TEXT | 状态（'unread', 'read'） |
| created_at | TEXT | 创建时间 |

### 前端数据格式

```typescript
interface Notification {
  id: number
  relatedId: number
  relatedType: string
  taskType: string
  scheduledTime: string
  content: string
  status: string
  createdAt: string
  // 关联的案件信息
  caseId?: number
  caseNumber?: string
  caseName?: string
}
```

## 流程节点提醒触发

### 1. 节点到期提醒

**触发时机**: 节点截止日期前N天

**实现位置**: `notificationScheduler.js`

```javascript
// 检查即将到期的节点
const upcomingNodes = await query(`
  SELECT pn.*, c.case_number, c.case_name
  FROM process_nodes pn
  LEFT JOIN cases c ON pn.case_id = c.id
  WHERE pn.deadline <= datetime('now', '+3 days')
  AND pn.status != '已完成'
`);

// 为每个节点创建提醒
for (const node of upcomingNodes) {
  await NotificationTask.create({
    related_id: node.id,
    related_type: 'process_node',
    task_type: 'deadline',
    scheduled_time: node.deadline,
    content: `节点"${node.node_name}"即将到期`,
    status: 'unread'
  });
}
```

### 2. 节点逾期提醒

**触发时机**: 节点截止日期已过且未完成

```javascript
// 检查逾期节点
const overdueNodes = await query(`
  SELECT pn.*, c.case_number, c.case_name
  FROM process_nodes pn
  LEFT JOIN cases c ON pn.case_id = c.id
  WHERE pn.deadline < datetime('now')
  AND pn.status != '已完成'
`);

// 创建逾期提醒
for (const node of overdueNodes) {
  await NotificationTask.create({
    related_id: node.id,
    related_type: 'process_node',
    task_type: 'overdue',
    scheduled_time: new Date().toISOString(),
    content: `节点"${node.node_name}"已逾期`,
    status: 'unread'
  });
}
```

### 3. 流程流转提醒

**触发时机**: 节点状态变更时

**实现位置**: `processNodeController.js`

```javascript
// 更新节点状态时
exports.updateProcessNode = async (req, res) => {
  const { id } = req.params;
  const { status, completion_time } = req.body;
  
  // 更新节点
  await ProcessNode.update(id, { status, completion_time });
  
  // 如果节点完成，通知相关人员
  if (status === '已完成') {
    const node = await ProcessNode.findById(id);
    const caseInfo = await Case.findById(node.case_id);
    
    // 创建完成提醒
    await NotificationTask.create({
      related_id: node.id,
      related_type: 'process_node',
      task_type: 'task',
      scheduled_time: new Date().toISOString(),
      content: `节点"${node.node_name}"已完成`,
      status: 'unread'
    });
  }
};
```

## 显示效果

### NotificationCenter（提醒中心）

```
┌─────────────────────────────────────────────────────┐
│ [节点到期]                                 2小时前   │
│ 节点"证据收集"即将到期                              │
│ 关联: 2024-001                    [标记已读] [删除] │ ← 点击跳转
├─────────────────────────────────────────────────────┤
│ [节点超期]                                 昨天      │
│ 节点"开庭准备"已逾期                                │
│ 关联: 2024-002                    [标记已读] [删除] │ ← 点击跳转
└─────────────────────────────────────────────────────┘
```

### Dashboard待办事项

```
┌─────────────────────────────────────────┐
│ ● [⚠] 节点"证据收集"即将到期            │
│        案件编号: 2024-001               │ ← 显示案件编号
│        2小时前                          │
├─────────────────────────────────────────┤
│ ● [🕐] 节点"开庭准备"已逾期             │
│        案件编号: 2024-002               │ ← 显示案件编号
│        昨天                             │
└─────────────────────────────────────────┘
```

## 跳转路由

```typescript
// 跳转到案件详情
router.push(`/cases/${caseId}`)

// 案件详情页面路由
{
  path: '/cases/:id',
  name: 'CaseDetail',
  component: () => import('@/views/cases/CaseDetail.vue')
}
```

## 测试要点

1. ✅ 节点到期前3天创建提醒
2. ✅ 节点逾期后创建提醒
3. ✅ 节点完成时创建提醒
4. ✅ 提醒列表显示案件编号
5. ✅ 点击案件编号跳转到案件详情
6. ✅ 没有案件信息时显示原始关联信息
7. ✅ Dashboard待办事项显示案件编号
8. ✅ 点击待办事项跳转到案件详情

## 数据库查询优化

使用LEFT JOIN一次性获取所有需要的信息：

```sql
SELECT 
  nt.*,
  pn.node_name,
  pn.deadline,
  c.id as case_id,
  c.case_number,
  c.case_name
FROM notification_tasks nt
LEFT JOIN process_nodes pn ON nt.related_id = pn.id AND nt.related_type = 'process_node'
LEFT JOIN cases c ON pn.case_id = c.id
WHERE nt.status = 'unread'
ORDER BY nt.scheduled_time DESC
```

## 注意事项

1. **数据完整性**: 确保process_nodes表有case_id外键
2. **性能优化**: 使用索引优化关联查询
3. **错误处理**: 案件信息获取失败时优雅降级
4. **权限控制**: 确保用户只能查看有权限的案件提醒
5. **实时性**: 考虑使用WebSocket推送实时提醒

## 扩展功能

### 1. 批量操作

```typescript
// 批量标记为已读
const markMultipleAsRead = async (ids: number[]) => {
  await notificationApi.markMultipleAsRead(ids)
}
```

### 2. 提醒分组

按案件分组显示提醒：

```typescript
const groupedNotifications = computed(() => {
  const groups: Record<string, Notification[]> = {}
  
  notifications.value.forEach(n => {
    const key = n.caseNumber || 'other'
    if (!groups[key]) groups[key] = []
    groups[key].push(n)
  })
  
  return groups
})
```

### 3. 提醒统计

```typescript
// 按案件统计未读提醒数量
const unreadCountByCase = computed(() => {
  const counts: Record<string, number> = {}
  
  notifications.value
    .filter(n => n.status === 'unread')
    .forEach(n => {
      const key = n.caseNumber || 'other'
      counts[key] = (counts[key] || 0) + 1
    })
  
  return counts
})
```
