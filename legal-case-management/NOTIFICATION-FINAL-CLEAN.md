# 提醒通知最终清晰实现

## 需求实现

### 提醒列表文案优化

**原格式：**
```
【超期警告】冀1091民初8255号案件节点"第一次庭审"已超期 662 天（截止日期：2024-02-01 17:00:00），请尽快处理关联案件编码:AN202511000002（不展示）关联案件编码:--（展示案件的内部编号）
```

**新格式：**
```
【超期警告】冀1091民初8255号案件节点"第一次庭审"已超期 662 天（截止日期：2024-02-01 17:00:00），请尽快处理。
（下方字段）关联案件编码:AN202511000002
```

**实现方式：**
- 文案中只包含主要信息，末尾添加句号
- 关联案件编码不在文案中显示
- 关联案件编码单独显示在下方的字段里
- 没有内部编号时显示 `关联案件编码:--`

## 修改文件

### 后端修改

#### 文件：`backend/src/services/notificationSchedulerEnhanced.js`

**修改内容：**

1. **截止日期提醒文案**
   ```javascript
   const caseNumberPart = node.case_number ? `${node.case_number}` : '';
   const content = `${caseNumberPart}案件节点"${node.node_name}"将在 ${daysLeft} 天后到期（截止日期：${formattedDeadline}），请及时处理。`;
   ```

2. **超期提醒文案**
   ```javascript
   const caseNumberPart = node.case_number ? `${node.case_number}` : '';
   const content = `【超期警告】${caseNumberPart}案件节点"${node.node_name}"已超期 ${overdueDays} 天（截止日期：${formattedDeadline}），请尽快处理。`;
   ```

3. **费用支付提醒文案**
   ```javascript
   const caseNumberPart = cost.case_number ? `${cost.case_number}` : '';
   const content = `${caseNumberPart}案件费用"${cost.cost_type}"将在 ${daysLeft} 天后到期（截止日期：${formattedDueDate}），金额：¥${cost.amount}，请及时支付。`;
   ```

### 前端显示

#### 文件：`frontend/src/views/notification/NotificationCenter.vue`

**显示方式：**
```vue
<!-- 主文案 -->
<div class="notification-body">
  <p class="notification-text" v-for="(line, index) in notification.content.split('\n')" :key="index">
    {{ line }}
  </p>
</div>

<!-- 下方字段显示关联案件编码 -->
<div class="notification-footer">
  <span class="notification-related">
    <el-link 
      v-if="notification.internalNumber"
      type="primary" 
      :underline="false"
      @click.stop="handleNotificationClick(notification)"
    >
      关联案件编码:{{ notification.internalNumber }}
    </el-link>
    <span v-else>
      关联案件编码:--
    </span>
  </span>
</div>
```

## 显示效果

### 通知中心

**有内部编号的提醒：**
```
【超期警告】冀1091民初8255号案件节点"第一次庭审"已超期 662 天（截止日期：2024-02-01 17:00:00），请尽快处理。
（下方字段）关联案件编码:AN202511000002
```

**没有内部编号的提醒：**
```
案件节点"节点1"将在 3 天后到期（截止日期：2025-11-28 00:00:00），请及时处理。
（下方字段）关联案件编码:--
```

### 右上角通知弹窗

**显示方式：**
```
【超期警告】冀1091民初8255号案件节点"第一次庭审"已超期 662 天（截止日期：2024-02-01 17:00:00），请尽快处理。
```

## 功能特性

✓ **文案清晰**：只包含主要信息，末尾添加句号
✓ **关联信息分离**：关联案件编码不在文案中，单独显示在下方字段
✓ **默认值处理**：没有内部编号时显示 `--`
✓ **点击跳转**：点击关联信息可跳转到案件详情页面
✓ **右上角折行**：宽度不足时自动折行显示

## 数据流

```
后端生成提醒
  ↓
文案中只包含主要信息（不包含关联案件编码）
  ↓
通知控制器返回 internalNumber 字段
  ↓
前端接收数据
  ↓
通知中心显示：
  - 主文案在上方
  - 关联案件编码在下方字段
  ↓
点击关联信息跳转到案件详情页面
```

## 部署步骤

1. 部署后端修改
2. 重启后端服务
3. 刷新前端页面
4. 验证提醒文案和关联信息显示

## 验证清单

- [ ] 文案中不包含关联案件编码
- [ ] 文案末尾有句号
- [ ] 关联案件编码显示在下方字段
- [ ] 没有内部编号时显示 `--`
- [ ] 点击关联信息可跳转到案件详情
- [ ] 右上角通知宽度不足时自动折行

## 相关文件

- `backend/src/services/notificationSchedulerEnhanced.js`
- `frontend/src/views/notification/NotificationCenter.vue`
- `frontend/src/components/notification/NotificationPopover.vue`
- `backend/src/controllers/notificationController.js`
