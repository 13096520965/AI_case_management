# 主体搜索API实现总结

## 实施任务
任务 4: 主体搜索API
- 4.1 实现搜索建议接口 ✅
- 4.2 实现主体历史信息接口 ✅
- 4.3 实现主体模板查询接口 ✅

## 实现内容

### 1. 搜索建议接口 (4.1)

**接口**: `GET /api/parties/suggestions`

**参数**:
- `keyword` (必填): 搜索关键词
- `partyType` (可选): 主体类型（原告、被告、第三人等）

**功能**:
- 根据关键词模糊匹配主体名称
- 可选按主体类型过滤
- 返回匹配的主体名称和案件数量
- 按案件数量降序排序
- 限制返回10条结果

**响应示例**:
```json
{
  "data": {
    "suggestions": [
      {
        "name": "张三",
        "case_count": 5,
        "id": 1
      },
      {
        "name": "张四",
        "case_count": 3,
        "id": 2
      }
    ]
  }
}
```

**验证需求**: 需求 4.2, 8.1

### 2. 主体历史信息接口 (4.2)

**接口**: `GET /api/parties/:id/history`

**参数**:
- `id` (路径参数): 主体ID

**功能**:
- 返回主体基本信息（ID、名称、实体类型、联系方式、地址等）
- 返回该主体参与的所有历史案件列表
- 案件信息包括案号、案由、案件类型、立案日期、状态等

**响应示例**:
```json
{
  "data": {
    "party": {
      "id": 1,
      "name": "张三",
      "entity_type": "个人",
      "contact_phone": "13800138000",
      "contact_email": "zhangsan@example.com",
      "address": "北京市朝阳区",
      "unified_credit_code": null,
      "legal_representative": null
    },
    "cases": [
      {
        "id": 1,
        "case_number": "2024民初001",
        "internal_number": "CASE-2024-001",
        "case_cause": "合同纠纷",
        "case_type": "民事",
        "filing_date": "2024-01-15",
        "status": "审理中"
      }
    ]
  }
}
```

**验证需求**: 需求 7.5

### 3. 主体模板查询接口 (4.3)

**接口**: `GET /api/parties/templates/:name`

**参数**:
- `name` (路径参数): 主体名称

**功能**:
- 先从 `party_templates` 表查询模板
- 如果不存在，从 `litigation_parties` 表查询最近记录
- 自动更新使用统计（usage_count 和 last_used_at）
- 用于快速录入时自动填充主体信息

**响应示例**:
```json
{
  "data": {
    "template": {
      "id": 1,
      "name": "张三",
      "entity_type": "个人",
      "contact_phone": "13800138000",
      "address": "北京市朝阳区",
      "unified_credit_code": null,
      "legal_representative": null,
      "usage_count": 5,
      "last_used_at": "2024-01-20 10:30:00",
      "created_at": "2024-01-01 09:00:00"
    }
  }
}
```

**验证需求**: 需求 8.2, 8.5

## 代码修改

### 1. 控制器 (partyController.js)

新增三个控制器方法:
- `getPartySuggestions`: 处理搜索建议请求
- `getPartyHistoryById`: 处理主体历史信息请求
- `getPartyTemplate`: 处理主体模板查询请求

### 2. 模型 (LitigationParty.js)

新增三个模型方法:
- `getSuggestions(keyword, partyType)`: 查询搜索建议
- `getTemplate(name)`: 查询主体模板并更新使用统计

### 3. 路由 (party.js)

新增三个路由:
- `GET /api/parties/suggestions`
- `GET /api/parties/:id/history`
- `GET /api/parties/templates/:name`

## 测试结果

所有测试通过 ✅

### 4.1 搜索建议接口测试
- ✅ 基本搜索建议
- ✅ 按主体类型搜索建议
- ✅ 空关键词验证
- ✅ 结果按案件数量降序排序
- ✅ 结果限制在10条以内

### 4.2 主体历史信息接口测试
- ✅ 获取主体历史信息
- ✅ 返回格式正确（包含 party 和 cases）
- ✅ 主体基本信息完整
- ✅ 案件列表格式正确
- ✅ 不存在的主体ID返回404

### 4.3 主体模板查询接口测试
- ✅ 获取主体模板
- ✅ 返回模板数据
- ✅ 模板数据包含必要字段
- ✅ 验证使用统计更新
- ✅ 不存在的主体名称返回404
- ✅ 空名称验证

## 数据库表使用

### party_templates 表
用于存储主体模板信息，支持快速录入功能:
- `name`: 主体名称
- `entity_type`: 实体类型
- `contact_phone`: 联系电话
- `address`: 地址
- `usage_count`: 使用次数
- `last_used_at`: 最后使用时间
- `created_at`: 创建时间

### litigation_parties 表
主体信息表，用于:
- 搜索建议查询（按名称模糊匹配）
- 历史案件查询（按主体名称关联案件）
- 模板查询（当 party_templates 表无数据时作为备选）

## API使用示例

### 1. 获取搜索建议
```javascript
// 基本搜索
GET /api/parties/suggestions?keyword=张

// 按类型搜索
GET /api/parties/suggestions?keyword=公司&partyType=被告
```

### 2. 获取主体历史信息
```javascript
GET /api/parties/123/history
```

### 3. 获取主体模板
```javascript
GET /api/parties/templates/张三
```

## 前端集成建议

### 1. 搜索建议组件
```vue
<el-autocomplete
  v-model="searchKeyword"
  :fetch-suggestions="fetchPartySuggestions"
  placeholder="请输入当事人名称"
>
  <template #default="{ item }">
    <div>
      <span>{{ item.name }}</span>
      <span class="case-count">{{ item.case_count }}个案件</span>
    </div>
  </template>
</el-autocomplete>
```

### 2. 主体详情页面
```vue
<template>
  <div v-if="partyHistory">
    <h3>{{ partyHistory.party.name }}</h3>
    <p>联系电话: {{ partyHistory.party.contact_phone }}</p>
    <h4>历史案件 ({{ partyHistory.cases.length }})</h4>
    <ul>
      <li v-for="c in partyHistory.cases" :key="c.id">
        {{ c.case_number }} - {{ c.case_cause }}
      </li>
    </ul>
  </div>
</template>
```

### 3. 快速录入表单
```vue
<el-autocomplete
  v-model="partyForm.name"
  :fetch-suggestions="fetchPartySuggestions"
  @select="handlePartySelect"
>
</el-autocomplete>

<script>
async function handlePartySelect(item) {
  // 获取模板并自动填充
  const { data } = await getPartyTemplate(item.name);
  partyForm.entity_type = data.template.entity_type;
  partyForm.contact_phone = data.template.contact_phone;
  partyForm.address = data.template.address;
}
</script>
```

## 性能优化

1. **索引优化**: 已在 `litigation_parties` 表的 `name` 字段上创建索引 (`idx_party_name`)
2. **结果限制**: 搜索建议限制返回10条，避免大量数据传输
3. **缓存策略**: 建议前端对搜索建议实现防抖和缓存
4. **使用统计**: 模板使用统计采用 INSERT ... ON CONFLICT 语法，高效更新

## 后续优化建议

1. **全文搜索**: 考虑使用 SQLite FTS5 扩展实现更高效的全文搜索
2. **拼音搜索**: 支持拼音首字母搜索（如输入"zs"匹配"张三"）
3. **智能排序**: 结合使用频率、最近使用时间等多维度排序
4. **批量查询**: 支持一次查询多个主体的历史信息
5. **缓存机制**: 对高频查询的主体模板实现服务端缓存

## 相关文件

- 控制器: `src/controllers/partyController.js`
- 模型: `src/models/LitigationParty.js`
- 路由: `src/routes/party.js`
- 测试: `test-party-search-api.js`
