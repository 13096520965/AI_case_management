# 文书模板创建错误修复

## 问题描述

创建文书模板时报错：
```
Error: SQLITE_ERROR: table document_templates has no column named name
```

## 问题原因

数据库表结构与代码中使用的字段名不匹配：

### 数据库实际表结构
```sql
CREATE TABLE document_templates (
  id INTEGER PRIMARY KEY,
  template_name VARCHAR(100) NOT NULL,  -- 实际列名
  document_type VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  variables TEXT,
  description TEXT,
  created_at DATETIME,
  updated_at DATETIME
)
```

### 代码中使用的字段名
```javascript
INSERT INTO document_templates (name, ...) -- 错误：使用了 name
```

另外，代码中还尝试插入 `created_by` 列，但表中没有这个列。

## 解决方案

### 1. 修复创建模板方法

**文件**: `backend/src/controllers/documentTemplateController.js`

**修改前**:
```javascript
const result = await run(
  `INSERT INTO document_templates (name, document_type, content, variables, description, created_by, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
  [name, documentType, content, JSON.stringify(variables), description || '', req.user?.id || 1]
);
```

**修改后**:
```javascript
const result = await run(
  `INSERT INTO document_templates (template_name, document_type, content, variables, description, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
  [name, documentType, content, JSON.stringify(variables), description || '']
);
```

### 2. 修复更新模板方法

**修改前**:
```javascript
await run(
  `UPDATE document_templates 
   SET name = ?, document_type = ?, content = ?, variables = ?, description = ?, updated_at = datetime('now')
   WHERE id = ?`,
  [name || template.name, ...]
);
```

**修改后**:
```javascript
await run(
  `UPDATE document_templates 
   SET template_name = ?, document_type = ?, content = ?, variables = ?, description = ?, updated_at = datetime('now')
   WHERE id = ?`,
  [name || template.template_name, ...]
);
```

### 3. 统一字段名转换

为了保持前端使用驼峰命名的一致性，在查询时使用 SQL 别名：

**获取模板列表**:
```javascript
let sql = `SELECT 
  id,
  template_name as name,
  document_type as documentType,
  content,
  variables,
  description,
  created_at as createdAt,
  updated_at as updatedAt
FROM document_templates WHERE 1=1`;
```

**获取模板详情**:
```javascript
const template = await get(`SELECT 
  id,
  template_name as name,
  document_type as documentType,
  content,
  variables,
  description,
  created_at as createdAt,
  updated_at as updatedAt
FROM document_templates WHERE id = ?`, [id]);
```

## 修复效果

### 修复前
- ❌ 创建模板失败，报错 "table document_templates has no column named name"
- ❌ 无法保存模板

### 修复后
- ✅ 可以正常创建模板
- ✅ 可以正常更新模板
- ✅ 可以正常查询模板
- ✅ 前端显示正常

## 测试验证

### 测试步骤

1. 进入"文书模板"页面
2. 点击"新建模板"按钮
3. 填写模板信息：
   - 模板名称：民事起诉状模板
   - 文书类型：起诉状
   - 模板内容：包含变量的模板文本
   - 模板描述：可选
4. 点击"保存"按钮

### 预期结果

- ✅ 提示"模板创建成功"
- ✅ 模板列表中显示新创建的模板
- ✅ 可以预览、编辑、删除模板

## 字段映射关系

| 数据库字段 | 前端字段 | 说明 |
|-----------|---------|------|
| id | id | 模板ID |
| template_name | name | 模板名称 |
| document_type | documentType | 文书类型 |
| content | content | 模板内容 |
| variables | variables | 变量列表（JSON） |
| description | description | 模板描述 |
| created_at | createdAt | 创建时间 |
| updated_at | updatedAt | 更新时间 |

## 相关文件

### 后端
- `backend/src/controllers/documentTemplateController.js` - 控制器（已修复）
- `backend/src/scripts/createDocumentTemplatesTable.js` - 表创建脚本
- `backend/check-table-structure.js` - 表结构检查工具（新增）

### 前端
- `frontend/src/views/document/DocumentTemplates.vue` - 模板管理页面
- `frontend/src/api/documentTemplate.ts` - API接口

## 注意事项

1. **字段命名规范**
   - 数据库使用 snake_case（如 `template_name`）
   - 前端使用 camelCase（如 `name`）
   - 在 SQL 查询中使用别名进行转换

2. **表结构检查**
   - 如果遇到类似问题，可以运行 `node check-table-structure.js` 检查表结构
   - 确保代码中使用的字段名与数据库表结构一致

3. **数据迁移**
   - 如果需要修改表结构，应该创建迁移脚本
   - 不要直接修改已有数据的表结构

## 检查工具

创建了一个表结构检查工具：

**文件**: `backend/check-table-structure.js`

```bash
# 运行检查
node check-table-structure.js
```

输出示例：
```
检查document_templates表结构...

✅ 表存在，列信息：

  0. id (INTEGER)  PRIMARY KEY
  1. template_name (VARCHAR(100)) NOT NULL
  2. document_type (VARCHAR(50)) NOT NULL
  3. content (TEXT) NOT NULL
  4. variables (TEXT)
  5. description (TEXT)
  6. created_at (DATETIME)
  7. updated_at (DATETIME)
```

## 更新日期

2024-11-20

## 版本

v1.0.0
