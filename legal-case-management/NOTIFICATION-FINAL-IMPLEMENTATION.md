# 提醒通知最终实现 - 完整总结

## 需求实现

### 1. 提醒文案格式优化

**原格式：**
```
【超期警告】AN202511000007（案号）案件节点"庭前准备"已超期 6 天（截止日期：2025-11-19 02:25:32），请尽快处理关联案件编码:AN202511000007（内部编号）
```

**新格式：**
```
【超期警告】案号001案件节点"庭前准备"已超期 6 天（截止日期：2025-11-19 02:25:32），请尽快处理
关联案件编码:AN202511000007
```

**特点：**
- ✓ 主文案和关联信息分行显示
- ✓ 没有案号的案件不显示案号，不显示null
- ✓ 内部编号单独显示在下一行

### 2. 前端显示优化

#### 通知中心（NotificationCenter.vue）
- ✓ 提醒文案支持换行显示
- ✓ 点击提醒可跳转到对应的案件详情页面
- ✓ 支持 `linkUrl` 和 `caseId` 两种跳转方式

#### 右上角通知弹窗（NotificationPopover.vue）
- ✓ 提醒文案支持换行显示
- ✓ 每行文本单独显示，便于阅读
- ✓ 点击提醒可跳转到对应的案件详情页面或通知中心

### 3. 后端实现

#### 文件：`backend/src/services/notificationSchedulerEnhanced.js`

**修改内容：**

1. **截止日期提醒文案**
   ```javascript
   const caseNumberPart = node.case_number ? `${node.case_number}` : '';
   const mainContent = `${caseNumberPart}案件节点"${node.node_name}"将在 ${daysLeft} 天后到期（截止日期：${formattedDeadline}），请及时处理`;
   const relatedInfo = node.internal_number ? `关联案件编码:${node.internal_number}` : '';
   const fullContent = relatedInfo ? `${mainContent}\n${relatedInfo}` : mainContent;
   ```

2. **超期提醒文案**
   ```javascript
   const caseNumberPart = node.case_number ? `${node.case_number}` : '';
   const mainContent = `【超期警告】${caseNumberPart}案件节点"${node.node_name}"已超期 ${overdueDays} 天（截止日期：${formattedDeadline}），请尽快处理`;
   const relatedInfo = node.internal_number ? `关联案件编码:${node.internal_number}` : '';
   const fullContent = relatedInfo ? `${mainContent}\n${relatedInfo}` : mainContent;
   ```

3. **费用支付提醒文案**
   ```javascript
   const caseNumberPart = cost.case_number ? `${cost.case_number}` : '';
   const mainContent = `${caseNumberPart}案件费用"${cost.cost_type}"将在 ${daysLeft} 天后到期（截止日期：${formattedDueDate}），金额：¥${cost.amount}，请及时支付`;
   const relatedInfo = cost.internal_number ? `关联案件编码:${cost.internal_number}` : '';
   const fullContent = relatedInfo ? `${mainContent}\n${relatedInfo}` : mainContent;
   ```

#### 文件：`backend/src/controllers/notificationController.js`

**修改内容：**
- 返回 `linkUrl` 和 `internalNumber` 字段
- 支持节点和费用相关的提醒跳转

### 4. 前端实现

#### 文件：`frontend/src/views/notification/NotificationCenter.vue`

**修改内容：**
```vue
<div class="notification-body">
  <p class="notification-text" v-for="(line, index) in notification.content.split('\n')" :key="index">
    {{ line }}
  </p>
</div>
```

#### 文件：`frontend/src/components/notification/NotificationPopover.vue`

**修改内容：**
1. 支持换行显示
   ```vue
   <div class="item-text">
     <div v-for="(line, index) in notification.content.split('\n')" :key="index" class="text-line">
       {{ line }}
     </div>
   </div>
   ```

2. 添加样式
   ```css
   .text-line {
     margin-bottom: 4px;
   }
   
   .text-line:last-child {
     margin-bottom: 0;
   }
   ```

3. 点击跳转逻辑
   ```javascript
   if (notification.linkUrl) {
     router.push(notification.linkUrl)
   } else if (notification.caseId) {
     router.push(`/cases/${notification.caseId}`)
   } else {
     router.push('/notifications')
   }
   ```

## 实现效果

### 提醒文案示例

**截止日期提醒（有案号）：**
```
案号001案件节点"立案受理"将在 1 天后到期（截止日期：2025-11-26 09:40:22），请及时处理
关联案件编码:AN202511000007
```

**截止日期提醒（无案号）：**
```
案件节点"节点1"将在 3 天后到期（截止日期：2025-11-28 00:00:00），请及时处理
```

**超期提醒：**
```
【超期警告】2025111701案件节点"立案受理"已超期 4 天（截止日期：2025-11-21 10:05:44），请尽快处理
关联案件编码:AN202511000001
```

**费用支付提醒：**
```
案号001案件费用"律师费"将在 2 天后到期（截止日期：2025-11-27 10:00:00），金额：¥5000，请及时支付
关联案件编码:AN202511000007
```

## 功能特性

✓ **智能案号显示**：有案号则显示，无案号则不显示，不显示null
✓ **分行显示**：主文案和关联信息分行显示，便于阅读
✓ **点击跳转**：点击提醒可直接跳转到对应的案件详情页面
✓ **多处支持**：通知中心和右上角弹窗都支持换行显示和点击跳转
✓ **完整信息**：提醒包含所有必要的信息（案号、节点名称、天数、日期、金额等）

## 修改文件清单

**后端：**
- `backend/src/services/notificationSchedulerEnhanced.js`
- `backend/src/controllers/notificationController.js`

**前端：**
- `frontend/src/views/notification/NotificationCenter.vue`
- `frontend/src/components/notification/NotificationPopover.vue`

## 部署步骤

1. 部署后端修改
2. 重启后端服务
3. 清空旧的提醒数据（可选）
4. 手动触发提醒检查或等待定时任务运行
5. 在前端通知中心和右上角弹窗查看新的提醒文案
6. 点击提醒验证跳转功能

## 验证清单

- [ ] 提醒文案正确显示（有案号和无案号的情况）
- [ ] 提醒文案支持换行显示
- [ ] 通知中心可以点击跳转到案件详情页面
- [ ] 右上角弹窗可以点击跳转到案件详情页面
- [ ] 没有案号的提醒不显示null
- [ ] 所有类型的提醒都按照新格式显示

## 后续优化

1. **提醒模板**：支持自定义提醒文案模板
2. **多语言**：支持多语言提醒文案
3. **富文本**：支持在提醒中使用富文本格式
4. **提醒分类**：按类型分类显示提醒
5. **提醒统计**：显示各类型提醒的统计信息
