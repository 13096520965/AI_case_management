# 归档管理 API 快速参考

## 基础信息

- **Base URL**: `http://localhost:3000/api/archive`
- **认证方式**: Bearer Token (JWT)
- **请求头**: `Authorization: Bearer YOUR_TOKEN`

## API 端点总览

### 结案报告管理

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/closure-report` | 创建结案报告 |
| GET | `/closure-report/:caseId` | 获取结案报告（按案件ID） |
| PUT | `/closure-report/:id` | 更新结案报告 |

### 归档包管理

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/package` | 创建归档包 |
| GET | `/search` | 检索归档案件 |
| GET | `/package/:id` | 获取归档包详情 |

### 案例知识库

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/knowledge` | 创建案例知识 |
| GET | `/knowledge` | 检索案例知识库 |
| GET | `/knowledge/statistics` | 获取统计信息 |
| GET | `/knowledge/:id` | 获取案例知识详情 |
| PUT | `/knowledge/:id` | 更新案例知识 |

## 快速示例

### 1. 创建结案报告

```javascript
// 请求
POST /api/archive/closure-report
{
  "case_id": 1,
  "case_summary": "本案为合同纠纷案件",
  "case_result": "胜诉",
  "experience_summary": "关键在于证据链完整性",
  "risk_warnings": "注意合同条款明确性",
  "lessons_learned": "及时固定证据",
  "created_by": "张律师",
  "approval_status": "draft"
}

// 响应
{
  "message": "结案报告创建成功",
  "data": {
    "report": {
      "id": 1,
      "case_id": 1,
      "case_summary": "本案为合同纠纷案件",
      "approval_status": "draft",
      ...
    }
  }
}
```

### 2. 创建归档包

```javascript
// 请求
POST /api/archive/package
{
  "case_id": 1,
  "archived_by": "张律师",
  "notes": "案件已结案，材料齐全"
}

// 响应
{
  "message": "归档包创建成功",
  "data": {
    "package": {
      "id": 1,
      "archive_number": "AR202411000001",
      "archive_date": "2024-11-17",
      ...
    },
    "summary": {
      "case": {...},
      "parties_count": 2,
      "nodes_count": 5,
      "evidence_count": 10,
      "documents_count": 8,
      "costs_count": 3
    }
  }
}
```

### 3. 检索归档案件

```javascript
// 请求
GET /api/archive/search?case_cause=合同&page=1&limit=10

// 响应
{
  "data": {
    "packages": [
      {
        "id": 1,
        "archive_number": "AR202411000001",
        "case_number": "（2024）京0105民初12345号",
        "case_cause": "合同纠纷",
        ...
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

### 4. 创建案例知识

```javascript
// 请求
POST /api/archive/knowledge
{
  "case_id": 1,
  "case_cause": "合同纠纷",
  "dispute_focus": "合同履行义务的认定",
  "legal_issues": "合同法第107条、第113条的适用",
  "case_result": "胜诉",
  "key_evidence": "合同原件、付款凭证、催告函",
  "legal_basis": "《民法典》合同编相关规定",
  "case_analysis": "本案争议焦点在于被告是否履行了合同约定的义务",
  "keywords": "合同纠纷,违约责任,损害赔偿",
  "tags": "民事,合同,胜诉",
  "win_rate_reference": 85.5,
  "created_by": "张律师"
}

// 响应
{
  "message": "案例知识创建成功",
  "data": {
    "knowledge": {
      "id": 1,
      "case_cause": "合同纠纷",
      ...
    }
  }
}
```

### 5. 检索案例知识库

```javascript
// 请求
GET /api/archive/knowledge?keywords=合同&case_result=胜诉&page=1&limit=10

// 响应
{
  "data": {
    "knowledge": [
      {
        "id": 1,
        "case_cause": "合同纠纷",
        "case_result": "胜诉",
        "win_rate_reference": 85.5,
        ...
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

## 查询参数说明

### 归档案件检索 (`/search`)

| 参数 | 类型 | 说明 |
|------|------|------|
| page | number | 页码（默认1） |
| limit | number | 每页数量（默认10） |
| archive_number | string | 归档编号（模糊） |
| case_number | string | 案号（模糊） |
| case_cause | string | 案由（模糊） |
| archive_date_from | date | 归档日期起始 |
| archive_date_to | date | 归档日期结束 |
| archived_by | string | 归档人 |

### 案例知识库检索 (`/knowledge`)

| 参数 | 类型 | 说明 |
|------|------|------|
| page | number | 页码（默认1） |
| limit | number | 每页数量（默认10） |
| case_cause | string | 案由（模糊） |
| dispute_focus | string | 争议焦点（模糊） |
| keywords | string | 关键词（模糊，全文） |
| tags | string | 标签（模糊） |
| case_result | string | 案件结果（精确） |

## 归档编号规则

格式：`AR + 年份(4位) + 月份(2位) + 序号(6位)`

示例：
- `AR202411000001` - 2024年11月第1个归档
- `AR202411000002` - 2024年11月第2个归档
- `AR202412000001` - 2024年12月第1个归档

## 常见错误码

| 状态码 | 说明 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 未认证或令牌无效 |
| 404 | 资源不存在 |
| 409 | 资源冲突（如重复创建） |
| 500 | 服务器内部错误 |

## 业务规则

1. **结案报告**: 每个案件只能有一个结案报告
2. **归档包**: 每个案件只能有一个归档包
3. **归档编号**: 自动生成，不可修改
4. **案例知识**: 可以独立创建，也可以关联案件或归档包
5. **审批状态**: draft（草稿）、approved（已批准）、rejected（已拒绝）

## 测试命令

```bash
# 运行完整测试
node test-archive-api.js

# 测试前确保：
# 1. 后端服务已启动（端口3000）
# 2. 数据库已初始化
# 3. 测试用户已创建（testuser/password123）
```

## 相关文档

- [完整实施文档](./ARCHIVE-API-IMPLEMENTATION.md)
- [数据库设计](./src/config/initDatabase.js)
- [API 测试脚本](./test-archive-api.js)
