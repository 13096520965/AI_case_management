const express = require('express');
const router = express.Router();
const caseLogController = require('../controllers/caseLogController');
const { authenticate } = require('../middleware/auth');

/**
 * @route   GET /api/cases/:caseId/logs
 * @desc    获取案件日志列表
 * @access  Private
 */
router.get('/cases/:caseId/logs', authenticate, caseLogController.getCaseLogs);

/**
 * @route   GET /api/cases/:caseId/logs/statistics
 * @desc    获取案件日志统计
 * @access  Private
 */
router.get('/cases/:caseId/logs/statistics', authenticate, caseLogController.getCaseLogStatistics);

/**
 * @route   GET /api/operators/:operatorId/logs
 * @desc    获取操作人的日志
 * @access  Private
 */
router.get('/operators/:operatorId/logs', authenticate, caseLogController.getOperatorLogs);

module.exports = router;
