# 案件列表排序功能

## 功能概述

为案件列表添加了灵活的排序功能，支持多种排序方式，默认按创建时间倒序显示最新案件。

## 功能特性

### 1. 默认排序
- ✅ 默认按创建时间倒序排列
- ✅ 最新创建的案件显示在最上面
- ✅ 页面加载时自动应用

### 2. 排序选择器
在搜索区域新增"排序方式"下拉框，支持以下排序选项：

| 选项 | 说明 | 排序字段 | 排序方向 |
|------|------|---------|---------|
| 创建时间（最新） | 默认选项 | createdAt | DESC |
| 创建时间（最早） | 最早创建的在前 | createdAt | ASC |
| 案件ID（降序） | ID从大到小 | id | DESC |
| 案件ID（升序） | ID从小到大 | id | ASC |
| 立案日期（最新） | 最新立案的在前 | filingDate | DESC |
| 立案日期（最早） | 最早立案的在前 | filingDate | ASC |

### 3. 实时更新
- ✅ 选择排序方式后立即刷新列表
- ✅ 保持当前的筛选条件
- ✅ 重置到第一页

## 界面变化

### 搜索区域

**修改前**:
```
[关键词] [案件类型] [案件状态] [搜索] [重置]
```

**修改后**:
```
[关键词] [案件类型] [案件状态] [排序方式] [搜索] [重置]
```

### 排序选择器

```vue
<el-form-item label="排序方式">
  <el-select v-model="searchForm.sortBy" style="width: 160px">
    <el-option label="创建时间（最新）" value="createdAt-desc" />
    <el-option label="创建时间（最早）" value="createdAt-asc" />
    <el-option label="案件ID（降序）" value="id-desc" />
    <el-option label="案件ID（升序）" value="id-asc" />
    <el-option label="立案日期（最新）" value="filingDate-desc" />
    <el-option label="立案日期（最早）" value="filingDate-asc" />
  </el-select>
</el-form-item>
```

## 技术实现

### 前端实现

**文件**: `frontend/src/views/case/CaseList.vue`

#### 1. 添加sortBy字段

```typescript
const searchForm = reactive({
  keyword: '',
  caseType: '',
  status: '',
  sortBy: 'createdAt-desc' // 默认按创建时间倒序
})

const sortField = ref('createdAt')
const sortOrder = ref('desc')
```

#### 2. 解析排序参数

```typescript
const fetchCaseList = async () => {
  // 解析排序参数
  if (searchForm.sortBy) {
    const [field, order] = searchForm.sortBy.split('-')
    sortField.value = field
    sortOrder.value = order
  }
  
  const params: any = {
    page: pagination.page,
    limit: pagination.pageSize
  }
  
  if (sortField.value) {
    params.sortField = sortField.value
    params.sortOrder = sortOrder.value
  }
  
  const response = await caseApi.getCases(params)
  // ...
}
```

#### 3. 重置功能

```typescript
const handleReset = () => {
  searchForm.keyword = ''
  searchForm.caseType = ''
  searchForm.status = ''
  searchForm.sortBy = 'createdAt-desc' // 重置为默认排序
  sortField.value = 'createdAt'
  sortOrder.value = 'desc'
  pagination.page = 1
  fetchCaseList()
}
```

### 后端实现

**文件**: `backend/src/models/Case.js`

#### 1. 接收排序参数

```javascript
static async findAll(options = {}) {
  const {
    page = 1,
    limit = 10,
    status,
    case_type,
    search,
    sortField = 'createdAt',  // 默认排序字段
    sortOrder = 'desc'         // 默认排序方向
  } = options;
  
  // ...
}
```

#### 2. 字段名映射

```javascript
// 处理排序字段映射（camelCase -> snake_case）
const fieldMap = {
  'id': 'id',
  'createdAt': 'created_at',
  'updatedAt': 'updated_at',
  'filingDate': 'filing_date',
  'caseNumber': 'case_number',
  'internalNumber': 'internal_number'
};

const dbField = fieldMap[sortField] || 'created_at';
const order = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
```

#### 3. 动态ORDER BY

```javascript
sql += ` ORDER BY ${dbField} ${order} LIMIT ? OFFSET ?`;
params.push(limit, (page - 1) * limit);
```

## 使用示例

### 场景 1: 查看最新案件

1. 进入案件列表页面
2. 默认显示最新创建的案件在最上面
3. 无需任何操作

### 场景 2: 查看最早的案件

1. 点击"排序方式"下拉框
2. 选择"创建时间（最早）"
3. 列表自动刷新，最早的案件显示在最上面

### 场景 3: 按案件ID排序

1. 点击"排序方式"下拉框
2. 选择"案件ID（降序）"或"案件ID（升序）"
3. 列表按案件ID排序

### 场景 4: 按立案日期排序

1. 点击"排序方式"下拉框
2. 选择"立案日期（最新）"或"立案日期（最早）"
3. 列表按立案日期排序

### 场景 5: 组合筛选和排序

1. 选择案件类型："民事"
2. 选择案件状态："审理中"
3. 选择排序方式："创建时间（最新）"
4. 点击"搜索"
5. 显示符合条件的案件，按创建时间倒序排列

## 排序逻辑

### 前端到后端的数据流

```
用户选择: "创建时间（最新）"
  ↓
前端: sortBy = "createdAt-desc"
  ↓
解析: field = "createdAt", order = "desc"
  ↓
发送: { sortField: "createdAt", sortOrder: "desc" }
  ↓
后端: 映射 createdAt → created_at
  ↓
SQL: ORDER BY created_at DESC
  ↓
返回: 按创建时间倒序的案件列表
```

### 字段映射表

| 前端字段 | 后端字段 | 数据库字段 | 说明 |
|---------|---------|-----------|------|
| id | id | id | 案件ID |
| createdAt | createdAt | created_at | 创建时间 |
| updatedAt | updatedAt | updated_at | 更新时间 |
| filingDate | filingDate | filing_date | 立案日期 |
| caseNumber | caseNumber | case_number | 案号 |
| internalNumber | internalNumber | internal_number | 内部编号 |

## 注意事项

### 1. 默认排序

- 系统默认按创建时间倒序排列
- 重置时恢复默认排序
- 确保最新案件始终优先显示

### 2. 字段映射

- 前端使用 camelCase
- 数据库使用 snake_case
- 后端负责字段名转换

### 3. 安全性

- 使用白名单验证排序字段
- 防止SQL注入
- 只允许预定义的字段排序

### 4. 性能优化

- 在常用排序字段上建立索引
- 建议索引：
  - `created_at`
  - `filing_date`
  - `id`（主键，自动索引）

## 扩展建议

### 1. 添加更多排序选项

```javascript
<el-option label="标的额（从高到低）" value="targetAmount-desc" />
<el-option label="标的额（从低到高）" value="targetAmount-asc" />
<el-option label="案号（升序）" value="caseNumber-asc" />
<el-option label="案号（降序）" value="caseNumber-desc" />
```

### 2. 记住用户偏好

```javascript
// 保存到localStorage
localStorage.setItem('caseSortPreference', searchForm.sortBy)

// 页面加载时恢复
const savedSort = localStorage.getItem('caseSortPreference')
if (savedSort) {
  searchForm.sortBy = savedSort
}
```

### 3. 表格列头排序

保留表格列头的排序功能，与下拉框排序联动：

```javascript
const handleSortChange = ({ prop, order }: any) => {
  if (prop && order) {
    const orderValue = order === 'ascending' ? 'asc' : 'desc'
    searchForm.sortBy = `${prop}-${orderValue}`
    fetchCaseList()
  }
}
```

## 测试验证

### 测试步骤

1. **测试默认排序**
   - 进入案件列表页面
   - 验证最新创建的案件在最上面

2. **测试排序切换**
   - 选择不同的排序方式
   - 验证列表顺序是否正确

3. **测试组合筛选**
   - 设置筛选条件
   - 选择排序方式
   - 验证结果正确

4. **测试重置功能**
   - 设置筛选和排序
   - 点击重置
   - 验证恢复默认状态

### 预期结果

- ✅ 默认按创建时间倒序
- ✅ 排序选择器工作正常
- ✅ 各种排序方式正确
- ✅ 与筛选功能配合良好
- ✅ 重置功能正常

## 相关文件

### 前端
- `frontend/src/views/case/CaseList.vue` - 案件列表页面（已修改）

### 后端
- `backend/src/models/Case.js` - 案件模型（已修改）
- `backend/src/controllers/caseController.js` - 案件控制器

## 更新日期

2024-11-20

## 版本

v1.0.0
