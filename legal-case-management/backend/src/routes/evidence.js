const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { logEvidenceOperation } = require('../middleware/evidenceLogger');
const {
  upload,
  uploadEvidence,
  getEvidenceById,
  downloadEvidence,
  updateEvidence,
  deleteEvidence,
  uploadNewVersion,
  getVersionHistory,
  downloadVersion,
  getOperationLogs
} = require('../controllers/evidenceController');

/**
 * @route   POST /api/evidence/upload
 * @desc    上传证据文件（接收线上文件URL）
 * @access  Private
 */
// 使用 upload.any() 以兼容前端只传 form 字段(storage_path)且不上传文件的场景
router.post('/upload', authenticate, upload.any(), uploadEvidence);

/**
 * @route   GET /api/evidence/:id
 * @desc    获取证据详情
 * @access  Private
 */
router.get('/:id', authenticate, logEvidenceOperation('view'), getEvidenceById);

/**
 * @route   GET /api/evidence/:id/download
 * @desc    下载证据文件
 * @access  Private
 */
router.get('/:id/download', authenticate, logEvidenceOperation('download'), downloadEvidence);

/**
 * @route   PUT /api/evidence/:id
 * @desc    更新证据信息（分类、标签）
 * @access  Private
 */
router.put('/:id', authenticate, logEvidenceOperation('update'), updateEvidence);

/**
 * @route   DELETE /api/evidence/:id
 * @desc    删除证据
 * @access  Private
 */
router.delete('/:id', authenticate, logEvidenceOperation('delete'), deleteEvidence);

/**
 * @route   POST /api/evidence/:id/version
 * @desc    上传证据新版本
 * @access  Private
 */
// 使用 upload.any() 以兼容没有文件字段但仍能解析表单的情况
router.post('/:id/version', authenticate, upload.any(), logEvidenceOperation('upload_version'), uploadNewVersion);

/**
 * @route   GET /api/evidence/:id/versions
 * @desc    获取证据版本历史
 * @access  Private
 */
router.get('/:id/versions', authenticate, getVersionHistory);

/**
 * @route   GET /api/evidence/:id/versions/:version/download
 * @desc    下载特定版本的证据
 * @access  Private
 */
router.get('/:id/versions/:version/download', authenticate, logEvidenceOperation('download_version'), downloadVersion);

/**
 * @route   GET /api/evidence/:id/logs
 * @desc    获取证据操作日志
 * @access  Private
 */
router.get('/:id/logs', authenticate, getOperationLogs);

module.exports = router;
