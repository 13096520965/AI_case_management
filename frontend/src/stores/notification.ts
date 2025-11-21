import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Notification {
  id: number
  relatedId: number
  relatedType: string
  taskType: string
  scheduledTime: string
  content: string
  status: string
  createdAt?: string
}

export type NotificationType = 'deadline' | 'overdue' | 'payment' | 'task' | 'system'
export type NotificationStatus = 'unread' | 'read' | 'archived'

export const useNotificationStore = defineStore('notification', () => {
  // State
  const notifications = ref<Notification[]>([])
  const isLoading = ref<boolean>(false)
  const error = ref<string | null>(null)
  const lastFetchTime = ref<Date | null>(null)

  // Getters
  const unreadCount = computed(() => {
    return notifications.value.filter(n => n.status === 'unread').length
  })

  const unreadNotifications = computed(() => {
    return notifications.value.filter(n => n.status === 'unread')
  })

  const readNotifications = computed(() => {
    return notifications.value.filter(n => n.status === 'read')
  })

  const notificationsByType = computed(() => {
    const typeMap: Record<string, Notification[]> = {}
    notifications.value.forEach(n => {
      if (!typeMap[n.taskType]) {
        typeMap[n.taskType] = []
      }
      typeMap[n.taskType].push(n)
    })
    return typeMap
  })

  const urgentNotifications = computed(() => {
    return notifications.value.filter(n => 
      n.status === 'unread' && 
      (n.taskType === 'overdue' || n.taskType === 'deadline')
    )
  })

  const hasUnreadNotifications = computed(() => unreadCount.value > 0)

  // Actions
  const setNotifications = (notificationList: Notification[]) => {
    notifications.value = notificationList
    lastFetchTime.value = new Date()
    error.value = null
  }

  const addNotification = (notification: Notification) => {
    // Check if notification already exists
    const exists = notifications.value.some(n => n.id === notification.id)
    if (!exists) {
      notifications.value.unshift(notification)
    }
  }

  const addNotifications = (notificationList: Notification[]) => {
    notificationList.forEach(notification => {
      addNotification(notification)
    })
  }

  const markAsRead = (id: number) => {
    const notification = notifications.value.find(n => n.id === id)
    if (notification && notification.status === 'unread') {
      notification.status = 'read'
    }
  }

  const markAllAsRead = () => {
    notifications.value.forEach(n => {
      if (n.status === 'unread') {
        n.status = 'read'
      }
    })
  }

  const markMultipleAsRead = (ids: number[]) => {
    ids.forEach(id => markAsRead(id))
  }

  const removeNotification = (id: number) => {
    notifications.value = notifications.value.filter(n => n.id !== id)
  }

  const clearAllNotifications = () => {
    notifications.value = []
  }

  const clearReadNotifications = () => {
    notifications.value = notifications.value.filter(n => n.status !== 'read')
  }

  const getNotificationById = (id: number): Notification | undefined => {
    return notifications.value.find(n => n.id === id)
  }

  const getNotificationsByType = (type: string): Notification[] => {
    return notifications.value.filter(n => n.taskType === type)
  }

  const getNotificationsByRelated = (relatedType: string, relatedId: number): Notification[] => {
    return notifications.value.filter(
      n => n.relatedType === relatedType && n.relatedId === relatedId
    )
  }

  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  const setError = (errorMessage: string | null) => {
    error.value = errorMessage
  }

  const updateNotification = (id: number, updates: Partial<Notification>) => {
    const notification = notifications.value.find(n => n.id === id)
    if (notification) {
      Object.assign(notification, updates)
    }
  }

  const resetStore = () => {
    notifications.value = []
    isLoading.value = false
    error.value = null
    lastFetchTime.value = null
  }

  return {
    // State
    notifications,
    isLoading,
    error,
    lastFetchTime,
    // Getters
    unreadCount,
    unreadNotifications,
    readNotifications,
    notificationsByType,
    urgentNotifications,
    hasUnreadNotifications,
    // Actions
    setNotifications,
    addNotification,
    addNotifications,
    markAsRead,
    markAllAsRead,
    markMultipleAsRead,
    removeNotification,
    clearAllNotifications,
    clearReadNotifications,
    getNotificationById,
    getNotificationsByType,
    getNotificationsByRelated,
    setLoading,
    setError,
    updateNotification,
    resetStore
  }
})
