# 诉讼主体管理 API 实现总结

## 任务概述

实现任务 6.2 - 诉讼主体管理接口，包括添加、查询、更新、删除诉讼主体，以及主体历史案件关联查询功能。

## 实现的接口

### 1. POST /api/cases/:caseId/parties
**功能**: 添加诉讼主体到指定案件

**请求参数**:
```json
{
  "party_type": "原告/被告/第三人",
  "entity_type": "企业/个人",
  "name": "主体名称",
  "unified_credit_code": "统一社会信用代码（企业）",
  "legal_representative": "法定代表人（企业）",
  "id_number": "身份证号（个人）",
  "contact_phone": "联系电话",
  "contact_email": "联系邮箱",
  "address": "地址"
}
```

**响应示例**:
```json
{
  "message": "诉讼主体添加成功",
  "data": {
    "party": {
      "id": 5,
      "case_id": 22,
      "party_type": "原告",
      "entity_type": "企业",
      "name": "测试科技有限公司",
      ...
    }
  }
}
```

### 2. GET /api/cases/:caseId/parties
**功能**: 获取指定案件的所有诉讼主体列表

**响应示例**:
```json
{
  "data": {
    "parties": [
      {
        "id": 5,
        "case_id": 22,
        "party_type": "原告",
        "entity_type": "企业",
        "name": "测试科技有限公司",
        ...
      },
      {
        "id": 6,
        "case_id": 22,
        "party_type": "被告",
        "entity_type": "个人",
        "name": "李四",
        ...
      }
    ]
  }
}
```

### 3. PUT /api/parties/:id
**功能**: 更新诉讼主体信息

**请求参数**: 支持更新任意字段
```json
{
  "contact_phone": "010-87654321",
  "contact_email": "updated@company.com",
  "address": "北京市朝阳区更新路999号"
}
```

**响应示例**:
```json
{
  "message": "诉讼主体更新成功",
  "data": {
    "party": {
      "id": 5,
      "contact_phone": "010-87654321",
      "contact_email": "updated@company.com",
      ...
    }
  }
}
```

### 4. DELETE /api/parties/:id
**功能**: 删除诉讼主体

**响应示例**:
```json
{
  "message": "诉讼主体删除成功"
}
```

### 5. GET /api/parties/history?name=主体名称
**功能**: 查询指定主体的历史案件

**查询参数**:
- `name`: 主体名称（必填）

**响应示例**:
```json
{
  "data": {
    "name": "测试科技有限公司",
    "cases": [
      {
        "id": 22,
        "case_number": "TEST-PARTY-1763100190136",
        "case_cause": "合同纠纷",
        "target_amount": 100000,
        ...
      },
      {
        "id": 23,
        "case_number": "TEST-HISTORY-1763100190162",
        "case_cause": "借款纠纷",
        "target_amount": 50000,
        ...
      }
    ],
    "total": 2
  }
}
```

## 实现文件

### 1. 数据模型层
**文件**: `src/models/LitigationParty.js`

实现的方法:
- `create(partyData)` - 创建诉讼主体
- `findById(id)` - 根据 ID 查询主体
- `findByCaseId(caseId)` - 根据案件 ID 查询主体列表
- `update(id, updateData)` - 更新主体信息
- `delete(id)` - 删除主体
- `findHistoryCases(name)` - 查询主体历史案件

### 2. 控制器层
**文件**: `src/controllers/partyController.js`

实现的控制器方法:
- `createParty` - 添加诉讼主体
- `getPartiesByCaseId` - 获取诉讼主体列表
- `updateParty` - 更新诉讼主体
- `deleteParty` - 删除诉讼主体
- `getPartyHistory` - 查询主体历史案件

### 3. 路由层
**文件**: 
- `src/routes/case.js` - 案件相关的嵌套路由（POST 和 GET）
- `src/routes/party.js` - 主体独立路由（PUT、DELETE、历史查询）

## 功能特性

### 1. 数据验证
- 验证案件是否存在
- 验证必填字段（party_type、entity_type、name）
- 验证主体是否存在（更新和删除操作）

### 2. 错误处理
- 404: 案件或主体不存在
- 400: 缺少必填字段或没有数据被更新
- 500: 服务器内部错误

### 3. 支持的主体类型
- **party_type**: 原告、被告、第三人
- **entity_type**: 企业、个人

### 4. 企业和个人字段区分
- **企业**: unified_credit_code（统一社会信用代码）、legal_representative（法定代表人）
- **个人**: id_number（身份证号）

### 5. 历史案件关联
- 通过主体名称查询该主体参与的所有历史案件
- 按创建时间倒序排列
- 返回完整的案件信息

## 测试验证

**测试文件**: `test-party-api.js`

测试覆盖:
1. ✓ 添加企业主体
2. ✓ 添加个人主体
3. ✓ 获取主体列表
4. ✓ 更新主体信息
5. ✓ 查询历史案件
6. ✓ 删除主体
7. ✓ 错误处理（不存在的案件、缺少必填字段、不存在的主体）

**测试结果**: 所有 9 项测试全部通过 ✓

## 数据库表结构

```sql
CREATE TABLE litigation_parties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER,
  party_type VARCHAR(50),        -- 原告/被告/第三人
  entity_type VARCHAR(50),       -- 企业/个人
  name VARCHAR(200),             -- 主体名称
  unified_credit_code VARCHAR(100), -- 统一社会信用代码（企业）
  legal_representative VARCHAR(100), -- 法定代表人（企业）
  id_number VARCHAR(50),         -- 身份证号（个人）
  contact_phone VARCHAR(50),     -- 联系电话
  contact_email VARCHAR(100),    -- 联系邮箱
  address TEXT,                  -- 地址
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id)
);
```

## API 使用示例

### 添加企业主体
```bash
curl -X POST http://localhost:3000/api/cases/1/parties \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "party_type": "原告",
    "entity_type": "企业",
    "name": "测试科技有限公司",
    "unified_credit_code": "91110000MA01234567",
    "legal_representative": "张三",
    "contact_phone": "010-12345678",
    "contact_email": "test@company.com",
    "address": "北京市朝阳区测试路123号"
  }'
```

### 添加个人主体
```bash
curl -X POST http://localhost:3000/api/cases/1/parties \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "party_type": "被告",
    "entity_type": "个人",
    "name": "李四",
    "id_number": "110101199001011234",
    "contact_phone": "13800138000",
    "address": "北京市海淀区测试街456号"
  }'
```

### 查询历史案件
```bash
curl -X GET "http://localhost:3000/api/parties/history?name=测试科技有限公司" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 实现状态

✅ **任务 6.2 已完成**

所有要求的功能均已实现并通过测试:
- ✅ POST /api/cases/:caseId/parties - 添加诉讼主体
- ✅ GET /api/cases/:caseId/parties - 获取诉讼主体列表
- ✅ PUT /api/parties/:id - 更新诉讼主体
- ✅ DELETE /api/parties/:id - 删除诉讼主体
- ✅ 实现主体历史案件关联查询

## 相关需求

满足需求 1: 诉讼主体管理
- 支持企业和个人主体的完整信息管理
- 支持主体历史案件关联查询
- 提供完整的 CRUD 操作
