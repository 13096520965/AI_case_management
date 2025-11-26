# 每日提醒问题 - 快速修复指南

## 问题症状

案件 AN202511000007 的立案受理节点设置了"提前3天每天提示"的提醒规则，但没有收到提示消息。

## 根本原因（一句话）

调度器在检查是否应该创建提醒时，没有考虑规则的频率设置，导致"每天"频率的规则只在第一天创建提醒，之后就不再创建了。

## 修复内容

修改文件：`backend/src/services/notificationSchedulerEnhanced.js`

**核心改动：**

1. 新增 `shouldCreateNotification` 方法，根据频率智能判断是否创建提醒
   - `once`：永不重复
   - `daily`：每天创建一次（检查是否是同一天）
   - `weekly`：每周创建一次
   - `monthly`：每月创建一次

2. 更新三个检查方法使用新的判断逻辑：
   - `processDeadlineRule`
   - `checkOverdueNodes`
   - `checkCostPayments`

## 验证修复

### 快速验证（推荐）

```bash
# 1. 运行诊断脚本
node backend/diagnose-daily-reminder.js

# 2. 手动触发提醒检查
curl -X POST http://localhost:3000/api/notifications/trigger-manual-check

# 3. 查看通知中心是否收到新的提醒
```

### 完整验证

```bash
# 运行测试脚本（会创建测试数据并验证）
node backend/test-daily-reminder-fix.js
```

## 预期结果

修复后，对于"每天"频率的提醒规则：

| 时间 | 操作 | 结果 |
|------|------|------|
| 2025-11-23 09:00 | 调度器运行 | ✓ 创建提醒 |
| 2025-11-23 10:00 | 调度器再次运行 | ✓ 不重复创建（同一天） |
| 2025-11-24 09:00 | 调度器运行 | ✓ 创建新的提醒 |
| 2025-11-24 10:00 | 调度器再次运行 | ✓ 不重复创建（同一天） |

## 对用户的影响

- ✓ 用户现在会每天收到提醒（如果规则设置为"每天"）
- ✓ 不会收到重复的提醒（同一天内）
- ✓ 其他频率的规则（仅一次、每周、每月）也会正确工作

## 相关文件

- 修改文件：`backend/src/services/notificationSchedulerEnhanced.js`
- 诊断脚本：`backend/diagnose-daily-reminder.js`
- 测试脚本：`backend/test-daily-reminder-fix.js`
- 详细文档：`DAILY-REMINDER-FIX.md`

## 常见问题

**Q: 为什么之前没有收到提醒？**
A: 因为调度器在第一次创建提醒后，后续检查时发现24小时内已有提醒，就不再创建新的了。

**Q: 修复后需要重新配置规则吗？**
A: 不需要。现有的规则配置保持不变，修复会自动应用。

**Q: 如何确认修复已生效？**
A: 运行诊断脚本或手动触发提醒检查，查看通知中心是否收到新的提醒。

**Q: 历史提醒会重复吗？**
A: 不会。修复只影响新创建的提醒，历史提醒不受影响。
