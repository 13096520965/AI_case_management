# 通知数据清理和优化总结

## 修改内容

### 1. 后端修改 (notificationController.js)

**添加无效数据过滤**：
- 检查关联的节点或费用记录是否存在
- 如果关联对象不存在，标记通知为无效
- 返回前过滤出所有无效通知

**系统通知特殊处理**：
- 系统通知不需要返回 `caseId` 和 `internalNumber`
- 系统通知不需要生成跳转链接

**代码变更**：
```javascript
// 系统通知不需要案件编码
if (notification.task_type === 'system') {
  return {
    ...notification,
    caseId: null,
    internalNumber: null,
    linkUrl: null,
    isValid: true
  };
}

// 检查关联对象是否存在
if (nodeResult && nodeResult.length > 0) {
  // 有效
} else {
  // 标记为无效
  isValid = false;
}

// 过滤出有效的通知
const validNotifications = notificationsWithCase.filter(n => n.isValid !== false);
```

### 2. 前端修改

#### NotificationCenter.vue
- 只在非系统通知时显示案件编码
- 条件：`v-if="notification.taskType !== 'system'"`

#### NotificationPopover.vue
- 只在非系统通知时显示案件编码
- 条件：`v-if="notification.taskType !== 'system' && notification.internalNumber && notification.internalNumber !== '--'"`

### 3. 数据清理脚本 (clean-invalid-notifications.js)

创建了一个清理脚本，用于：
1. 删除关联节点不存在的 process_node 类型通知
2. 删除关联费用记录不存在的 cost_record 类型通知
3. 统计清理后的通知数量

**运行方式**：
```bash
node clean-invalid-notifications.js
```

**清理结果**：
- 总通知数: 23
- 系统通知: 1
- 节点通知: 20
- 费用通知: 0
- 无效通知: 0（已清理）

## 通知类型说明

| 类型 | 需要案件编码 | 说明 |
|------|-----------|------|
| deadline | 是 | 节点到期提醒 |
| overdue | 是 | 节点超期提醒 |
| payment | 是 | 费用支付提醒 |
| task | 是 | 协作任务提醒 |
| system | 否 | 系统通知 |

## 性能改进

1. **减少无效数据**：过滤掉关联对象不存在的通知
2. **简化系统通知**：系统通知不需要查询案件信息
3. **提高响应速度**：减少不必要的数据库查询

## 文件修改列表

- `legal-case-management/backend/src/controllers/notificationController.js`
- `legal-case-management/frontend/src/views/notification/NotificationCenter.vue`
- `legal-case-management/frontend/src/components/notification/NotificationPopover.vue`
- `legal-case-management/backend/clean-invalid-notifications.js` (新增)

## 测试验证

已验证：
- ✓ 无效通知已过滤
- ✓ 系统通知不显示案件编码
- ✓ 其他类型通知正常显示案件编码
- ✓ 后端正常启动
