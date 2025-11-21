# 诉讼主体历史案件显示修复

## 问题描述

在查看诉讼主体的历史案件时，表格中的部分信息无法显示：
- ❌ 案号列为空
- ❌ 案件类型列为空
- ❌ 案由列为空
- ✅ 法院列正常显示
- ✅ 状态列正常显示

## 问题原因

后端返回的数据使用数据库原始字段名（snake_case），而前端期望的是驼峰命名（camelCase），导致字段名不匹配。

### 后端返回的字段名
```javascript
{
  case_number: '(2024)京0105民初12345号',
  case_type: '民事',
  case_cause: '合同纠纷',
  court: '北京市朝阳区人民法院',
  status: '审理中'
}
```

### 前端期望的字段名
```javascript
{
  caseNumber: '(2024)京0105民初12345号',
  caseType: '民事',
  caseCause: '合同纠纷',
  court: '北京市朝阳区人民法院',
  status: '审理中'
}
```

## 解决方案

### 1. 后端修改

在 `LitigationParty.findHistoryCases()` 方法中，使用 SQL 别名将字段名转换为驼峰命名：

**文件**: `backend/src/models/LitigationParty.js`

```javascript
static async findHistoryCases(name) {
  const sql = `
    SELECT DISTINCT 
      c.id,
      c.case_number as caseNumber,
      c.internal_number as internalNumber,
      c.case_type as caseType,
      c.case_cause as caseCause,
      c.court,
      c.target_amount as targetAmount,
      c.filing_date as filingDate,
      c.status,
      c.created_at as createdAt,
      c.updated_at as updatedAt
    FROM cases c
    INNER JOIN litigation_parties lp ON c.id = lp.case_id
    WHERE lp.name = ?
    ORDER BY c.created_at DESC
  `;
  return await query(sql, [name]);
}
```

### 2. 前端优化

优化案号显示逻辑，优先显示正式案号，如果没有则显示内部编号：

**文件**: `frontend/src/components/case/PartyManagement.vue`

```vue
<el-table-column label="案号" width="180">
  <template #default="{ row }">
    {{ row.caseNumber || row.internalNumber || '-' }}
  </template>
</el-table-column>
```

## 修复效果

### 修复前
| 案号 | 案件类型 | 案由 | 法院 | 状态 |
|------|----------|------|------|------|
| (空) | (空) | (空) | 广州市越秀区人民法院 | 审理中 |

### 修复后
| 案号 | 案件类型 | 案由 | 法院 | 状态 |
|------|----------|------|------|------|
| (2024)粤0104民初12345号 | 民事 | 合同纠纷 | 广州市越秀区人民法院 | 审理中 |

## 测试验证

### 测试步骤

1. 进入案件详情页
2. 点击"诉讼主体"标签
3. 在诉讼主体列表中，点击某个主体的"历史案件"按钮
4. 查看历史案件对话框

### 预期结果

- ✅ 案号正常显示（优先显示正式案号，否则显示内部编号）
- ✅ 案件类型正常显示
- ✅ 案由正常显示
- ✅ 法院正常显示
- ✅ 状态正常显示（带颜色标签）
- ✅ 可以点击"查看"按钮跳转到案件详情

## 返回的字段说明

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | number | 案件ID |
| caseNumber | string | 正式案号 |
| internalNumber | string | 内部编号 |
| caseType | string | 案件类型 |
| caseCause | string | 案由 |
| court | string | 受理法院 |
| targetAmount | number | 标的额 |
| filingDate | string | 立案日期 |
| status | string | 案件状态 |
| createdAt | string | 创建时间 |
| updatedAt | string | 更新时间 |

## 相关文件

### 后端
- `backend/src/models/LitigationParty.js` - 数据模型
- `backend/src/controllers/partyController.js` - 控制器
- `backend/src/routes/party.js` - 路由

### 前端
- `frontend/src/components/case/PartyManagement.vue` - 诉讼主体管理组件
- `frontend/src/api/party.ts` - API接口

## 注意事项

1. **字段命名规范**
   - 后端数据库使用 snake_case
   - 前端使用 camelCase
   - 在 SQL 查询中使用别名进行转换

2. **案号显示优先级**
   - 优先显示 `caseNumber`（正式案号）
   - 如果没有，显示 `internalNumber`（内部编号）
   - 如果都没有，显示 `-`

3. **其他类似问题**
   - 如果其他地方也有字段名不匹配的问题，可以采用相同的解决方案
   - 建议在所有 SQL 查询中统一使用别名转换

## 更新日期

2024-11-20

## 版本

v1.0.0
