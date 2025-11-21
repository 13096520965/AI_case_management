# 成本分析模块错误修复

## 问题描述

成本分析页面无法加载内容，页面显示大量错误提示：
- "组件渲染错误，请刷新重试"
- "组件发生内部错误或异常"

## 错误信息

后端日志显示：
```
TypeError: db.all is not a function
TypeError: db.get is not a function
```

## 问题原因

`costController.js` 中的 `getCosts` 方法直接使用了 `db.all` 和 `db.get` 方法，但这些方法在当前的数据库配置中不存在。

应该使用封装好的 `query` 和 `get` 函数。

### 错误代码

```javascript
const db = require('../config/database');

const costs = await new Promise((resolve, reject) => {
  db.all(query, params, (err, rows) => {  // ❌ db.all 不存在
    if (err) reject(err);
    else resolve(rows || []);
  });
});

const countResult = await new Promise((resolve, reject) => {
  db.get(countQuery, countParams, (err, row) => {  // ❌ db.get 不存在
    if (err) reject(err);
    else resolve(row);
  });
});
```

## 解决方案

使用正确的数据库查询函数 `query` 和 `get`。

**文件**: `backend/src/controllers/costController.js`

### 修复 1: 导入正确的函数

```javascript
// 修改前
const db = require('../config/database');

// 修改后
const { query: dbQuery } = require('../config/database');
const { get } = require('../config/database');
```

### 修复 2: 使用 query 函数查询列表

```javascript
// 修改前
let query = `SELECT ...`;
const costs = await new Promise((resolve, reject) => {
  db.all(query, params, (err, rows) => {
    if (err) reject(err);
    else resolve(rows || []);
  });
});

// 修改后
let sql = `SELECT ...`;
const costs = await dbQuery(sql, params);
```

### 修复 3: 使用 get 函数查询总数

```javascript
// 修改前
let countQuery = `SELECT COUNT(*) ...`;
const countResult = await new Promise((resolve, reject) => {
  db.get(countQuery, countParams, (err, row) => {
    if (err) reject(err);
    else resolve(row);
  });
});

// 修改后
let countSql = `SELECT COUNT(*) ...`;
const { get } = require('../config/database');
const countResult = await get(countSql, countParams);
```

### 修复 4: 添加字段名转换

同时添加了字段名转换，将 snake_case 转换为 camelCase：

```javascript
SELECT 
  cr.*,
  c.case_number as caseNumber,
  c.case_type as caseType,
  c.case_cause as caseCause
FROM cost_records cr
LEFT JOIN cases c ON cr.case_id = c.id
```

## 修复效果

### 修复前
- ❌ 页面无法加载
- ❌ 显示大量错误提示
- ❌ 后端报错 `db.all is not a function`

### 修复后
- ✅ 页面正常加载
- ✅ 成本数据正常显示
- ✅ 图表正常渲染
- ✅ 筛选功能正常工作

## 数据库查询函数说明

### database.js 提供的函数

```javascript
// backend/src/config/database.js

// 查询多行数据
exports.query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// 查询单行数据
exports.get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// 执行SQL（INSERT, UPDATE, DELETE）
exports.run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};
```

### 正确的使用方式

```javascript
const { query, get, run } = require('../config/database');

// 查询多行
const rows = await query('SELECT * FROM table WHERE id = ?', [id]);

// 查询单行
const row = await get('SELECT * FROM table WHERE id = ?', [id]);

// 执行SQL
const result = await run('INSERT INTO table (name) VALUES (?)', [name]);
```

## 相关文件

### 后端
- `backend/src/controllers/costController.js` - 成本控制器（已修复）
- `backend/src/config/database.js` - 数据库配置

### 前端
- `frontend/src/views/cost/CostAnalytics.vue` - 成本分析页面

## 测试验证

### 测试步骤

1. 进入"数据分析" → "成本分析"页面
2. 查看页面是否正常加载
3. 检查以下功能：
   - 总成本显示
   - 已支付金额显示
   - 待支付金额显示
   - 成本占比分析图表
   - 成本趋势分析图表

### 预期结果

- ✅ 页面正常加载，无错误提示
- ✅ 统计数据正常显示
- ✅ 图表正常渲染
- ✅ 筛选功能正常工作
- ✅ 数据导出功能正常

## 其他可能的问题

### 1. 字段名不匹配

如果前端期望的字段名与后端返回的不一致，需要在SQL查询中添加别名：

```javascript
SELECT 
  field_name as fieldName,  // snake_case → camelCase
  another_field as anotherField
FROM table
```

### 2. 数据为空

如果数据库中没有成本记录，页面会显示空状态。可以：
- 添加测试数据
- 显示友好的空状态提示

### 3. 权限问题

确保用户有权限访问成本数据。

## 注意事项

1. **统一使用封装的数据库函数**
   - 使用 `query`、`get`、`run`
   - 不要直接使用 `db.all`、`db.get`、`db.run`

2. **字段命名规范**
   - 数据库：snake_case
   - 后端返回：camelCase
   - 前端使用：camelCase

3. **错误处理**
   - 所有数据库操作都应该有 try-catch
   - 返回友好的错误信息

4. **性能优化**
   - 使用索引优化查询
   - 避免 N+1 查询
   - 合理使用分页

## 更新日期

2024-11-20

## 版本

v1.0.0
