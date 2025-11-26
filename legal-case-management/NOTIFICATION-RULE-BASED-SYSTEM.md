# 基于规则的提醒系统实现

## 功能概述

实现基于规则的自动提醒发送功能，当案件流程节点到达设定的时间点时，自动发送提醒给相关人员。

## 示例场景

**案件**: 立案受理  
**节点**: 立案受理  
**截止日期**: 2025-12-02  
**提醒规则**: 提前3天提醒  
**结果**: 系统在2025-11-29自动发送提醒给经办人

## 系统架构

```
提醒规则表 (notification_rules)
  ↓
定时调度器 (notificationScheduler)
  ↓
检查符合条件的节点
  ↓
创建提醒任务 (notification_tasks)
  ↓
前端展示提醒
```

## 数据库表结构

### notification_rules (提醒规则表)

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| id | INTEGER | 规则ID | 1 |
| rule_name | TEXT | 规则名称 | "节点截止提前3天提醒" |
| rule_type | TEXT | 规则类型 | "deadline" |
| threshold_value | INTEGER | 阈值 | 3 |
| threshold_unit | TEXT | 单位 | "days" |
| frequency | TEXT | 频率 | "once" |
| recipients | TEXT | 接收人 | "handler" |
| is_enabled | INTEGER | 是否启用 | 1 |

### notification_tasks (提醒任务表)

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| id | INTEGER | 任务ID | 1 |
| related_id | INTEGER | 关联对象ID | 5 (节点ID) |
| related_type | TEXT | 关联类型 | "process_node" |
| task_type | TEXT | 任务类型 | "deadline" |
| scheduled_time | TEXT | 计划时间 | "2025-11-29 09:00:00" |
| content | TEXT | 提醒内容 | "节点'立案受理'将在3天后到期" |
| status | TEXT | 状态 | "unread" |
| created_at | TEXT | 创建时间 | "2025-11-29 09:00:00" |

## 提醒类型

### 1. deadline (截止日期提醒)

**触发条件**: 节点截止日期前N天  
**规则配置**:
```sql
INSERT INTO notification_rules (
  rule_name, rule_type, threshold_value, threshold_unit, 
  frequency, recipients, is_enabled
) VALUES (
  '节点截止提前3天提醒', 'deadline', 3, 'days', 
  'once', 'handler', 1
);
```

**查询逻辑**:
```sql
SELECT pn.*, c.case_number, c.case_name, c.handler
FROM process_nodes pn
LEFT JOIN cases c ON pn.case_id = c.id
WHERE pn.status IN ('待处理', '进行中')
AND pn.deadline IS NOT NULL
AND julianday(pn.deadline) - julianday('now') <= 3  -- 3天内到期
AND julianday(pn.deadline) - julianday('now') > 0   -- 还未到期
```

**提醒内容**:
```
节点"立案受理"将在 3 天后到期（2025-12-02），请及时处理
```

### 2. overdue (超期提醒)

**触发条件**: 节点已超过截止日期且未完成  
**规则配置**:
```sql
INSERT INTO notification_rules (
  rule_name, rule_type, threshold_value, threshold_unit, 
  frequency, recipients, is_enabled
) VALUES (
  '节点超期提醒', 'overdue', 0, 'days', 
  'daily', 'handler', 1
);
```

**查询逻辑**:
```sql
SELECT pn.*, c.case_number, c.case_name, c.handler
FROM process_nodes pn
LEFT JOIN cases c ON pn.case_id = c.id
WHERE pn.status IN ('待处理', '进行中')
AND pn.deadline IS NOT NULL
AND julianday('now') > julianday(pn.deadline)  -- 已超期
```

**提醒内容**:
```
【超期警告】节点"立案受理"已超期 5 天（截止日期：2025-12-02），请尽快处理
```

### 3. payment (费用支付提醒)

**触发条件**: 费用到期日前N天  
**规则配置**:
```sql
INSERT INTO notification_rules (
  rule_name, rule_type, threshold_value, threshold_unit, 
  frequency, recipients, is_enabled
) VALUES (
  '费用支付提前7天提醒', 'payment', 7, 'days', 
  'once', 'handler', 1
);
```

**查询逻辑**:
```sql
SELECT cr.*, c.case_number, c.case_name
FROM cost_records cr
LEFT JOIN cases c ON cr.case_id = c.id
WHERE cr.status = '未支付'
AND cr.due_date IS NOT NULL
AND julianday(cr.due_date) - julianday('now') <= 7
AND julianday(cr.due_date) - julianday('now') >= 0
```

**提醒内容**:
```
费用"诉讼费"将在 7 天后到期，金额：¥5000，请及时支付
```

### 4. task (任务提醒)

**触发条件**: 流程流转时手动触发  
**使用场景**:
- 节点创建时
- 节点更新时
- 节点完成时
- 节点分配时

**提醒内容**:
```
新节点"立案受理"已创建，截止日期：2025-12-02
节点"立案受理"已完成
```

## 调度器实现

### 定时任务配置

```javascript
// 每天早上 9:00 检查节点截止日期
cron.schedule('0 9 * * *', async () => {
  await scheduler.checkNodeDeadlines();
});

// 每小时检查超期节点
cron.schedule('0 * * * *', async () => {
  await scheduler.checkOverdueNodes();
});

// 每天早上 9:00 检查费用支付
cron.schedule('0 9 * * *', async () => {
  await scheduler.checkCostPayments();
});
```

### 核心逻辑

```javascript
async processDeadlineRule(rule) {
  const { threshold_value, threshold_unit } = rule;
  const daysAhead = threshold_unit === 'days' ? threshold_value : threshold_value / 24;

  // 查询符合条件的节点
  const nodes = await query(`
    SELECT pn.*, c.case_number, c.case_name, c.handler
    FROM process_nodes pn
    LEFT JOIN cases c ON pn.case_id = c.id
    WHERE pn.status IN ('待处理', '进行中')
    AND pn.deadline IS NOT NULL
    AND julianday(pn.deadline) - julianday('now') <= ?
    AND julianday(pn.deadline) - julianday('now') > 0
  `, [daysAhead]);

  for (const node of nodes) {
    // 检查是否已发送过提醒（避免重复）
    const existing = await this.checkExistingNotification(
      node.id, 'process_node', 'deadline'
    );

    if (!existing) {
      // 创建提醒任务
      await NotificationTask.create({
        related_id: node.id,
        related_type: 'process_node',
        task_type: 'deadline',
        scheduled_time: new Date().toISOString(),
        content: `节点"${node.node_name}"将在 ${daysLeft} 天后到期`,
        status: 'unread'
      });
    }
  }
}
```

### 防重复机制

```javascript
async checkExistingNotification(relatedId, relatedType, taskType, hoursWindow = 24) {
  const cutoffTime = new Date(Date.now() - hoursWindow * 60 * 60 * 1000).toISOString();
  
  const existing = await query(`
    SELECT * FROM notification_tasks
    WHERE related_id = ?
    AND related_type = ?
    AND task_type = ?
    AND created_at > ?
  `, [relatedId, relatedType, taskType, cutoffTime]);

  return existing.length > 0;
}
```

## 流程流转触发

### 在processNodeController中集成

```javascript
// 创建节点时
exports.createProcessNode = async (req, res) => {
  // ... 创建节点逻辑
  
  // 发送提醒
  await scheduler.createNodeNotification(nodeId, 'created');
  
  res.json({ success: true, data: node });
};

// 更新节点时
exports.updateProcessNode = async (req, res) => {
  const { status } = req.body;
  
  // ... 更新节点逻辑
  
  // 如果节点完成，发送完成提醒
  if (status === '已完成') {
    await scheduler.createNodeNotification(nodeId, 'completed');
  }
  
  res.json({ success: true });
};
```

## 前端展示

### Dashboard待办事项

```vue
<div class="todo-item">
  <div class="item-dot" v-if="item.status === 'unread'"></div>
  <div class="item-icon">
    <el-icon :color="getNotificationColor(item)">
      <component :is="getNotificationIcon(item)" />
    </el-icon>
  </div>
  <div class="item-content">
    <div class="item-text">{{ item.content }}</div>
    <div class="item-desc">案件编号: {{ item.caseNumber }}</div>
    <div class="item-time">{{ formatTime(item.scheduledTime) }}</div>
  </div>
</div>
```

### NotificationCenter提醒中心

```vue
<div class="notification-footer">
  <span class="notification-related">
    关联: 
    <el-link 
      v-if="notification.caseNumber"
      type="primary" 
      @click.stop="handleViewCase(notification)"
    >
      {{ notification.caseNumber }}
    </el-link>
  </span>
</div>
```

## 测试流程

### 1. 准备测试数据

```sql
-- 创建测试案件
INSERT INTO cases (case_number, case_name, handler, status) 
VALUES ('TEST-2025-001', '测试案件-立案受理', '张三', '进行中');

-- 创建测试节点（3天后到期）
INSERT INTO process_nodes (
  case_id, node_name, deadline, status, handler
) VALUES (
  1, '立案受理', date('now', '+3 days'), '待处理', '张三'
);

-- 创建提醒规则
INSERT INTO notification_rules (
  rule_name, rule_type, threshold_value, threshold_unit, 
  frequency, recipients, is_enabled
) VALUES (
  '节点截止提前3天提醒', 'deadline', 3, 'days', 
  'once', 'handler', 1
);
```

### 2. 运行测试脚本

```bash
cd backend
node test-notification-scheduler.js
```

### 3. 验证结果

```bash
# 查看创建的提醒
sqlite3 database.sqlite "
  SELECT 
    nt.id,
    nt.task_type,
    nt.content,
    nt.status,
    datetime(nt.created_at, 'localtime') as created_at
  FROM notification_tasks nt
  ORDER BY nt.created_at DESC
  LIMIT 10;
"
```

## 启动调度器

### 在app.js中集成

```javascript
const scheduler = require('./src/services/notificationSchedulerEnhanced');

// 启动服务器后启动调度器
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  
  // 启动提醒调度器
  scheduler.start();
});

// 优雅关闭
process.on('SIGTERM', () => {
  scheduler.stop();
  process.exit(0);
});
```

## 配置建议

### 常用规则配置

```sql
-- 1. 节点截止提前3天提醒
INSERT INTO notification_rules VALUES (
  NULL, '节点截止提前3天提醒', 'deadline', 3, 'days', 
  'once', 'handler', 1, NULL, datetime('now')
);

-- 2. 节点截止提前1天提醒
INSERT INTO notification_rules VALUES (
  NULL, '节点截止提前1天提醒', 'deadline', 1, 'days', 
  'once', 'handler', 1, NULL, datetime('now')
);

-- 3. 节点超期每日提醒
INSERT INTO notification_rules VALUES (
  NULL, '节点超期每日提醒', 'overdue', 0, 'days', 
  'daily', 'handler', 1, NULL, datetime('now')
);

-- 4. 费用支付提前7天提醒
INSERT INTO notification_rules VALUES (
  NULL, '费用支付提前7天提醒', 'payment', 7, 'days', 
  'once', 'handler', 1, NULL, datetime('now')
);
```

## 注意事项

1. **时区处理**: 确保数据库时间和系统时间一致
2. **防重复**: 使用时间窗口避免重复发送提醒
3. **性能优化**: 使用索引优化查询性能
4. **错误处理**: 捕获异常避免调度器崩溃
5. **日志记录**: 记录提醒创建日志便于追踪
6. **权限控制**: 确保只发送给有权限的人员

## 扩展功能

### 1. 邮件通知

```javascript
const nodemailer = require('nodemailer');

async sendEmailNotification(notification, recipient) {
  const transporter = nodemailer.createTransporter({...});
  
  await transporter.sendMail({
    to: recipient.email,
    subject: '案件提醒',
    text: notification.content
  });
}
```

### 2. 短信通知

```javascript
const sms = require('aliyun-sms');

async sendSMSNotification(notification, recipient) {
  await sms.send({
    phone: recipient.phone,
    template: 'SMS_TEMPLATE_ID',
    params: {
      content: notification.content
    }
  });
}
```

### 3. 微信通知

```javascript
const wechat = require('wechat-api');

async sendWeChatNotification(notification, recipient) {
  await wechat.sendTemplateMessage({
    touser: recipient.openid,
    template_id: 'TEMPLATE_ID',
    data: {
      content: notification.content
    }
  });
}
```
