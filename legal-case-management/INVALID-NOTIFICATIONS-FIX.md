# 无效提醒清理和修复

## 问题描述

提醒列表页面存在一些节点超期、到期的提醒，但这些提醒没有关联案件。这是因为：

1. 节点在创建时没有正确关联到案件（`case_id` 为 NULL）
2. 提醒调度器在生成提醒时，没有检查节点是否有关联的案件
3. 导致生成了孤立的提醒，无法在提醒列表中正确显示

## 诊断结果

运行诊断脚本发现：
- 总共 35 条提醒
- 其中 12 条无效提醒（节点没有关联案件）
- 无效提醒的类型：
  - deadline（节点到期）：3 条
  - overdue（节点超期）：9 条

## 解决方案

### 1. 清理无效提醒

创建清理脚本 `clean-invalid-notifications-v2.js`，删除所有没有关联案件的提醒：

```bash
node clean-invalid-notifications-v2.js
```

结果：
- 删除了 12 条无效提醒
- 剩余 23 条有效提醒

### 2. 修复提醒生成逻辑

修改 `notificationSchedulerEnhanced.js` 中的三个方法，添加关联案件的检查条件：

#### processDeadlineRule（截止日期规则）
```sql
WHERE pn.status IN ('待处理', '进行中', 'pending', 'in_progress')
AND pn.deadline IS NOT NULL
AND julianday(pn.deadline) - julianday('now') <= ?
AND julianday(pn.deadline) - julianday('now') > 0
AND pn.case_id IS NOT NULL          -- 新增
AND c.id IS NOT NULL                -- 新增
```

#### checkOverdueNodes（超期节点检查）
```sql
WHERE pn.status IN ('待处理', '进行中', 'pending', 'in_progress')
AND pn.deadline IS NOT NULL
AND julianday('now') > julianday(pn.deadline)
AND pn.case_id IS NOT NULL          -- 新增
AND c.id IS NOT NULL                -- 新增
```

#### checkCostPayments（费用支付检查）
```sql
WHERE cr.status = '未支付'
AND cr.due_date IS NOT NULL
AND julianday(cr.due_date) - julianday('now') <= 7
AND julianday(cr.due_date) - julianday('now') >= 0
AND cr.case_id IS NOT NULL          -- 新增
AND c.id IS NOT NULL                -- 新增
```

## 修改文件

- `backend/src/services/notificationSchedulerEnhanced.js` - 修复提醒生成逻辑
- `backend/clean-invalid-notifications-v2.js` - 清理脚本（已执行）
- `backend/diagnose-invalid-notifications.js` - 诊断脚本

## 验证

1. 清理前：35 条提醒，其中 12 条无效
2. 清理后：23 条提醒，全部有效
3. 后续生成的提醒都会检查关联案件，不会再产生无效提醒

## 影响

- ✅ 提醒列表页面不再显示无效提醒
- ✅ 所有提醒都有正确的案件关联
- ✅ 用户可以点击提醒跳转到对应案件
