const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate } = require('../middleware/auth');

/**
 * @route   GET /api/analytics/dashboard
 * @desc    获取驾驶舱数据统计
 * @access  Private
 */
router.get('/dashboard', authenticate, analyticsController.getDashboardData);

/**
 * @route   GET /api/analytics/cases/type-distribution
 * @desc    获取案件类型分布
 * @access  Private
 */
router.get('/cases/type-distribution', authenticate, analyticsController.getCaseTypeDistribution);

/**
 * @route   GET /api/analytics/cases/trend
 * @desc    获取案件趋势
 * @access  Private
 */
router.get('/cases/trend', authenticate, analyticsController.getCaseTrend);

/**
 * @route   GET /api/analytics/lawyers/evaluation
 * @desc    获取所有律师评价
 * @access  Private
 */
router.get('/lawyers/evaluation', authenticate, analyticsController.getAllLawyersEvaluation);

/**
 * @route   GET /api/analytics/lawyers/:id/evaluation
 * @desc    获取律师评价统计
 * @access  Private
 */
router.get('/lawyers/:id/evaluation', authenticate, analyticsController.getLawyerEvaluation);

/**
 * @route   POST /api/analytics/similar-cases
 * @desc    类案检索（模拟实现）
 * @access  Private
 */
router.post('/similar-cases', authenticate, analyticsController.searchSimilarCases);

module.exports = router;
