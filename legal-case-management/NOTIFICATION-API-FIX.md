# 通知 API 修复总结

## 问题描述

1. 后端返回的 `content` 字段中仍然包含关联案件编码
2. 前端没有正确使用后端返回的 `internalNumber` 字段

## 修复内容

### 1. 后端修复 (notificationController.js)

**问题**：正则表达式 `/\n?关联案件编码:[^\n]*/g` 没有正确匹配关联案件编码

**修复**：
- 更新正则表达式为 `/\n关联案件编码:[^\n]*/g`
- 确保正确移除包含关联案件编码的整行内容

**代码变更**：
```javascript
const removeInternalNumberFromContent = (content) => {
  if (!content) return content;
  // 移除 "关联案件编码:AN..." 这样的内容（包括前面的换行符）
  return content.replace(/\n关联案件编码:[^\n]*/g, '').trim();
};
```

### 2. 后端返回数据结构

通知 API 现在返回以下字段：
- `id`: 通知 ID
- `relatedId`: 关联对象 ID
- `relatedType`: 关联对象类型 (process_node, cost_record)
- `taskType`: 任务类型 (deadline, overdue, payment, task, system)
- `scheduledTime`: 计划时间
- `content`: 通知内容（已移除关联案件编码）
- `status`: 状态 (unread, read)
- `createdAt`: 创建时间
- **`caseId`**: 关联案件 ID（新增）
- **`internalNumber`**: 关联案件内部编号（新增）
- **`linkUrl`**: 跳转链接（新增）

### 3. 前端修复

#### NotificationCenter.vue
- 移除了重复的案件信息获取逻辑
- 直接使用后端返回的 `internalNumber` 和 `caseId`

#### NotificationPopover.vue
- 移除了重复的案件信息获取逻辑
- 直接使用后端返回的 `internalNumber` 和 `caseId`

#### CaseDetail.vue
- 简化了通知过滤逻辑
- 使用后端返回的 `caseId` 直接过滤属于当前案件的通知
- 减少了不必要的 API 调用

## 性能改进

- **减少 API 调用**：前端不再需要为每个通知单独查询节点和案件信息
- **减少网络流量**：后端直接返回所需的 `internalNumber` 和 `caseId`
- **提高响应速度**：减少了异步操作的数量

## 测试验证

正则表达式测试：
```
原始内容：案号002案件节点"庭前准备"将在 3 天后到期（截止日期：2025-11-28 09:35:51），请及时处理
关联案件编码:AN202511000008

清理后：案号002案件节点"庭前准备"将在 3 天后到期（截止日期：2025-11-28 09:35:51），请及时处理
```

## 文件修改列表

- `legal-case-management/backend/src/controllers/notificationController.js`
- `legal-case-management/frontend/src/views/notification/NotificationCenter.vue`
- `legal-case-management/frontend/src/components/notification/NotificationPopover.vue`
- `legal-case-management/frontend/src/views/case/CaseDetail.vue`
