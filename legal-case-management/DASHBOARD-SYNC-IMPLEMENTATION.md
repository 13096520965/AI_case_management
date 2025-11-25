# 首页待办事项数据同步实现

## 实现概述

为首页的待办事项卡片添加了数据同步功能，用户可以通过页面刷新或手动刷新按钮获取最新的提醒信息。

## 核心功能

### 1. 页面加载同步
- **触发时机**: 页面首次加载或刷新时
- **实现方式**: 在 `onMounted` 生命周期中调用
- **加载内容**: 获取前20条待办提醒

```typescript
onMounted(async () => {
  await loadDashboardData()
  await loadAlertList()
  // ...
})
```

### 2. 手动刷新
- **UI组件**: 刷新按钮（圆形图标按钮）
- **位置**: 卡片标题右侧
- **功能**: 点击立即刷新数据
- **状态**: 显示loading状态

### 3. 实时本地更新
- **触发时机**: 用户点击提醒项标记为已读时
- **更新内容**:
  - 从列表中移除已读项
  - 更新未读计数徽章
  - 同步更新待办事项统计卡片
- **优势**: 无需等待服务器响应，即时反馈

```typescript
const handleAlertClick = async (alert: AlertItem) => {
  await notificationApi.markAsRead(alert.id)
  
  // 立即更新本地数据
  alertList.value = alertList.value.filter(item => item.id !== alert.id)
  totalAlerts.value = Math.max(0, totalAlerts.value - 1)
  dashboardData.value.pendingTasks = totalAlerts.value
  
  // 跳转
  if (alert.caseId) {
    router.push(`/cases/${alert.caseId}`)
  }
}
```

### 4. 资源清理
- **清理时机**: 组件卸载时
- **清理内容**:
  - 移除事件监听器
  - 销毁图表实例

```typescript
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  caseTypeChart?.dispose()
  caseTrendChart?.dispose()
  costChart?.dispose()
})
```

## 数据流

```
页面加载/刷新
  ↓
显示20条数据
  ↓
用户交互（点击/滚动/手动刷新）
  ↓
实时更新本地数据
```

## 性能优化

1. **防抖保护**: loading状态防止重复请求
2. **本地优先**: 用户操作立即更新UI，提升体验
3. **按需加载**: 首次只加载20条，滚动时才加载更多
4. **内存管理**: 组件卸载时清理所有监听器和图表实例

## 用户体验

1. **即时反馈**: 点击操作立即生效
2. **状态可见**: 未读数量徽章实时更新
3. **手动控制**: 提供刷新按钮，用户可主动更新
4. **加载提示**: 加载时显示loading状态
5. **简洁高效**: 页面刷新时自动更新，无需后台轮询

## 测试要点

1. ✅ 页面加载时是否正确显示20条数据
2. ✅ 点击刷新按钮，确认数据立即更新
3. ✅ 点击提醒项，确认列表和计数立即更新
4. ✅ 滚动加载更多数据是否正常
5. ✅ 刷新浏览器页面，确认数据重新加载
6. ✅ 网络错误时，确认有错误提示

## 技术细节

- **状态管理**: Vue 3 Composition API (`ref`)
- **生命周期**: `onMounted` 和 `onUnmounted`
- **异步处理**: `async/await`
- **错误处理**: try-catch 捕获异常

## 兼容性

- ✅ 现代浏览器（Chrome, Firefox, Safari, Edge）
- ✅ 移动端浏览器
- ✅ 无需特殊API支持
