# 提醒通知UI最终实现

## 需求实现

### 1. 右上角提醒通知

**修改内容：**
- ✅ 未读消息不需要背景色（移除 `#f0f9ff` 背景）
- ✅ 不需要展示关联案件编码
- ✅ 点击提醒通知单条消息时，跳转到对应的案件详情

**实现方式：**
```css
.notification-item.is-unread {
  /* 未读消息不需要背景色 */
}

.notification-item.is-unread:hover {
  background-color: #f5f7fa;
}
```

**点击处理：**
```javascript
const handleNotificationClick = async (notification: any) => {
  // 标记为已读
  if (notification.status === 'unread') {
    // ... 标记逻辑
  }

  // 关闭弹窗
  visible.value = false

  // 跳转到案件详情
  if (notification.linkUrl) {
    router.push(notification.linkUrl)
  } else if (notification.caseId) {
    router.push(`/cases/${notification.caseId}`)
  }
}
```

### 2. 提醒列表

**修改内容：**
- ✅ 不需要在文案中展示关联案件编码
- ✅ 只在单条的下方字段中展示
- ✅ 修复：数据存在案件内部编号时仍然展示 `--` 的问题
- ✅ 点击单条消息时，跳转到对应的案件详情

**实现方式：**
```vue
<!-- 下方字段显示关联案件编码 -->
<div class="notification-footer">
  <span class="notification-related">
    <el-link 
      v-if="notification.internalNumber && notification.internalNumber !== '--'"
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

**点击处理：**
```javascript
const handleNotificationClick = (notification: any) => {
  if (notification.status === 'unread') {
    handleMarkAsRead(notification.id)
  }
  // 跳转到案件详情
  if (notification.linkUrl) {
    router.push(notification.linkUrl)
  } else if (notification.caseId) {
    router.push(`/cases/${notification.caseId}`)
  }
}
```

## 修改文件

- `frontend/src/components/notification/NotificationPopover.vue`
  - 移除未读消息背景色
  - 点击跳转到案件详情

- `frontend/src/views/notification/NotificationCenter.vue`
  - 修复关联案件编码显示逻辑
  - 点击跳转到案件详情

## 显示效果

### 右上角通知弹窗
```
【超期警告】冀1091民初8255号案件节点"第一次庭审"已超期 662 天（截止日期：2024-02-01 17:00:00），请尽快处理。
（无背景色，点击跳转到案件详情）
```

### 提醒列表
```
【超期警告】冀1091民初8255号案件节点"第一次庭审"已超期 662 天（截止日期：2024-02-01 17:00:00），请尽快处理。
关联案件编码:AN202511000002
（点击任意位置跳转到案件详情）
```

## 功能特性

✓ 右上角通知未读消息无背景色
✓ 右上角通知不显示关联案件编码
✓ 右上角通知点击跳转到案件详情
✓ 提醒列表文案中不显示关联案件编码
✓ 提醒列表关联案件编码显示在下方字段
✓ 修复：有内部编号时正确显示，无则显示 `--`
✓ 提醒列表点击跳转到案件详情

## 相关文件

- `frontend/src/components/notification/NotificationPopover.vue`
- `frontend/src/views/notification/NotificationCenter.vue`
- `backend/src/controllers/notificationController.js`
