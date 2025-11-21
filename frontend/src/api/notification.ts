import request from './request'

export interface NotificationRuleData {
  ruleName: string
  ruleType: string
  threshold?: number
  frequency?: string
  recipients?: string
  enabled?: boolean
}

export const notificationApi = {
  // Get notifications
  getNotifications: (params?: { status?: string; taskType?: string; page?: number; pageSize?: number }) => {
    return request.get('/notifications', { params })
  },
  
  // Get notification by ID
  getNotificationById: (id: number) => {
    return request.get(`/notifications/${id}`)
  },
  
  // Mark notification as read
  markAsRead: (id: number) => {
    return request.put(`/notifications/${id}/read`)
  },
  
  // Mark all as read
  markAllAsRead: () => {
    return request.put('/notifications/read-all')
  },
  
  // Delete notification
  deleteNotification: (id: number) => {
    return request.delete(`/notifications/${id}`)
  },
  
  // Get unread count
  getUnreadCount: () => {
    return request.get('/notifications/unread-count')
  }
}

// 转换驼峰命名到下划线命名
const ruleToSnakeCase = (data: any) => {
  const result: any = {}
  if (data.ruleName !== undefined) result.rule_name = data.ruleName
  if (data.ruleType !== undefined) result.rule_type = data.ruleType
  if (data.triggerCondition !== undefined) result.trigger_condition = data.triggerCondition
  if (data.thresholdValue !== undefined) result.threshold_value = data.thresholdValue
  if (data.thresholdUnit !== undefined) result.threshold_unit = data.thresholdUnit
  if (data.frequency !== undefined) result.frequency = data.frequency
  if (data.recipients !== undefined) result.recipients = data.recipients
  if (data.isEnabled !== undefined) result.is_enabled = data.isEnabled
  if (data.description !== undefined) result.description = data.description
  return result
}

export const notificationRuleApi = {
  // Get notification rules
  getRules: () => {
    return request.get('/notifications/rules')
  },
  
  // Get rule by ID
  getRuleById: (id: number) => {
    return request.get(`/notifications/rules/${id}`)
  },
  
  // Create rule
  createRule: (data: NotificationRuleData) => {
    const snakeCaseData = ruleToSnakeCase(data)
    return request.post('/notifications/rules', snakeCaseData)
  },
  
  // Update rule
  updateRule: (id: number, data: Partial<NotificationRuleData>) => {
    const snakeCaseData = ruleToSnakeCase(data)
    return request.put(`/notifications/rules/${id}`, snakeCaseData)
  },
  
  // Delete rule
  deleteRule: (id: number) => {
    return request.delete(`/notifications/rules/${id}`)
  },
  
  // Toggle rule status
  toggleRule: (id: number, enabled: boolean) => {
    return request.put(`/notifications/rules/${id}/toggle`, { is_enabled: enabled })
  }
}
