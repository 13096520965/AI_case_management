const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const notificationRuleController = require('../controllers/notificationRuleController');
const { authenticate } = require('../middleware/auth');

// 所有路由都需要认证
router.use(authenticate);

// ===== 提醒规则路由（需要在前面，避免被 :id 路由捕获）=====

// GET /api/notifications/rules - 获取规则列表
router.get('/rules', notificationRuleController.getRules);

// GET /api/notifications/rules/enabled - 获取启用的规则
router.get('/rules/enabled', notificationRuleController.getEnabledRules);

// GET /api/notifications/rules/type/:type - 根据类型获取规则
router.get('/rules/type/:type', notificationRuleController.getRulesByType);

// POST /api/notifications/rules - 创建规则
router.post('/rules', notificationRuleController.createRule);

// GET /api/notifications/rules/:id - 获取单个规则详情
router.get('/rules/:id', notificationRuleController.getRuleById);

// PUT /api/notifications/rules/:id - 更新规则
router.put('/rules/:id', notificationRuleController.updateRule);

// PUT /api/notifications/rules/:id/toggle - 启用/禁用规则
router.put('/rules/:id/toggle', notificationRuleController.toggleRule);

// DELETE /api/notifications/rules/:id - 删除规则
router.delete('/rules/:id', notificationRuleController.deleteRule);

// ===== 提醒任务路由（特定路由在前）=====

// GET /api/notifications/unread-count - 获取未读数量
router.get('/unread-count', notificationController.getUnreadCount);

// PUT /api/notifications/read-all - 标记所有为已读
router.put('/read-all', notificationController.markAllAsRead);

// POST /api/notifications/mark-read - 批量标记为已读
router.post('/mark-read', notificationController.markMultipleAsRead);

// POST /api/notifications/trigger-check - 手动触发提醒检查
router.post('/trigger-check', notificationController.triggerManualCheck);

// POST /api/notifications/send-pending - 批量发送待发送的提醒
router.post('/send-pending', notificationController.sendPendingNotifications);

// GET /api/notifications/related/:relatedType/:relatedId - 根据关联对象获取提醒
router.get('/related/:relatedType/:relatedId', notificationController.getNotificationsByRelated);

// GET /api/notifications - 获取提醒列表
router.get('/', notificationController.getNotifications);

// POST /api/notifications - 创建提醒任务
router.post('/', notificationController.createNotification);

// GET /api/notifications/:id/send-history - 获取发送历史
router.get('/:id/send-history', notificationController.getSendHistory);

// GET /api/notifications/:id - 获取单个提醒详情
router.get('/:id', notificationController.getNotificationById);

// PUT /api/notifications/:id/read - 标记为已读
router.put('/:id/read', notificationController.markAsRead);

// PUT /api/notifications/:id - 更新提醒任务
router.put('/:id', notificationController.updateNotification);

// POST /api/notifications/:id/send - 发送单个提醒
router.post('/:id/send', notificationController.sendNotification);

// POST /api/notifications/:id/resend - 重新发送提醒
router.post('/:id/resend', notificationController.resendNotification);

// DELETE /api/notifications/:id - 删除提醒任务
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
