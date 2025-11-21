# 案件列表显示问题修复

## 问题描述

案件列表页面出现显示问题，大部分列的数据都显示为"-"，包括：
- 内部编号
- 案号
- 案件类型
- 案由
- 标的额
- 立案日期
- 创建时间

只有"法院"和"状态"列能正常显示。

## 问题原因

后端返回的数据字段名已经从 snake_case 转换为 camelCase，但前端表格列的 `prop` 属性还在使用旧的 snake_case 字段名，导致字段名不匹配。

### 字段名对比

| 后端返回（新） | 前端期望（旧） | 列名 |
|--------------|--------------|------|
| internalNumber | internal_number | 内部编号 |
| caseNumber | case_number | 案号 |
| caseType | case_type | 案件类型 |
| caseCause | case_cause | 案由 |
| targetAmount | target_amount | 标的额 |
| filingDate | filing_date | 立案日期 |
| createdAt | created_at | 创建时间 |

### 为什么"法院"和"状态"能显示？

这两个字段在数据库中本身就没有下划线：
- `court` → `court`（无变化）
- `status` → `status`（无变化）

所以它们能正常显示。

## 解决方案

更新前端表格列的 `prop` 属性，使用 camelCase 字段名。

**文件**: `frontend/src/views/case/CaseList.vue`

### 修改内容

#### 1. 内部编号
```vue
<!-- 修改前 -->
<el-table-column prop="internal_number" label="内部编号" />

<!-- 修改后 -->
<el-table-column prop="internalNumber" label="内部编号" />
```

#### 2. 案号
```vue
<!-- 修改前 -->
<el-table-column prop="case_number" label="案号" />

<!-- 修改后 -->
<el-table-column prop="caseNumber" label="案号" />
```

#### 3. 案件类型
```vue
<!-- 修改前 -->
<el-table-column prop="case_type" label="案件类型">
  <template #default="{ row }">
    <el-tag :type="getCaseTypeTag(row.case_type)">
      {{ row.case_type }}
    </el-tag>
  </template>
</el-table-column>

<!-- 修改后 -->
<el-table-column prop="caseType" label="案件类型">
  <template #default="{ row }">
    <el-tag :type="getCaseTypeTag(row.caseType)">
      {{ row.caseType }}
    </el-tag>
  </template>
</el-table-column>
```

#### 4. 案由
```vue
<!-- 修改前 -->
<el-table-column prop="case_cause" label="案由" />

<!-- 修改后 -->
<el-table-column prop="caseCause" label="案由" />
```

#### 5. 标的额
```vue
<!-- 修改前 -->
<el-table-column prop="target_amount" label="标的额（元）">
  <template #default="{ row }">
    {{ formatAmount(row.target_amount) }}
  </template>
</el-table-column>

<!-- 修改后 -->
<el-table-column prop="targetAmount" label="标的额（元）">
  <template #default="{ row }">
    {{ formatAmount(row.targetAmount) }}
  </template>
</el-table-column>
```

#### 6. 立案日期
```vue
<!-- 修改前 -->
<el-table-column prop="filing_date" label="立案日期">
  <template #default="{ row }">
    {{ formatDate(row.filing_date) }}
  </template>
</el-table-column>

<!-- 修改后 -->
<el-table-column prop="filingDate" label="立案日期">
  <template #default="{ row }">
    {{ formatDate(row.filingDate) }}
  </template>
</el-table-column>
```

#### 7. 创建时间
```vue
<!-- 修改前 -->
<el-table-column prop="created_at" label="创建时间">
  <template #default="{ row }">
    {{ formatDateTime(row.created_at) }}
  </template>
</el-table-column>

<!-- 修改后 -->
<el-table-column prop="createdAt" label="创建时间">
  <template #default="{ row }">
    {{ formatDateTime(row.createdAt) }}
  </template>
</el-table-column>
```

## 修复效果

### 修复前
| 案件ID | 内部编号 | 案号 | 案件类型 | 案由 | 法院 | 标的额 | 立案日期 | 状态 | 创建时间 |
|--------|---------|------|---------|------|------|--------|---------|------|---------|
| 119 | - | - | - | - | 深圳市福田区人民法院 | - | - | 审理中 | - |
| 117 | - | - | - | - | 上海市静安区人民法院 | - | - | 已结案 | - |

### 修复后
| 案件ID | 内部编号 | 案号 | 案件类型 | 案由 | 法院 | 标的额 | 立案日期 | 状态 | 创建时间 |
|--------|---------|------|---------|------|------|--------|---------|------|---------|
| 119 | AN202411000119 | (2024)粤0304民初12345号 | 民事 | 合同纠纷 | 深圳市福田区人民法院 | 100,000 | 2024-01-15 | 审理中 | 2024-11-20 10:30:00 |
| 117 | AN202411000117 | (2024)沪0106民初67890号 | 民事 | 劳动争议 | 上海市静安区人民法院 | 50,000 | 2024-02-20 | 已结案 | 2024-11-20 09:15:00 |

## 相关修复

这个问题是由之前的修复引起的：

1. **TEMPLATE_GENERATE_FIX.md** - 修复了文书模板生成时无法选择案件的问题
   - 在 `Case.findAll()` 方法中添加了字段名转换
   - 将 snake_case 转换为 camelCase

2. **后续影响** - 所有使用案件列表的页面都需要更新字段名
   - ✅ 案件列表页面（已修复）
   - ✅ 文书模板生成（已修复）
   - ✅ 诉讼主体历史案件（已修复）

## 测试验证

### 测试步骤

1. 进入"案件管理"页面
2. 查看案件列表表格
3. 检查所有列是否正常显示数据

### 预期结果

- ✅ 内部编号正常显示（如：AN202411000119）
- ✅ 案号正常显示（如：(2024)粤0304民初12345号）
- ✅ 案件类型正常显示（如：民事）
- ✅ 案由正常显示（如：合同纠纷）
- ✅ 法院正常显示（如：深圳市福田区人民法院）
- ✅ 标的额正常显示（如：100,000）
- ✅ 立案日期正常显示（如：2024-01-15）
- ✅ 状态正常显示（如：审理中）
- ✅ 创建时间正常显示（如：2024-11-20 10:30:00）

## 字段命名规范

### 数据库层（snake_case）
```sql
CREATE TABLE cases (
  id INTEGER PRIMARY KEY,
  case_number VARCHAR(100),
  internal_number VARCHAR(50),
  case_type VARCHAR(50),
  case_cause VARCHAR(200),
  court VARCHAR(200),
  target_amount DECIMAL(15,2),
  filing_date DATE,
  status VARCHAR(20),
  created_at DATETIME,
  updated_at DATETIME
);
```

### 后端返回（camelCase）
```javascript
{
  id: 119,
  caseNumber: '(2024)粤0304民初12345号',
  internalNumber: 'AN202411000119',
  caseType: '民事',
  caseCause: '合同纠纷',
  court: '深圳市福田区人民法院',
  targetAmount: 100000,
  filingDate: '2024-01-15',
  status: '审理中',
  createdAt: '2024-11-20 10:30:00',
  updatedAt: '2024-11-20 10:30:00'
}
```

### 前端使用（camelCase）
```vue
<el-table-column prop="caseNumber" label="案号" />
<el-table-column prop="internalNumber" label="内部编号" />
<el-table-column prop="caseType" label="案件类型" />
<el-table-column prop="caseCause" label="案由" />
```

## 注意事项

1. **统一命名规范**
   - 数据库：snake_case
   - 后端返回：camelCase
   - 前端使用：camelCase

2. **SQL别名转换**
   - 在 SQL 查询中使用 `AS` 别名
   - 例如：`case_number AS caseNumber`

3. **全局影响**
   - 修改字段名会影响所有使用该字段的地方
   - 需要同步更新前端所有相关页面

4. **测试覆盖**
   - 修改后需要测试所有相关功能
   - 确保没有遗漏的地方

## 相关文件

### 前端
- `frontend/src/views/case/CaseList.vue` - 案件列表页面（已修复）
- `frontend/src/views/case/CaseDetail.vue` - 案件详情页面
- `frontend/src/views/document/DocumentTemplates.vue` - 文书模板页面

### 后端
- `backend/src/models/Case.js` - 案件模型（已修改字段转换）
- `backend/src/controllers/caseController.js` - 案件控制器

## 更新日期

2024-11-20

## 版本

v1.0.0
