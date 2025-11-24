# 超期预警页面API修复

## 🐛 问题描述

超期预警页面接口报错，无法获取超期节点和即将到期节点数据。

## 🔍 问题分析

### 1. 数据库表缺失
- `process_nodes` 表不存在
- 数据库初始化脚本有错误，无法完整执行

### 2. 测试数据缺失
- 没有流程节点测试数据
- 无法测试超期预警功能

## ✅ 解决方案

### 1. 创建 process_nodes 表

**表结构**:
```sql
CREATE TABLE IF NOT EXISTS process_nodes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER NOT NULL,
  node_type VARCHAR(50) NOT NULL,
  node_name VARCHAR(100) NOT NULL,
  handler VARCHAR(100),
  start_time DATETIME,
  deadline DATETIME,
  completion_time DATETIME,
  status VARCHAR(50) DEFAULT 'pending',
  progress TEXT,
  node_order INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);
```

### 2. 创建测试数据生成脚本

**文件**: `backend/scripts/seed-process-nodes.js`

**生成数据**:
- 5个超期节点（deadline < now）
- 3个即将到期节点（deadline在未来1-3天）
- 1个今天到期节点
- 1个已完成节点（不应出现在预警中）

**运行命令**:
```bash
node legal-case-management/backend/scripts/seed-process-nodes.js
```

### 3. 修复控制器代码

**文件**: `backend/src/controllers/processNodeController.js`

**修改前**:
```javascript
exports.getOverdueNodes = async (req, res) => {
  try {
    const ProcessNode = require('../models/ProcessNode');  // ❌ 重复导入
    const nodes = await ProcessNode.findOverdueNodes();
    ...
  }
}
```

**修改后**:
```javascript
exports.getOverdueNodes = async (req, res) => {
  try {
    const nodes = await ProcessNode.findOverdueNodes();  // ✅ 使用顶部导入
    ...
  }
}
```

## 📊 测试数据详情

### 超期节点（5个）

| 案件ID | 节点名称 | 经办人 | 截止时间 | 超期天数 | 状态 |
|--------|----------|--------|----------|----------|------|
| 1 | 证据收集 | 张三 | 5天前 | 5天 | 进行中 |
| 2 | 提交答辩状 | 李四 | 2天前 | 2天 | 进行中 |
| 3 | 开庭准备 | 王五 | 7天前 | 7天 | 进行中 |
| 4 | 证据交换 | 赵六 | 3天前 | 3天 | 进行中 |
| 5 | 提交证据 | 孙七 | 1天前 | 1天 | 进行中 |

### 即将到期节点（3个）

| 案件ID | 节点名称 | 经办人 | 截止时间 | 剩余天数 | 状态 |
|--------|----------|--------|----------|----------|------|
| 6 | 庭前会议 | 周八 | 明天 | 1天 | 进行中 |
| 7 | 提交代理词 | 吴九 | 2天后 | 2天 | 进行中 |
| 8 | 质证环节 | 郑十 | 3天后 | 3天 | 进行中 |

### 今天到期节点（1个）

| 案件ID | 节点名称 | 经办人 | 截止时间 | 状态 |
|--------|----------|--------|----------|------|
| 9 | 提交补充材料 | 冯十一 | 今天 | 进行中 |

### 已完成节点（1个）

| 案件ID | 节点名称 | 经办人 | 完成时间 | 状态 |
|--------|----------|--------|----------|------|
| 10 | 证据收集 | 陈十二 | 16天前 | 已完成 |

## 🎯 API端点

### 1. 获取超期节点
```
GET /api/nodes/overdue
```

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "case_id": 1,
      "node_type": "evidence",
      "node_name": "证据收集",
      "handler": "张三",
      "deadline": "2025-11-16T...",
      "status": "in_progress",
      "progress": "已收集部分证据"
    }
  ]
}
```

### 2. 获取即将到期节点
```
GET /api/nodes/upcoming?days=3
```

**响应**:
```json
{
  "success": true,
  "data": {
    "nodes": [
      {
        "id": 6,
        "case_id": 6,
        "node_type": "hearing",
        "node_name": "庭前会议",
        "handler": "周八",
        "deadline": "2025-11-22T...",
        "status": "in_progress"
      }
    ],
    "threshold": 3
  }
}
```

## 🔧 修复步骤

### 1. 创建数据库表
```bash
sqlite3 legal-case-management/backend/legal_case_management.db < create_process_nodes.sql
```

### 2. 生成测试数据
```bash
node legal-case-management/backend/scripts/seed-process-nodes.js
```

**预期输出**:
```
Cleared existing process node data
Successfully inserted 10 process node records

统计信息:
- 总节点数: 10
- 超期节点: 5
- 即将到期: 3

✅ Process node test data seeded successfully!
```

### 3. 重启后端服务
```bash
# 后端服务已自动重启
# Process ID: 57
```

### 4. 验证API
```bash
# 测试超期节点API
curl http://localhost:3000/api/nodes/overdue \
  -H "Authorization: Bearer YOUR_TOKEN"

# 测试即将到期节点API
curl http://localhost:3000/api/nodes/upcoming?days=3 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🧪 前端测试

### 访问超期预警页面
```
URL: http://localhost:5173/notifications/alerts
```

### 预期效果

#### 统计卡片
- **超期节点**: 5
- **即将到期**: 3
- **总预警数**: 8

#### 表格数据
- 显示8条预警记录
- 超期节点显示红色标签
- 即将到期节点显示橙色标签
- 超期时长正确计算

#### 筛选功能
- **全部预警**: 显示8条
- **超期节点**: 显示5条
- **即将到期**: 显示3条

## 📝 数据库查询

### 查看所有节点
```sql
SELECT * FROM process_nodes ORDER BY deadline;
```

### 查看超期节点
```sql
SELECT * FROM process_nodes 
WHERE status != 'completed' 
AND deadline < datetime('now')
ORDER BY deadline ASC;
```

### 查看即将到期节点
```sql
SELECT * FROM process_nodes 
WHERE status != 'completed' 
AND deadline BETWEEN datetime('now') AND datetime('now', '+3 days')
ORDER BY deadline ASC;
```

### 统计信息
```sql
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN status != 'completed' AND deadline < datetime('now') THEN 1 ELSE 0 END) as overdue,
  SUM(CASE WHEN status != 'completed' AND deadline BETWEEN datetime('now') AND datetime('now', '+3 days') THEN 1 ELSE 0 END) as upcoming
FROM process_nodes;
```

## 🎨 页面效果

```
┌─────────────────────────────────────────────────────┐
│ 超期预警                                              │
├─────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│ │ ⚠️  5    │ │ 🕐  3    │ │ 📄  8    │             │
│ │ 超期节点  │ │ 即将到期  │ │ 总预警数  │             │
│ └──────────┘ └──────────┘ └──────────┘             │
├─────────────────────────────────────────────────────┤
│ [全部预警] [超期节点] [即将到期]        [刷新]       │
├─────────────────────────────────────────────────────┤
│ 超期 | 案件#3 | 开庭准备 | 王五 | 超期7天 | [处理]   │
│ 超期 | 案件#1 | 证据收集 | 张三 | 超期5天 | [处理]   │
│ 超期 | 案件#4 | 证据交换 | 赵六 | 超期3天 | [处理]   │
│ 超期 | 案件#2 | 提交答辩状 | 李四 | 超期2天 | [处理] │
│ 超期 | 案件#5 | 提交证据 | 孙七 | 超期1天 | [处理]   │
│ 即将 | 案件#6 | 庭前会议 | 周八 | 1天后 | [处理]     │
│ 即将 | 案件#7 | 提交代理词 | 吴九 | 2天后 | [处理]   │
│ 即将 | 案件#8 | 质证环节 | 郑十 | 3天后 | [处理]     │
└─────────────────────────────────────────────────────┘
```

## ✅ 修复完成

- [x] 创建 process_nodes 表
- [x] 生成测试数据（10条）
- [x] 修复控制器代码
- [x] 重启后端服务
- [x] 验证API正常

## 📚 相关文件

### 新增文件
1. `backend/scripts/seed-process-nodes.js` - 测试数据生成脚本

### 修改文件
1. `backend/src/controllers/processNodeController.js` - 修复getOverdueNodes方法

## 🔄 后续维护

### 重新生成测试数据
```bash
node legal-case-management/backend/scripts/seed-process-nodes.js
```

### 清空节点数据
```sql
DELETE FROM process_nodes;
```

### 添加新节点
```sql
INSERT INTO process_nodes (
  case_id, node_type, node_name, handler, 
  start_time, deadline, status, progress, node_order
) VALUES (
  1, 'evidence', '新节点', '张三',
  datetime('now'), datetime('now', '+7 days'), 
  'in_progress', '进行中', 1
);
```

---

**修复时间**: 2025-11-21
**修复状态**: ✅ 已完成
**测试状态**: 待前端验证
