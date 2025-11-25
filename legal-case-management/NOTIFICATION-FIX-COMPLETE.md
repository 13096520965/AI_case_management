# 通知提醒问题修复 - 完整解决方案

## 问题描述

案件 AN202511000007 的立案受理节点截止日期为 2025-11-26，提醒规则设置为"提前3天每天提示"，但用户没有收到提示消息。

## 根本原因分析

经过诊断，发现了**三个关键问题**：

### 问题1：数据库字段不匹配
**症状**：SQL 查询失败，错误信息 "no such column: c.case_name"

**原因**：
- 代码中查询了不存在的列 `c.case_name`
- 实际数据库中案件表没有 `case_name` 列，只有 `internal_number`

**影响**：调度器无法运行，所有提醒检查都失败

### 问题2：单位转换错误
**症状**：规则中设置了"3天"的阈值，但调度器计算出"0天"

**原因**：
- 代码检查的是英文单位 `'days'` 和 `'hours'`
- 数据库中存储的是中文单位 `'天'` 和 `'小时'`
- 单位不匹配导致 `daysAhead` 始终为 0

**影响**：即使 SQL 查询成功，也找不到任何符合条件的节点

### 问题3：状态值混合
**症状**：查询不到符合条件的节点

**原因**：
- 代码检查的是中文状态 `('待处理', '进行中')`
- 数据库中实际存储的是英文状态 `'pending'` 和 `'in_progress'`
- 状态值不匹配导致查询结果为空

**影响**：即使前两个问题解决，也找不到需要提醒的节点

## 修复方案

### 修改文件：`backend/src/services/notificationSchedulerEnhanced.js`

#### 修复1：更正数据库字段引用

**原代码：**
```javascript
SELECT 
  pn.*,
  c.case_number,
  c.case_name,  // ❌ 不存在的列
  c.handler
```

**修复后：**
```javascript
SELECT 
  pn.*,
  c.internal_number as case_number,  // ✓ 使用正确的列
  c.handler
```

**影响范围：**
- `processDeadlineRule` 方法
- `checkOverdueNodes` 方法
- `checkCostPayments` 方法
- `createNodeNotification` 方法

#### 修复2：支持中英文单位

**原代码：**
```javascript
if (threshold_unit === 'days') {
  daysAhead = threshold_value;
} else if (threshold_unit === 'hours') {
  daysAhead = threshold_value / 24;
}
```

**修复后：**
```javascript
if (threshold_unit === 'days' || threshold_unit === '天') {
  daysAhead = threshold_value;
} else if (threshold_unit === 'hours' || threshold_unit === '小时') {
  daysAhead = threshold_value / 24;
}
```

#### 修复3：支持中英文状态值

**原代码：**
```javascript
WHERE pn.status IN ('待处理', '进行中')
```

**修复后：**
```javascript
WHERE pn.status IN ('待处理', '进行中', 'pending', 'in_progress')
```

**影响范围：**
- `processDeadlineRule` 方法
- `checkOverdueNodes` 方法

## 验证结果

修复后，手动触发提醒检查的结果：

```
✓ 创建截止提醒: AN202511000007 - 立案受理 (1天后到期)
✓ 创建截止提醒: AN202511000008 - 庭前准备 (3天后到期)
✓ 创建截止提醒: AN202511000007 - 庭前准备 (3天后到期)
```

案件 AN202511000007 的立案受理节点现在已成功创建提醒：
- **提醒内容**：节点"立案受理"将在 1 天后到期（2025-11-26T01:40:22.000Z），请及时处理
- **提醒状态**：unread（未读）
- **创建时间**：2025-11-25 02:40:44

## 后续步骤

### 1. 部署修复
将修改后的 `notificationSchedulerEnhanced.js` 部署到生产环境

### 2. 重启后端服务
确保调度器重新启动并开始定期检查

### 3. 验证提醒显示
- 打开通知中心，查看是否显示新的提醒
- 检查提醒内容是否正确
- 验证提醒状态是否为"未读"

### 4. 监控日志
在生产环境中监控调度器的日志，确保每天都有提醒被创建

## 相关文件

- **修改文件**：`backend/src/services/notificationSchedulerEnhanced.js`
- **诊断脚本**：`backend/diagnose-daily-reminder.js`
- **测试脚本**：`backend/trigger-check.js`
- **检查脚本**：`backend/find-case.js`

## 预期效果

修复后，用户将能够：
1. ✓ 收到节点截止日期的提醒
2. ✓ 每天都收到提醒（如果规则设置为"每天"）
3. ✓ 不会收到重复的提醒（同一天内）
4. ✓ 在通知中心查看所有提醒

## 总结

通过修复三个关键问题（字段不匹配、单位转换、状态值混合），调度器现在能够正确地：
1. 查询数据库中的节点和规则
2. 计算正确的提醒时间
3. 创建相应的提醒任务
4. 在前端通知中心显示提醒
