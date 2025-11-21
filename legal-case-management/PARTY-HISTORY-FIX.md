# 诉讼主体历史案件显示修复

## 问题描述

诉讼主体的历史案件对话框中，案号、案件类型、案由等字段没有正确显示。

## 问题原因

前端表格列使用的是驼峰命名（camelCase），但后端返回的数据使用下划线命名（snake_case）：

### 字段名映射

| 前端期望 | 后端返回 | 说明 |
|---------|---------|------|
| `caseNumber` | `case_number` | 案号 |
| `caseType` | `case_type` | 案件类型 |
| `caseCause` | `case_cause` | 案由 |
| `court` | `court` | 法院 |
| `status` | `status` | 状态 |

## 解决方案

修改前端表格列定义，使用后端返回的实际字段名（下划线格式）。

### 修改前
```vue
<el-table-column prop="caseNumber" label="案号" />
<el-table-column prop="caseType" label="案件类型" />
<el-table-column prop="caseCause" label="案由" />
```

### 修改后
```vue
<el-table-column prop="case_number" label="案号" />
<el-table-column prop="case_type" label="案件类型" />
<el-table-column prop="case_cause" label="案由" />
```

## 更新内容

### 1. 字段名修正
- ✅ `caseNumber` → `case_number`
- ✅ `caseType` → `case_type`
- ✅ `caseCause` → `case_cause`

### 2. 新增字段
- ✅ `filing_date` - 立案日期

### 3. 界面优化
- ✅ 对话框宽度：900px → 1000px
- ✅ 添加 `show-overflow-tooltip` 显示完整内容
- ✅ 操作列固定在右侧

## 历史案件表格结构

### 显示的列

| 列名 | 字段 | 宽度 | 说明 |
|------|------|------|------|
| 案号 | `case_number` | 180px | 显示案件编号 |
| 案件类型 | `case_type` | 120px | 民事/刑事/行政等 |
| 案由 | `case_cause` | 150px+ | 案件原因 |
| 法院 | `court` | 150px+ | 受理法院 |
| 立案日期 | `filing_date` | 120px | 立案时间 |
| 状态 | `status` | 100px | 案件状态标签 |
| 操作 | - | 100px | 查看按钮 |

### 数据来源

后端 SQL 查询：
```sql
SELECT DISTINCT c.* 
FROM cases c
INNER JOIN litigation_parties lp ON c.id = lp.case_id
WHERE lp.name = ?
ORDER BY c.created_at DESC
```

返回 `cases` 表的所有字段。

## 测试步骤

### 1. 准备测试数据

确保数据库中有相同名称的诉讼主体在多个案件中：

```sql
-- 查询某个主体的历史案件
SELECT c.case_number, c.case_type, c.case_cause, c.court, c.filing_date, c.status
FROM cases c
INNER JOIN litigation_parties lp ON c.id = lp.case_id
WHERE lp.name = '某某公司'
ORDER BY c.created_at DESC;
```

### 2. 前端测试

1. 刷新浏览器页面
2. 进入案件详情
3. 在诉讼主体列表中，点击某个主体的"历史案件"按钮
4. 验证对话框显示：
   - ✅ 案号正确显示
   - ✅ 案件类型正确显示
   - ✅ 案由正确显示
   - ✅ 法院正确显示
   - ✅ 立案日期正确显示
   - ✅ 状态标签正确显示

### 3. 数据验证

检查浏览器控制台的网络请求：

```javascript
// 请求
GET /api/parties/history?name=某某公司

// 响应
{
  "data": {
    "name": "某某公司",
    "cases": [
      {
        "id": 1,
        "case_number": "（2024）京0105民初12345号",
        "case_type": "民事",
        "case_cause": "合同纠纷",
        "court": "北京市朝阳区人民法院",
        "filing_date": "2024-01-15",
        "status": "审理中"
      }
    ],
    "total": 1
  }
}
```

## 界面效果

### 历史案件对话框

```
┌─────────────────────────────────────────────────────────────────┐
│  某某公司 的历史案件                                        ✕   │
├─────────────────────────────────────────────────────────────────┤
│ 案号              │案件类型│案由      │法院        │立案日期  │状态│操作│
├──────────────────┼────────┼──────────┼───────────┼──────────┼────┼────┤
│（2024）京0105民初│民事    │合同纠纷  │北京市朝阳区│2024-01-15│审理中│查看│
│12345号           │        │          │人民法院    │          │    │    │
├──────────────────┼────────┼──────────┼───────────┼──────────┼────┼────┤
│（2023）京0105民初│民事    │买卖合同  │北京市朝阳区│2023-06-20│已结案│查看│
│67890号           │        │纠纷      │人民法院    │          │    │    │
└─────────────────────────────────────────────────────────────────┘
```

### 状态标签颜色

| 状态 | 颜色 | 类型 |
|------|------|------|
| 立案 | 灰色 | info |
| 审理中 | 蓝色 | primary |
| 已结案 | 绿色 | success |
| 已归档 | 灰色 | info |

## 后端数据结构

### cases 表字段

```sql
CREATE TABLE cases (
  id INTEGER PRIMARY KEY,
  case_number VARCHAR(100),      -- 案号
  internal_number VARCHAR(100),  -- 内部编号
  case_type VARCHAR(50),         -- 案件类型
  case_cause VARCHAR(200),       -- 案由
  court VARCHAR(200),            -- 法院
  target_amount DECIMAL(15,2),   -- 标的额
  filing_date DATE,              -- 立案日期
  status VARCHAR(50),            -- 状态
  team_id INTEGER,               -- 团队ID
  created_at DATETIME,           -- 创建时间
  updated_at DATETIME            -- 更新时间
);
```

## 修改的文件

- ✅ `frontend/src/components/case/PartyManagement.vue`
  - 修正字段名映射
  - 添加立案日期列
  - 优化界面布局

## 相关 API

### 获取主体历史案件

**接口**: `GET /api/parties/history`

**参数**:
- `name` (string, required) - 主体名称

**响应**:
```json
{
  "data": {
    "name": "主体名称",
    "cases": [
      {
        "id": 1,
        "case_number": "案号",
        "case_type": "案件类型",
        "case_cause": "案由",
        "court": "法院",
        "filing_date": "立案日期",
        "status": "状态"
      }
    ],
    "total": 1
  }
}
```

## 注意事项

1. **字段命名规范**
   - 后端统一使用下划线命名（snake_case）
   - 前端在显示时使用下划线字段名
   - 或者在前端统一转换为驼峰命名

2. **数据完整性**
   - 确保 cases 表有完整的数据
   - 案号、案件类型、案由是必填字段

3. **性能考虑**
   - 历史案件查询使用索引
   - 限制返回数量（如最近50条）

## 优化建议

### 1. 添加分页

```vue
<el-pagination
  v-model:current-page="historyPage"
  :page-size="10"
  :total="historyTotal"
  @current-change="handleHistoryPageChange"
/>
```

### 2. 添加筛选

```vue
<el-form inline>
  <el-form-item label="案件类型">
    <el-select v-model="historyFilter.caseType">
      <el-option label="全部" value="" />
      <el-option label="民事" value="民事" />
      <el-option label="刑事" value="刑事" />
    </el-select>
  </el-form-item>
</el-form>
```

### 3. 添加排序

```vue
<el-table-column
  prop="filing_date"
  label="立案日期"
  sortable
/>
```

## 测试清单

- [x] 修改字段名映射
- [x] 添加立案日期列
- [x] 优化界面布局
- [ ] 刷新浏览器测试
- [ ] 验证数据显示正确
- [ ] 测试查看按钮功能

## 状态

🟢 **已修复**

- ✅ 字段名映射已修正
- ✅ 界面已优化
- ✅ 文件无语法错误
- ⏳ 等待前端测试验证

---

**更新时间**: 2024-11-21  
**修复内容**: 字段名映射 + 界面优化  
**测试状态**: 待验证
