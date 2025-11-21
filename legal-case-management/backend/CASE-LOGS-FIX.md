# 案件日志表结构修复说明

## 问题描述

系统在记录案件日志时报错：
```
Error: SQLITE_ERROR: table case_logs has no column named action_type
```

## 问题原因

`case_logs` 表的原始结构只包含基础字段：
- id
- case_id
- operator
- action
- created_at

但代码尝试插入更详细的日志信息，包括：
- action_type (操作类型)
- action_description (操作描述)
- operator_id (操作人ID)
- operator_name (操作人姓名)
- ip_address (IP地址)
- user_agent (用户代理)
- related_data (相关数据)

## 解决方案

### 1. 数据库迁移

创建了迁移脚本 `src/config/migrations/002_update_case_logs_schema.js`，将 `case_logs` 表结构更新为：

```sql
CREATE TABLE case_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER NOT NULL,
  action_type VARCHAR(50),
  action_description TEXT,
  operator_id INTEGER,
  operator_name VARCHAR(100),
  operator VARCHAR(100),          -- 保留旧字段以兼容
  action TEXT,                     -- 保留旧字段以兼容
  ip_address VARCHAR(50),
  user_agent TEXT,
  related_data TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);
```

### 2. 创建案件日志中间件

创建了 `src/middleware/caseLogger.js` 中间件，用于自动记录案件操作：

```javascript
const { logCaseAction } = require('../middleware/caseLogger');

// 使用示例
router.get('/:id', authenticate, logCaseAction('VIEW_CASE', '查看案件详情'), caseController.getCaseById);
```

### 3. 更新路由

在 `src/routes/case.js` 中为以下操作添加了日志记录：
- 创建案件 (CREATE_CASE)
- 查看案件详情 (VIEW_CASE)
- 更新案件信息 (UPDATE_CASE)
- 删除案件 (DELETE_CASE)

### 4. 更新初始化脚本

更新了 `src/config/initDatabase.js`，确保新建数据库时使用正确的表结构。

## 执行的迁移

运行了以下脚本完成数据库迁移：
```bash
node migrate-actual-db.js
```

迁移过程：
1. 创建新表 `case_logs_new` 包含所有新字段
2. 将旧表数据迁移到新表（operator → operator_name, action → action_description）
3. 删除旧表
4. 重命名新表为 `case_logs`
5. 创建索引以提高查询性能

## 验证

运行测试脚本验证功能：
```bash
node test-case-logger.js
```

测试结果：
- ✓ 日志插入成功
- ✓ 日志查询成功
- ✓ 所有字段正确保存

## 新增的索引

为提高查询性能，添加了以下索引：
- `idx_case_logs_case_id` - 按案件ID查询
- `idx_case_logs_action_type` - 按操作类型查询

## 兼容性

- 保留了旧的 `operator` 和 `action` 字段，确保向后兼容
- 新代码使用 `action_type`、`action_description`、`operator_name` 等新字段
- 旧数据在迁移时自动映射到新字段

## 相关文件

- `src/config/migrations/002_update_case_logs_schema.js` - 迁移脚本
- `src/middleware/caseLogger.js` - 日志中间件
- `src/routes/case.js` - 更新的路由
- `src/config/initDatabase.js` - 更新的初始化脚本
- `migrate-actual-db.js` - 迁移执行脚本
- `test-case-logger.js` - 测试脚本
- `verify-case-logs-schema.js` - 验证脚本
