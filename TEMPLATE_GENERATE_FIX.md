# 文书模板生成功能修复

## 问题描述

在文书模板页面点击"生成文书"按钮后，无法在下拉框中选择案件，下拉框为空。

## 问题原因

### 1. API参数不匹配
前端调用案件列表API时使用的参数名不正确：
- 前端使用：`pageSize`
- 后端期望：`limit`

### 2. 数据结构不匹配
后端返回的数据结构与前端期望的不一致：
- 后端返回：`{ data: { cases: [...] } }`
- 前端期望：`{ data: { list: [...] } }`

### 3. 字段名不匹配
后端返回的是数据库原始字段名（snake_case），前端期望驼峰命名（camelCase）：
- 后端：`case_number`, `case_type`, `case_cause`
- 前端：`caseNumber`, `caseType`, `caseCause`

## 解决方案

### 1. 修复前端API调用

**文件**: `frontend/src/views/document/DocumentTemplates.vue`

**修改前**:
```javascript
const loadCases = async () => {
  try {
    const response = await caseApi.getCases({ page: 1, pageSize: 100 })
    cases.value = response.data?.list || []
  } catch (error) {
    console.error('加载案件列表失败', error)
  }
}
```

**修改后**:
```javascript
const loadCases = async () => {
  try {
    const response = await caseApi.getCases({ page: 1, limit: 100 })
    cases.value = response.data?.cases || []
  } catch (error) {
    console.error('加载案件列表失败', error)
  }
}
```

### 2. 修复后端字段名转换

**文件**: `backend/src/models/Case.js`

在 `findAll` 方法中使用 SQL 别名将字段名转换为驼峰命名：

**修改前**:
```javascript
let sql = 'SELECT * FROM cases WHERE 1=1';
```

**修改后**:
```javascript
let sql = `SELECT 
  id,
  case_number as caseNumber,
  internal_number as internalNumber,
  case_type as caseType,
  case_cause as caseCause,
  court,
  target_amount as targetAmount,
  filing_date as filingDate,
  status,
  team_id as teamId,
  created_at as createdAt,
  updated_at as updatedAt
FROM cases WHERE 1=1`;
```

## 修复效果

### 修复前
- ❌ 案件下拉框为空
- ❌ 无法选择案件
- ❌ 无法生成文书

### 修复后
- ✅ 案件下拉框正常显示案件列表
- ✅ 可以选择案件
- ✅ 选择案件后自动填充变量
- ✅ 可以正常生成文书

## 测试验证

### 测试步骤

1. 进入"文书模板"页面
2. 点击任意模板的"生成文书"按钮
3. 在弹出的对话框中，点击"选择案件"下拉框
4. 查看是否显示案件列表

### 预期结果

- ✅ 下拉框显示案件列表
- ✅ 每个案件显示格式：`案号 - 案由`
- ✅ 可以搜索过滤案件
- ✅ 选择案件后自动填充以下变量：
  - 案号
  - 案由
  - 法院
  - 标的额
  - 立案日期

### 案件显示示例

```
(2024)京0105民初12345号 - 合同纠纷
AN202411000001 - 劳动争议
(2024)粤0104民初67890号 - 侵权责任纠纷
```

## 数据流程

```
用户点击"生成文书"
  ↓
打开生成对话框
  ↓
调用 loadCases()
  ↓
caseApi.getCases({ page: 1, limit: 100 })
  ↓
后端 Case.findAll()
  ↓
返回 { data: { cases: [...] } }
  ↓
前端 cases.value = response.data.cases
  ↓
下拉框显示案件列表
```

## 字段映射关系

| 数据库字段 | 前端字段 | 显示位置 |
|-----------|---------|---------|
| case_number | caseNumber | 下拉框标签 |
| internal_number | internalNumber | 下拉框标签（备用） |
| case_type | caseType | - |
| case_cause | caseCause | 下拉框标签 |
| court | court | 自动填充变量 |
| target_amount | targetAmount | 自动填充变量 |
| filing_date | filingDate | 自动填充变量 |
| status | status | - |

## 相关文件

### 前端
- `frontend/src/views/document/DocumentTemplates.vue` - 模板管理页面（已修复）
- `frontend/src/api/case.ts` - 案件API接口

### 后端
- `backend/src/models/Case.js` - 案件模型（已修复）
- `backend/src/controllers/caseController.js` - 案件控制器

## 注意事项

1. **API参数命名**
   - 后端使用 `limit` 而不是 `pageSize`
   - 前端调用时需要使用正确的参数名

2. **数据结构**
   - 后端返回 `{ data: { cases: [...] } }`
   - 前端需要访问 `response.data.cases`

3. **字段命名规范**
   - 数据库使用 snake_case
   - 前端使用 camelCase
   - 在 SQL 查询中使用别名转换

4. **案件显示格式**
   - 优先显示正式案号 `caseNumber`
   - 如果没有，显示内部编号 `internalNumber`
   - 格式：`案号 - 案由`

## 其他受影响的功能

这次修复同时改善了以下功能：
- ✅ 案件列表页面的字段显示
- ✅ 案件详情页面的数据加载
- ✅ 其他需要案件列表的功能

## 更新日期

2024-11-20

## 版本

v1.0.0
