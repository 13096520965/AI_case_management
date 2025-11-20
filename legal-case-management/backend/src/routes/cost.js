const express = require('express');
const router = express.Router();
const costController = require('../controllers/costController');
const { authenticate } = require('../middleware/auth');

/**
 * @route   POST /api/costs
 * @desc    创建成本记录
 * @access  Private
 */
router.post('/', authenticate, costController.createCost);

/**
 * @route   GET /api/cases/:caseId/costs
 * @desc    获取案件的成本列表（支持按类型和状态筛选）
 * @access  Private
 */
router.get('/cases/:caseId', authenticate, costController.getCostsByCaseId);

/**
 * @route   PUT /api/costs/:id
 * @desc    更新成本记录
 * @access  Private
 */
router.put('/:id', authenticate, costController.updateCost);

/**
 * @route   DELETE /api/costs/:id
 * @desc    删除成本记录
 * @access  Private
 */
router.delete('/:id', authenticate, costController.deleteCost);

/**
 * @route   POST /api/costs/calculate
 * @desc    费用计算器
 * @access  Private
 */
router.post('/calculate', authenticate, costController.calculateCost);

/**
 * @route   GET /api/costs/analytics/:caseId
 * @desc    获取案件成本统计分析
 * @access  Private
 */
router.get('/analytics/:caseId', authenticate, costController.getCostAnalytics);

module.exports = router;
