# 案件管理 API 实现总结

## 已完成的功能

### 6.1 案件基础 CRUD 接口 ✅

实现了完整的案件管理接口：

- **POST /api/cases** - 创建案件
  - 自动生成唯一的内部编号（格式：AN + 年月 + 6位序号）
  - 验证案号唯一性
  - 验证内部编号唯一性
  - 支持所有案件字段

- **GET /api/cases** - 获取案件列表
  - 支持分页（page, limit）
  - 支持按状态筛选（status）
  - 支持按案件类型筛选（case_type）
  - 支持关键词搜索（search）- 搜索案号、案由、法院
  - 返回分页信息（总数、总页数）

- **GET /api/cases/:id** - 获取案件详情
  - 返回完整的案件信息
  - 404 错误处理

- **PUT /api/cases/:id** - 更新案件信息
  - 支持部分更新
  - 验证案号唯一性（如果修改案号）
  - 验证内部编号唯一性（如果修改内部编号）
  - 自动更新 updated_at 时间戳

- **DELETE /api/cases/:id** - 删除案件
  - 验证案件存在性
  - 级联删除相关数据（通过数据库外键约束）

### 6.2 诉讼主体管理接口 ✅

实现了完整的诉讼主体管理接口：

- **POST /api/cases/:caseId/parties** - 添加诉讼主体
  - 验证案件存在性
  - 验证必填字段（主体类型、实体类型、名称）
  - 支持企业和个人两种实体类型
  - 支持完整的主体信息字段

- **GET /api/cases/:caseId/parties** - 获取诉讼主体列表
  - 按创建时间排序
  - 验证案件存在性

- **PUT /api/parties/:id** - 更新诉讼主体
  - 支持部分更新
  - 验证主体存在性

- **DELETE /api/parties/:id** - 删除诉讼主体
  - 验证主体存在性

- **GET /api/parties/history?name=xxx** - 查询主体历史案件
  - 根据主体名称查询所有相关案件
  - 返回案件列表和总数
  - 支持企业和个人主体

### 6.3 案件编号生成逻辑 ✅

实现了智能的案件编号生成系统：

- **自动生成内部编号**
  - 格式：AN + YYYYMM + 6位序号
  - 例如：AN202511000001
  - 自动递增序号
  - 按月份重置序号

- **唯一性验证**
  - 案号唯一性检查
  - 内部编号唯一性检查
  - 创建和更新时都进行验证

## 技术实现

### 文件结构

```
backend/src/
├── controllers/
│   ├── caseController.js      # 案件控制器
│   └── partyController.js     # 诉讼主体控制器
├── models/
│   ├── Case.js                # 案件模型（已扩展）
│   └── LitigationParty.js     # 诉讼主体模型
├── routes/
│   ├── case.js                # 案件路由
│   └── party.js               # 诉讼主体路由
└── app.js                     # 应用入口（已更新）
```

### 新增的模型方法

**Case 模型：**
- `findByCaseNumber(caseNumber)` - 根据案号查找案件
- `findByInternalNumber(internalNumber)` - 根据内部编号查找案件
- `findLastByPrefix(prefix)` - 查找指定前缀的最后一个案件
- 更新了 `count()` 方法以支持搜索参数

### 错误处理

所有接口都实现了完善的错误处理：
- 400 - 请求参数错误
- 401 - 未授权
- 404 - 资源不存在
- 409 - 资源冲突（唯一性约束）
- 500 - 服务器内部错误

### 认证和授权

所有接口都需要 JWT 认证：
- 使用 `authenticate` 中间件
- 在请求头中携带 Bearer token

## 测试结果

所有功能已通过手动测试验证：

✅ 用户登录
✅ 创建案件（自动生成内部编号）
✅ 获取案件列表（分页、筛选、搜索）
✅ 获取案件详情
✅ 更新案件信息
✅ 添加诉讼主体
✅ 获取诉讼主体列表
✅ 更新诉讼主体
✅ 查询主体历史案件
✅ 案号唯一性验证
✅ 内部编号自动生成和唯一性验证

## API 使用示例

### 创建案件

```bash
curl -X POST http://localhost:3000/api/cases \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "case_type": "民事",
    "case_cause": "合同纠纷",
    "court": "北京市朝阳区人民法院",
    "target_amount": 500000,
    "filing_date": "2024-11-01",
    "status": "active"
  }'
```

### 获取案件列表（带筛选和搜索）

```bash
curl -X GET "http://localhost:3000/api/cases?page=1&limit=10&case_type=民事&search=合同" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 添加诉讼主体

```bash
curl -X POST http://localhost:3000/api/cases/1/parties \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "party_type": "原告",
    "entity_type": "企业",
    "name": "北京科技有限公司",
    "unified_credit_code": "91110000123456789X",
    "legal_representative": "张三",
    "contact_phone": "13800138000",
    "address": "北京市朝阳区某某街道"
  }'
```

### 查询主体历史案件

```bash
curl -X GET "http://localhost:3000/api/parties/history?name=北京科技有限公司" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 下一步

任务 6 已全部完成。可以继续实现：
- 任务 7：流程节点管理 API
- 任务 8：证据管理 API
- 任务 9：文书管理 API

