# 提醒列表关联案号功能

## 功能说明

在提醒列表中，将关联信息从 `关联: process_node #17` 改为显示案号，并支持点击跳转到案件详情。

## 修改内容

### 1. 显示案号

**修改前**:
```
关联: process_node #17
```

**修改后**:
```
关联: AN202511000001  (可点击的链接)
```

### 2. 点击跳转

点击案号链接时，跳转到对应的案件详情页面。

## 实现细节

### 前端修改

**文件**: `frontend/src/views/notification/NotificationCenter.vue`

#### 1. 添加导入
```typescript
import { useRouter } from 'vue-router'
import request from '@/api/request'

const router = useRouter()
```

#### 2. 修改模板
```vue
<div class="notification-footer">
  <span class="notification-related">
    关联: 
    <el-link 
      v-if="notification.caseNumber"
      type="primary" 
      :underline="false"
      @click.stop="handleViewCase(notification)"
    >
      {{ notification.caseNumber }}
    </el-link>
    <span v-else>
      {{ notification.relatedType }} #{{ notification.relatedId }}
    </span>
  </span>
</div>
```

#### 3. 获取案号逻辑
```typescript
const fetchNotifications = async () => {
  loading.value = true
  try {
    const response = await notificationApi.getNotifications()
    if (response && response.success) {
      const notifications = response.data || []
      
      // 获取关联的案号
      const notificationsWithCaseNumber = await Promise.all(
        notifications.map(async (notification: any) => {
          if (notification.relatedType === 'process_node' && notification.relatedId) {
            try {
              // 1. 获取节点信息
              const nodeResponse = await request.get(`/nodes/${notification.relatedId}`)
              const node = nodeResponse?.data?.node || nodeResponse?.node || nodeResponse
              
              if (node && node.case_id) {
                // 2. 获取案件信息
                const caseResponse = await request.get(`/cases/${node.case_id}`)
                const caseData = caseResponse?.data?.case || caseResponse?.case || caseResponse
                
                return {
                  ...notification,
                  caseId: node.case_id,
                  caseNumber: caseData?.case_number || caseData?.internal_number || `案件 #${node.case_id}`
                }
              }
            } catch (error) {
              console.error('获取案号失败:', error)
            }
          }
          return notification
        })
      )
      
      notificationStore.setNotifications(notificationsWithCaseNumber)
    }
  } catch (error: any) {
    ElMessage.error(error.message || '获取提醒列表失败')
  } finally {
    loading.value = false
  }
}
```

#### 4. 跳转处理
```typescript
const handleViewCase = (notification: any) => {
  if (notification.caseId) {
    router.push(`/cases/${notification.caseId}`)
  }
}
```

## 数据流程

```
1. 获取提醒列表
   ↓
2. 遍历每条提醒
   ↓
3. 如果 relatedType === 'process_node'
   ↓
4. 通过 relatedId 获取节点信息 (/nodes/:id)
   ↓
5. 从节点信息中获取 case_id
   ↓
6. 通过 case_id 获取案件信息 (/cases/:id)
   ↓
7. 从案件信息中获取 case_number
   ↓
8. 将 caseId 和 caseNumber 添加到提醒对象
   ↓
9. 显示案号链接
   ↓
10. 点击时跳转到 /cases/:caseId
```

## 支持的提醒类型

### process_node 类型
- **deadline**: 节点到期提醒
- **node_deadline**: 系统节点到期
- **overdue**: 节点超期预警

**显示**: 案号链接（可点击）

### 其他类型
- **payment**: 费用支付提醒
- **system**: 系统通知
- **task**: 协作任务

**显示**: 原始格式 `relatedType #relatedId`

## 案号优先级

获取案号时的优先级：
1. `case_number` - 正式案号
2. `internal_number` - 内部编号
3. `案件 #${case_id}` - 默认显示

## 错误处理

### 1. 节点不存在
```typescript
try {
  const nodeResponse = await request.get(`/nodes/${notification.relatedId}`)
} catch (error) {
  console.error('获取案号失败:', error)
  // 返回原始提醒对象，不显示案号
  return notification
}
```

### 2. 案件不存在
```typescript
try {
  const caseResponse = await request.get(`/cases/${node.case_id}`)
} catch (error) {
  console.error('获取案号失败:', error)
  // 返回原始提醒对象，不显示案号
  return notification
}
```

### 3. 降级显示
如果获取案号失败，显示原始格式：
```
关联: process_node #17
```

## 性能优化

### 1. 并行请求
使用 `Promise.all` 并行获取所有提醒的案号：
```typescript
const notificationsWithCaseNumber = await Promise.all(
  notifications.map(async (notification) => {
    // 并行处理每条提醒
  })
)
```

### 2. 缓存优化（建议）
可以添加案号缓存，避免重复请求：
```typescript
const caseNumberCache = new Map<number, string>()

const getCaseNumber = async (caseId: number) => {
  if (caseNumberCache.has(caseId)) {
    return caseNumberCache.get(caseId)
  }
  
  const caseResponse = await request.get(`/cases/${caseId}`)
  const caseNumber = caseResponse?.case_number
  caseNumberCache.set(caseId, caseNumber)
  
  return caseNumber
}
```

### 3. 批量查询（建议）
后端可以提供批量查询接口：
```typescript
// 前端
const caseIds = [...new Set(nodes.map(n => n.case_id))]
const cases = await request.post('/cases/batch', { ids: caseIds })

// 后端
router.post('/cases/batch', async (req, res) => {
  const { ids } = req.body
  const cases = await Case.findByIds(ids)
  res.json({ success: true, data: cases })
})
```

## 用户体验

### 1. 视觉效果
- 案号显示为蓝色链接
- 鼠标悬停时显示下划线
- 点击时有视觉反馈

### 2. 交互反馈
- 点击后立即跳转
- 使用 `@click.stop` 防止触发父元素的点击事件
- 跳转到案件详情页面

### 3. 加载状态
- 获取案号时显示 loading 状态
- 获取失败时降级显示原始格式
- 不影响其他提醒的显示

## 测试场景

### 1. 正常场景
```
提醒类型: deadline
关联类型: process_node
关联ID: 17
节点存在: ✓
案件存在: ✓
案号: AN202511000001

显示: 关联: AN202511000001 (蓝色链接)
点击: 跳转到 /cases/33
```

### 2. 节点不存在
```
提醒类型: deadline
关联类型: process_node
关联ID: 999
节点存在: ✗

显示: 关联: process_node #999
点击: 无
```

### 3. 案件不存在
```
提醒类型: deadline
关联类型: process_node
关联ID: 17
节点存在: ✓
案件存在: ✗

显示: 关联: process_node #17
点击: 无
```

### 4. 非节点类型
```
提醒类型: payment
关联类型: cost_record
关联ID: 5

显示: 关联: cost_record #5
点击: 无
```

## 示例数据

### 提醒数据
```json
{
  "id": 88,
  "relatedId": 1,
  "relatedType": "process_node",
  "taskType": "deadline",
  "content": "节点"立案审查"即将到期，请及时处理",
  "status": "unread",
  "scheduledTime": "2025-11-21T08:00:00Z"
}
```

### 节点数据
```json
{
  "id": 1,
  "case_id": 33,
  "node_name": "立案审查",
  "deadline": "2025-11-25T00:00:00Z"
}
```

### 案件数据
```json
{
  "id": 33,
  "case_number": "AN202511000001",
  "internal_number": "AN202511000001",
  "case_cause": "测试案件"
}
```

### 最终显示
```
关联: AN202511000001 (点击跳转到 /cases/33)
```

## 相关文件

- `frontend/src/views/notification/NotificationCenter.vue` - 提醒列表页面
- `frontend/src/api/notification.ts` - 提醒API
- `frontend/src/api/request.ts` - HTTP请求封装

## 后续优化建议

### 1. 后端优化
在后端返回提醒数据时，直接包含案号：
```javascript
// backend/src/controllers/notificationController.js
exports.getNotifications = async (req, res) => {
  const notifications = await NotificationTask.findAll()
  
  // 关联查询案号
  const notificationsWithCase = await Promise.all(
    notifications.map(async (notification) => {
      if (notification.related_type === 'process_node') {
        const node = await ProcessNode.findById(notification.related_id)
        if (node) {
          const caseData = await Case.findById(node.case_id)
          return {
            ...notification,
            case_id: node.case_id,
            case_number: caseData?.case_number
          }
        }
      }
      return notification
    })
  )
  
  res.json({ success: true, data: notificationsWithCase })
}
```

### 2. 数据库优化
使用 JOIN 查询一次性获取所有数据：
```sql
SELECT 
  nt.*,
  pn.case_id,
  c.case_number,
  c.internal_number
FROM notification_tasks nt
LEFT JOIN process_nodes pn ON nt.related_type = 'process_node' AND nt.related_id = pn.id
LEFT JOIN cases c ON pn.case_id = c.id
WHERE nt.status IN ('unread', 'pending')
ORDER BY nt.scheduled_time DESC
```

### 3. 前端缓存
使用 Vuex/Pinia 缓存案号映射：
```typescript
// stores/case.ts
export const useCaseStore = defineStore('case', {
  state: () => ({
    caseNumbers: new Map<number, string>()
  }),
  actions: {
    setCaseNumber(caseId: number, caseNumber: string) {
      this.caseNumbers.set(caseId, caseNumber)
    },
    getCaseNumber(caseId: number) {
      return this.caseNumbers.get(caseId)
    }
  }
})
```

## 总结

通过本次修改：
- ✅ 提醒列表显示案号而不是ID
- ✅ 案号可点击跳转到案件详情
- ✅ 支持错误降级显示
- ✅ 保持良好的用户体验

用户现在可以直接从提醒列表点击案号查看案件详情，提升了操作效率。

---

**修改完成时间**: 2025-11-21  
**修改人员**: AI Assistant  
**测试状态**: 待测试  
**部署状态**: 已应用（热更新）
