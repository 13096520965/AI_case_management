const NotificationTask = require('../models/NotificationTask');

/**
 * 从 content 中移除关联案件编码
 */
const removeInternalNumberFromContent = (content) => {
  if (!content) return content;
  // 移除 "关联案件编码:AN..." 这样的内容（包括前面的换行符）
  return content.replace(/\n关联案件编码:[^\n]*/g, '').trim();
};

/**
 * 转换数据库字段为前端格式 (snake_case -> camelCase)
 */
const convertToCamelCase = (notification) => {
  if (!notification) return null;
  return {
    id: notification.id,
    relatedId: notification.related_id,
    relatedType: notification.related_type,
    taskType: notification.task_type,
    scheduledTime: notification.scheduled_time,
    content: removeInternalNumberFromContent(notification.content),
    status: notification.status,
    createdAt: notification.created_at
  };
};

/**
 * 获取提醒列表
 */
exports.getNotifications = async (req, res) => {
  try {
    const { status, task_type, related_type, related_id, page, pageSize } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    if (task_type) filters.task_type = task_type;
    if (related_type) filters.related_type = related_type;
    if (related_id) filters.related_id = parseInt(related_id);

    const notifications = await NotificationTask.findAll(filters);
    
    // 获取案件信息
    const { query: dbQuery } = require('../config/database');
    const notificationsWithCase = await Promise.all(
      notifications.map(async (notification) => {
        let caseInfo = null;
        let linkUrl = null;
        let isValid = true;
        
        // 系统通知不需要案件编码
        if (notification.task_type === 'system') {
          return {
            ...notification,
            caseId: null,
            internalNumber: null,
            linkUrl: null,
            isValid: true
          };
        }
        
        // 如果是节点相关的提醒，获取案件信息
        if (notification.related_type === 'process_node' && notification.related_id) {
          try {
            const nodeResult = await dbQuery(
              'SELECT pn.*, c.id as caseId, c.internal_number FROM process_nodes pn LEFT JOIN cases c ON pn.case_id = c.id WHERE pn.id = ?',
              [notification.related_id]
            );
            if (nodeResult && nodeResult.length > 0) {
              caseInfo = {
                caseId: nodeResult[0].caseId,
                internalNumber: nodeResult[0].internal_number
              };
              // 生成跳转链接
              linkUrl = `/cases/${nodeResult[0].caseId}`;
            } else {
              // 节点不存在，标记为无效
              isValid = false;
            }
          } catch (err) {
            console.error('Error fetching case info:', err);
            isValid = false;
          }
        }
        
        // 如果是费用相关的提醒，获取案件信息
        if (notification.related_type === 'cost_record' && notification.related_id) {
          try {
            const costResult = await dbQuery(
              'SELECT cr.*, c.id as caseId, c.internal_number FROM cost_records cr LEFT JOIN cases c ON cr.case_id = c.id WHERE cr.id = ?',
              [notification.related_id]
            );
            if (costResult && costResult.length > 0) {
              caseInfo = {
                caseId: costResult[0].caseId,
                internalNumber: costResult[0].internal_number
              };
              // 生成跳转链接
              linkUrl = `/cases/${costResult[0].caseId}`;
            } else {
              // 费用记录不存在，标记为无效
              isValid = false;
            }
          } catch (err) {
            console.error('Error fetching case info:', err);
            isValid = false;
          }
        }
        
        return {
          ...notification,
          caseId: caseInfo?.caseId,
          internalNumber: caseInfo?.internalNumber,
          linkUrl: linkUrl,
          isValid: isValid
        };
      })
    );
    
    // 过滤出有效的通知
    const validNotifications = notificationsWithCase.filter(n => n.isValid !== false);
    
    // 转换为前端格式
    const convertedNotifications = validNotifications.map(notification => {
      const converted = convertToCamelCase(notification);
      return {
        ...converted,
        caseId: notification.caseId,
        internalNumber: notification.internalNumber,
        linkUrl: notification.linkUrl
      };
    });
    
    // 如果请求了分页，则返回分页数据
    if (page && pageSize) {
      const pageNum = parseInt(page);
      const size = parseInt(pageSize);
      const startIndex = (pageNum - 1) * size;
      const endIndex = startIndex + size;
      const paginatedData = convertedNotifications.slice(startIndex, endIndex);
      
      res.json({
        success: true,
        data: {
          list: paginatedData,
          total: convertedNotifications.length,
          page: pageNum,
          pageSize: size
        }
      });
    } else {
      // 兼容旧的返回格式
      res.json({
        success: true,
        data: convertedNotifications
      });
    }
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * 获取单个提醒详情
 */
exports.getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await NotificationTask.findById(parseInt(id));
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    res.json({
      success: true,
      data: convertToCamelCase(notification)
    });
  } catch (error) {
    console.error('Error fetching notification:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * 创建提醒任务
 */
exports.createNotification = async (req, res) => {
  try {
    const { related_id, related_type, task_type, scheduled_time, content } = req.body;

    // 验证必填字段
    if (!related_id || !related_type || !task_type || !scheduled_time || !content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const notificationId = await NotificationTask.create({
      related_id,
      related_type,
      task_type,
      scheduled_time,
      content,
      status: 'pending'
    });

    const notification = await NotificationTask.findById(notificationId);

    res.status(201).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * 更新提醒任务
 */
exports.updateNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const changes = await NotificationTask.update(parseInt(id), updateData);

    if (changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    const notification = await NotificationTask.findById(parseInt(id));

    res.json({
      success: true,
      data: convertToCamelCase(notification)
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * 标记提醒为已读
 */
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const changes = await NotificationTask.markAsRead(parseInt(id));

    if (changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    const notification = await NotificationTask.findById(parseInt(id));

    res.json({
      success: true,
      data: convertToCamelCase(notification),
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * 批量标记为已读
 */
exports.markMultipleAsRead = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or empty ids array'
      });
    }

    const changes = await NotificationTask.markMultipleAsRead(ids);

    res.json({
      success: true,
      data: {
        updated_count: changes
      },
      message: `${changes} notifications marked as read`
    });
  } catch (error) {
    console.error('Error marking multiple notifications as read:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * 删除提醒任务
 */
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const changes = await NotificationTask.delete(parseInt(id));

    if (changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * 获取未读提醒数量
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const { related_type, related_id } = req.query;
    
    const filters = {};
    if (related_type) filters.related_type = related_type;
    if (related_id) filters.related_id = parseInt(related_id);

    const count = await NotificationTask.getUnreadCount(filters);

    res.json({
      success: true,
      data: {
        unread_count: count
      }
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * 根据关联对象获取提醒
 */
exports.getNotificationsByRelated = async (req, res) => {
  try {
    const { relatedType, relatedId } = req.params;

    const notifications = await NotificationTask.findByRelated(
      relatedType,
      parseInt(relatedId)
    );

    res.json({
      success: true,
      data: notifications.map(convertToCamelCase)
    });
  } catch (error) {
    console.error('Error fetching notifications by related:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * 手动触发提醒检查（用于测试）
 */
exports.triggerManualCheck = async (req, res) => {
  try {
    const notificationScheduler = require('../services/notificationScheduler');
    await notificationScheduler.manualCheck();

    res.json({
      success: true,
      message: 'Manual notification check triggered successfully'
    });
  } catch (error) {
    console.error('Error triggering manual check:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * 发送单个提醒
 */
exports.sendNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { phoneNumber, email, sendSystem } = req.body;

    const notificationSender = require('../services/notificationSender');
    const result = await notificationSender.sendNotification(parseInt(id), {
      phoneNumber,
      email,
      sendSystem
    });

    res.json({
      success: true,
      data: result,
      message: 'Notification sent successfully'
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * 批量发送待发送的提醒
 */
exports.sendPendingNotifications = async (req, res) => {
  try {
    const notificationSender = require('../services/notificationSender');
    const result = await notificationSender.sendPendingNotifications();

    res.json({
      success: true,
      data: result,
      message: 'Pending notifications sent successfully'
    });
  } catch (error) {
    console.error('Error sending pending notifications:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * 获取发送历史
 */
exports.getSendHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const notificationSender = require('../services/notificationSender');
    const history = await notificationSender.getSendHistory(parseInt(id));

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error fetching send history:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * 重新发送提醒
 */
exports.resendNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notificationSender = require('../services/notificationSender');
    const result = await notificationSender.resendNotification(parseInt(id));

    res.json({
      success: true,
      data: result,
      message: 'Notification resent successfully'
    });
  } catch (error) {
    console.error('Error resending notification:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * 标记所有提醒为已读
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const changes = await NotificationTask.markAllAsRead();

    res.json({
      success: true,
      data: {
        updated_count: changes
      },
      message: `${changes} notifications marked as read`
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
