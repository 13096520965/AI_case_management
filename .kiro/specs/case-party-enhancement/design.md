# 案件主体信息展示与搜索增强设计文档

## 概述

本设计文档描述了案件主体（当事人）信息展示和搜索功能的增强方案。该功能将主体信息整合到案件基本信息中，在列表页面直接展示，并支持批量导入和按当事人搜索，从而提升法务人员的工作效率。

### 设计目标

- **信息集中**: 将主体信息整合到案件基本信息中，减少页面跳转
- **快速识别**: 在案件列表中直接展示主要当事人，便于快速定位
- **高效录入**: 支持批量导入和智能补全，减少重复劳动
- **精准搜索**: 支持按当事人名称搜索，快速找到相关案件
- **数据完整**: 保证主体信息的完整性和一致性

### 技术栈

本功能基于现有的智能案管系统技术栈：

**前端**:
- Vue 3 + TypeScript
- Element Plus (UI组件)
- Pinia (状态管理)
- Axios (HTTP客户端)
- XLSX (Excel文件处理)

**后端**:
- Express.js
- SQLite3
- Multer (文件上传)

## 架构设计

### 系统架构

```
┌─────────────────────────────────────────────┐
│           前端层 (Vue 3)                     │
│  ┌────────────────────────────────────────┐ │
│  │  案件列表页面 (带主体信息展示)         │ │
│  ├────────────────────────────────────────┤ │
│  │  案件详情页面 (基本信息+主体管理)      │ │
│  ├────────────────────────────────────────┤ │
│  │  主体批量导入页面                      │ │
│  ├────────────────────────────────────────┤ │
│  │  主体搜索组件                          │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
                    ↓ REST API
┌─────────────────────────────────────────────┐
│           后端层 (Express.js)                │
│  ┌────────────────────────────────────────┐ │
│  │  案件API (增强查询，包含主体信息)      │ │
│  ├────────────────────────────────────────┤ │
│  │  主体API (CRUD + 批量导入)             │ │
│  ├────────────────────────────────────────┤ │
│  │  搜索API (支持当事人搜索)              │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│           数据层 (SQLite)                    │
│  ┌────────────────────────────────────────┐ │
│  │  cases 表 (案件基本信息)               │ │
│  ├────────────────────────────────────────┤ │
│  │  litigation_parties 表 (主体信息)      │ │
│  ├────────────────────────────────────────┤ │
│  │  party_history 表 (主体修改历史)       │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

## 组件和接口

### 前端组件

**1. CaseListWithParties (案件列表组件增强)**
- 功能: 展示案件列表，每行显示主要当事人信息
- 输入: 案件列表数据（包含主体信息）
- 输出: 渲染的列表，支持点击跳转
- 交互: 鼠标悬停显示完整主体信息

**2. CaseBasicInfoWithParties (案件基本信息组件增强)**
- 功能: 在案件基本信息中按主体类型分别展示和管理主体信息
- 输入: 案件ID
- 输出: 案件基本信息 + 按类型分组的主体列表（原告、被告、第三人）
- 交互: 
  - 按主体类型分别添加（添加原告、添加被告、添加第三人）
  - 每个类型下可添加多个主体
  - 支持编辑、删除各类型下的主体

**3. PartyImportDialog (主体批量导入对话框)**
- 功能: 上传Excel/CSV文件批量导入主体信息
- 输入: Excel/CSV文件
- 输出: 导入结果（成功/失败统计）
- 交互: 文件上传、验证、导入、结果展示

**4. PartySearchInput (当事人搜索输入框)**
- 功能: 提供当事人搜索功能，支持自动补全
- 输入: 用户输入的关键词
- 输出: 搜索建议列表
- 交互: 输入、选择、搜索

**5. PartyQuickInput (主体快速录入组件)**
- 功能: 支持自动补全的主体信息录入
- 输入: 主体名称关键词
- 输出: 自动填充的主体信息
- 交互: 输入、选择历史主体、自动填充

### 后端接口

**1. 案件查询接口增强**

```
GET /api/cases?page=1&limit=10&partyName=张三
```

响应:
```json
{
  "data": [
    {
      "id": 1,
      "case_number": "2024民初001",
      "case_cause": "合同纠纷",
      "parties": {
        "plaintiffs": [
          {"id": 1, "name": "张三", "party_type": "原告"}
        ],
        "defendants": [
          {"id": 2, "name": "李四", "party_type": "被告"}
        ]
      }
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 10
}
```

**2. 主体批量导入接口**

```
POST /api/parties/import
Content-Type: multipart/form-data

file: parties.xlsx
```

响应:
```json
{
  "success": true,
  "summary": {
    "total": 100,
    "success": 95,
    "failed": 5
  },
  "errors": [
    {
      "row": 10,
      "field": "name",
      "message": "主体名称不能为空"
    }
  ]
}
```

**3. 主体搜索建议接口**

```
GET /api/parties/suggestions?keyword=张
```

响应:
```json
{
  "suggestions": [
    {"id": 1, "name": "张三", "caseCount": 5},
    {"id": 2, "name": "张四", "caseCount": 3}
  ]
}
```

**4. 主体历史信息接口**

```
GET /api/parties/:id/history
```

响应:
```json
{
  "party": {
    "id": 1,
    "name": "张三",
    "contact_phone": "13800138000",
    "address": "北京市朝阳区"
  },
  "cases": [
    {"id": 1, "case_number": "2024民初001", "party_type": "原告"},
    {"id": 2, "case_number": "2023民初100", "party_type": "被告"}
  ]
}
```

**5. 导出接口增强**

```
GET /api/cases/export?format=xlsx&includeParties=true
```

响应: Excel文件下载

## 数据模型

### 数据库表结构

**1. litigation_parties 表（现有表，需要增强）**

```sql
CREATE TABLE litigation_parties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER NOT NULL,
  party_type VARCHAR(50) NOT NULL,  -- 原告/被告/第三人/代理律师
  entity_type VARCHAR(50),           -- 企业/个人
  name VARCHAR(200) NOT NULL,
  unified_credit_code VARCHAR(100),  -- 统一社会信用代码
  legal_representative VARCHAR(100), -- 法定代表人
  id_number VARCHAR(50),             -- 身份证号
  contact_phone VARCHAR(50),
  contact_email VARCHAR(100),
  address TEXT,
  is_primary BOOLEAN DEFAULT 0,      -- 是否为主要当事人（新增）
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- 添加索引以优化搜索性能
CREATE INDEX idx_party_name ON litigation_parties(name);
CREATE INDEX idx_party_case_id ON litigation_parties(case_id);
CREATE INDEX idx_party_type ON litigation_parties(party_type);
```

**2. party_history 表（新增，用于记录修改历史）**

```sql
CREATE TABLE party_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  party_id INTEGER NOT NULL,
  case_id INTEGER NOT NULL,
  action VARCHAR(50) NOT NULL,       -- CREATE/UPDATE/DELETE
  changed_fields TEXT,                -- JSON格式，记录变更字段
  changed_by VARCHAR(100),            -- 操作人
  changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (party_id) REFERENCES litigation_parties(id),
  FOREIGN KEY (case_id) REFERENCES cases(id)
);

CREATE INDEX idx_party_history_party_id ON party_history(party_id);
```

**3. party_templates 表（新增，用于快速录入）**

```sql
CREATE TABLE party_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(200) NOT NULL,
  entity_type VARCHAR(50),
  unified_credit_code VARCHAR(100),
  legal_representative VARCHAR(100),
  id_number VARCHAR(50),
  contact_phone VARCHAR(50),
  contact_email VARCHAR(100),
  address TEXT,
  usage_count INTEGER DEFAULT 0,     -- 使用次数
  last_used_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, entity_type)
);

CREATE INDEX idx_party_template_name ON party_templates(name);
```

### 数据关系

```
cases (1) ──────< (N) litigation_parties
                        │
                        │ (1)
                        │
                        ↓
                      (N) party_history

party_templates (独立表，用于快速录入参考)
```

## 核心功能实现

### 1. 案件列表展示主体信息（按类型分列）

**实现逻辑**:

```javascript
// 后端: 查询案件时按主体类型关联信息
async function getCasesWithParties(filters) {
  const cases = await db.all(`
    SELECT c.*, 
           GROUP_CONCAT(
             CASE WHEN lp.party_type = '原告' 
             THEN json_object('id', lp.id, 'name', lp.name, 'is_primary', lp.is_primary)
             END
           ) as plaintiffs,
           GROUP_CONCAT(
             CASE WHEN lp.party_type = '被告' 
             THEN json_object('id', lp.id, 'name', lp.name, 'is_primary', lp.is_primary)
             END
           ) as defendants,
           GROUP_CONCAT(
             CASE WHEN lp.party_type = '第三人' 
             THEN json_object('id', lp.id, 'name', lp.name, 'is_primary', lp.is_primary)
             END
           ) as third_parties
    FROM cases c
    LEFT JOIN litigation_parties lp ON c.id = lp.case_id
    WHERE 1=1
      ${filters.partyName ? "AND lp.name LIKE ?" : ""}
    GROUP BY c.id
    ORDER BY c.created_at DESC
    LIMIT ? OFFSET ?
  `, params);
  
  // 解析JSON字符串为对象，按类型分组
  return cases.map(c => ({
    ...c,
    plaintiffs: JSON.parse(c.plaintiffs || '[]').filter(p => p),
    defendants: JSON.parse(c.defendants || '[]').filter(p => p),
    third_parties: JSON.parse(c.third_parties || '[]').filter(p => p)
  }));
}
```

**前端渲染（按类型分列展示）**:

```vue
<template>
  <el-table :data="cases">
    <el-table-column label="案号" prop="case_number" width="150" />
    
    <!-- 原告列 -->
    <el-table-column label="原告" width="200">
      <template #default="{ row }">
        <div class="party-cell">
          <el-tag type="danger" size="small" class="party-icon">原</el-tag>
          <span v-if="row.plaintiffs.length === 0" class="text-gray">-</span>
          <span v-else-if="row.plaintiffs.length === 1">
            {{ row.plaintiffs[0].name }}
          </span>
          <el-tooltip v-else placement="top">
            <template #content>
              <div v-for="p in row.plaintiffs" :key="p.id" class="tooltip-item">
                {{ p.name }}
              </div>
            </template>
            <span class="party-summary">
              {{ getPrimaryParty(row.plaintiffs).name }} 
              <el-tag size="small">等{{ row.plaintiffs.length }}人</el-tag>
            </span>
          </el-tooltip>
        </div>
      </template>
    </el-table-column>
    
    <!-- 被告列 -->
    <el-table-column label="被告" width="200">
      <template #default="{ row }">
        <div class="party-cell">
          <el-tag type="warning" size="small" class="party-icon">被</el-tag>
          <span v-if="row.defendants.length === 0" class="text-gray">-</span>
          <span v-else-if="row.defendants.length === 1">
            {{ row.defendants[0].name }}
          </span>
          <el-tooltip v-else placement="top">
            <template #content>
              <div v-for="p in row.defendants" :key="p.id" class="tooltip-item">
                {{ p.name }}
              </div>
            </template>
            <span class="party-summary">
              {{ getPrimaryParty(row.defendants).name }} 
              <el-tag size="small">等{{ row.defendants.length }}人</el-tag>
            </span>
          </el-tooltip>
        </div>
      </template>
    </el-table-column>
    
    <!-- 第三人列 -->
    <el-table-column label="第三人" width="150">
      <template #default="{ row }">
        <div class="party-cell">
          <el-tag type="info" size="small" class="party-icon">三</el-tag>
          <span v-if="row.third_parties.length === 0" class="text-gray">-</span>
          <span v-else-if="row.third_parties.length === 1">
            {{ row.third_parties[0].name }}
          </span>
          <el-tooltip v-else placement="top">
            <template #content>
              <div v-for="p in row.third_parties" :key="p.id" class="tooltip-item">
                {{ p.name }}
              </div>
            </template>
            <span class="party-summary">
              {{ getPrimaryParty(row.third_parties).name }} 
              <el-tag size="small">等{{ row.third_parties.length }}人</el-tag>
            </span>
          </el-tooltip>
        </div>
      </template>
    </el-table-column>
    
    <el-table-column label="案由" prop="case_cause" />
    <el-table-column label="操作" width="150">
      <template #default="{ row }">
        <el-button link @click="viewDetail(row.id)">查看</el-button>
      </template>
    </el-table-column>
  </el-table>
</template>

<style scoped>
.party-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}
.party-icon {
  flex-shrink: 0;
}
.party-summary {
  display: flex;
  align-items: center;
  gap: 4px;
}
.tooltip-item {
  padding: 2px 0;
}
.text-gray {
  color: #909399;
}
</style>
```

### 2. 主体信息批量导入（按类型导入）

**Excel模板格式（按主体类型分sheet或分区）**:

**方案一：单sheet，按主体类型列**

| 案件编号 | 主体类型 | 主体名称 | 实体类型 | 统一社会信用代码 | 联系电话 | 地址 |
|---------|---------|---------|---------|----------------|---------|------|
| 2024民初001 | 原告 | 张三 | 个人 | | 13800138000 | 北京市朝阳区 |
| 2024民初001 | 被告 | 李四公司 | 企业 | 91110000XXXXXXXX | 010-12345678 | 北京市海淀区 |
| 2024民初001 | 第三人 | 王五 | 个人 | | 13900139000 | 北京市东城区 |

**方案二：多sheet，按主体类型分sheet（推荐）**

Sheet 1 - 原告信息:
| 案件编号 | 主体名称 | 实体类型 | 统一社会信用代码 | 联系电话 | 地址 |
|---------|---------|---------|----------------|---------|------|
| 2024民初001 | 张三 | 个人 | | 13800138000 | 北京市朝阳区 |

Sheet 2 - 被告信息:
| 案件编号 | 主体名称 | 实体类型 | 统一社会信用代码 | 联系电话 | 地址 |
|---------|---------|---------|----------------|---------|------|
| 2024民初001 | 李四公司 | 企业 | 91110000XXXXXXXX | 010-12345678 | 北京市海淀区 |

Sheet 3 - 第三人信息:
| 案件编号 | 主体名称 | 实体类型 | 统一社会信用代码 | 联系电话 | 地址 |
|---------|---------|---------|----------------|---------|------|
| 2024民初001 | 王五 | 个人 | | 13900139000 | 北京市东城区 |

**导入处理流程（按类型处理）**:

```javascript
// 后端: 处理Excel导入（支持按类型分sheet）
const XLSX = require('xlsx');

async function importParties(file, importMode = 'multi-sheet') {
  const workbook = XLSX.readFile(file.path);
  
  const results = {
    total: 0,
    success: 0,
    failed: 0,
    byType: {
      '原告': { success: 0, failed: 0 },
      '被告': { success: 0, failed: 0 },
      '第三人': { success: 0, failed: 0 }
    },
    errors: []
  };
  
  if (importMode === 'multi-sheet') {
    // 方案二：多sheet模式，按主体类型分sheet
    const sheetMapping = {
      '原告信息': '原告',
      '被告信息': '被告',
      '第三人信息': '第三人'
    };
    
    for (const [sheetName, partyType] of Object.entries(sheetMapping)) {
      if (workbook.Sheets[sheetName]) {
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        await processSheetData(data, partyType, results, sheetName);
      }
    }
  } else {
    // 方案一：单sheet模式，包含主体类型列
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);
    await processSheetData(data, null, results, workbook.SheetNames[0]);
  }
  
  return results;
}

async function processSheetData(data, fixedPartyType, results, sheetName) {
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    results.total++;
    
    try {
      // 确定主体类型
      const partyType = fixedPartyType || row['主体类型'];
      
      // 验证必填字段
      validatePartyData(row, partyType);
      
      // 查找案件ID
      const caseInfo = await db.get(
        'SELECT id FROM cases WHERE internal_number = ? OR case_number = ?',
        [row['案件编号'], row['案件编号']]
      );
      
      if (!caseInfo) {
        throw new Error('案件不存在');
      }
      
      // 检查重复
      const existing = await db.get(
        'SELECT id FROM litigation_parties WHERE case_id = ? AND name = ? AND party_type = ?',
        [caseInfo.id, row['主体名称'], partyType]
      );
      
      if (existing) {
        // 更新现有记录
        await updateParty(existing.id, { ...row, party_type: partyType });
      } else {
        // 插入新记录
        await insertParty(caseInfo.id, { ...row, party_type: partyType });
      }
      
      results.success++;
      results.byType[partyType].success++;
    } catch (error) {
      results.failed++;
      if (fixedPartyType) {
        results.byType[fixedPartyType].failed++;
      }
      results.errors.push({
        sheet: sheetName,
        row: i + 2, // Excel行号（从2开始，因为第1行是表头）
        partyType: fixedPartyType || row['主体类型'],
        data: row,
        message: error.message
      });
    }
  }
}

function validatePartyData(row, partyType) {
  const required = ['案件编号', '主体名称'];
  for (const field of required) {
    if (!row[field]) {
      throw new Error(`${field}不能为空`);
    }
  }
  
  if (!partyType) {
    throw new Error('主体类型不能为空');
  }
  
  const validTypes = ['原告', '被告', '第三人', '代理律师'];
  if (!validTypes.includes(partyType)) {
    throw new Error(`主体类型必须是: ${validTypes.join('、')}`);
  }
}
```

### 3. 按当事人搜索

**搜索建议实现**:

```javascript
// 后端: 提供搜索建议
async function getPartySuggestions(keyword) {
  const suggestions = await db.all(`
    SELECT 
      lp.name,
      COUNT(DISTINCT lp.case_id) as case_count,
      MAX(lp.id) as id
    FROM litigation_parties lp
    WHERE lp.name LIKE ?
    GROUP BY lp.name
    ORDER BY case_count DESC, lp.name ASC
    LIMIT 10
  `, [`%${keyword}%`]);
  
  return suggestions;
}
```

**前端自动补全**:

```vue
<template>
  <el-autocomplete
    v-model="searchForm.partyName"
    :fetch-suggestions="fetchPartySuggestions"
    placeholder="请输入当事人名称"
    @select="handleSelect"
  >
    <template #default="{ item }">
      <div class="suggestion-item">
        <span>{{ item.name }}</span>
        <span class="case-count">{{ item.case_count }}个案件</span>
      </div>
    </template>
  </el-autocomplete>
</template>

<script setup>
import { ref } from 'vue';
import { getPartySuggestions } from '@/api/parties';

const searchForm = ref({ partyName: '' });

async function fetchPartySuggestions(queryString, cb) {
  if (!queryString) {
    cb([]);
    return;
  }
  
  const { data } = await getPartySuggestions(queryString);
  cb(data.suggestions);
}

function handleSelect(item) {
  // 触发搜索
  searchCases();
}
</script>
```

### 4. 主体信息快速录入

**自动补全实现**:

```javascript
// 后端: 获取主体模板
async function getPartyTemplate(name) {
  // 先从模板表查找
  let template = await db.get(
    'SELECT * FROM party_templates WHERE name = ?',
    [name]
  );
  
  if (!template) {
    // 从历史记录中查找最近使用的
    template = await db.get(`
      SELECT * FROM litigation_parties 
      WHERE name = ? 
      ORDER BY updated_at DESC 
      LIMIT 1
    `, [name]);
  }
  
  if (template) {
    // 更新使用统计
    await db.run(`
      INSERT INTO party_templates (name, entity_type, contact_phone, address, usage_count, last_used_at)
      VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
      ON CONFLICT(name, entity_type) DO UPDATE SET
        usage_count = usage_count + 1,
        last_used_at = CURRENT_TIMESTAMP
    `, [template.name, template.entity_type, template.contact_phone, template.address]);
  }
  
  return template;
}
```

### 5. 数据完整性保障

**级联删除**:

```javascript
// 后端: 删除案件时级联删除主体
async function deleteCase(caseId) {
  await db.run('BEGIN TRANSACTION');
  
  try {
    // 删除主体信息
    await db.run('DELETE FROM litigation_parties WHERE case_id = ?', [caseId]);
    
    // 删除主体历史
    await db.run('DELETE FROM party_history WHERE case_id = ?', [caseId]);
    
    // 删除案件
    await db.run('DELETE FROM cases WHERE id = ?', [caseId]);
    
    await db.run('COMMIT');
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }
}
```

**修改历史记录**:

```javascript
// 后端: 记录主体信息变更
async function updateParty(partyId, newData, userId) {
  // 获取旧数据
  const oldData = await db.get('SELECT * FROM litigation_parties WHERE id = ?', [partyId]);
  
  // 计算变更字段
  const changedFields = {};
  for (const key in newData) {
    if (oldData[key] !== newData[key]) {
      changedFields[key] = {
        old: oldData[key],
        new: newData[key]
      };
    }
  }
  
  // 更新主体信息
  await db.run(`
    UPDATE litigation_parties 
    SET name = ?, contact_phone = ?, address = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [newData.name, newData.contact_phone, newData.address, partyId]);
  
  // 记录历史
  await db.run(`
    INSERT INTO party_history (party_id, case_id, action, changed_fields, changed_by)
    VALUES (?, ?, 'UPDATE', ?, ?)
  `, [partyId, oldData.case_id, JSON.stringify(changedFields), userId]);
}
```

### 6. 基本信息输入（按类型分别填写）

**前端表单设计**:

```vue
<template>
  <el-form :model="caseForm" label-width="120px">
    <!-- 案件基本信息 -->
    <el-form-item label="案号">
      <el-input v-model="caseForm.case_number" />
    </el-form-item>
    <el-form-item label="案由">
      <el-input v-model="caseForm.case_cause" />
    </el-form-item>
    
    <!-- 原告信息区域 -->
    <el-divider content-position="left">
      <el-tag type="danger">原告信息</el-tag>
    </el-divider>
    <div v-for="(plaintiff, index) in caseForm.plaintiffs" :key="index" class="party-group">
      <el-form-item :label="`原告${index + 1}`">
        <el-row :gutter="10">
          <el-col :span="6">
            <el-select v-model="plaintiff.entity_type" placeholder="实体类型">
              <el-option label="个人" value="个人" />
              <el-option label="企业" value="企业" />
            </el-select>
          </el-col>
          <el-col :span="8">
            <el-autocomplete
              v-model="plaintiff.name"
              :fetch-suggestions="(q, cb) => fetchPartySuggestions(q, cb, '原告')"
              placeholder="主体名称"
              @select="(item) => handlePartySelect(item, plaintiff)"
            />
          </el-col>
          <el-col :span="6">
            <el-input v-model="plaintiff.contact_phone" placeholder="联系电话" />
          </el-col>
          <el-col :span="4">
            <el-button 
              type="danger" 
              icon="Delete" 
              circle 
              @click="removePlaintiff(index)"
              v-if="caseForm.plaintiffs.length > 1"
            />
          </el-col>
        </el-row>
      </el-form-item>
      <el-form-item label="地址">
        <el-input v-model="plaintiff.address" />
      </el-form-item>
    </div>
    <el-form-item>
      <el-button type="primary" plain @click="addPlaintiff">
        <el-icon><Plus /></el-icon> 添加原告
      </el-button>
    </el-form-item>
    
    <!-- 被告信息区域 -->
    <el-divider content-position="left">
      <el-tag type="warning">被告信息</el-tag>
    </el-divider>
    <div v-for="(defendant, index) in caseForm.defendants" :key="index" class="party-group">
      <el-form-item :label="`被告${index + 1}`">
        <el-row :gutter="10">
          <el-col :span="6">
            <el-select v-model="defendant.entity_type" placeholder="实体类型">
              <el-option label="个人" value="个人" />
              <el-option label="企业" value="企业" />
            </el-select>
          </el-col>
          <el-col :span="8">
            <el-autocomplete
              v-model="defendant.name"
              :fetch-suggestions="(q, cb) => fetchPartySuggestions(q, cb, '被告')"
              placeholder="主体名称"
              @select="(item) => handlePartySelect(item, defendant)"
            />
          </el-col>
          <el-col :span="6">
            <el-input v-model="defendant.contact_phone" placeholder="联系电话" />
          </el-col>
          <el-col :span="4">
            <el-button 
              type="danger" 
              icon="Delete" 
              circle 
              @click="removeDefendant(index)"
              v-if="caseForm.defendants.length > 1"
            />
          </el-col>
        </el-row>
      </el-form-item>
      <el-form-item label="地址">
        <el-input v-model="defendant.address" />
      </el-form-item>
    </div>
    <el-form-item>
      <el-button type="warning" plain @click="addDefendant">
        <el-icon><Plus /></el-icon> 添加被告
      </el-button>
    </el-form-item>
    
    <!-- 第三人信息区域 -->
    <el-divider content-position="left">
      <el-tag type="info">第三人信息（可选）</el-tag>
    </el-divider>
    <div v-for="(thirdParty, index) in caseForm.thirdParties" :key="index" class="party-group">
      <el-form-item :label="`第三人${index + 1}`">
        <el-row :gutter="10">
          <el-col :span="6">
            <el-select v-model="thirdParty.entity_type" placeholder="实体类型">
              <el-option label="个人" value="个人" />
              <el-option label="企业" value="企业" />
            </el-select>
          </el-col>
          <el-col :span="8">
            <el-autocomplete
              v-model="thirdParty.name"
              :fetch-suggestions="(q, cb) => fetchPartySuggestions(q, cb, '第三人')"
              placeholder="主体名称"
              @select="(item) => handlePartySelect(item, thirdParty)"
            />
          </el-col>
          <el-col :span="6">
            <el-input v-model="thirdParty.contact_phone" placeholder="联系电话" />
          </el-col>
          <el-col :span="4">
            <el-button 
              type="danger" 
              icon="Delete" 
              circle 
              @click="removeThirdParty(index)"
            />
          </el-col>
        </el-row>
      </el-form-item>
      <el-form-item label="地址">
        <el-input v-model="thirdParty.address" />
      </el-form-item>
    </div>
    <el-form-item>
      <el-button type="info" plain @click="addThirdParty">
        <el-icon><Plus /></el-icon> 添加第三人
      </el-button>
    </el-form-item>
    
    <!-- 提交按钮 -->
    <el-form-item>
      <el-button type="primary" @click="submitForm">保存案件</el-button>
      <el-button @click="resetForm">重置</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { Plus } from '@element-plus/icons-vue';

const caseForm = reactive({
  case_number: '',
  case_cause: '',
  plaintiffs: [{ entity_type: '', name: '', contact_phone: '', address: '', party_type: '原告' }],
  defendants: [{ entity_type: '', name: '', contact_phone: '', address: '', party_type: '被告' }],
  thirdParties: []
});

// 按主体类型添加
function addPlaintiff() {
  caseForm.plaintiffs.push({ 
    entity_type: '', 
    name: '', 
    contact_phone: '', 
    address: '', 
    party_type: '原告',
    is_primary: caseForm.plaintiffs.length === 0 
  });
}

function addDefendant() {
  caseForm.defendants.push({ 
    entity_type: '', 
    name: '', 
    contact_phone: '', 
    address: '', 
    party_type: '被告',
    is_primary: caseForm.defendants.length === 0 
  });
}

function addThirdParty() {
  caseForm.thirdParties.push({ 
    entity_type: '', 
    name: '', 
    contact_phone: '', 
    address: '', 
    party_type: '第三人' 
  });
}

// 按主体类型删除
function removePlaintiff(index) {
  caseForm.plaintiffs.splice(index, 1);
}

function removeDefendant(index) {
  caseForm.defendants.splice(index, 1);
}

function removeThirdParty(index) {
  caseForm.thirdParties.splice(index, 1);
}

// 按主体类型获取自动补全建议
async function fetchPartySuggestions(queryString, cb, partyType) {
  if (!queryString) {
    cb([]);
    return;
  }
  const { data } = await getPartySuggestions(queryString, partyType);
  cb(data.suggestions);
}

// 选择历史主体后自动填充
function handlePartySelect(item, party) {
  party.entity_type = item.entity_type;
  party.contact_phone = item.contact_phone;
  party.address = item.address;
  party.unified_credit_code = item.unified_credit_code;
}

// 提交表单
async function submitForm() {
  // 合并所有主体
  const allParties = [
    ...caseForm.plaintiffs,
    ...caseForm.defendants,
    ...caseForm.thirdParties
  ];
  
  const caseData = {
    case_number: caseForm.case_number,
    case_cause: caseForm.case_cause,
    parties: allParties
  };
  
  await saveCaseWithParties(caseData);
}
</script>

<style scoped>
.party-group {
  background: #f5f7fa;
  padding: 15px;
  margin-bottom: 15px;
  border-radius: 4px;
}
</style>
```

### 7. 导出功能增强（按类型分sheet导出）

```javascript
// 后端: 导出包含主体信息的案件数据（按类型分sheet）
async function exportCasesWithParties(filters, exportMode = 'multi-sheet') {
  const cases = await getCasesWithParties(filters);
  const workbook = XLSX.utils.book_new();
  
  if (exportMode === 'multi-sheet') {
    // 方案一：按主体类型分sheet导出
    const plaintiffRows = [];
    const defendantRows = [];
    const thirdPartyRows = [];
    
    for (const c of cases) {
      // 原告sheet
      if (c.plaintiffs.length > 0) {
        c.plaintiffs.forEach(p => {
          plaintiffRows.push({
            '案件编号': c.case_number,
            '案由': c.case_cause,
            '主体名称': p.name,
            '实体类型': p.entity_type,
            '联系电话': p.contact_phone,
            '地址': p.address,
            '是否主要当事人': p.is_primary ? '是' : '否'
          });
        });
      }
      
      // 被告sheet
      if (c.defendants.length > 0) {
        c.defendants.forEach(p => {
          defendantRows.push({
            '案件编号': c.case_number,
            '案由': c.case_cause,
            '主体名称': p.name,
            '实体类型': p.entity_type,
            '联系电话': p.contact_phone,
            '地址': p.address,
            '是否主要当事人': p.is_primary ? '是' : '否'
          });
        });
      }
      
      // 第三人sheet
      if (c.third_parties && c.third_parties.length > 0) {
        c.third_parties.forEach(p => {
          thirdPartyRows.push({
            '案件编号': c.case_number,
            '案由': c.case_cause,
            '主体名称': p.name,
            '实体类型': p.entity_type,
            '联系电话': p.contact_phone,
            '地址': p.address
          });
        });
      }
    }
    
    // 创建各个sheet
    if (plaintiffRows.length > 0) {
      const ws1 = XLSX.utils.json_to_sheet(plaintiffRows);
      XLSX.utils.book_append_sheet(workbook, ws1, '原告信息');
    }
    
    if (defendantRows.length > 0) {
      const ws2 = XLSX.utils.json_to_sheet(defendantRows);
      XLSX.utils.book_append_sheet(workbook, ws2, '被告信息');
    }
    
    if (thirdPartyRows.length > 0) {
      const ws3 = XLSX.utils.json_to_sheet(thirdPartyRows);
      XLSX.utils.book_append_sheet(workbook, ws3, '第三人信息');
    }
  } else {
    // 方案二：单sheet，包含主体类型列
    const rows = [];
    for (const c of cases) {
      const allParties = [
        ...c.plaintiffs.map(p => ({ ...p, party_type: '原告' })),
        ...c.defendants.map(p => ({ ...p, party_type: '被告' })),
        ...(c.third_parties || []).map(p => ({ ...p, party_type: '第三人' }))
      ];
      
      if (allParties.length === 0) {
        rows.push({
          '案件编号': c.case_number,
          '案由': c.case_cause,
          '主体类型': '',
          '主体名称': '',
          '联系电话': '',
          '地址': ''
        });
      } else {
        for (const party of allParties) {
          rows.push({
            '案件编号': c.case_number,
            '案由': c.case_cause,
            '主体类型': party.party_type,
            '主体名称': party.name,
            '实体类型': party.entity_type,
            '联系电话': party.contact_phone,
            '地址': party.address
          });
        }
      }
    }
    
    const worksheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, '案件主体信息');
  }
  
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}
```

## 错误处理

### 导入错误处理

**常见错误类型**:

1. **文件格式错误**: 不是有效的Excel/CSV文件
2. **必填字段缺失**: 案件编号、主体类型、主体名称为空
3. **案件不存在**: 指定的案件编号在系统中不存在
4. **主体类型无效**: 不在预定义的类型列表中
5. **数据格式错误**: 电话号码、邮箱格式不正确

**错误响应格式**:

```json
{
  "success": false,
  "summary": {
    "total": 100,
    "success": 85,
    "failed": 15
  },
  "errors": [
    {
      "row": 10,
      "field": "主体名称",
      "value": "",
      "message": "主体名称不能为空"
    },
    {
      "row": 25,
      "field": "案件编号",
      "value": "2024民初999",
      "message": "案件不存在"
    }
  ]
}
```

### 搜索错误处理

**超时处理**: 搜索超过5秒自动取消
**空结果处理**: 提示用户调整搜索条件
**特殊字符处理**: 自动转义SQL特殊字符

## 测试策略

### 单元测试

**后端测试**:
- 测试主体信息CRUD操作
- 测试批量导入逻辑（各种错误场景）
- 测试搜索建议生成
- 测试数据完整性约束

**前端测试**:
- 测试组件渲染（不同数量的主体）
- 测试表单验证
- 测试文件上传组件
- 测试搜索自动补全

### 集成测试

- 测试完整的导入流程
- 测试搜索到展示的完整流程
- 测试案件删除的级联效果
- 测试导出功能

### 性能测试

- 测试大量案件（10000+）的列表加载性能
- 测试大文件（1000+行）的导入性能
- 测试搜索响应时间

## 验收标准可测试性分析

### 需求 1: 案件基本信息中整合主体信息

**1.1 WHEN 用户查看案件基本信息时，案管系统 SHALL 在基本信息区域展示所有案件主体列表**
- 思考: 这是测试UI渲染规则。对于任何案件（无论有多少主体），基本信息页面都应该展示所有主体。我们可以生成随机案件数据（包含0个、1个、多个主体），渲染页面，验证所有主体都被展示
- 可测试性: yes - property

**1.2 WHEN 用户创建案件时，案管系统 SHALL 在基本信息表单中提供主体信息录入功能**
- 思考: 这是测试特定UI状态（创建案件表单）是否包含特定功能。这是一个具体的场景
- 可测试性: yes - example

**1.3 WHEN 用户录入主体信息时，案管系统 SHALL 要求填写主体类型、主体名称、联系方式等必填字段**
- 思考: 这是测试表单验证规则。我们可以生成各种缺少必填字段的输入，验证系统是否正确拒绝
- 可测试性: yes - property

**1.4 WHEN 用户保存案件时，案管系统 SHALL 同时保存案件基本信息和关联的主体信息**
- 思考: 这是测试数据持久化的完整性。我们可以生成随机案件和主体数据，保存后查询，验证数据一致性。这是一个round-trip property
- 可测试性: yes - property

**1.5 WHEN 用户编辑案件时，案管系统 SHALL 允许在基本信息页面直接添加、修改或删除主体信息**
- 思考: 这是测试编辑功能的完整性。我们可以测试添加、修改、删除操作是否正确反映在数据中
- 可测试性: yes - property

### 需求 2: 案件列表展示主体信息

**2.1 WHEN 用户查看案件列表时，案管系统 SHALL 在列表的每一行展示该案件的原告和被告名称**
- 思考: 这是测试列表渲染规则。对于任何案件，列表行都应该包含原告和被告信息
- 可测试性: yes - property

**2.2 WHEN 案件存在多个原告或被告时，案管系统 SHALL 显示主要原告和主要被告，并标注总数量**
- 思考: 这是测试特定场景（多个主体）的显示格式。我们可以生成有多个原告/被告的案件，验证显示格式
- 可测试性: yes - property

**2.3 WHEN 用户将鼠标悬停在主体名称上时，案管系统 SHALL 显示该主体的详细信息提示框**
- 思考: 这是测试UI交互行为。对于任何主体，悬停都应该显示提示框
- 可测试性: yes - property

**2.4 WHEN 列表数据加载时，案管系统 SHALL 同时加载案件基本信息和关联的主体信息**
- 思考: 这是测试数据加载的完整性。我们可以验证返回的数据结构包含主体信息
- 可测试性: yes - property

**2.5 WHEN 用户点击主体名称时，案管系统 SHALL 跳转到该主体的详细档案页面**
- 思考: 这是测试导航行为。对于任何主体，点击都应该跳转到正确的页面
- 可测试性: yes - property

### 需求 3: 主体信息批量导入

**3.1 THE 案管系统 SHALL 支持通过Excel文件批量导入案件主体信息**
- 思考: 这是测试系统能力。我们可以生成有效的Excel文件，验证导入成功
- 可测试性: yes - example

**3.2 THE 案管系统 SHALL 支持通过CSV文件批量导入案件主体信息**
- 思考: 这是测试系统能力。我们可以生成有效的CSV文件，验证导入成功
- 可测试性: yes - example

**3.3 WHEN 用户上传导入文件时，案管系统 SHALL 验证文件格式和必填字段的完整性**
- 思考: 这是测试输入验证。我们可以生成各种无效文件（错误格式、缺少字段），验证系统正确拒绝
- 可测试性: yes - property

**3.4 WHEN 文件验证失败时，案管系统 SHALL 显示详细的错误信息，指出具体的错误行和字段**
- 思考: 这是测试错误报告的质量。对于任何验证失败的文件，错误信息都应该包含行号和字段名
- 可测试性: yes - property

**3.5 WHEN 导入数据存在重复时，案管系统 SHALL 提供选项让用户选择跳过或更新已有数据**
- 思考: 这是测试重复数据处理。我们可以导入包含重复数据的文件，验证系统提供选项
- 可测试性: yes - example

**3.6 WHEN 导入完成时，案管系统 SHALL 显示导入结果摘要，包括成功数量、失败数量和错误详情**
- 思考: 这是测试导入结果报告。对于任何导入操作，都应该返回完整的摘要
- 可测试性: yes - property

**3.7 THE 案管系统 SHALL 提供标准的导入模板文件供用户下载**
- 思考: 这是测试系统功能存在性
- 可测试性: yes - example

### 需求 4: 按当事人搜索案件

**4.1 WHEN 用户访问案件列表页面时，案管系统 SHALL 在搜索区域提供"当事人"搜索字段**
- 思考: 这是测试UI元素存在性
- 可测试性: yes - example

**4.2 WHEN 用户在当事人字段输入关键词时，案管系统 SHALL 实时提供自动补全建议，显示匹配的主体名称**
- 思考: 这是测试搜索建议功能。对于任何关键词，系统都应该返回匹配的建议
- 可测试性: yes - property

**4.3 WHEN 用户选择或输入当事人名称后点击搜索时，案管系统 SHALL 返回所有包含该当事人的案件列表**
- 思考: 这是测试搜索结果的完整性。对于任何当事人名称，返回的案件都应该包含该当事人
- 可测试性: yes - property

**4.4 WHEN 搜索结果展示时，案管系统 SHALL 高亮显示匹配的当事人名称**
- 思考: 这是测试UI渲染规则。对于任何搜索结果，匹配的名称都应该被高亮
- 可测试性: yes - property

**4.5 WHEN 用户组合多个搜索条件时，案管系统 SHALL 支持当事人搜索与案号、案由、日期等其他条件的联合查询**
- 思考: 这是测试组合查询功能。我们可以生成各种条件组合，验证结果正确
- 可测试性: yes - property

**4.6 WHEN 用户清空搜索条件时，案管系统 SHALL 恢复显示完整的案件列表**
- 思考: 这是测试状态重置。清空条件后应该显示所有案件
- 可测试性: yes - property

### 需求 5: 主体信息数据完整性

**5.1 WHEN 用户删除案件时，案管系统 SHALL 同时删除该案件关联的所有主体信息**
- 思考: 这是测试级联删除。对于任何案件，删除后其主体信息也应该被删除
- 可测试性: yes - property

**5.2 WHEN 用户删除主体信息时，案管系统 SHALL 检查该主体是否被其他案件引用**
- 思考: 这是测试删除前的检查逻辑。系统应该执行引用检查
- 可测试性: yes - property

**5.3 WHEN 主体被多个案件引用时，案管系统 SHALL 仅删除当前案件的关联关系，保留主体档案**
- 思考: 这是测试特定场景的删除行为。我们可以创建被多个案件引用的主体，验证删除行为
- 可测试性: yes - property

**5.4 WHEN 用户修改主体信息时，案管系统 SHALL 记录修改历史，包括修改人、修改时间和修改内容**
- 思考: 这是测试审计日志功能。对于任何修改操作，都应该有历史记录
- 可测试性: yes - property

**5.5 THE 案管系统 SHALL 确保主体类型字段只能选择预定义的值**
- 思考: 这是测试输入约束。我们可以尝试输入无效的类型值，验证系统拒绝
- 可测试性: yes - property

### 需求 6: 主体信息导出

**6.1 WHEN 用户在案件列表页面点击导出时，案管系统 SHALL 提供选项导出包含主体信息的案件数据**
- 思考: 这是测试导出功能存在性
- 可测试性: yes - example

**6.2 THE 案管系统 SHALL 支持导出为Excel格式**
- 思考: 这是测试导出格式支持
- 可测试性: yes - example

**6.3 THE 案管系统 SHALL 支持导出为CSV格式**
- 思考: 这是测试导出格式支持
- 可测试性: yes - example

**6.4 WHEN 导出文件生成时，案管系统 SHALL 包含案件基本信息和所有关联的主体信息**
- 思考: 这是测试导出数据的完整性。对于任何案件，导出文件都应该包含其所有主体
- 可测试性: yes - property

**6.5 WHEN 用户选择部分案件导出时，案管系统 SHALL 仅导出选中案件及其主体信息**
- 思考: 这是测试选择性导出。导出的数据应该只包含选中的案件
- 可测试性: yes - property

**6.6 WHEN 导出完成时，案管系统 SHALL 自动下载文件到用户本地**
- 思考: 这是测试下载行为
- 可测试性: yes - example

### 需求 7: 主体信息显示优化

**7.1 WHEN 案件列表展示主体信息时，案管系统 SHALL 使用不同的颜色或图标区分原告、被告、第三人**
- 思考: 这是测试UI视觉区分。对于不同类型的主体，应该有不同的视觉标识
- 可测试性: yes - property

**7.2 WHEN 主体名称过长时，案管系统 SHALL 自动截断并显示省略号，完整内容通过提示框展示**
- 思考: 这是测试长文本处理。对于超过长度限制的名称，应该被截断
- 可测试性: yes - property

**7.3 WHEN 案件存在多个同类型主体时，案管系统 SHALL 显示格式为"主体名称 等N人"**
- 思考: 这是测试多主体显示格式。对于有多个同类型主体的案件，应该使用特定格式
- 可测试性: yes - property

**7.4 WHEN 用户查看案件详情时，案管系统 SHALL 按主体类型分组展示所有主体信息**
- 思考: 这是测试分组显示逻辑。主体应该按类型分组
- 可测试性: yes - property

**7.5 THE 案管系统 SHALL 在主体信息旁边显示该主体的历史案件数量**
- 思考: 这是测试关联信息显示。对于任何主体，都应该显示其案件数量
- 可测试性: yes - property

### 需求 8: 主体信息快速录入

**8.1 WHEN 用户录入主体名称时，案管系统 SHALL 从历史数据中提供自动补全建议**
- 思考: 这是测试自动补全功能。对于任何输入，系统都应该提供历史匹配
- 可测试性: yes - property

**8.2 WHEN 用户选择历史主体时，案管系统 SHALL 自动填充该主体的联系方式、地址等信息**
- 思考: 这是测试自动填充功能。选择历史主体后，相关字段应该被填充
- 可测试性: yes - property

**8.3 WHEN 用户录入企业主体时，案管系统 SHALL 支持通过统一社会信用代码自动查询企业信息**
- 思考: 这是测试企业信息查询功能。输入信用代码后应该能查询到企业信息
- 可测试性: yes - example

**8.4 WHEN 用户添加多个同类型主体时，案管系统 SHALL 提供"添加另一个"快捷按钮**
- 思考: 这是测试UI功能存在性
- 可测试性: yes - example

**8.5 THE 案管系统 SHALL 保存用户最近录入的主体信息，提供快速选择功能**
- 思考: 这是测试历史记录功能。系统应该保存最近录入的主体
- 可测试性: yes - property

## 正确性属性

*属性是一个特征或行为，应该在系统的所有有效执行中保持为真——本质上是关于系统应该做什么的正式陈述。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*

### 属性反思

在编写具体属性之前，我们需要识别并消除冗余：

**冗余分析**:
1. 需求1.1和2.1都涉及主体信息展示，但场景不同（详情页 vs 列表页），保留两者
2. 需求3.3和3.4都涉及验证，但3.3是验证本身，3.4是错误报告，可以合并为一个综合属性
3. 需求5.1和5.3都涉及删除，但场景不同（删除案件 vs 删除主体），保留两者
4. 需求6.2和6.3都是导出格式支持，可以合并为一个属性
5. 需求7.1和7.3都涉及显示格式，但关注点不同（视觉区分 vs 文本格式），保留两者

**合并后的属性列表**:
- 将3.3和3.4合并为"导入验证和错误报告"
- 将6.2和6.3合并为"导出格式支持"
- 其他属性保持独立

### 核心属性

**属性 1: 主体信息展示完整性**
*对于任何*案件，当在基本信息页面或列表页面展示时，所有关联的主体信息都应该被包含在渲染结果中
**验证需求: 1.1, 2.1, 2.4**

**属性 2: 必填字段验证**
*对于任何*主体信息录入请求，如果缺少必填字段（主体类型、主体名称、联系方式），系统应该拒绝该请求并返回明确的错误信息
**验证需求: 1.3**

**属性 3: 数据持久化一致性（Round-trip）**
*对于任何*案件和主体信息，保存后立即查询应该返回相同的数据（案件基本信息和所有主体信息）
**验证需求: 1.4**

**属性 4: 编辑操作反映性**
*对于任何*案件，在基本信息页面执行的主体添加、修改或删除操作，应该立即反映在数据库查询结果中
**验证需求: 1.5**

**属性 5: 多主体显示格式**
*对于任何*有多个同类型主体的案件，列表展示应该使用"主要主体名称 等N人"的格式，其中N是该类型主体的总数
**验证需求: 2.2, 7.3**

**属性 6: 导入验证和错误报告**
*对于任何*导入文件，如果包含无效数据（格式错误、缺少必填字段），系统应该拒绝导入并返回包含具体错误行号和字段名的错误列表
**验证需求: 3.3, 3.4**

**属性 7: 导入结果完整性**
*对于任何*导入操作，返回的结果摘要中的成功数量+失败数量应该等于文件中的总记录数
**验证需求: 3.6**

**属性 8: 搜索结果准确性**
*对于任何*当事人名称搜索，返回的所有案件都应该包含至少一个名称匹配该搜索关键词的主体
**验证需求: 4.3**

**属性 9: 组合搜索交集性**
*对于任何*多条件搜索（当事人+案号+案由等），返回的案件应该同时满足所有搜索条件
**验证需求: 4.5**

**属性 10: 级联删除完整性**
*对于任何*案件，删除该案件后，查询该案件ID关联的主体信息应该返回空结果
**验证需求: 5.1**

**属性 11: 引用检查保护**
*对于任何*被多个案件引用的主体，从一个案件中删除该主体时，其他案件仍然应该能够查询到该主体信息
**验证需求: 5.3**

**属性 12: 修改历史记录**
*对于任何*主体信息修改操作，系统应该在party_history表中创建一条记录，包含修改人、修改时间和变更字段
**验证需求: 5.4**

**属性 13: 类型约束**
*对于任何*主体信息，其party_type字段的值应该属于预定义的集合（原告、被告、第三人、代理律师）
**验证需求: 5.5**

**属性 14: 导出数据完整性**
*对于任何*导出操作，导出文件中每个案件的主体数量应该等于数据库中该案件关联的主体数量
**验证需求: 6.4**

**属性 15: 选择性导出准确性**
*对于任何*部分案件导出操作，导出文件中的案件ID集合应该等于用户选中的案件ID集合
**验证需求: 6.5**

**属性 16: 长文本截断**
*对于任何*主体名称，如果长度超过显示限制（如20个字符），列表展示应该截断并添加省略号
**验证需求: 7.2**

**属性 17: 类型分组展示**
*对于任何*案件详情页面，主体列表应该按party_type字段分组，每个类型的主体应该在同一组内
**验证需求: 7.4**

**属性 18: 历史案件数量准确性**
*对于任何*主体，显示的历史案件数量应该等于数据库中该主体名称关联的不同案件数量
**验证需求: 7.5**

**属性 19: 自动补全匹配性**
*对于任何*主体名称输入，自动补全建议列表中的所有主体名称都应该包含输入的关键词
**验证需求: 8.1**

**属性 20: 自动填充完整性**
*对于任何*从历史记录选择的主体，自动填充后的表单字段（联系方式、地址等）应该与该主体在数据库中的最新记录一致
**验证需求: 8.2**

## 测试策略

本功能采用双重测试方法：单元测试验证具体示例和边界情况，属性测试验证通用规则在所有输入下都成立。

### 单元测试

单元测试覆盖：
- 具体示例：验证特定输入产生预期输出
- 边界情况：空列表、单个主体、大量主体
- 错误条件：无效输入、缺失字段、格式错误

**后端单元测试示例**:

```javascript
// 测试案件查询包含主体信息
describe('getCasesWithParties', () => {
  it('should return cases with plaintiff and defendant info', async () => {
    const cases = await getCasesWithParties({ page: 1, limit: 10 });
    expect(cases[0]).toHaveProperty('plaintiffs');
    expect(cases[0]).toHaveProperty('defendants');
  });
  
  it('should handle cases with no parties', async () => {
    const caseId = await createCase({ case_number: 'TEST001' });
    const cases = await getCasesWithParties({ caseId });
    expect(cases[0].plaintiffs).toEqual([]);
    expect(cases[0].defendants).toEqual([]);
  });
});

// 测试批量导入验证
describe('importParties', () => {
  it('should reject file with missing required fields', async () => {
    const file = createExcelFile([
      { '案件编号': '2024001', '主体类型': '原告' } // 缺少主体名称
    ]);
    const result = await importParties(file);
    expect(result.failed).toBe(1);
    expect(result.errors[0].field).toBe('主体名称');
  });
  
  it('should handle duplicate parties correctly', async () => {
    const file = createExcelFile([
      { '案件编号': '2024001', '主体类型': '原告', '主体名称': '张三' },
      { '案件编号': '2024001', '主体类型': '原告', '主体名称': '张三' }
    ]);
    const result = await importParties(file);
    expect(result.success).toBe(1); // 第二条应该更新而不是重复插入
  });
});

// 测试级联删除
describe('deleteCase', () => {
  it('should delete all associated parties', async () => {
    const caseId = await createCaseWithParties();
    await deleteCase(caseId);
    const parties = await getPartiesByCaseId(caseId);
    expect(parties).toEqual([]);
  });
});
```

**前端单元测试示例**:

```typescript
// 测试主体列表展示组件
describe('CaseListWithParties', () => {
  it('should display plaintiff and defendant names', () => {
    const cases = [
      {
        id: 1,
        case_number: '2024001',
        plaintiffs: [{ name: '张三' }],
        defendants: [{ name: '李四' }]
      }
    ];
    const wrapper = mount(CaseListWithParties, { props: { cases } });
    expect(wrapper.text()).toContain('张三');
    expect(wrapper.text()).toContain('李四');
  });
  
  it('should show "等N人" for multiple parties', () => {
    const cases = [
      {
        id: 1,
        plaintiffs: [
          { name: '张三', is_primary: true },
          { name: '李四', is_primary: false },
          { name: '王五', is_primary: false }
        ]
      }
    ];
    const wrapper = mount(CaseListWithParties, { props: { cases } });
    expect(wrapper.text()).toContain('张三 等3人');
  });
});

// 测试导入组件
describe('PartyImportDialog', () => {
  it('should validate file format', async () => {
    const file = new File(['invalid'], 'test.txt', { type: 'text/plain' });
    const wrapper = mount(PartyImportDialog);
    await wrapper.vm.handleFileUpload(file);
    expect(wrapper.vm.errorMessage).toContain('文件格式');
  });
});
```

### 属性测试

属性测试使用随机生成的输入验证通用规则。我们将使用 **fast-check** (JavaScript的属性测试库)。

**配置要求**:
- 每个属性测试至少运行 100 次迭代
- 每个测试必须用注释标注对应的设计文档属性编号

**属性测试示例**:

```javascript
const fc = require('fast-check');

/**
 * Feature: case-party-enhancement, Property 3: 数据持久化一致性（Round-trip）
 * 验证需求: 1.4
 */
describe('Property 3: Data persistence consistency', () => {
  it('should preserve case and party data after save and query', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryCaseWithParties(),
        async (caseData) => {
          // 保存案件和主体
          const savedId = await saveCase(caseData);
          
          // 立即查询
          const retrieved = await getCaseById(savedId);
          
          // 验证数据一致性
          expect(retrieved.case_number).toBe(caseData.case_number);
          expect(retrieved.parties.length).toBe(caseData.parties.length);
          
          for (let i = 0; i < caseData.parties.length; i++) {
            expect(retrieved.parties[i].name).toBe(caseData.parties[i].name);
            expect(retrieved.parties[i].party_type).toBe(caseData.parties[i].party_type);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: case-party-enhancement, Property 7: 导入结果完整性
 * 验证需求: 3.6
 */
describe('Property 7: Import result completeness', () => {
  it('should have success + failed = total for any import', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryImportFile(),
        async (fileData) => {
          const result = await importParties(fileData);
          
          expect(result.success + result.failed).toBe(result.total);
          expect(result.total).toBe(fileData.rows.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: case-party-enhancement, Property 8: 搜索结果准确性
 * 验证需求: 4.3
 */
describe('Property 8: Search result accuracy', () => {
  it('should return only cases containing the searched party name', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 20 }),
        async (partyName) => {
          // 创建测试数据
          await setupTestCases(partyName);
          
          // 执行搜索
          const results = await searchCasesByParty(partyName);
          
          // 验证每个结果都包含该当事人
          for (const caseItem of results) {
            const allParties = [...caseItem.plaintiffs, ...caseItem.defendants];
            const hasMatch = allParties.some(p => 
              p.name.includes(partyName)
            );
            expect(hasMatch).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: case-party-enhancement, Property 10: 级联删除完整性
 * 验证需求: 5.1
 */
describe('Property 10: Cascade delete completeness', () => {
  it('should delete all parties when case is deleted', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryCaseWithParties(),
        async (caseData) => {
          // 创建案件和主体
          const caseId = await saveCase(caseData);
          
          // 删除案件
          await deleteCase(caseId);
          
          // 验证主体也被删除
          const parties = await getPartiesByCaseId(caseId);
          expect(parties.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: case-party-enhancement, Property 13: 类型约束
 * 验证需求: 5.5
 */
describe('Property 13: Party type constraint', () => {
  it('should reject invalid party types', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string().filter(s => !['原告', '被告', '第三人', '代理律师'].includes(s)),
        async (invalidType) => {
          const partyData = {
            case_id: 1,
            party_type: invalidType,
            name: '测试主体'
          };
          
          await expect(saveParty(partyData)).rejects.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });
});

// 数据生成器（Arbitraries）
function arbitraryCaseWithParties() {
  return fc.record({
    case_number: fc.string({ minLength: 5, maxLength: 20 }),
    case_cause: fc.constantFrom('合同纠纷', '侵权纠纷', '劳动争议'),
    parties: fc.array(
      fc.record({
        party_type: fc.constantFrom('原告', '被告', '第三人'),
        name: fc.string({ minLength: 2, maxLength: 50 }),
        contact_phone: fc.option(fc.string({ minLength: 11, maxLength: 11 })),
        address: fc.option(fc.string({ minLength: 10, maxLength: 100 }))
      }),
      { minLength: 0, maxLength: 10 }
    )
  });
}

function arbitraryImportFile() {
  return fc.record({
    rows: fc.array(
      fc.record({
        '案件编号': fc.option(fc.string()),
        '主体类型': fc.option(fc.constantFrom('原告', '被告', '第三人', '无效类型')),
        '主体名称': fc.option(fc.string()),
        '联系电话': fc.option(fc.string())
      }),
      { minLength: 1, maxLength: 100 }
    )
  });
}
```

### 集成测试

集成测试验证完整的用户流程：

1. **完整导入流程**: 上传文件 → 验证 → 导入 → 查看结果
2. **搜索到详情流程**: 搜索当事人 → 查看列表 → 点击案件 → 查看详情
3. **编辑流程**: 打开案件 → 添加主体 → 保存 → 验证显示
4. **导出流程**: 筛选案件 → 导出 → 验证文件内容

### 性能测试

**性能指标**:
- 案件列表加载（包含主体信息）: < 500ms (1000条记录)
- 搜索响应时间: < 200ms
- 批量导入: < 5s (1000条记录)
- 导出: < 3s (1000条记录)

## 部署和迁移

### 数据库迁移

**迁移脚本**:

```sql
-- 1. 为 litigation_parties 表添加新字段
ALTER TABLE litigation_parties ADD COLUMN is_primary BOOLEAN DEFAULT 0;

-- 2. 为现有数据设置主要当事人（每个案件的第一个原告/被告）
UPDATE litigation_parties SET is_primary = 1
WHERE id IN (
  SELECT MIN(id) FROM litigation_parties
  GROUP BY case_id, party_type
);

-- 3. 添加索引
CREATE INDEX IF NOT EXISTS idx_party_name ON litigation_parties(name);
CREATE INDEX IF NOT EXISTS idx_party_case_id ON litigation_parties(case_id);
CREATE INDEX IF NOT EXISTS idx_party_type ON litigation_parties(party_type);

-- 4. 创建新表
CREATE TABLE IF NOT EXISTS party_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  party_id INTEGER NOT NULL,
  case_id INTEGER NOT NULL,
  action VARCHAR(50) NOT NULL,
  changed_fields TEXT,
  changed_by VARCHAR(100),
  changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (party_id) REFERENCES litigation_parties(id),
  FOREIGN KEY (case_id) REFERENCES cases(id)
);

CREATE INDEX idx_party_history_party_id ON party_history(party_id);

CREATE TABLE IF NOT EXISTS party_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(200) NOT NULL,
  entity_type VARCHAR(50),
  unified_credit_code VARCHAR(100),
  legal_representative VARCHAR(100),
  id_number VARCHAR(50),
  contact_phone VARCHAR(50),
  contact_email VARCHAR(100),
  address TEXT,
  usage_count INTEGER DEFAULT 0,
  last_used_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, entity_type)
);

CREATE INDEX idx_party_template_name ON party_templates(name);
```

### 前端部署

**新增依赖**:
```json
{
  "dependencies": {
    "xlsx": "^0.18.5"
  }
}
```

**构建配置**: 无需修改，使用现有Vite配置

### 后端部署

**新增依赖**: 无需新增，使用现有依赖

**环境变量**: 无需新增

### 回滚计划

如果需要回滚：

1. 删除新增的表：
```sql
DROP TABLE IF EXISTS party_history;
DROP TABLE IF EXISTS party_templates;
```

2. 删除新增的字段：
```sql
ALTER TABLE litigation_parties DROP COLUMN is_primary;
```

3. 删除新增的索引：
```sql
DROP INDEX IF EXISTS idx_party_name;
DROP INDEX IF EXISTS idx_party_case_id;
DROP INDEX IF EXISTS idx_party_type;
```

4. 恢复前端和后端代码到之前的版本

## 后期优化方向

1. **性能优化**:
   - 实现主体信息的缓存机制
   - 优化大量案件的查询性能（分页加载）
   - 实现搜索建议的防抖和缓存

2. **功能增强**:
   - 支持主体信息的批量编辑
   - 支持更多导入格式（JSON、XML）
   - 实现主体信息的智能去重和合并
   - 集成企业信息查询API（天眼查、企查查）

3. **用户体验**:
   - 实现拖拽排序主体顺序
   - 提供主体信息的快速复制功能
   - 实现主体关系图谱可视化

4. **数据分析**:
   - 统计高频当事人
   - 分析当事人胜诉率
   - 生成当事人关系网络图
