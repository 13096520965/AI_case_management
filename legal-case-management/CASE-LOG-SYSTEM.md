# 案件独立日志系统

## 📋 功能概述

案件独立日志系统用于记录案件的所有操作，便于溯源案件流程和追踪责任人。系统自动记录每一次操作的详细信息，包括操作人、操作时间、操作类型、IP地址等。

## ✨ 核心功能

### 1. 自动日志记录
- ✅ 案件创建、编辑、删除
- ✅ 诉讼主体添加、编辑、删除
- ✅ 证据上传、更新、删除、下载
- ✅ 文书添加、生成、删除
- ✅ 流程节点操作
- ✅ 成本记录操作
- ✅ 状态变更

### 2. 详细信息记录
每条日志包含以下信息：
- **操作时间**: 精确到秒
- **操作类型**: 标准化的操作类型代码
- **操作描述**: 人类可读的操作说明
- **操作人ID**: 用户唯一标识
- **操作人姓名**: 便于识别
- **IP地址**: 操作来源IP
- **用户代理**: 浏览器/客户端信息
- **相关数据**: JSON格式的详细数据

### 3. 强大的查询功能
- 按操作类型筛选
- 按操作人筛选
- 按时间范围筛选
- 分页浏览
- 导出日志

## 🗂️ 数据库结构

### case_logs 表

```sql
CREATE TABLE case_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER NOT NULL,                    -- 案件ID
  action_type VARCHAR(50),                     -- 操作类型
  action_description TEXT,                     -- 操作描述
  operator_id INTEGER,                         -- 操作人ID
  operator_name VARCHAR(100),                  -- 操作人姓名
  ip_address VARCHAR(50),                      -- IP地址
  user_agent TEXT,                             -- 用户代理
  related_data TEXT,                           -- 相关数据(JSON)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- 兼容旧字段
  operator VARCHAR(100),                       -- 旧版操作人字段
  action TEXT,                                 -- 旧版操作描述字段
  
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX idx_case_logs_case_id ON case_logs(case_id);
CREATE INDEX idx_case_logs_action_type ON case_logs(action_type);
```

## 📝 操作类型定义

### 案件操作
- `CREATE_CASE` - 创建案件
- `UPDATE_CASE` - 编辑案件
- `DELETE_CASE` - 删除案件
- `VIEW_CASE` - 查看案件

### 诉讼主体操作
- `ADD_PARTY` - 添加诉讼主体
- `UPDATE_PARTY` - 编辑诉讼主体
- `DELETE_PARTY` - 删除诉讼主体

### 证据操作
- `ADD_EVIDENCE` - 添加证据
- `UPDATE_EVIDENCE` - 更新证据
- `DELETE_EVIDENCE` - 删除证据
- `DOWNLOAD_EVIDENCE` - 下载证据

### 文书操作
- `ADD_DOCUMENT` - 添加文书
- `UPDATE_DOCUMENT` - 更新文书
- `DELETE_DOCUMENT` - 删除文书
- `GENERATE_DOCUMENT` - 生成文书

### 流程操作
- `ADD_PROCESS_NODE` - 添加流程节点
- `UPDATE_PROCESS_NODE` - 更新流程节点
- `DELETE_PROCESS_NODE` - 删除流程节点
- `COMPLETE_PROCESS_NODE` - 完成流程节点

### 成本操作
- `ADD_COST` - 添加成本记录
- `UPDATE_COST` - 更新成本记录
- `DELETE_COST` - 删除成本记录

### 其他操作
- `STATUS_CHANGE` - 状态变更
- `EXPORT_DATA` - 导出数据
- `IMPORT_DATA` - 导入数据

## 🔧 后端实现

### 1. 日志工具类

**文件**: `backend/src/utils/caseLogger.js`

```javascript
const { logCaseAction, ACTION_TYPES } = require('../utils/caseLogger');

// 记录案件创建
await logCaseAction({
  caseId: 123,
  actionType: ACTION_TYPES.CREATE_CASE,
  actionDescription: '创建案件 (案号: (2024)京0105民初11111号)',
  operatorId: req.user.id,
  operatorName: req.user.username,
  ipAddress: req.ip,
  userAgent: req.get('user-agent'),
  relatedData: {
    case_number: '(2024)京0105民初11111号',
    case_type: '民事'
  }
});
```

### 2. 便捷方法

```javascript
const { 
  logCaseCreate,
  logCaseUpdate,
  logPartyAdd,
  logPartyUpdate,
  logPartyDelete,
  logEvidenceAction,
  logStatusChange
} = require('../utils/caseLogger');

// 记录案件创建
await logCaseCreate(caseId, caseInfo, req);

// 记录诉讼主体添加
await logPartyAdd(caseId, partyInfo, req);

// 记录状态变更
await logStatusChange(caseId, '立案', '审理中', req);
```

### 3. API接口

**获取案件日志**
```
GET /api/cases/:id/logs?page=1&limit=20
```

**响应示例**:
```json
{
  "data": {
    "logs": [
      {
        "id": 1,
        "case_id": 123,
        "action_type": "CREATE_CASE",
        "action_description": "创建案件 (案号: (2024)京0105民初11111号)",
        "operator_id": 1,
        "operator_name": "张三",
        "ip_address": "192.168.1.100",
        "user_agent": "Mozilla/5.0...",
        "related_data": "{\"case_number\":\"(2024)京0105民初11111号\"}",
        "created_at": "2024-11-21 10:30:00"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

## 🎨 前端实现

### 1. 日志查看器组件

**文件**: `frontend/src/components/case/CaseLogViewer.vue`

**功能特性**:
- 📊 表格展示日志列表
- 🔍 多条件筛选（操作类型、操作人、时间范围）
- 📄 分页浏览
- 🔄 刷新功能
- 📥 导出日志
- 👁️ 查看详情

**使用方式**:
```vue
<template>
  <CaseLogViewer :case-id="123" />
</template>

<script setup>
import CaseLogViewer from '@/components/case/CaseLogViewer.vue'
</script>
```

### 2. 在案件详情页集成

**文件**: `frontend/src/views/case/CaseDetail.vue`

日志查看器已集成到案件详情页面底部，自动加载当前案件的所有操作日志。

## 📊 日志展示效果

### 列表视图
```
┌────┬──────────────────────┬──────────┬────────────────────────┬────────┬──────────────┬────────┐
│ #  │ 操作时间              │ 操作类型  │ 操作描述                │ 操作人  │ IP地址        │ 操作   │
├────┼──────────────────────┼──────────┼────────────────────────┼────────┼──────────────┼────────┤
│ 1  │ 2024-11-21 10:30:00  │ 创建案件  │ 创建案件 (案号: ...)    │ 张三   │ 192.168.1.100│ 详情   │
│ 2  │ 2024-11-21 10:35:00  │ 添加主体  │ 添加诉讼主体: 原告-...  │ 张三   │ 192.168.1.100│ 详情   │
│ 3  │ 2024-11-21 10:40:00  │ 添加证据  │ 添加证据: 合同文件      │ 李四   │ 192.168.1.101│ 详情   │
│ 4  │ 2024-11-21 11:00:00  │ 状态变更  │ 案件状态变更: 立案→审理中│ 王五   │ 192.168.1.102│ 详情   │
└────┴──────────────────────┴──────────┴────────────────────────┴────────┴──────────────┴────────┘
```

### 详情视图
```
┌─────────────────────────────────────────────────────────┐
│ 日志详情                                                 │
├─────────────────────────────────────────────────────────┤
│ 操作时间:   2024-11-21 10:30:00                         │
│ 操作类型:   [创建案件]                                   │
│ 操作描述:   创建案件 (案号: (2024)京0105民初11111号)     │
│ 操作人ID:   1                                           │
│ 操作人姓名: 张三                                         │
│ IP地址:     192.168.1.100                               │
│ 用户代理:   Mozilla/5.0 (Windows NT 10.0; Win64; x64)  │
│ 相关数据:   {                                           │
│               "case_number": "(2024)京0105民初11111号",  │
│               "case_type": "民事",                       │
│               "case_cause": "合同纠纷"                   │
│             }                                           │
└─────────────────────────────────────────────────────────┘
```

## 🔍 筛选功能

### 按操作类型筛选
选择特定的操作类型，只显示该类型的日志记录。

### 按操作人筛选
输入操作人姓名，模糊匹配相关日志。

### 按时间范围筛选
选择开始和结束日期，查看特定时间段的日志。

## 📥 导出功能

支持将日志导出为以下格式：
- CSV - 表格数据
- JSON - 完整数据
- PDF - 打印报告

## 🎯 使用场景

### 1. 责任追溯
当案件出现问题时，可以通过日志快速定位：
- 谁在什么时间做了什么操作
- 操作的详细内容是什么
- 操作是否符合规范

### 2. 流程审计
定期审查案件操作日志，确保：
- 所有操作都有记录
- 操作符合业务流程
- 没有异常操作

### 3. 数据恢复
如果数据被误删除或修改，可以通过日志：
- 查看原始数据
- 了解变更历史
- 辅助数据恢复

### 4. 性能分析
通过日志分析：
- 哪些操作最频繁
- 哪些用户最活跃
- 系统使用模式

## 🔒 安全性

### 1. 日志不可修改
日志一旦创建，不允许修改或删除（除非删除整个案件）。

### 2. 完整性保护
- 记录IP地址和用户代理
- 记录操作的详细数据
- 时间戳精确到秒

### 3. 访问控制
只有有权限查看案件的用户才能查看该案件的日志。

## 📋 相关文件

### 后端
| 文件 | 说明 |
|------|------|
| `backend/src/utils/caseLogger.js` | 日志工具类（新增） |
| `backend/src/middleware/caseLogger.js` | 日志中间件 |
| `backend/src/controllers/caseController.js` | 案件控制器（含日志记录） |
| `backend/src/models/Case.js` | 案件模型（含日志方法） |
| `backend/src/config/initDatabase.js` | 数据库初始化（含日志表） |

### 前端
| 文件 | 说明 |
|------|------|
| `frontend/src/components/case/CaseLogViewer.vue` | 日志查看器组件（新增） |
| `frontend/src/views/case/CaseDetail.vue` | 案件详情页（已集成日志） |
| `frontend/src/api/case.ts` | 案件API（含日志接口） |

## 🚀 快速开始

### 1. 查看案件日志

进入任意案件详情页面，滚动到底部即可看到"案件操作日志"卡片。

### 2. 筛选日志

使用顶部的筛选条件，可以按操作类型、操作人、时间范围筛选日志。

### 3. 查看详情

点击日志记录右侧的"详情"按钮，可以查看该操作的完整信息。

### 4. 导出日志

点击"导出日志"按钮，可以将当前筛选的日志导出为文件。

## 🎉 功能优势

1. **完整性** - 记录所有操作，无遗漏
2. **可追溯** - 每个操作都有明确的责任人
3. **易查询** - 强大的筛选和搜索功能
4. **安全性** - 日志不可篡改，保证真实性
5. **易用性** - 直观的界面，简单的操作

## 📞 技术支持

如有问题或建议，请联系开发团队。
