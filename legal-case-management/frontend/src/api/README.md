# API 模块使用说明

本目录包含所有前端 API 接口封装，基于 Axios 实现。

## 目录结构

```
api/
├── request.ts              # Axios 实例配置（拦截器）
├── index.ts                # 统一导出所有 API
├── auth.ts                 # 认证相关接口
├── case.ts                 # 案件管理接口
├── party.ts                # 诉讼主体接口
├── processNode.ts          # 流程节点接口
├── processTemplate.ts      # 流程模板接口
├── evidence.ts             # 证据管理接口
├── document.ts             # 文书管理接口
├── documentTemplate.ts     # 文书模板接口
├── cost.ts                 # 成本管理接口
├── notification.ts         # 提醒通知接口
├── collaboration.ts        # 协同管理接口
├── analytics.ts            # 数据分析接口
└── archive.ts              # 归档管理接口
```

## 核心功能

### 1. Axios 实例配置 (request.ts)

#### 请求拦截器
- 自动从 localStorage 读取 token 并添加到请求头
- 格式：`Authorization: Bearer <token>`

#### 响应拦截器
- 自动处理响应数据，直接返回 `response.data`
- 统一错误处理：
  - **401**: 清除 token，跳转登录页
  - **403**: 权限不足提示
  - **404**: 资源不存在提示
  - **500**: 服务器错误提示
  - 网络错误提示

### 2. 使用方式

#### 方式一：导入单个 API 模块

```typescript
import { caseApi } from '@/api'

// 获取案件列表
const cases = await caseApi.getCases({ page: 1, pageSize: 10 })

// 创建案件
const newCase = await caseApi.createCase({
  caseType: '民事',
  caseCause: '合同纠纷',
  court: '北京市朝阳区人民法院',
  targetAmount: 100000
})
```

#### 方式二：导入多个 API 模块

```typescript
import { caseApi, partyApi, evidenceApi } from '@/api'

// 创建案件
const caseData = await caseApi.createCase({ ... })

// 添加诉讼主体
await partyApi.addParty(caseData.id, { ... })

// 上传证据
const formData = new FormData()
formData.append('file', file)
formData.append('caseId', caseData.id)
await evidenceApi.uploadEvidence(formData)
```

#### 方式三：使用 request 实例自定义请求

```typescript
import { request } from '@/api'

// 自定义 GET 请求
const data = await request.get('/custom-endpoint', { params: { id: 1 } })

// 自定义 POST 请求
const result = await request.post('/custom-endpoint', { data: 'value' })
```

## API 模块详解

### 认证模块 (authApi)

```typescript
// 登录
await authApi.login({ username: 'admin', password: '123456' })

// 注册
await authApi.register({ 
  username: 'user', 
  password: '123456',
  realName: '张三',
  email: 'user@example.com'
})

// 获取用户信息
await authApi.getProfile()
```

### 案件管理 (caseApi)

```typescript
// 获取案件列表（支持分页、筛选）
await caseApi.getCases({ 
  page: 1, 
  pageSize: 10,
  status: 'active',
  caseType: '民事'
})

// 获取案件详情
await caseApi.getCaseById(1)

// 创建案件
await caseApi.createCase({ ... })

// 更新案件
await caseApi.updateCase(1, { status: 'closed' })

// 删除案件
await caseApi.deleteCase(1)
```

### 诉讼主体 (partyApi)

```typescript
// 添加诉讼主体
await partyApi.addParty(caseId, {
  partyType: '原告',
  entityType: '企业',
  name: '某某公司',
  unifiedCreditCode: '91110000XXXXXXXXXX'
})

// 获取案件的诉讼主体列表
await partyApi.getPartiesByCaseId(caseId)

// 更新诉讼主体
await partyApi.updateParty(partyId, { contactPhone: '13800138000' })

// 删除诉讼主体
await partyApi.deleteParty(partyId)

// 查询主体历史案件
await partyApi.getPartyHistory('某某公司')
```

### 流程节点 (processNodeApi)

```typescript
// 创建流程节点
await processNodeApi.createNode(caseId, {
  nodeType: '立案',
  nodeName: '提交立案材料',
  handler: '张律师',
  deadline: '2024-01-31'
})

// 获取案件的流程节点
await processNodeApi.getNodesByCaseId(caseId)

// 更新节点状态
await processNodeApi.updateNode(nodeId, { 
  status: '已完成',
  completionTime: '2024-01-25'
})

// 删除节点
await processNodeApi.deleteNode(nodeId)
```

### 证据管理 (evidenceApi)

```typescript
// 上传证据
const formData = new FormData()
formData.append('file', file)
formData.append('caseId', caseId)
formData.append('category', '书证')
formData.append('tags', '合同,发票')
await evidenceApi.uploadEvidence(formData)

// 获取案件证据列表
await evidenceApi.getEvidenceByCaseId(caseId, { category: '书证' })

// 更新证据信息
await evidenceApi.updateEvidence(evidenceId, { tags: '合同,发票,收据' })

// 下载证据
const blob = await evidenceApi.downloadEvidence(evidenceId)

// 删除证据
await evidenceApi.deleteEvidence(evidenceId)

// 查看证据版本历史
await evidenceApi.getEvidenceVersions(evidenceId)

// 查看证据操作日志
await evidenceApi.getEvidenceLogs(evidenceId)
```

### 文书管理 (documentApi)

```typescript
// 上传文书
const formData = new FormData()
formData.append('file', file)
formData.append('caseId', caseId)
formData.append('documentType', '起诉状')
await documentApi.uploadDocument(formData)

// 获取案件文书列表
await documentApi.getDocumentsByCaseId(caseId)

// 下载文书
const blob = await documentApi.downloadDocument(documentId)

// OCR 识别
await documentApi.ocrRecognize(documentId)
```

### 成本管理 (costApi)

```typescript
// 创建成本记录
await costApi.createCost({
  caseId: 1,
  costType: '诉讼费',
  amount: 5000,
  paymentDate: '2024-01-20',
  status: '已支付'
})

// 获取案件成本列表
await costApi.getCostsByCaseId(caseId)

// 费用计算
await costApi.calculateCost({
  calculationType: 'litigation',
  targetAmount: 100000,
  caseType: '财产案件'
})

// 成本分析
await costApi.getCostAnalytics(caseId)
```

### 提醒通知 (notificationApi)

```typescript
// 获取提醒列表
await notificationApi.getNotifications({ status: 'unread' })

// 标记已读
await notificationApi.markAsRead(notificationId)

// 标记全部已读
await notificationApi.markAllAsRead()

// 获取未读数量
await notificationApi.getUnreadCount()
```

### 数据分析 (analyticsApi)

```typescript
// 获取驾驶舱数据
await analyticsApi.getDashboard({ 
  startDate: '2024-01-01',
  endDate: '2024-12-31'
})

// 案件统计
await analyticsApi.getCaseStatistics()

// 律师评价
await analyticsApi.getLawyerEvaluation(lawyerId)

// 类案检索
await analyticsApi.searchSimilarCases({
  caseType: '民事',
  caseCause: '合同纠纷',
  keywords: ['违约', '赔偿']
})
```

### 归档管理 (archiveApi)

```typescript
// 创建结案报告
await archiveApi.createClosureReport({
  caseId: 1,
  caseResult: '胜诉',
  experienceSummary: '...',
  riskWarning: '...'
})

// 创建归档包
await archiveApi.createArchivePackage({ caseId: 1 })

// 检索归档案件
await archiveApi.searchArchive({ keyword: '合同纠纷' })

// 创建案例知识
await archiveApi.createKnowledge({
  caseId: 1,
  caseCause: '合同纠纷',
  disputeFocus: '违约责任认定',
  judgmentSummary: '...'
})

// 检索知识库
await archiveApi.searchKnowledge({ caseCause: '合同纠纷' })
```

## 错误处理

所有 API 调用都应该使用 try-catch 处理错误：

```typescript
try {
  const cases = await caseApi.getCases()
  // 处理成功响应
} catch (error) {
  // 错误已经在拦截器中通过 ElMessage 提示
  // 这里可以做额外的错误处理
  console.error('获取案件列表失败:', error)
}
```

## 类型支持

所有 API 模块都提供了完整的 TypeScript 类型定义，可以获得良好的代码提示和类型检查：

```typescript
import type { CreateCaseData, CaseParams } from '@/api'

const params: CaseParams = {
  page: 1,
  pageSize: 10,
  status: 'active'
}

const caseData: CreateCaseData = {
  caseType: '民事',
  caseCause: '合同纠纷',
  court: '北京市朝阳区人民法院'
}
```

## 环境配置

API 基础路径通过环境变量配置：

- **开发环境** (.env.development): `/api` (使用 Vite 代理)
- **生产环境** (.env.production): `http://localhost:3000/api`

可以根据实际部署情况修改 `.env.production` 文件。
