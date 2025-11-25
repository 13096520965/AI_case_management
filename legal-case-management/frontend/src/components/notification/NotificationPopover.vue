<template>
  <el-popover
    :visible="visible"
    placement="bottom-end"
    :width="380"
    trigger="click"
    popper-class="notification-popover"
    @update:visible="handleVisibleChange"
  >
    <template #reference>
      <div class="notification-trigger">
        <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99">
          <el-icon :size="20" class="notification-icon">
            <Bell />
          </el-icon>
        </el-badge>
      </div>
    </template>

    <div class="notification-popover-content">
      <div class="popover-header">
        <span class="header-title">提醒通知</span>
        <span class="header-count">{{ unreadCount }}条未读</span>
      </div>

      <div class="popover-body" v-loading="loading">
        <div v-if="recentNotifications.length === 0" class="empty-state">
          <el-empty description="暂无提醒" :image-size="80" />
        </div>

        <div v-else class="notification-list">
          <div
            v-for="notification in recentNotifications"
            :key="notification.id"
            class="notification-item"
            :class="{ 'is-unread': notification.status === 'unread' }"
            @click="handleNotificationClick(notification)"
          >
            <div class="item-dot" v-if="notification.status === 'unread'"></div>
            <div class="item-icon">
              <el-icon :size="18" :color="getNotificationColor(notification)">
                <component :is="getNotificationIcon(notification)" />
              </el-icon>
            </div>
            <div class="item-content">
              <div class="item-text">{{ notification.content }}</div>
              <div class="item-time">{{ formatTime(notification.scheduledTime) }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="popover-footer">
        <el-link type="primary" :underline="false" @click="handleViewMore">
          查看更多
        </el-link>
      </div>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Bell, Warning, Clock, Money, Document } from '@element-plus/icons-vue'
import { useNotificationStore } from '@/stores/notification'
import { notificationApi } from '@/api/notification'
import { formatDistanceToNow } from '@/utils/format'

const router = useRouter()
const notificationStore = useNotificationStore()

const visible = ref(false)
const loading = ref(false)

// 获取最近的10条提醒，按时间倒序
const recentNotifications = computed(() => {
  return [...notificationStore.notifications]
    .sort((a, b) => new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime())
    .slice(0, 10)
})

const unreadCount = computed(() => notificationStore.unreadCount)

const handleVisibleChange = (val: boolean) => {
  visible.value = val
  if (val) {
    fetchNotifications()
  }
}

const fetchNotifications = async () => {
  loading.value = true
  try {
    const response = await notificationApi.getNotifications()
    if (response && response.success) {
      notificationStore.setNotifications(response.data || [])
    }
  } catch (error: any) {
    console.error('Failed to fetch notifications:', error)
  } finally {
    loading.value = false
  }
}

const handleNotificationClick = async (notification: any) => {
  // 标记为已读
  if (notification.status === 'unread') {
    try {
      const response = await notificationApi.markAsRead(notification.id)
      if (response && response.success) {
        notificationStore.markAsRead(notification.id)
      }
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  // 关闭弹窗
  visible.value = false

  // 跳转到提醒中心
  router.push('/notifications')
}

const handleViewMore = () => {
  visible.value = false
  router.push('/notifications')
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

const formatTime = (time: string): string => {
  return formatDistanceToNow(time)
}

// 定期刷新未读数量
let refreshInterval: NodeJS.Timeout | null = null

onMounted(() => {
  // 初始加载
  fetchNotifications()
  
  // 每60秒刷新一次（从30秒改为60秒，减少请求频率）
  refreshInterval = setInterval(() => {
    // 只在页面可见时刷新
    if (document.visibilityState === 'visible') {
      fetchNotifications()
    }
  }, 60000)
})

// 组件卸载时清除定时器
onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
})
</script>

<style scoped>
.notification-trigger {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.notification-icon {
  transition: color 0.3s;
}

.notification-trigger:hover .notification-icon {
  color: #409eff;
}

.notification-popover-content {
  display: flex;
  flex-direction: column;
  max-height: 500px;
}

.popover-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.header-count {
  font-size: 12px;
  color: #909399;
}

.popover-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 200px;
  max-height: 400px;
  word-wrap: break-word;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
}

.notification-list {
  padding: 8px 0;
}

.notification-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.3s;
  border-bottom: 1px solid #ebeef5;
}

.notification-item:first-child {
  border-top: 1px solid #ebeef5;
}

.notification-item:hover {
  background-color: #f5f7fa;
}

.notification-item.is-unread {
  background-color: #f0f9ff;
}

.notification-item.is-unread:hover {
  background-color: #e6f4ff;
}

.item-dot {
  position: absolute;
  left: 8px;
  top: 18px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #f56c6c;
}

.item-icon {
  flex-shrink: 0;
  margin-right: 12px;
  margin-top: 2px;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-text {
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
  margin-bottom: 4px;
  word-wrap: break-word;
  word-break: break-word;
  white-space: normal;
}

.item-time {
  font-size: 12px;
  color: #909399;
}

.popover-footer {
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
  text-align: center;
}
</style>

<style>
.notification-popover {
  padding: 0 !important;
}
</style>
