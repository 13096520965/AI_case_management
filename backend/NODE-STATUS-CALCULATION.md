# 节点状态计算逻辑实现文档

## 概述

本文档描述了流程节点状态自动计算和更新的实现，满足需求 8 和需求 19。

## 功能特性

### 1. 节点状态计算逻辑

系统自动根据节点的时间信息计算其状态，支持以下四种状态：

- **completed (已完成)**: 节点已有完成时间
- **overdue (超期)**: 节点未完成且已超过截止日期
- **in_progress (进行中)**: 节点已开始但未完成，且未超期
- **pending (待处理)**: 节点尚未开始

#### 状态计算规则

```javascript
calculateNodeStatus(node) {
  // 规则 1: 如果有完成时间，状态为 completed
  if (node.completion_time) {
    return 'completed';
  }

  // 规则 2: 如果没有截止日期
  if (!node.deadline) {
    // 有开始时间 -> in_progress
    // 无开始时间 -> pending
    return node.start_time ? 'in_progress' : 'pending';
  }

  // 规则 3: 如果已超过截止日期，状态为 overdue
  const now = new Date();
  const deadline = new Date(node.deadline);
  if (now > deadline) {
    return 'overdue';
  }

  // 规则 4: 未超期的情况下
  // 有开始时间 -> in_progress
  // 无开始时间 -> pending
  return node.start_time ? 'in_progress' : 'pending';
}
```

### 2. 超期检查功能

系统提供超期检查功能，计算节点是否超期以及超期天数：

```javascript
checkNodeOverdue(node) {
  // 已完成或无截止日期的节点不算超期
  if (!node.deadline || node.completion_time) {
    return {
      isOverdue: false,
      overdueDays: 0
    };
  }

  const now = new Date();
  const deadline = new Date(node.deadline);
  const isOverdue = now > deadline;

  // 计算超期天数
  let overdueDays = 0;
  if (isOverdue) {
    const diffTime = Math.abs(now - deadline);
    overdueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  return {
    isOverdue,
    overdueDays,
    deadline: node.deadline
  };
}
```

### 3. 状态更新方式

系统提供多种状态更新方式：

#### 3.1 单个节点状态更新

```javascript
// 更新指定节点的状态
await ProcessNodeService.updateNodeStatus(nodeId);
```

#### 3.2 案件节点批量更新

```javascript
// 更新指定案件的所有节点状态
await ProcessNodeService.updateCaseNodesStatus(caseId);
```

#### 3.3 全局节点状态更新

```javascript
// 更新系统中所有节点的状态（适用于定时任务）
await ProcessNodeService.updateAllNodesStatus();
```

使用 SQL 批量更新，性能优异：

```sql
UPDATE process_nodes
SET status = CASE
  WHEN completion_time IS NOT NULL THEN 'completed'
  WHEN deadline IS NULL AND start_time IS NOT NULL THEN 'in_progress'
  WHEN deadline IS NULL THEN 'pending'
  WHEN datetime(deadline) < datetime('now') THEN 'overdue'
  WHEN start_time IS NOT NULL THEN 'in_progress'
  ELSE 'pending'
END,
updated_at = CURRENT_TIMESTAMP
WHERE status != [计算后的状态]
```

## API 接口

### 1. 获取节点列表（自动更新状态）

```http
GET /api/cases/:caseId/nodes?updateStatus=true
Authorization: Bearer {token}
```

**参数说明：**
- `updateStatus=true`: 在返回前自动更新所有节点状态

**响应示例：**
```json
{
  "data": {
    "nodes": [
      {
        "id": 1,
        "case_id": 1,
        "node_name": "立案审查",
        "status": "overdue",
        "deadline": "2024-10-10 17:00:00",
        ...
      }
    ]
  }
}
```

### 2. 批量更新所有节点状态

```http
POST /api/nodes/update-status
Authorization: Bearer {token}
```

**响应示例：**
```json
{
  "message": "成功更新 15 个节点的状态",
  "data": {
    "updated": 15
  }
}
```

### 3. 获取超期节点统计

```http
GET /api/nodes/overdue/statistics
Authorization: Bearer {token}
```

**响应示例：**
```json
{
  "data": {
    "total": 5,
    "affectedCases": 3,
    "nodes": [...],
    "byCaseId": {
      "1": [...],
      "2": [...]
    }
  }
}
```

### 4. 获取即将到期的节点

```http
GET /api/nodes/upcoming?days=3
Authorization: Bearer {token}
```

**参数说明：**
- `days`: 天数阈值，默认为 3 天

**响应示例：**
```json
{
  "data": {
    "nodes": [...],
    "threshold": 3
  }
}
```

### 5. 获取节点详情（包含超期信息）

```http
GET /api/nodes/:id/detail
Authorization: Bearer {token}
```

**响应示例：**
```json
{
  "data": {
    "node": {
      "id": 1,
      "node_name": "立案审查",
      "status": "overdue",
      "calculatedStatus": "overdue",
      "overdueInfo": {
        "isOverdue": true,
        "overdueDays": 35,
        "deadline": "2024-10-10 17:00:00"
      },
      ...
    }
  }
}
```

## 使用场景

### 场景 1: 案件详情页面加载

前端在加载案件详情时，自动更新并获取最新的节点状态：

```javascript
// 获取案件节点列表，自动更新状态
const response = await axios.get(
  `/api/cases/${caseId}/nodes?updateStatus=true`,
  { headers: { Authorization: `Bearer ${token}` } }
);

// 根据状态显示不同颜色
nodes.forEach(node => {
  if (node.status === 'overdue') {
    // 显示红色警告
  } else if (node.status === 'in_progress') {
    // 显示黄色进行中
  } else if (node.status === 'completed') {
    // 显示绿色已完成
  }
});
```

### 场景 2: 定时任务更新

使用 node-cron 创建定时任务，每天自动更新所有节点状态：

```javascript
const cron = require('node-cron');
const ProcessNodeService = require('./services/processNodeService');

// 每天凌晨 1 点更新所有节点状态
cron.schedule('0 1 * * *', async () => {
  console.log('开始更新所有节点状态...');
  const result = await ProcessNodeService.updateAllNodesStatus();
  console.log(result.message);
});
```

### 场景 3: 超期预警

在首页或提醒中心显示超期节点：

```javascript
// 获取超期节点统计
const response = await axios.get(
  '/api/nodes/overdue/statistics',
  { headers: { Authorization: `Bearer ${token}` } }
);

// 显示超期预警
if (response.data.data.total > 0) {
  showAlert(`您有 ${response.data.data.total} 个节点已超期`);
}
```

### 场景 4: 即将到期提醒

在首页显示即将到期的节点：

```javascript
// 获取 3 天内即将到期的节点
const response = await axios.get(
  '/api/nodes/upcoming?days=3',
  { headers: { Authorization: `Bearer ${token}` } }
);

// 显示提醒列表
response.data.data.nodes.forEach(node => {
  showNotification(`节点 "${node.node_name}" 将在 3 天内到期`);
});
```

## 测试

### 单元测试

运行单元测试验证状态计算逻辑：

```bash
cd backend
node test-node-status-calculation.js
```

测试覆盖：
- ✓ 已完成节点状态计算
- ✓ 超期节点状态计算
- ✓ 进行中节点状态计算
- ✓ 待处理节点状态计算
- ✓ 无截止日期节点状态计算
- ✓ 超期检查功能
- ✓ 超期天数计算

### API 集成测试

运行 API 集成测试（需要服务器运行）：

```bash
cd backend
npm start  # 在另一个终端启动服务器
node test-node-status-api.js
```

测试覆盖：
- ✓ 获取节点列表并自动更新状态
- ✓ 批量更新所有节点状态
- ✓ 获取超期节点统计
- ✓ 获取即将到期的节点
- ✓ 获取节点详情（包含超期信息）

## 性能优化

### 1. 批量更新优化

使用单条 SQL 语句批量更新所有节点状态，避免逐个更新：

```javascript
// 高效：一次 SQL 更新所有节点
await ProcessNodeService.updateAllNodesStatus();

// 低效：循环更新每个节点
for (const node of nodes) {
  await ProcessNodeService.updateNodeStatus(node.id);
}
```

### 2. 按需更新

只在需要时更新状态，避免不必要的数据库操作：

```javascript
// 只更新状态发生变化的节点
if (node.status !== newStatus) {
  await ProcessNode.update(nodeId, { status: newStatus });
}
```

### 3. 数据库索引

确保在 `deadline` 和 `status` 字段上创建索引，提高查询性能：

```sql
CREATE INDEX idx_process_nodes_deadline ON process_nodes(deadline);
CREATE INDEX idx_process_nodes_status ON process_nodes(status);
```

## 扩展建议

### 1. 状态变更通知

当节点状态从 `in_progress` 变为 `overdue` 时，自动发送通知：

```javascript
if (oldStatus === 'in_progress' && newStatus === 'overdue') {
  await NotificationService.sendOverdueAlert(node);
}
```

### 2. 状态变更历史

记录节点状态变更历史，便于追溯：

```javascript
await StatusHistory.create({
  node_id: node.id,
  old_status: oldStatus,
  new_status: newStatus,
  changed_at: new Date()
});
```

### 3. 自定义状态规则

支持用户自定义状态计算规则，例如提前 N 天标记为"即将超期"状态。

## 总结

节点状态计算逻辑已完整实现，包括：

✅ 自动计算节点状态（待处理/进行中/已完成/超期）  
✅ 检查节点是否超期及超期天数  
✅ 单个节点状态更新  
✅ 批量节点状态更新  
✅ 超期节点统计  
✅ 即将到期节点查询  
✅ 完整的 API 接口  
✅ 单元测试和集成测试  

该实现满足需求 8（流程节点状态展示）和需求 19（超期预警）的要求。
