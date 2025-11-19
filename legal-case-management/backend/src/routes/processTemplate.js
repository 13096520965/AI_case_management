const express = require('express');
const router = express.Router();
const processTemplateController = require('../controllers/processTemplateController');
const { authenticate } = require('../middleware/auth');

/**
 * @route   POST /api/templates
 * @desc    创建流程模板
 * @access  Private
 */
router.post('/', authenticate, processTemplateController.createTemplate);

/**
 * @route   GET /api/templates
 * @desc    获取所有流程模板
 * @access  Private
 * @query   case_type - 案件类型（可选）
 */
router.get('/', authenticate, processTemplateController.getTemplates);

/**
 * @route   GET /api/templates/:id
 * @desc    获取流程模板详情
 * @access  Private
 */
router.get('/:id', authenticate, processTemplateController.getTemplateById);

/**
 * @route   PUT /api/templates/:id
 * @desc    更新流程模板
 * @access  Private
 */
router.put('/:id', authenticate, processTemplateController.updateTemplate);

/**
 * @route   DELETE /api/templates/:id
 * @desc    删除流程模板
 * @access  Private
 */
router.delete('/:id', authenticate, processTemplateController.deleteTemplate);

/**
 * @route   POST /api/templates/initialize
 * @desc    初始化默认流程模板
 * @access  Private
 */
router.post('/initialize', authenticate, processTemplateController.initializeDefaultTemplates);

/**
 * @route   POST /api/templates/apply/:caseId
 * @desc    应用流程模板到案件
 * @access  Private
 */
router.post('/apply/:caseId', authenticate, processTemplateController.applyTemplateToCase);

module.exports = router;
