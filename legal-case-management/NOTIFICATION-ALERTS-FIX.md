# 超期预警页面前后端联调修复

## 🔧 修复内容

### 问题
超期预警页面存在与提醒中心相同的响应拦截器数据访问问题。

### 修复位置
`frontend/src/views/notification/NotificationAlerts.vue`

### 修改详情

#### fetchAlerts 方法

**修改前（错误）**:
```typescript
const overdueResponse = await request.get('/nodes/overdue')
const overdueNodes = overdueResponse.data.data || []  // ❌ 双重嵌套

const upcomingResponse = await request.get('/nodes/upcoming')
const upcomingNodes = upcomingResponse.data.data?.nodes || upcomingResponse.data.data || []  // ❌

const caseResponse = await request.get(`/cases/${node.case_id}`)
caseName: caseResponse.data.data?.case_cause || `案件 #${node.case_id}`  // ❌
```

**修改后（正确）**:
```typescript
const overdueResponse = await request.get('/nodes/overdue')
const overdueNodes = overdueResponse.data || []  // ✅ 直接访问

const upcomingResponse = await request.get('/nodes/upcoming')
const upcomingNodes = upcomingResponse.data?.nodes || upcomingResponse.data || []  // ✅

const caseResponse = await request.get(`/cases/${node.case_id}`)
caseName: caseResponse.data?.case_cause || `案件 #${node.case_id}`  // ✅
```

## 📊 API响应格式

### 1. 超期节点API
**请求**: `GET /api/nodes/overdue`

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "case_id": 5,
      "node_name": "证据收集",
      "handler": "张三",
      "deadline": "2025-11-19T00:00:00.000Z",
      "status": "进行中",
      "progress": null
    }
  ]
}
```

### 2. 即将到期节点API
**请求**: `GET /api/nodes/upcoming?days=3`

**响应**:
```json
{
  "success": true,
  "data": {
    "nodes": [
      {
        "id": 2,
        "case_id": 3,
        "node_name": "提交答辩状",
        "handler": "李四",
        "deadline": "2025-11-23T00:00:00.000Z",
        "status": "进行中"
      }
    ],
    "threshold": 3
  }
}
```

### 3. 案件详情API
**请求**: `GET /api/cases/:id`

**响应**:
```json
{
  "success": true,
  "data": {
    "id": 5,
    "case_number": "2024-001",
    "case_cause": "张三诉李四合同纠纷案",
    "status": "active"
  }
}
```

## 🎯 页面功能

### 统计卡片
- **超期节点**: 显示已超期的节点数量
- **即将到期**: 显示3天内到期的节点数量
- **总预警数**: 超期 + 即将到期的总数

### 筛选功能
- **全部预警**: 显示所有超期和即将到期的节点
- **超期节点**: 只显示已超期的节点
- **即将到期**: 只显示即将到期的节点

### 表格列
1. **状态**: 超期/即将到期标签
2. **案件名称**: 可点击跳转到案件详情
3. **节点名称**: 流程节点名称
4. **经办人**: 负责人姓名
5. **截止时间**: 节点截止日期时间
6. **超期时长**: 
   - 已超期: "超期 X 天"（红色）
   - 今天到期: "今天到期"（橙色）
   - 明天到期: "明天到期"（橙色）
   - 未来到期: "X 天后到期"（绿色）
7. **处理建议**: 根据超期时长给出建议
8. **操作**: 处理、提醒、详情按钮

### 处理建议逻辑
```typescript
// 超期节点
if (超期 > 7天) {
  return '严重超期，建议立即联系经办人并上报主管'
} else if (超期 > 3天) {
  return '已超期多日，建议尽快联系经办人处理'
} else {
  return '已超期，建议及时跟进处理进度'
}

// 即将到期节点
if (剩余 <= 1天) {
  return '即将到期，建议立即处理'
} else {
  return '注意截止时间，提前做好准备'
}
```

### 操作功能

#### 1. 处理节点
- 打开处理对话框
- 可选择状态：进行中/已完成
- 如果选择已完成，需要填写完成时间
- 可填写处理说明
- 提交后更新节点状态

#### 2. 发送提醒
- 确认是否发送提醒给经办人
- 创建一条提醒通知
- 提醒类型根据节点状态自动判断（overdue/deadline）

#### 3. 查看详情
- 跳转到案件详情页面

## 🔍 数据流程

```
1. 页面加载
   ↓
2. 调用 fetchAlerts()
   ↓
3. 并行请求两个API
   ├─ GET /api/nodes/overdue
   └─ GET /api/nodes/upcoming
   ↓
4. 合并节点数据
   ↓
5. 为每个节点获取案件名称
   ├─ GET /api/cases/:id
   └─ 提取 case_cause
   ↓
6. 转换字段名（snake_case → camelCase）
   ↓
7. 设置到 alerts 数组
   ↓
8. 计算统计数据
   ├─ overdueCount
   ├─ upcomingCount
   └─ totalAlertsCount
   ↓
9. 根据筛选条件显示数据
   ↓
10. 渲染表格
```

## 🎨 样式特性

### 行样式
- **超期行**: 浅红色背景 (#fef0f0)
- **即将到期行**: 浅橙色背景 (#fdf6ec)

### 文字颜色
- **超期**: 红色 (#f56c6c)
- **紧急（1天内）**: 橙色 (#e6a23c)
- **警告（3天内）**: 橙色 (#e6a23c)
- **正常**: 绿色 (#67c23a)

### 统计卡片
- **超期节点**: 红色左边框
- **即将到期**: 橙色左边框
- **总预警数**: 蓝色左边框

## 🧪 测试步骤

### 1. 访问页面
```
URL: http://localhost:5173/notifications/alerts
```

### 2. 检查统计卡片
- [ ] 超期节点数量正确
- [ ] 即将到期数量正确
- [ ] 总预警数 = 超期 + 即将到期

### 3. 检查表格数据
- [ ] 显示所有超期和即将到期的节点
- [ ] 案件名称正确显示
- [ ] 节点名称正确显示
- [ ] 超期时长计算正确
- [ ] 处理建议显示正确

### 4. 测试筛选功能
- [ ] 点击"全部预警" - 显示所有节点
- [ ] 点击"超期节点" - 只显示超期节点
- [ ] 点击"即将到期" - 只显示即将到期节点

### 5. 测试操作功能
- [ ] 点击"处理" - 打开处理对话框
- [ ] 填写处理信息并提交
- [ ] 点击"提醒" - 发送提醒通知
- [ ] 点击"详情" - 跳转到案件详情

### 6. 测试刷新功能
- [ ] 点击"刷新"按钮
- [ ] 数据重新加载
- [ ] 统计数据更新

## 🐛 调试检查

### 在浏览器Console中执行

```javascript
// 1. 检查API响应
fetch('http://localhost:3000/api/nodes/overdue', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(res => res.json())
.then(data => {
  console.log('超期节点:', data)
  console.log('数量:', data.data?.length)
})

// 2. 检查即将到期节点
fetch('http://localhost:3000/api/nodes/upcoming?days=3', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(res => res.json())
.then(data => {
  console.log('即将到期节点:', data)
  console.log('数量:', data.data?.nodes?.length)
})
```

## 📋 预期效果

### 页面布局
```
┌─────────────────────────────────────────────────────┐
│ 超期预警                                              │
├─────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│ │ ⚠️  5    │ │ 🕐  3    │ │ 📄  8    │             │
│ │ 超期节点  │ │ 即将到期  │ │ 总预警数  │             │
│ └──────────┘ └──────────┘ └──────────┘             │
├─────────────────────────────────────────────────────┤
│ [全部预警] [超期节点] [即将到期]        [刷新]       │
├─────────────────────────────────────────────────────┤
│ 状态 | 案件名称 | 节点名称 | 经办人 | 截止时间 | ... │
│ 超期 | 张三案   | 证据收集 | 张三   | 11-19    | ... │
│ 即将 | 李四案   | 答辩状   | 李四   | 11-23    | ... │
└─────────────────────────────────────────────────────┘
```

## ✅ 修复完成

- [x] 修复响应拦截器数据访问问题
- [x] 重启前端服务
- [x] 创建联调文档

---

**修复时间**: 2025-11-21
**修复状态**: ✅ 已完成
**测试状态**: 待验证
