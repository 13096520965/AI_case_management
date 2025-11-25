# 首页待办事项数据展示修复

## 问题描述

首页待办事项卡片接口返回数据，但是没有展示在页面上。

## 问题原因

1. **后端接口不支持分页**: 原始的 `/api/notifications` 接口只返回数组格式，不支持分页参数
2. **数据格式不匹配**: 前端期望 `{ data: { list: [], total: 0 } }` 格式，但后端返回 `{ data: [] }` 格式
3. **缺少案件信息**: 提醒数据中没有关联的案件编号和案件名称

## 解决方案

### 1. 后端修改

**文件**: `backend/src/controllers/notificationController.js`

#### 添加分页支持

```javascript
exports.getNotifications = async (req, res) => {
  const { page, pageSize, status } = req.query;
  
  // 获取所有提醒
  const notifications = await NotificationTask.findAll({ status });
  
  // 关联案件信息
  const notificationsWithCase = await Promise.all(
    notifications.map(async (notification) => {
      // 如果是节点相关提醒，获取案件信息
      if (notification.related_type === 'process_node') {
        const nodeResult = await dbQuery(
          'SELECT pn.*, c.case_number, c.case_name FROM process_nodes pn LEFT JOIN cases c ON pn.case_id = c.id WHERE pn.id = ?',
          [notification.related_id]
        );
        // 添加案件信息
      }
      return notification;
    })
  );
  
  // 如果有分页参数，返回分页数据
  if (page && pageSize) {
    const pageNum = parseInt(page);
    const size = parseInt(pageSize);
    const startIndex = (pageNum - 1) * size;
    const paginatedData = notifications.slice(startIndex, startIndex + size);
    
    res.json({
      success: true,
      data: {
        list: paginatedData,
        total: notifications.length,
        page: pageNum,
        pageSize: size
      }
    });
  } else {
    // 兼容旧格式
    res.json({
      success: true,
      data: notifications
    });
  }
};
```

### 2. 前端修改

**文件**: `frontend/src/views/dashboard/Dashboard.vue`

#### 兼容两种数据格式

```typescript
const loadAlertList = async (append = false) => {
  const response = await notificationApi.getNotifications({ 
    page: currentPage.value,
    pageSize: pageSize.value,
    status: 'pending'
  });
  
  let newAlerts = [];
  let total = 0;
  
  // 检查返回的数据格式
  if (response.data.list) {
    // 分页格式
    newAlerts = response.data.list || [];
    total = response.data.total || 0;
  } else if (Array.isArray(response.data)) {
    // 数组格式（兼容旧接口）
    newAlerts = response.data;
    total = response.data.length;
  }
  
  // 更新列表
  if (append) {
    alertList.value = [...alertList.value, ...newAlerts];
  } else {
    alertList.value = newAlerts;
  }
  
  totalAlerts.value = total;
  hasMore.value = alertList.value.length < total;
};
```

#### 修复字段映射

```typescript
interface AlertItem {
  id: number
  taskType: string  // 后端返回的是 taskType
  type?: string     // 兼容字段
  content: string
  caseId?: number
  caseNumber?: string
  caseName?: string
  status: string
  scheduledTime: string
  createdAt: string
}

// 优先级判断
const getAlertPriority = (alert: AlertItem): string => {
  const type = alert.taskType || alert.type || '';
  if (type.includes('overdue')) return 'high';
  if (type.includes('deadline')) return 'medium';
  return 'low';
};
```

## 数据流程

```
1. 前端请求
   GET /api/notifications?page=1&pageSize=20&status=pending

2. 后端处理
   - 查询 notification_tasks 表
   - 关联 process_nodes 和 cases 表获取案件信息
   - 分页处理
   - 返回数据

3. 前端展示
   - 解析数据（兼容两种格式）
   - 渲染列表
   - 显示案件编号、内容、时间
   - 根据 taskType 显示不同图标和优先级
```

## 测试要点

1. ✅ 页面加载时是否显示提醒列表
2. ✅ 是否显示案件编号和案件名称
3. ✅ 是否显示正确的图标（逾期-红色，截止-橙色）
4. ✅ 是否显示相对时间
5. ✅ 点击刷新按钮是否更新数据
6. ✅ 滚动加载更多是否正常
7. ✅ 点击提醒项是否跳转到案件详情

## 调试方法

在浏览器控制台查看日志：

```javascript
// 查看接口响应
console.log('Dashboard Alert Response:', response);

// 查看解析后的数据
console.log('New alerts:', newAlerts);
console.log('Total:', total);

// 查看最终的列表
console.log('Alert list after update:', alertList.value);
```

## 注意事项

1. 后端接口同时支持分页和非分页两种格式，保持向后兼容
2. 前端代码兼容两种数据格式，避免接口变更导致问题
3. 案件信息通过 JOIN 查询获取，确保数据完整性
4. taskType 字段用于判断提醒类型和优先级
