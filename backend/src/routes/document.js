const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { authenticate } = require('../middleware/auth');

/**
 * @route   POST /api/documents/generate
 * @desc    智能生成文书
 * @access  Private
 */
router.post('/generate', authenticate, documentController.generateDocument);

/**
 * @route   POST /api/documents/review
 * @desc    智能审核文书
 * @access  Private
 */
router.post('/review', authenticate, documentController.reviewDocument);

/**
 * @route   POST /api/documents/save
 * @desc    保存文书
 * @access  Private
 */
router.post('/save', authenticate, documentController.saveDocument);

/**
 * @route   POST /api/documents/upload
 * @desc    上传文书文件
 * @access  Private
 */
router.post('/upload', authenticate, documentController.uploadDocument);

// 注意：/api/cases/:caseId/documents 路由在 case.js 中定义

/**
 * @route   GET /api/documents/:id
 * @desc    获取文书详情
 * @access  Private
 */
router.get('/:id', authenticate, documentController.getDocumentById);

/**
 * @route   DELETE /api/documents/:id
 * @desc    删除文书
 * @access  Private
 */
router.delete('/:id', authenticate, documentController.deleteDocument);

/**
 * @route   GET /api/documents/:id/download
 * @desc    下载文书
 * @access  Private
 */
router.get('/:id/download', authenticate, documentController.downloadDocument);

/**
 * @route   GET /api/documents/:id/preview
 * @desc    预览文书
 * @access  Private
 */
router.get('/:id/preview', authenticate, documentController.previewDocument);

module.exports = router;
