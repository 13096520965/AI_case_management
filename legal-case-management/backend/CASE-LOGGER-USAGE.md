# 案件日志中间件使用指南

## 概述

`caseLogger` 中间件用于自动记录案件相关的操作日志，包括查看、创建、更新、删除等操作。

## 基本使用

### 1. 导入中间件

```javascript
const { logCaseAction } = require('../middleware/caseLogger');
```

### 2. 在路由中使用

```javascript
router.get('/:id', 
  authenticate,                              // 认证中间件
  logCaseAction('VIEW_CASE', '查看案件详情'),  // 日志中间件
  caseController.getCaseById                 // 控制器
);
```

## 操作类型

推荐使用以下操作类型常量：

| 操作类型 | 描述 | 使用场景 |
|---------|------|---------|
| `VIEW_CASE` | 查看案件 | 获取案件详情 |
| `CREATE_CASE` | 创建案件 | 新建案件 |
| `UPDATE_CASE` | 更新案件 | 修改案件信息 |
| `DELETE_CASE` | 删除案件 | 删除案件 |
| `EXPORT_CASE` | 导出案件 | 导出案件数据 |
| `ARCHIVE_CASE` | 归档案件 | 案件归档 |
| `CLOSE_CASE` | 结案 | 案件结案 |

## 记录的信息

中间件会自动记录以下信息：

- **case_id**: 案件ID（从 `req.params.id` 或 `req.params.caseId` 获取）
- **action_type**: 操作类型（如 'VIEW_CASE'）
- **action_description**: 操作描述（如 '查看案件详情'）
- **operator_id**: 操作人ID（从 `req.user.id` 获取）
- **operator_name**: 操作人姓名（从 `req.user.username` 或 `req.user.real_name` 获取）
- **ip_address**: IP地址（从 `req.ip` 获取）
- **user_agent**: 用户代理（从请求头获取）
- **related_data**: 相关数据（JSON格式，包含请求方法、路径、参数等）

## 示例

### 查看案件详情

```javascript
router.get('/:id', 
  authenticate, 
  logCaseAction('VIEW_CASE', '查看案件详情'), 
  caseController.getCaseById
);
```

### 更新案件信息

```javascript
router.put('/:id', 
  authenticate, 
  logCaseAction('UPDATE_CASE', '更新案件信息'), 
  caseController.updateCase
);
```

### 删除案件

```javascript
router.delete('/:id', 
  authenticate, 
  logCaseAction('DELETE_CASE', '删除案件'), 
  caseController.deleteCase
);
```

### 导出案件

```javascript
router.get('/:id/export', 
  authenticate, 
  logCaseAction('EXPORT_CASE', '导出案件数据'), 
  caseController.exportCase
);
```

## 查询日志

### 获取案件的所有日志

```javascript
const logs = await query(
  'SELECT * FROM case_logs WHERE case_id = ? ORDER BY created_at DESC',
  [caseId]
);
```

### 按操作类型查询

```javascript
const logs = await query(
  'SELECT * FROM case_logs WHERE case_id = ? AND action_type = ? ORDER BY created_at DESC',
  [caseId, 'UPDATE_CASE']
);
```

### 按操作人查询

```javascript
const logs = await query(
  'SELECT * FROM case_logs WHERE operator_name = ? ORDER BY created_at DESC',
  [operatorName]
);
```

### 按时间范围查询

```javascript
const logs = await query(
  `SELECT * FROM case_logs 
   WHERE case_id = ? 
   AND created_at BETWEEN ? AND ? 
   ORDER BY created_at DESC`,
  [caseId, startDate, endDate]
);
```

## 注意事项

1. **异步记录**: 日志记录是异步的，不会阻塞响应
2. **仅记录成功操作**: 只有响应状态码为 2xx 时才记录日志
3. **错误处理**: 日志记录失败不会影响主要业务流程
4. **案件ID必需**: 如果请求中没有案件ID，不会记录日志
5. **认证信息**: 需要在 `authenticate` 中间件之后使用，以获取用户信息

## 扩展

如果需要记录额外的信息，可以在控制器中手动调用：

```javascript
const { run } = require('../config/database');

await run(`
  INSERT INTO case_logs (
    case_id, action_type, action_description, 
    operator_id, operator_name, ip_address, 
    user_agent, related_data
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`, [
  caseId,
  'CUSTOM_ACTION',
  '自定义操作',
  req.user?.id,
  req.user?.username,
  req.ip,
  req.get('user-agent'),
  JSON.stringify({ custom: 'data' })
]);
```

## 性能优化

- 已为 `case_id` 和 `action_type` 创建索引
- 日志记录使用 `setImmediate` 异步执行
- 建议定期归档或清理旧日志数据
