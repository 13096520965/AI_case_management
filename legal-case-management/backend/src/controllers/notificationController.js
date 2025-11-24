const NotificationTask = require('../models/NotificationTask');

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
    content: notification.content,
    status: notification.status,
    createdAt: notification.created_at
  };
};

/**
 * 获取提醒列表
 */
exports.getNotifications = async (req, res) => {
  try {
    const { status, task_type, related_type, related_id } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    if (task_type) filters.task_type = task_type;
    if (related_type) filters.related_type = related_type;
    if (related_id) filters.related_id = parseInt(related_id);

    const notifications = await NotificationTask.findAll(filters);
    
    // 转换为前端格式
    const convertedNotifications = notifications.map(convertToCamelCase);
    
    res.json({
      success: true,
      data: convertedNotifications
    });
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
