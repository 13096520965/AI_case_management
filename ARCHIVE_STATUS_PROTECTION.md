# 案件归档状态保护机制

## 功能概述

实现了完整的案件归档状态保护机制，确保"已归档"状态只能通过创建归档包来设置，且一旦归档后不可修改。

## 核心规则

### 1. 创建归档包自动归档
- ✅ 当用户为案件创建归档包时，系统自动将案件状态更新为"已归档"
- ✅ 记录详细的状态变更日志，标注为自动归档操作

### 2. 禁止手动设置归档状态
- ❌ 创建新案件时，不能直接选择"已归档"状态
- ❌ 编辑案件时，不能手动将状态改为"已归档"
- ✅ 前端表单中移除了"已归档"选项

### 3. 已归档案件不可修改
- ❌ 已归档的案件状态不可再修改为其他状态
- ✅ 前端表单中，已归档案件的状态选择器被禁用
- ✅ 后端接口会拒绝对已归档案件的状态修改请求

## 技术实现

### 后端保护 - 案件创建

**文件**: `backend/src/controllers/caseController.js`

```javascript
// 禁止直接创建"已归档"状态的案件
if (caseData.status === '已归档') {
  return res.status(400).json({
    error: {
      message: '不能直接创建"已归档"状态的案件，请先创建案件，结案后通过创建归档包来归档',
      status: 400
    }
  });
}
```

### 后端保护 - 案件更新

**文件**: `backend/src/controllers/caseController.js`

```javascript
// 检查案件是否已归档
if (existingCase.status === '已归档') {
  return res.status(403).json({
    error: {
      message: '已归档的案件不可修改状态，如需修改请联系管理员',
      status: 403
    }
  });
}

// 禁止手动将案件状态改为"已归档"
if (updateData.status === '已归档') {
  return res.status(400).json({
    error: {
      message: '不能手动将案件状态改为"已归档"，请通过创建归档包来归档案件',
      status: 400
    }
  });
}
```

### 自动归档逻辑

**文件**: `backend/src/controllers/archiveController.js`

```javascript
// 创建归档包后，自动将案件状态更新为"已归档"
const oldStatus = caseData.status;
await Case.update(case_id, { status: '已归档' });

console.log(`案件 ${case_id} 创建归档包后，自动标记为已归档 (原状态: ${oldStatus})`);

// 记录案件状态变更日志
const { logCaseAction } = require('../middleware/caseLogger');
await logCaseAction(
  case_id,
  'CASE_STATUS_CHANGE',
  `创建归档包"${archive_number}"，案件自动标记为已归档`,
  req.user,
  {
    data: {
      old_status: oldStatus,
      new_status: '已归档',
      archive_id: packageId,
      archive_number: archive_number,
      auto_archived: true
    }
  }
);
```

### 前端保护 - 表单限制

**文件**: `frontend/src/views/case/CaseForm.vue`

```vue
<el-select
  v-model="formData.status"
  placeholder="请选择案件状态"
  style="width: 100%"
  :disabled="isArchived"
>
  <el-option label="立案" value="立案" />
  <el-option label="审理中" value="审理中" />
  <el-option label="已结案" value="已结案" />
  <!-- 已归档状态只能通过创建归档包来设置，不能手动选择 -->
</el-select>
<div v-if="isArchived" style="color: #909399; font-size: 12px; margin-top: 4px;">
  已归档的案件不可修改状态
</div>
```

```javascript
const isArchived = computed(() => formData.status === '已归档')
```

## 案件状态流转图

```
创建案件
  ↓
立案 → 审理中 → 已结案
  ↓       ↓        ↓
 (可手动修改状态)
                   ↓
              创建归档包
                   ↓
              【已归档】
                   ↓
            (状态锁定，不可修改)
```

## 使用场景

### 场景 1: 正常归档流程

1. **创建案件** → 状态: 立案
2. **案件审理** → 状态: 审理中
3. **案件结案** → 状态: 已结案
4. **创建归档包** → 状态: 已归档 ✅ (自动)
5. **尝试修改状态** → ❌ 被拒绝

### 场景 2: 尝试直接创建已归档案件

```
用户操作: 创建新案件，选择"已归档"状态
系统响应: ❌ 前端表单中没有"已归档"选项
```

### 场景 3: 尝试手动修改为已归档

```
用户操作: 编辑案件，尝试将状态改为"已归档"
系统响应: ❌ 前端表单中没有"已归档"选项
后端保护: ❌ 即使绕过前端，后端也会拒绝请求
```

### 场景 4: 尝试修改已归档案件

```
用户操作: 编辑已归档的案件，尝试修改状态
前端保护: ❌ 状态选择器被禁用，显示提示信息
后端保护: ❌ 即使绕过前端，后端也会拒绝请求
```

## 错误提示信息

### 创建案件时选择已归档状态
```json
{
  "error": {
    "message": "不能直接创建"已归档"状态的案件，请先创建案件，结案后通过创建归档包来归档",
    "status": 400
  }
}
```

### 手动修改为已归档状态
```json
{
  "error": {
    "message": "不能手动将案件状态改为"已归档"，请通过创建归档包来归档案件",
    "status": 400
  }
}
```

### 修改已归档案件的状态
```json
{
  "error": {
    "message": "已归档的案件不可修改状态，如需修改请联系管理员",
    "status": 403
  }
}
```

## 日志记录

系统会自动记录归档操作的详细日志：

```javascript
{
  action_type: 'CASE_STATUS_CHANGE',
  description: '创建归档包"AR202411000001"，案件自动标记为已归档',
  data: {
    old_status: '已结案',
    new_status: '已归档',
    archive_id: 123,
    archive_number: 'AR202411000001',
    auto_archived: true  // 标记为自动归档
  }
}
```

## 测试验证

### 测试步骤 1: 验证自动归档

1. 创建一个新案件，状态设为"已结案"
2. 进入归档管理页面
3. 为该案件创建归档包
4. **预期结果**:
   - ✅ 提示"归档包创建成功，案件已自动标记为已归档"
   - ✅ 案件状态自动变为"已归档"
   - ✅ 案件日志中记录了自动状态变更

### 测试步骤 2: 验证创建限制

1. 进入创建案件页面
2. 查看状态选择器
3. **预期结果**:
   - ✅ 状态选项中没有"已归档"
   - ✅ 只能选择: 立案、审理中、已结案

### 测试步骤 3: 验证修改限制

1. 打开一个已归档的案件
2. 点击编辑按钮
3. 尝试修改状态
4. **预期结果**:
   - ✅ 状态选择器被禁用
   - ✅ 显示提示"已归档的案件不可修改状态"

### 测试步骤 4: 验证后端保护

使用 API 测试工具（如 Postman）:

```bash
# 尝试创建已归档案件
POST /api/cases
{
  "case_type": "民事",
  "case_cause": "合同纠纷",
  "status": "已归档"
}
# 预期: 400 错误

# 尝试手动修改为已归档
PUT /api/cases/1
{
  "status": "已归档"
}
# 预期: 400 错误

# 尝试修改已归档案件
PUT /api/cases/2  # 假设案件2已归档
{
  "status": "审理中"
}
# 预期: 403 错误
```

## 安全性考虑

### 多层防护

1. **前端防护**: 
   - 移除"已归档"选项
   - 禁用已归档案件的状态选择器
   - 提供清晰的用户提示

2. **后端防护**:
   - 创建时验证状态
   - 更新时验证状态
   - 检查案件当前状态

3. **日志审计**:
   - 记录所有状态变更
   - 标记自动归档操作
   - 保留完整的操作历史

### 权限控制

虽然当前实现了状态保护，但如果需要特殊情况下修改已归档案件，可以：

1. 添加管理员权限检查
2. 创建专门的"解除归档"接口
3. 记录详细的解除归档日志

## 边界情况处理

### 1. 案件未结案就创建归档包

当前实现允许任何状态的案件创建归档包，创建后都会自动变为"已归档"。

如果需要限制只有"已结案"的案件才能归档，可以在 `archiveController.js` 中添加：

```javascript
// 检查案件是否已结案
if (caseData.status !== '已结案') {
  return res.status(400).json({
    error: {
      message: '只有已结案的案件才能创建归档包',
      status: 400
    }
  });
}
```

### 2. 重复创建归档包

当前实现已经防止了重复创建归档包：

```javascript
const existingPackage = await ArchivePackage.findByCaseId(case_id);
if (existingPackage) {
  return res.status(409).json({
    error: {
      message: '该案件已存在归档包',
      status: 409
    }
  });
}
```

### 3. 归档包创建失败

如果归档包创建失败，案件状态不会被修改，保证数据一致性。

## 优势

1. **数据完整性**: 确保归档状态的准确性和一致性
2. **操作规范**: 强制执行正确的归档流程
3. **审计追踪**: 完整记录所有状态变更
4. **用户友好**: 清晰的提示和禁用状态
5. **安全可靠**: 多层防护，防止误操作

## 后续优化建议

1. **管理员解除归档功能**
   - 添加特殊权限
   - 需要审批流程
   - 记录详细日志

2. **归档前置条件检查**
   - 检查是否有结案报告
   - 检查是否所有节点已完成
   - 检查是否所有费用已结清

3. **批量归档**
   - 支持批量创建归档包
   - 批量更新案件状态
   - 生成批量归档报告

4. **归档通知**
   - 案件归档后发送通知
   - 提醒相关人员
   - 记录通知历史

## 修改的文件

### 后端文件
- `backend/src/controllers/caseController.js` - 添加创建和更新限制
- `backend/src/controllers/archiveController.js` - 添加自动归档逻辑

### 前端文件
- `frontend/src/views/case/CaseForm.vue` - 移除已归档选项，添加禁用逻辑

## 更新日期

2025-11-20

## 版本

v1.0.0
