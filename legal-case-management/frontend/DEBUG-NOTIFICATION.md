# 提醒中心前端调试指南

## 🔍 调试步骤

### 1. 打开浏览器开发者工具

**快捷键**:
- Windows/Linux: `F12` 或 `Ctrl+Shift+I`
- Mac: `Cmd+Option+I`

### 2. 检查网络请求

#### 打开Network标签
1. 刷新页面 (`F5` 或 `Cmd+R`)
2. 查找 `/api/notifications` 请求
3. 检查请求状态和响应

**预期结果**:
```
Status: 200 OK
Response:
{
  "success": true,
  "data": [
    {
      "id": 81,
      "relatedId": 6,
      "relatedType": "process_node",
      "taskType": "deadline",
      "scheduledTime": "2025-11-28T06:51:18.817Z",
      "content": "案件\"孙七房产纠纷案\"流程节点\"调解协商\"将在一周后到期",
      "status": "unread",
      "createdAt": "2025-11-15T06:34:31.789Z"
    },
    ...
  ]
}
```

**如果看到401错误**:
- 原因: 未登录或token过期
- 解决: 先登录系统

**如果看到404错误**:
- 原因: 后端服务未启动或路由错误
- 解决: 检查后端服务状态

### 3. 检查Console日志

#### 打开Console标签
查看是否有错误信息：

**常见错误**:
```javascript
// 错误1: API请求失败
Error: Request failed with status code 401

// 错误2: 数据格式错误
TypeError: Cannot read property 'relatedId' of undefined

// 错误3: Store未初始化
Error: Store 'notification' not found
```

### 4. 检查Vue DevTools

#### 安装Vue DevTools
- Chrome: https://chrome.google.com/webstore
- Firefox: https://addons.mozilla.org

#### 检查Store状态
1. 打开Vue DevTools
2. 切换到 `Pinia` 标签
3. 查看 `notification` store
4. 检查 `notifications` 数组

**预期状态**:
```javascript
notification: {
  notifications: Array(31) [
    {
      id: 81,
      relatedId: 6,
      relatedType: "process_node",
      taskType: "deadline",
      scheduledTime: "2025-11-28T06:51:18.817Z",
      content: "案件\"孙七房产纠纷案\"流程节点\"调解协商\"将在一周后到期",
      status: "unread",
      createdAt: "2025-11-15T06:34:31.789Z"
    },
    ...
  ],
  unreadCount: 20,
  isLoading: false,
  error: null
}
```

### 5. 手动测试API

#### 在Console中执行
```javascript
// 测试API调用
fetch('http://localhost:3000/api/notifications', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN_HERE'
  }
})
.then(res => res.json())
.then(data => console.log('API Response:', data))
.catch(err => console.error('API Error:', err))
```

### 6. 检查组件渲染

#### 在Console中执行
```javascript
// 检查NotificationCenter组件
const app = document.querySelector('#app').__vueParentComponent
console.log('App instance:', app)

// 检查notifications数据
console.log('Notifications:', app.ctx.notifications)
```

## 🐛 常见问题排查

### 问题1: 页面空白，无数据显示

**检查清单**:
- [ ] 后端服务是否运行 (http://localhost:3000)
- [ ] 前端服务是否运行 (http://localhost:5173)
- [ ] 是否已登录系统
- [ ] Network标签是否有API请求
- [ ] API请求是否返回200状态
- [ ] 响应数据格式是否正确

**解决方案**:
```bash
# 1. 检查后端服务
curl http://localhost:3000/api/health

# 2. 重新生成数据
node legal-case-management/backend/scripts/seed-notification-data.js

# 3. 清除浏览器缓存
Ctrl+Shift+Delete (Windows/Linux)
Cmd+Shift+Delete (Mac)
```

### 问题2: 显示"未提供认证令牌"

**原因**: 未登录或token过期

**解决方案**:
1. 访问登录页面: http://localhost:5173/login
2. 使用测试账号登录
3. 重新访问提醒中心

### 问题3: 数据格式错误

**检查**:
```javascript
// 在Console中检查数据格式
const store = window.__PINIA__.state.value.notification
console.log('First notification:', store.notifications[0])

// 应该看到camelCase字段
// ✅ relatedId (正确)
// ❌ related_id (错误)
```

**解决方案**:
- 确认后端已重启
- 确认字段转换函数已添加
- 清除浏览器缓存

### 问题4: 红色角标不显示

**检查**:
```javascript
// 在Console中检查未读数量
const store = window.__PINIA__.state.value.notification
console.log('Unread count:', store.unreadCount)
// 应该显示: 20
```

**解决方案**:
- 检查数据是否加载
- 检查status字段是否为'unread'
- 刷新页面

### 问题5: 搜索/筛选无效

**检查**:
```javascript
// 在Console中检查filters状态
const app = document.querySelector('#app').__vueParentComponent
console.log('Filters:', app.ctx.filters)
```

**解决方案**:
- 检查v-model绑定
- 检查computed属性逻辑
- 查看Console错误信息

## 🔧 调试技巧

### 技巧1: 添加调试日志

在组件中添加console.log：

```javascript
// NotificationCenter.vue
const fetchNotifications = async () => {
  loading.value = true
  console.log('🔍 开始获取提醒数据...')
  
  try {
    const response = await notificationApi.getNotifications()
    console.log('✅ API响应:', response.data)
    
    if (response.data.success) {
      console.log('📊 提醒数量:', response.data.data.length)
      notificationStore.setNotifications(response.data.data)
      console.log('💾 Store已更新')
    }
  } catch (error: any) {
    console.error('❌ 获取失败:', error)
    ElMessage.error(error.message || '获取提醒列表失败')
  } finally {
    loading.value = false
  }
}
```

### 技巧2: 使用Vue DevTools

1. 打开Vue DevTools
2. 选择组件树中的 `NotificationCenter`
3. 查看组件的data和computed属性
4. 实时修改数据测试

### 技巧3: 断点调试

1. 打开Sources标签
2. 找到NotificationCenter.vue文件
3. 在fetchNotifications函数设置断点
4. 刷新页面，逐步执行代码

### 技巧4: 网络请求拦截

```javascript
// 在Console中拦截所有fetch请求
const originalFetch = window.fetch
window.fetch = function(...args) {
  console.log('🌐 Fetch请求:', args[0])
  return originalFetch.apply(this, args)
    .then(response => {
      console.log('📥 Fetch响应:', response)
      return response
    })
}
```

## 📋 测试检查表

### 基础功能
- [ ] 页面能正常访问
- [ ] 数据能正常加载
- [ ] 提醒列表能正常显示
- [ ] 未读徽章显示正确数量

### 提醒悬浮层
- [ ] 点击铃铛图标弹出悬浮层
- [ ] 红色角标显示正确
- [ ] 显示最近10条提醒
- [ ] 未读提醒有红点
- [ ] 点击提醒能跳转
- [ ] "查看更多"能跳转

### 搜索和筛选
- [ ] 状态筛选正常
- [ ] 类型筛选正常
- [ ] 关键词搜索正常
- [ ] 搜索按钮正常
- [ ] 重置按钮正常

### 操作功能
- [ ] 一键标为已读正常
- [ ] 刷新按钮正常
- [ ] 单条标记已读正常
- [ ] 删除提醒正常
- [ ] 分页功能正常

## 🎯 快速验证命令

### 在浏览器Console中执行

```javascript
// 1. 检查Vue应用是否加载
console.log('Vue App:', document.querySelector('#app').__vueParentComponent)

// 2. 检查Pinia Store
console.log('Pinia:', window.__PINIA__)

// 3. 检查notification store
const notificationStore = window.__PINIA__.state.value.notification
console.log('Notification Store:', notificationStore)
console.log('Notifications count:', notificationStore.notifications.length)
console.log('Unread count:', notificationStore.unreadCount)

// 4. 检查第一条提醒数据
console.log('First notification:', notificationStore.notifications[0])

// 5. 测试API
fetch('http://localhost:3000/api/notifications', {
  headers: {
    'Authorization': localStorage.getItem('token') ? 
      `Bearer ${localStorage.getItem('token')}` : ''
  }
})
.then(res => res.json())
.then(data => {
  console.log('✅ API测试成功')
  console.log('数据数量:', data.data?.length)
  console.log('第一条数据:', data.data?.[0])
})
.catch(err => console.error('❌ API测试失败:', err))
```

## 📞 获取帮助

如果以上步骤都无法解决问题：

1. **查看完整错误信息**
   - Console标签的完整错误堆栈
   - Network标签的请求详情

2. **检查环境**
   - Node.js版本
   - npm版本
   - 浏览器版本

3. **重新开始**
   - 停止所有服务
   - 清除node_modules
   - 重新安装依赖
   - 重新启动服务

---

**调试愉快！** 🐛🔍
