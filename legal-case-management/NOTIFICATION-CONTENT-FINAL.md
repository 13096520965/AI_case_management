# 提醒文案最终优化 - 完整实现

## 需求

提醒文案需要改进，从：
```
AN202511000007案件节点"庭前准备"将在 3 天后到期（截止日期：2025-11-28 09:40:22），请及时处理
关联: process_node #44
```

改为：
```
案号001（案号）案件节点"庭前准备"将在 3 天后到期（截止日期：2025-11-28 09:40:22），请及时处理
关联案件编码:AN202511000007（内部编号）
```

并且点击提醒时可以跳转到对应的案件详情页面。

## 实现方案

### 1. 数据库字段说明

- `case_number`：案号（如 "案号001"、"冀1091民初8255号"）
- `internal_number`：内部编号（如 "AN202511000007"）

### 2. 后端修改

#### 文件：`backend/src/services/notificationSchedulerEnhanced.js`

**修改内容：**

1. **更新SQL查询**
   - 从 `c.internal_number as case_number` 改为同时获取 `c.case_number` 和 `c.internal_number`
   - 影响范围：`processDeadlineRule`、`checkOverdueNodes`、`checkCostPayments`、`createNodeNotification`

2. **更新提醒文案格式**

   **截止日期提醒：**
   ```javascript
   // 原：${node.case_number}案件节点"${node.node_name}"将在 ${daysLeft} 天后到期...
   // 新：${caseNumberDisplay}（案号）案件节点"${node.node_name}"将在 ${daysLeft} 天后到期...
   //     ...关联案件编码:${internalNumberDisplay}（内部编号）
   ```

   **超期提醒：**
   ```javascript
   // 原：【超期警告】${node.case_number}案件节点"${node.node_name}"已超期...
   // 新：【超期警告】${caseNumberDisplay}（案号）案件节点"${node.node_name}"已超期...
   //     ...关联案件编码:${internalNumberDisplay}（内部编号）
   ```

   **费用支付提醒：**
   ```javascript
   // 原：${cost.case_number}案件费用"${cost.cost_type}"将在...
   // 新：${caseNumberDisplay}（案号）案件费用"${cost.cost_type}"将在...
   //     ...关联案件编码:${internalNumberDisplay}（内部编号）
   ```

3. **处理空值**
   ```javascript
   const caseNumberDisplay = node.case_number || '未知';
   const internalNumberDisplay = node.internal_number || '未知';
   ```

### 3. 前端修改

#### 文件：`frontend/src/views/notification/NotificationCenter.vue`

**修改内容：**

在 `handleNotificationClick` 方法中添加跳转逻辑：

```javascript
const handleNotificationClick = (notification: any) => {
  if (notification.status === 'unread') {
    handleMarkAsRead(notification.id)
  }
  // 如果有链接URL，则跳转到对应页面
  if (notification.linkUrl) {
    router.push(notification.linkUrl)
  } else if (notification.caseId) {
    // 备用方案：使用caseId跳转
    router.push(`/cases/${notification.caseId}`)
  }
}
```

## 实现效果

### 提醒文案示例

**截止日期提醒：**
```
案号001（案号）案件节点"立案受理"将在 1 天后到期（截止日期：2025-11-26 09:40:22），请及时处理关联案件编码:AN202511000007（内部编号）
```

**超期提醒：**
```
【超期警告】2025111701（案号）案件节点"立案受理"已超期 4 天（截止日期：2025-11-21 10:05:44），请尽快处理关联案件编码:AN202511000001（内部编号）
```

**费用支付提醒：**
```
案号001（案号）案件费用"律师费"将在 2 天后到期（截止日期：2025-11-27 10:00:00），金额：¥5000，请及时支付关联案件编码:AN202511000007（内部编号）
```

### 功能特性

✓ **显示案号**：显示案件的案号（如 "案号001"）
✓ **显示内部编号**：显示案件的内部编号（如 "AN202511000007"）
✓ **格式化日期**：日期显示为 `YYYY-MM-DD HH:mm:ss` 格式
✓ **可点击跳转**：点击提醒可以直接跳转到对应的案件详情页面
✓ **完整信息**：提醒包含所有必要的信息

## 验证结果

测试表明所有提醒文案都符合要求：

```
✓ 截止日期提醒:
  案号001（案号）案件节点"立案受理"将在 1 天后到期（截止日期：2025-11-26 09:40:22），请及时处理关联案件编码:AN202511000007（内部编号）

✓ 超期提醒:
  【超期警告】2025111701（案号）案件节点"立案受理"已超期 4 天（截止日期：2025-11-21 10:05:44），请尽快处理关联案件编码:AN202511000001（内部编号）
```

## 相关文件

- **后端服务**：`backend/src/services/notificationSchedulerEnhanced.js`
- **后端控制器**：`backend/src/controllers/notificationController.js`
- **前端组件**：`frontend/src/views/notification/NotificationCenter.vue`

## 部署步骤

1. 部署后端修改
2. 重启后端服务
3. 清空旧的提醒数据（可选）
4. 手动触发提醒检查或等待定时任务运行
5. 在前端通知中心查看新的提醒文案
6. 点击提醒验证跳转功能

## 文案对比

| 项目 | 原文案 | 新文案 |
|------|--------|--------|
| 案号显示 | AN202511000007 | 案号001（案号） |
| 内部编号 | 无 | AN202511000007（内部编号） |
| 关联信息 | process_node #44 | 案件编码:AN202511000007（内部编号） |
| 跳转功能 | ❌ 无 | ✓ 点击跳转到案件详情 |

## 后续优化

1. **多语言支持**：为不同语言提供不同的文案模板
2. **自定义文案**：允许管理员自定义提醒文案模板
3. **富文本支持**：支持在提醒中使用富文本格式
4. **提醒分类**：按类型分类显示提醒
5. **提醒统计**：显示各类型提醒的统计信息
