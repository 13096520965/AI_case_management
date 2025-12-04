const express = require('express');
const router = express.Router();
const partyController = require('../controllers/partyController');
const partyImportController = require('../controllers/partyImportController');
const { authenticate } = require('../middleware/auth');

/**
 * @route   POST /api/parties/import
 * @desc    批量导入主体信息
 * @access  Private
 * @body    file - Excel文件（必填）
 * @body    importMode - 导入模式（multi-sheet / single-sheet，默认multi-sheet）
 * @body    updateMode - 重复数据处理模式（skip / update，默认skip）
 */
router.post('/import', authenticate, partyImportController.upload.single('file'), partyImportController.importParties);

/**
 * @route   GET /api/parties/import/template
 * @desc    下载导入模板
 * @access  Private
 */
router.get('/import/template', authenticate, partyImportController.downloadTemplate);

/**
 * @route   GET /api/parties/suggestions
 * @desc    获取主体搜索建议
 * @access  Private
 * @query   keyword - 搜索关键词（必填）
 * @query   partyType - 主体类型（可选）
 */
router.get('/suggestions', authenticate, partyController.getPartySuggestions);

/**
 * @route   GET /api/parties/templates/:name
 * @desc    获取主体模板（用于快速录入）
 * @access  Private
 */
router.get('/templates/:name', authenticate, partyController.getPartyTemplate);

/**
 * @route   GET /api/parties/history
 * @desc    查询主体历史案件（按名称查询）
 * @access  Private
 * @query   name - 主体名称
 */
router.get('/history', authenticate, partyController.getPartyHistory);

/**
 * @route   GET /api/parties/:id/history
 * @desc    获取主体历史信息（包含基本信息和历史案件列表）
 * @access  Private
 */
router.get('/:id/history', authenticate, partyController.getPartyHistoryById);

/**
 * @route   PUT /api/parties/:id
 * @desc    更新诉讼主体
 * @access  Private
 */
router.put('/:id', authenticate, partyController.updateParty);

/**
 * @route   DELETE /api/parties/:id
 * @desc    删除诉讼主体
 * @access  Private
 */
router.delete('/:id', authenticate, partyController.deleteParty);

module.exports = router;

