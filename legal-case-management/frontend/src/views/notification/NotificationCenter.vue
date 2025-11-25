<template>
  <div class="notification-center-container">
    <PageHeader title="提醒中心" />

    <el-card class="filter-card">
      <el-row :gutter="16">
        <el-col :span="5">
          <el-select v-model="filters.status" placeholder="状态筛选" clearable style="width: 100%">
            <el-option label="全部" value="" />
            <el-option label="未读" value="unread" />
            <el-option label="已读" value="read" />
          </el-select>
        </el-col>
        <el-col :span="5">
          <el-select v-model="filters.taskType" placeholder="类型筛选" clearable style="width: 100%">
            <el-option label="全部" value="" />
            <el-option label="节点到期" value="deadline" />
            <el-option label="节点超期" value="overdue" />
            <el-option label="费用支付" value="payment" />
            <el-option label="协作任务" value="task" />
            <el-option label="系统通知" value="system" />
          </el-select>
        </el-col>
        <el-col :span="8">
          <el-input 
            v-model="filters.keyword" 
            placeholder="搜索提醒内容" 
            clearable
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="6" style="text-align: left">
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><RefreshLeft /></el-icon>
            重置
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <el-card class="notification-list-card" v-loading="loading">
      <div class="card-header">
        <div class="header-left">
          <span class="stats-text">共{{ total }}条提醒，其中{{ unreadCount }}条未读</span>
        </div>
        <div class="header-right">
          <el-button type="primary" @click="handleMarkAllAsRead" :disabled="unreadCount === 0">
            <el-icon><Check /></el-icon>
            一键标为已读
          </el-button>
          <el-button @click="handleRefresh" :loading="loading">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </div>

      <div v-if="displayedNotifications.length === 0" class="empty-state">
        <TableEmpty description="暂无提醒" />
      </div>

      <div v-else class="notification-list">
        <div
          v-for="notification in displayedNotifications"
          :key="notification.id"
          class="notification-item"
          @click="handleNotificationClick(notification)"
        >
          <div class="item-dot" v-if="notification.status === 'unread'"></div>
          <div class="notification-icon">
            <el-icon :size="20" :color="getNotificationColor(notification)">
              <component :is="getNotificationIcon(notification)" />
            </el-icon>
          </div>

          <div class="notification-content">
            <div class="notification-header">
              <span class="notification-type">
                <el-tag :type="getNotificationTagType(notification)" size="small">
                  {{ getNotificationTypeLabel(notification.taskType) }}
                </el-tag>
              </span>
              <span class="notification-time">
                {{ formatTime(notification.scheduledTime) }}
              </span>
            </div>

            <div class="notification-body">
              <p class="notification-text">{{ notification.content }}</p>
            </div>

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
          </div>

          <div class="notification-actions">
            <el-button
              v-if="notification.status === 'unread'"
              type="primary"
              size="small"
              text
              @click.stop="handleMarkAsRead(notification.id)"
            >
              标记已读
            </el-button>
            <el-button
              type="danger"
              size="small"
              text
              @click.stop="handleDelete(notification.id)"
            >
              删除
            </el-button>
          </div>
        </div>
      </div>

      <el-pagination
        v-if="total > pageSize"
        class="pagination"
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
        :prev-text="'上一页'"
        :next-text="'下一页'"
        background
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Bell, Warning, Clock, Money, Document, Search, RefreshLeft, Check } from '@element-plus/icons-vue'
import { notificationApi } from '@/api/notification'
import { useNotificationStore } from '@/stores/notification'
import PageHeader from '@/components/common/PageHeader.vue'
import TableEmpty from '@/components/common/TableEmpty.vue'
import { formatDistanceToNow } from '@/utils/format'
import request from '@/api/request'

const router = useRouter()
const notificationStore = useNotificationStore()

// State
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

const filters = ref({
  status: '',
  taskType: '',
  keyword: ''
})

// Computed
const unreadCount = computed(() => notificationStore.unreadCount)

const displayedNotifications = computed(() => {
  let notifications = notificationStore.notifications

  // Apply filters
  if (filters.value.status) {
    notifications = notifications.filter(n => n.status === filters.value.status)
  }
  if (filters.value.taskType) {
    notifications = notifications.filter(n => n.taskType === filters.value.taskType)
  }
  if (filters.value.keyword) {
    const keyword = filters.value.keyword.toLowerCase()
    notifications = notifications.filter(n => 
      n.content.toLowerCase().includes(keyword)
    )
  }

  total.value = notifications.length

  // Pagination
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return notifications.slice(start, end)
})

// Methods
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
              // 获取节点信息
              const nodeResponse: any = await request.get(`/nodes/${notification.relatedId}`)
              const node = nodeResponse?.data?.node || nodeResponse?.node || nodeResponse
              
              if (node && node.case_id) {
                // 获取案件信息
                const caseResponse: any = await request.get(`/cases/${node.case_id}`)
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

const handleViewCase = (notification: any) => {
  if (notification.caseId) {
    router.push(`/cases/${notification.caseId}`)
  }
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleReset = () => {
  filters.value = {
    status: '',
    taskType: '',
    keyword: ''
  }
  currentPage.value = 1
}

const handleRefresh = () => {
  fetchNotifications()
}

const handlePageChange = () => {
  // Pagination is handled by computed property
}

const handleSizeChange = () => {
  currentPage.value = 1
}

const handleNotificationClick = (notification: any) => {
  if (notification.status === 'unread') {
    handleMarkAsRead(notification.id)
  }
  // Could navigate to related item here
}

const handleMarkAsRead = async (id: number) => {
  try {
    const response = await notificationApi.markAsRead(id)
    if (response && response.success) {
      notificationStore.markAsRead(id)
      ElMessage.success('已标记为已读')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '标记失败')
  }
}

const handleMarkAllAsRead = async () => {
  try {
    await ElMessageBox.confirm('确定要将所有未读提醒标记为已读吗？', '确认操作', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const unreadIds = notificationStore.unreadNotifications.map(n => n.id)
    if (unreadIds.length === 0) {
      ElMessage.info('没有未读提醒')
      return
    }

    // Call API to mark multiple as read
    const response = await notificationApi.markAllAsRead()
    if (response && response.success) {
      notificationStore.markAllAsRead()
      ElMessage.success('已全部标记为已读')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '操作失败')
    }
  }
}

const handleDelete = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这条提醒吗？', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const response = await notificationApi.deleteNotification(id)
    if (response && response.success) {
      notificationStore.removeNotification(id)
      ElMessage.success('删除成功')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

const isUrgent = (notification: any): boolean => {
  return notification.taskType === 'overdue' || notification.taskType === 'deadline'
}

const getNotificationIcon = (notification: any) => {
  const iconMap: Record<string, any> = {
    deadline: Clock,
    overdue: Warning,
    payment: Money,
    task: Document,
    system: Bell
  }
  return iconMap[notification.taskType] || Bell
}

const getNotificationColor = (notification: any): string => {
  const colorMap: Record<string, string> = {
    deadline: '#E6A23C',
    overdue: '#F56C6C',
    payment: '#409EFF',
    task: '#67C23A',
    system: '#909399'
  }
  return colorMap[notification.taskType] || '#909399'
}

const getNotificationTagType = (notification: any): any => {
  const typeMap: Record<string, any> = {
    deadline: 'warning',
    overdue: 'danger',
    payment: 'primary',
    task: 'success',
    system: 'info'
  }
  return typeMap[notification.taskType] || 'info'
}

const getNotificationTypeLabel = (taskType: string): string => {
  const labelMap: Record<string, string> = {
    deadline: '节点到期',
    overdue: '节点超期',
    payment: '费用支付',
    task: '协作任务',
    system: '系统通知'
  }
  return labelMap[taskType] || taskType
}

const formatTime = (time: string): string => {
  return formatDistanceToNow(time)
}

// Lifecycle
onMounted(() => {
  fetchNotifications()
})
</script>

<style scoped>
.notification-center-container {
  padding: 20px;
  min-width: 1100px;
}

.filter-card {
  margin-bottom: 20px;
  min-width: 1000px;
}

.notification-list-card {
  min-height: 500px;
  min-width: 1000px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 16px;
  min-width: 800px;
  flex-wrap: nowrap;
}

.header-left {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.stats-text {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.header-right {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
  white-space: nowrap;
}

.empty-state {
  padding: 60px 0;
  text-align: center;
}

.notification-list {
  margin-top: 0;
}

.notification-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.3s;
  min-width: 800px;
}

.notification-item:hover {
  background-color: #f5f7fa;
}

.item-dot {
  position: absolute;
  left: 8px;
  top: 22px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #f56c6c;
}

.notification-icon {
  flex-shrink: 0;
  margin-right: 16px;
  margin-top: 4px;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.notification-type {
  font-weight: 500;
}

.notification-time {
  font-size: 12px;
  color: #909399;
}

.notification-body {
  margin-bottom: 8px;
}

.notification-text {
  margin: 0;
  color: #606266;
  line-height: 1.6;
}

.notification-footer {
  font-size: 12px;
  color: #909399;
}

.notification-related {
  margin-right: 16px;
}

.notification-actions {
  flex-shrink: 0;
  margin-left: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  white-space: nowrap;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  min-width: 600px;
  flex-wrap: wrap;
}
</style>
