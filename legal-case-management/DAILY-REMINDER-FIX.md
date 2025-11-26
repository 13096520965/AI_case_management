# 每日提醒问题修复

## 问题描述

案件 AN202511000007 的立案受理节点截止日期为 2025-11-26，提醒规则设置为"提前3天每天提示"，但用户没有收到提示消息。

## 根本原因

通知调度器中存在逻辑缺陷：

### 问题代码位置
`backend/src/services/notificationSchedulerEnhanced.js` 中的 `checkExistingNotification` 方法

### 具体问题

1. **频率判断缺失**：代码没有根据规则的 `frequency` 字段来决定是否应该创建新的提醒
   
2. **固定24小时检查窗口**：无论规则频率如何，都使用固定的24小时检查窗口
   - 对于 `frequency = 'once'`：应该永不重复
   - 对于 `frequency = 'daily'`：应该每天创建一次
   - 对于 `frequency = 'weekly'`：应该每周创建一次
   - 对于 `frequency = 'monthly'`：应该每月创建一次

3. **同一天重复检查问题**：当调度器在同一天运行多次时，第一次创建的提醒会阻止后续创建

### 示例场景

假设规则设置为"每天"提醒：
- 2025-11-23 09:00：调度器运行，创建提醒 ✓
- 2025-11-23 10:00：调度器再次运行，检查发现24小时内已有提醒，跳过创建 ✗
- 2025-11-24 09:00：调度器运行，检查发现24小时内已有提醒（昨天的），跳过创建 ✗

## 解决方案

### 1. 新增 `shouldCreateNotification` 方法

根据规则的频率智能判断是否应该创建新的提醒：

```javascript
async shouldCreateNotification(relatedId, relatedType, taskType, frequency = 'once') {
  // 根据频率设置不同的检查窗口
  let hoursWindow = 24;
  
  switch (frequency) {
    case 'once':
      hoursWindow = 24 * 365; // 一年内
      break;
    case 'daily':
      hoursWindow = 24; // 24小时内
      break;
    case 'weekly':
      hoursWindow = 24 * 7; // 7天内
      break;
    case 'monthly':
      hoursWindow = 24 * 30; // 30天内
      break;
  }

  // 对于"每天"频率，检查是否是同一天
  if (frequency === 'daily') {
    const today = new Date().toISOString().split('T')[0];
    const recentNotification = existing.find(n => {
      const notificationDate = new Date(n.created_at).toISOString().split('T')[0];
      return notificationDate === today;
    });
    return !recentNotification; // 今天未发送则创建
  }

  return existing.length === 0; // 其他频率：不存在则创建
}
```

### 2. 更新三个检查方法

- `processDeadlineRule`：处理节点截止日期规则
- `checkOverdueNodes`：检查超期节点
- `checkCostPayments`：检查费用支付提醒

所有方法都改为使用新的 `shouldCreateNotification` 方法，并传入规则的 `frequency` 参数。

## 修改文件

### `backend/src/services/notificationSchedulerEnhanced.js`

**变更内容：**

1. 修改 `processDeadlineRule` 方法
   - 从规则中获取 `frequency` 参数
   - 使用 `shouldCreateNotification` 替代 `checkExistingNotification`

2. 修改 `checkOverdueNodes` 方法
   - 从数据库查询超期规则的频率
   - 使用 `shouldCreateNotification` 替代 `checkExistingNotification`

3. 修改 `checkCostPayments` 方法
   - 从数据库查询费用支付规则的频率
   - 使用 `shouldCreateNotification` 替代 `checkExistingNotification`

4. 新增 `shouldCreateNotification` 方法
   - 根据频率判断是否应该创建新的提醒
   - 对于"每天"频率，检查是否是同一天
   - 对于其他频率，检查相应的时间窗口

## 验证方法

### 方法1：运行诊断脚本

```bash
node backend/diagnose-daily-reminder.js
```

这个脚本会：
1. 查找案件 AN202511000007
2. 查找立案受理节点
3. 检查提醒规则配置
4. 计算应该发送提醒的时间
5. 检查已发送的提醒记录
6. 提供诊断建议

### 方法2：运行测试脚本

```bash
node backend/test-daily-reminder-fix.js
```

这个脚本会：
1. 创建测试案件和节点
2. 创建"每天"频率的提醒规则
3. 验证第一天能创建提醒
4. 验证同一天不会重复创建
5. 模拟第二天并验证能创建新的提醒
6. 清理测试数据

### 方法3：手动触发提醒检查

```bash
curl -X POST http://localhost:3000/api/notifications/trigger-manual-check
```

## 预期效果

修复后，对于设置为"每天"频率的提醒规则：

- ✓ 第一天 09:00：创建提醒
- ✓ 第一天 10:00：不重复创建（同一天）
- ✓ 第二天 09:00：创建新的提醒
- ✓ 第二天 10:00：不重复创建（同一天）
- ✓ 第三天 09:00：创建新的提醒

## 相关文件

- 诊断脚本：`backend/diagnose-daily-reminder.js`
- 测试脚本：`backend/test-daily-reminder-fix.js`
- 修改文件：`backend/src/services/notificationSchedulerEnhanced.js`

## 后续建议

1. **监控日志**：在生产环境中监控调度器的日志，确保每天都有提醒被创建

2. **规则验证**：在创建/编辑规则时，验证频率字段是否正确设置

3. **用户通知**：通知用户修复已完成，建议重新检查提醒规则配置

4. **数据清理**：如果有历史数据中的重复提醒，可以运行清理脚本进行清理
