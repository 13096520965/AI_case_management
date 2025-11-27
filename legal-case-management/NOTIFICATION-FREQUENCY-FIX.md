# 提醒频率判断逻辑修复

## 问题描述

案号002的案件中，有三个节点的截止日期都在2025-11-28附近：
- 送达起诉状副本：2025-11-26（已过期）
- 被告答辩：2025-11-28
- 庭前准备：2025-11-28

但提醒消息只有"庭前准备"，缺少"被告答辩"和"送达判决书"的提醒。

## 根本原因

在 `notificationSchedulerEnhanced.js` 的 `shouldCreateNotification` 方法中，当频率为 `daily` 时，日期比较逻辑存在问题：

1. **时区混乱**：`created_at` 字段存储的是 UTC 时间，但 `beijingNow()` 返回的是北京时间字符串
2. **日期比较不准确**：使用 `cutoffTime` 进行时间窗口比较，但没有正确处理北京时间和 UTC 时间的转换
3. **结果**：某些节点的提醒被错误地判定为"已在24小时内发送过"，导致不创建新的提醒

## 修复方案

重写 `shouldCreateNotification` 方法，改进日期比较逻辑：

### 关键改进

1. **简化逻辑**：直接查询所有相关提醒，而不是使用时间窗口过滤
2. **正确的日期比较**：
   - 对于 `daily` 频率：使用北京时间日期字符串进行比较（YYYY-MM-DD）
   - 对于 `weekly` 和 `monthly` 频率：使用 JavaScript Date 对象进行时间差计算
3. **统一时区处理**：所有日期比较都使用北京时间

### 修复前后对比

**修复前**：
```javascript
const cutoffTime = beijingFromMs(Date.now() - hoursWindow * 60 * 60 * 1000);
const existing = await query(`
  SELECT * FROM notification_tasks
  WHERE related_id = ?
  AND related_type = ?
  AND task_type = ?
  AND created_at > ?
`, [relatedId, relatedType, taskType, cutoffTime]);
```

**修复后**：
```javascript
const existing = await query(`
  SELECT * FROM notification_tasks
  WHERE related_id = ?
  AND related_type = ?
  AND task_type = ?
  ORDER BY created_at DESC
`, [relatedId, relatedType, taskType]);

// 对于 daily 频率
const todayBeijing = beijingNow().split(' ')[0]; // YYYY-MM-DD
const latestDateBeijing = formatToBeijing(latestCreatedAt).split(' ')[0]; // YYYY-MM-DD
return todayBeijing !== latestDateBeijing;
```

## 修复结果

修复后，案号002的所有应该有提醒的节点都正确生成了提醒：

✅ **被告答辩** - deadline 类型 - 1天后到期
✅ **庭前准备** - deadline 类型 - 1天后到期
✅ **送达判决书** - deadline 类型 - 3天后到期
✅ **送达起诉状副本** - overdue 类型 - 已超期1天

## 文件修改

- `backend/src/services/notificationSchedulerEnhanced.js` - 修复 `shouldCreateNotification` 方法

## 测试验证

运行 `node test-notification-fix.js` 手动触发提醒检查，验证所有节点都能正确生成提醒。
