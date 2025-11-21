const express = require('express');
const router = express.Router();
const processNodeController = require('../controllers/processNodeController');
const { authenticate } = require('../middleware/auth');

/**
 * @route   GET /api/nodes/:id/detail
 * @desc    获取节点详情（包含超期信息）
 * @access  Private
 */
router.get('/:id/detail', authenticate, processNodeController.getNodeWithOverdueInfo);

/**
 * @route   PUT /api/nodes/:id
 * @desc    更新节点状态
 * @access  Private
 */
router.put('/:id', authenticate, processNodeController.updateNode);

/**
 * @route   DELETE /api/nodes/:id
 * @desc    删除节点
 * @access  Private
 */
router.delete('/:id', authenticate, processNodeController.deleteNode);

/**
 * @route   POST /api/nodes/update-status
 * @desc    更新所有节点状态
 * @access  Private
 */
router.post('/update-status', authenticate, processNodeController.updateAllNodesStatus);

/**
 * @route   GET /api/nodes/overdue
 * @desc    获取超期节点列表
 * @access  Private
 */
router.get('/overdue', authenticate, processNodeController.getOverdueNodes);

/**
 * @route   GET /api/nodes/overdue/statistics
 * @desc    获取超期节点统计
 * @access  Private
 */
router.get('/overdue/statistics', authenticate, processNodeController.getOverdueStatistics);

/**
 * @route   GET /api/nodes/upcoming
 * @desc    获取即将到期的节点
 * @access  Private
 * @query   days - 天数阈值（默认3天）
 */
router.get('/upcoming', authenticate, processNodeController.getUpcomingNodes);

module.exports = router;
