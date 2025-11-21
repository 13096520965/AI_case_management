# 归档包创建接口 400 错误修复

## 问题描述

调用 `/api/archive/package` 接口时报 400 错误："案件ID为必填项"

## 根本原因

前端 TypeScript 接口定义使用驼峰命名（`caseId`），但后端期望下划线命名（`case_id`），导致字段名不匹配。

### 问题详情

1. **前端表单**：使用 `case_id`（正确）
2. **TypeScript 接口**：定义为 `caseId`（错误）
3. **后端接口**：期望 `case_id`（正确）

当前端调用 API 时，TypeScript 类型系统可能导致字段名转换问题。

## 修复方案

### 1. 更新 TypeScript 接口定义

**文件**: `legal-case-management/frontend/src/api/archive.ts`

```typescript
// 修复前
export interface ArchivePackageData {
  caseId: number
  archiveNumber?: string
  archiveDate?: string
  archiveLocation?: string
  notes?: string
}

// 修复后
export interface ArchivePackageData {
  case_id: number
  archived_by?: string
  archive_number?: string
  archive_date?: string
  archive_location?: string
  notes?: string
}
```

### 2. 更新表单验证规则

**文件**: `legal-case-management/frontend/src/views/archive/ArchiveSearch.vue`

```typescript
// 修复前
const createRules: FormRules = {
  case_id: [
    { required: true, message: '请输入案件ID', trigger: 'blur' },
    { type: 'number', message: '案件ID必须是数字', trigger: 'blur' }
  ],
  archived_by: [
    { required: true, message: '请输入归档人', trigger: 'blur' }
  ]
}

// 修复后
const createRules: FormRules = {
  case_id: [
    { required: true, message: '请选择案件', trigger: 'change' }
  ],
  archived_by: [
    { required: true, message: '请输入归档人', trigger: 'blur' }
  ]
}
```

**改进点**：
- 移除了 `type: 'number'` 验证（下拉选择已保证是数字）
- 将 trigger 从 `blur` 改为 `change`（适用于下拉选择）
- 更新提示信息为"请选择案件"

## 测试验证

运行测试脚本验证修复：

```bash
cd legal-case-management/backend
node test-archive-package-fix.js
```

### 测试结果

✅ **正确格式**（使用 `case_id`）：
```json
{
  "case_id": 34,
  "archived_by": "测试归档员",
  "notes": "这是一个测试归档包"
}
```
- 成功创建归档包或返回 409（已存在）

❌ **错误格式**（缺少 `case_id`）：
```json
{
  "archived_by": "测试归档员",
  "notes": "缺少案件ID"
}
```
- 返回 400："案件ID为必填项"

❌ **错误格式**（使用驼峰命名）：
```json
{
  "caseId": 34,
  "archivedBy": "测试归档员"
}
```
- 返回 400："案件ID为必填项"（后端不识别驼峰命名）

## 前端测试步骤

1. **硬刷新浏览器**
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

2. **进入归档页面**
   - 导航到"归档案件检索"页面

3. **创建归档包**
   - 点击"创建归档包"按钮
   - 从下拉列表选择一个已结案的案件
   - 填写归档人姓名
   - （可选）填写备注信息
   - 点击"确定"

4. **验证结果**
   - 应该显示"归档包创建成功"
   - 归档列表自动刷新，显示新创建的归档包

## API 接口规范

### 创建归档包

**接口**: `POST /api/archive/package`

**请求头**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体**:
```json
{
  "case_id": 1,           // 必填：案件ID（数字）
  "archived_by": "张三",   // 可选：归档人姓名
  "notes": "归档备注"      // 可选：备注信息
}
```

**成功响应** (201):
```json
{
  "message": "归档包创建成功",
  "data": {
    "package": {
      "id": 1,
      "case_id": 1,
      "archive_number": "AR202411000001",
      "archive_date": "2024-11-21",
      "archive_location": "archive/AR202411000001",
      "package_size": 2048,
      "package_path": "/archive/AR202411000001",
      "archived_by": "张三",
      "notes": "归档备注"
    },
    "summary": {
      "case": { /* 案件信息 */ },
      "parties_count": 3,
      "nodes_count": 5,
      "evidence_count": 2,
      "documents_count": 4,
      "costs_count": 1,
      "has_closure_report": true
    }
  }
}
```

**错误响应**:

- **400** - 案件ID为必填项
- **404** - 案件不存在
- **409** - 该案件已存在归档包

## 命名规范说明

### 后端（Node.js/数据库）
使用**下划线命名**（snake_case）：
- `case_id`
- `archived_by`
- `archive_number`

### 前端（TypeScript/Vue）
**统一使用下划线命名**与后端保持一致：
- 接口定义：`case_id`
- 表单字段：`case_id`
- API 调用：`case_id`

这样可以避免字段名转换问题，保持前后端一致性。

## 相关文件

- `legal-case-management/frontend/src/api/archive.ts` - API 接口定义
- `legal-case-management/frontend/src/views/archive/ArchiveSearch.vue` - 归档搜索页面
- `legal-case-management/backend/src/controllers/archiveController.js` - 归档控制器
- `legal-case-management/backend/test-archive-package-fix.js` - 测试脚本

## 总结

修复完成后，前端可以正常创建归档包。关键是保持前后端字段命名一致，都使用下划线命名（`case_id`），避免驼峰和下划线混用导致的问题。
