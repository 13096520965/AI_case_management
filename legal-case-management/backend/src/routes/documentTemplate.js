const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  generateFromTemplate,
  getDefaultTemplatesList
} = require('../controllers/documentController');

/**
 * @route   GET /api/document-templates/defaults
 * @desc    获取默认模板列表
 * @access  Private
 */
router.get('/defaults', authenticate, getDefaultTemplatesList);

/**
 * @route   POST /api/document-templates
 * @desc    创建文书模板
 * @access  Private
 */
router.post('/', authenticate, createTemplate);

/**
 * @route   GET /api/document-templates
 * @desc    获取所有文书模板
 * @access  Private
 */
router.get('/', authenticate, getTemplates);

/**
 * @route   GET /api/document-templates/:id
 * @desc    获取模板详情
 * @access  Private
 */
router.get('/:id', authenticate, getTemplateById);

/**
 * @route   PUT /api/document-templates/:id
 * @desc    更新文书模板
 * @access  Private
 */
router.put('/:id', authenticate, updateTemplate);

/**
 * @route   DELETE /api/document-templates/:id
 * @desc    删除文书模板
 * @access  Private
 */
router.delete('/:id', authenticate, deleteTemplate);

/**
 * @route   POST /api/document-templates/:id/generate
 * @desc    基于模板生成文书
 * @access  Private
 */
router.post('/:id/generate', authenticate, generateFromTemplate);

module.exports = router;
