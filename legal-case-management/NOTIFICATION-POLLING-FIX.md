# 通知轮询优化

## 问题描述

### 现象
前端一直频繁调用 `api/notifications` 接口，导致：
1. 服务器负载增加
2. 网络请求过多
3. 浏览器性能下降

### 原因分析

**问题代码位置**: `frontend/src/components/notification/NotificationPopover.vue`

**问题1: 定时器清理错误**
```javascript
onMounted(() => {
  fetchNotifications()
  
  const interval = setInterval(() => {
    fetchNotifications()
  }, 30000)

  // ❌ 错误：onMounted的返回函数不会在组件卸载时执行
  return () => clearInterval(interval)
})
```

**问题2: 轮询频率过高**
- 每30秒请求一次
- 即使页面不可见也在请求
- 没有考虑用户活跃状态

## 解决方案

### 1. 修复定时器清理

**修改前**:
```javascript
onMounted(() => {
  const interval = setInterval(() => {
    fetchNotifications()
  }, 30000)
  
  return () => clearInterval(interval) // ❌ 不会执行
})
```

**修改后**:
```javascript
let refreshInterval: NodeJS.Timeout | null = null

onMounted(() => {
  fetchNotifications()
  
  refreshInterval = setInterval(() => {
    fetchNotifications()
  }, 60000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
})
```

### 2. 优化轮询策略

**改进点**:
1. **延长轮询间隔**: 30秒 → 60秒
2. **页面可见性检测**: 只在页面可见时刷新
3. **使用 onUnmounted**: 正确清理定时器

**优化后的代码**:
```javascript
onMounted(() => {
  fetchNotifications()
  
  refreshInterval = setInterval(() => {
    // 只在页面可见时刷新
    if (document.visibilityState === 'visible') {
      fetchNotifications()
    }
  }, 60000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
})
```

## 优化效果

### 请求频率对比

| 场景 | 优化前 | 优化后 | 改善 |
|------|--------|--------|------|
| 页面可见 | 每30秒 | 每60秒 | 50% ↓ |
| 页面隐藏 | 每30秒 | 不请求 | 100% ↓ |
| 组件卸载 | 继续请求 | 停止请求 | 100% ↓ |

### 性能提升

1. **服务器负载**: 减少50%的请求
2. **网络流量**: 减少50%的数据传输
3. **浏览器性能**: 减少不必要的DOM更新
4. **用户体验**: 减少后台资源消耗

## 进一步优化建议

### 1. 使用 WebSocket
**优点**:
- 实时推送，无需轮询
- 减少服务器负载
- 更好的用户体验

**实现**:
```javascript
// 建立WebSocket连接
const ws = new WebSocket('ws://localhost:3000/notifications')

ws.onmessage = (event) => {
  const notification = JSON.parse(event.data)
  notificationStore.addNotification(notification)
}
```

### 2. 使用 Server-Sent Events (SSE)
**优点**:
- 单向推送，适合通知场景
- 自动重连
- 基于HTTP，易于实现

**实现**:
```javascript
const eventSource = new EventSource('/api/notifications/stream')

eventSource.onmessage = (event) => {
  const notification = JSON.parse(event.data)
  notificationStore.addNotification(notification)
}
```

### 3. 智能轮询策略
**根据用户活跃度调整**:
```javascript
let pollInterval = 60000 // 默认60秒

// 用户活跃时缩短间隔
document.addEventListener('mousemove', () => {
  pollInterval = 30000
})

// 用户不活跃时延长间隔
setTimeout(() => {
  pollInterval = 120000
}, 300000) // 5分钟后
```

### 4. 使用 Visibility API
**完整实现**:
```javascript
// 页面可见性变化时的处理
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    // 页面变为可见，立即刷新
    fetchNotifications()
  } else {
    // 页面隐藏，停止轮询
    if (refreshInterval) {
      clearInterval(refreshInterval)
    }
  }
})
```

## 最佳实践

### 1. 轮询间隔建议
- **高优先级通知**: 30-60秒
- **普通通知**: 60-120秒
- **低优先级通知**: 5-10分钟

### 2. 请求优化
```javascript
// 使用防抖避免重复请求
import { debounce } from 'lodash-es'

const debouncedFetch = debounce(fetchNotifications, 1000)
```

### 3. 缓存策略
```javascript
// 缓存最近的请求结果
let lastFetchTime = 0
const CACHE_DURATION = 10000 // 10秒缓存

const fetchNotifications = async () => {
  const now = Date.now()
  if (now - lastFetchTime < CACHE_DURATION) {
    return // 使用缓存
  }
  
  lastFetchTime = now
  // 执行请求...
}
```

### 4. 错误处理
```javascript
let retryCount = 0
const MAX_RETRIES = 3

const fetchNotifications = async () => {
  try {
    const response = await notificationApi.getNotifications()
    retryCount = 0 // 重置重试计数
    // 处理响应...
  } catch (error) {
    retryCount++
    if (retryCount >= MAX_RETRIES) {
      // 停止轮询
      clearInterval(refreshInterval)
      console.error('通知获取失败，已停止轮询')
    }
  }
}
```

## 监控建议

### 1. 添加请求日志
```javascript
const fetchNotifications = async () => {
  console.log('[Notification] Fetching at', new Date().toISOString())
  // 请求逻辑...
}
```

### 2. 性能监控
```javascript
const fetchNotifications = async () => {
  const startTime = performance.now()
  
  try {
    await notificationApi.getNotifications()
  } finally {
    const duration = performance.now() - startTime
    console.log(`[Notification] Request took ${duration}ms`)
  }
}
```

### 3. 请求统计
```javascript
let requestCount = 0
let totalDuration = 0

const fetchNotifications = async () => {
  requestCount++
  const startTime = performance.now()
  
  try {
    await notificationApi.getNotifications()
  } finally {
    totalDuration += performance.now() - startTime
    console.log(`[Stats] Requests: ${requestCount}, Avg: ${totalDuration/requestCount}ms`)
  }
}
```

## 测试验证

### 1. 验证定时器清理
```javascript
// 在浏览器控制台
// 1. 打开页面
// 2. 等待几次请求
// 3. 关闭页面或切换路由
// 4. 检查是否还有请求发出
```

### 2. 验证页面可见性
```javascript
// 1. 打开页面
// 2. 切换到其他标签页
// 3. 检查Network面板，应该没有新请求
// 4. 切换回来
// 5. 应该立即有一次请求
```

### 3. 性能测试
```javascript
// 使用Chrome DevTools Performance面板
// 1. 开始录制
// 2. 等待几分钟
// 3. 停止录制
// 4. 检查定时器和网络请求
```

## 相关文件

- `frontend/src/components/notification/NotificationPopover.vue` - 通知弹出层组件
- `frontend/src/api/notification.ts` - 通知API
- `frontend/src/stores/notification.ts` - 通知状态管理

## 总结

通过以下优化：
1. ✅ 修复定时器清理逻辑
2. ✅ 延长轮询间隔（30秒→60秒）
3. ✅ 添加页面可见性检测
4. ✅ 正确使用 onUnmounted 钩子

**效果**:
- 请求频率减少50%
- 页面隐藏时不再请求
- 组件卸载时正确清理
- 用户体验无影响

**建议**:
- 考虑使用 WebSocket 实现实时推送
- 根据业务需求调整轮询间隔
- 添加请求监控和统计

---

**优化完成时间**: 2025-11-21  
**优化人员**: AI Assistant  
**测试状态**: 待测试  
**部署状态**: 可部署
