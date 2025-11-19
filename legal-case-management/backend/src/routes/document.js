const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  upload,
  uploadDocument,
  getDocumentById,
  downloadDocument,
  deleteDocument,
  recognizeDocument,
  getOCRResult
} = require('../controllers/documentController');

/**
 * @route   POST /api/documents/upload
 * @desc    上传文书
 * @access  Private
 */
router.post('/upload', authenticate, upload.single('file'), uploadDocument);

/**
 * @route   GET /api/documents/:id
 * @desc    获取文书详情
 * @access  Private
 */
router.get('/:id', authenticate, getDocumentById);

/**
 * @route   GET /api/documents/:id/download
 * @desc    下载文书文件
 * @access  Private
 */
router.get('/:id/download', authenticate, downloadDocument);

/**
 * @route   DELETE /api/documents/:id
 * @desc    删除文书
 * @access  Private
 */
router.delete('/:id', authenticate, deleteDocument);

/**
 * @route   POST /api/documents/:id/ocr
 * @desc    对文书执行 OCR 识别
 * @access  Private
 */
router.post('/:id/ocr', authenticate, recognizeDocument);

/**
 * @route   GET /api/documents/:id/ocr
 * @desc    获取文书的 OCR 识别结果
 * @access  Private
 */
router.get('/:id/ocr', authenticate, getOCRResult);

module.exports = router;
