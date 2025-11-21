# 归档包创建 - 案件搜索功能优化

## 功能概述

在创建归档包时，为案件选择下拉框添加了搜索功能，用户可以通过输入案件编号或案由来快速查找已结案的案件。

## 功能特点

### 1. 远程搜索

- **实时搜索**：用户输入关键词时，系统会实时向后端发送搜索请求
- **智能匹配**：支持按案件编号、内部编号或案由进行搜索
- **加载提示**：搜索时显示加载状态

### 2. 优化的显示格式

**下拉选项格式**：
```
案件编号                    案由
AN2025110000045          托管纠纷
```

- 左侧显示案件编号（内部编号或案号）
- 右侧显示案由
- 使用不同颜色区分

### 3. 友好的提示信息

**占位符文本**：`请输入案件编号或案由进行搜索`

明确告诉用户可以搜索什么内容。

## 使用方法

### 1. 打开创建归档包对话框

1. 进入"归档案件检索"页面
2. 点击"创建归档包"按钮

### 2. 搜索案件

**方式1：直接输入搜索**
1. 点击"选择案件"下拉框
2. 在顶部搜索框中输入案件编号或案由
3. 系统会实时显示匹配的案件
4. 选择目标案件

**方式2：浏览选择**
1. 点击"选择案件"下拉框
2. 浏览已结案的案件列表
3. 选择目标案件

### 3. 搜索示例

**按案件编号搜索**：
```
输入：AN2025
结果：显示所有编号包含"AN2025"的案件
```

**按案由搜索**：
```
输入：合同
结果：显示所有案由包含"合同"的案件
```

**按内部编号搜索**：
```
输入：2025-001
结果：显示内部编号包含"2025-001"的案件
```

## 技术实现

### 前端实现

#### 1. 添加远程搜索

```vue
<el-select
  v-model="createForm.case_id"
  placeholder="请输入案件编号或案由进行搜索"
  filterable
  remote
  :remote-method="searchCases"
  :loading="loadingCases"
>
  <!-- 选项 -->
</el-select>
```

**关键属性**：
- `filterable`: 启用过滤功能
- `remote`: 启用远程搜索
- `remote-method`: 指定搜索方法
- `loading`: 显示加载状态

#### 2. 搜索方法

```typescript
const searchCases = (query: string) => {
  if (query) {
    loadAvailableCases(query)
  } else {
    loadAvailableCases()
  }
}

const loadAvailableCases = async (query = '') => {
  loadingCases.value = true
  try {
    const params: any = { 
      status: '已结案', 
      limit: 100 
    }
    
    if (query) {
      params.keyword = query
    }
    
    const response = await caseApi.getCases(params)
    // 处理响应...
  } finally {
    loadingCases.value = false
  }
}
```

#### 3. 优化显示格式

```vue
<el-option
  v-for="caseItem in availableCases"
  :key="caseItem.id"
  :label="`${caseItem.internal_number || caseItem.case_number} - ${caseItem.case_cause}`"
  :value="caseItem.id"
>
  <div style="display: flex; justify-content: space-between;">
    <span>{{ caseItem.internal_number || caseItem.case_number }}</span>
    <span style="color: #8492a6; font-size: 13px;">{{ caseItem.case_cause }}</span>
  </div>
</el-option>
```

### 后端支持

后端的 `getCases` API 需要支持 `keyword` 参数进行搜索：

```javascript
// 示例：后端搜索逻辑
if (keyword) {
  query += ` AND (
    case_number LIKE '%${keyword}%' OR 
    internal_number LIKE '%${keyword}%' OR 
    case_cause LIKE '%${keyword}%'
  )`;
}
```

## 用户体验改进

### 改进前

- ❌ 需要在长列表中滚动查找
- ❌ 没有明确的搜索提示
- ❌ 显示格式不够清晰

### 改进后

- ✅ 可以快速搜索定位
- ✅ 明确的搜索提示
- ✅ 清晰的显示格式
- ✅ 实时搜索反馈
- ✅ 加载状态提示

## 测试验证

### 测试步骤

1. **刷新浏览器**（Ctrl+F5）
2. **进入归档案件检索页面**
3. **点击"创建归档包"按钮**
4. **点击"选择案件"下拉框**
5. **在搜索框中输入案件编号或案由**
6. **验证搜索结果**

### 预期结果

- ✅ 下拉框顶部显示搜索输入框
- ✅ 占位符显示"请输入案件编号或案由进行搜索"
- ✅ 输入关键词时显示加载状态
- ✅ 搜索结果实时更新
- ✅ 案件显示格式清晰（编号 + 案由）
- ✅ 可以选择搜索结果中的案件

## 注意事项

### 1. 搜索范围

只搜索**已结案**的案件，因为只有已结案的案件才能创建归档包。

### 2. 搜索字段

支持搜索以下字段：
- 案件编号（case_number）
- 内部编号（internal_number）
- 案由（case_cause）

### 3. 搜索性能

- 限制返回结果数量（最多100条）
- 使用远程搜索减少前端数据量
- 实时搜索可能增加服务器负载

### 4. 搜索延迟

Element Plus 的远程搜索默认有防抖处理，避免频繁请求。

## 后续优化建议

### 1. 搜索历史

记录用户最近搜索的案件，方便快速访问。

### 2. 高级搜索

支持更多搜索条件：
- 按日期范围搜索
- 按案件类型搜索
- 按当事人搜索

### 3. 搜索结果排序

- 按相关度排序
- 按结案日期排序
- 按案件编号排序

### 4. 搜索建议

输入时显示搜索建议：
- 最近搜索
- 热门案件
- 相关案件

### 5. 批量归档

支持一次选择多个案件创建归档包。

## 相关文件

- `frontend/src/views/archive/ArchiveSearch.vue`

## 更新日期

2025-11-19
