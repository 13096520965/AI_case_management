const Evidence = require('../models/Evidence');
const EvidenceVersion = require('../models/EvidenceVersion');
const EvidenceOperationLog = require('../models/EvidenceOperationLog');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 配置 Multer 文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/evidence');
    // 确保目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名：时间戳-随机数-原始文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    const sanitizedBasename = basename.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5-]/g, '_');
    cb(null, `${uniqueSuffix}-${sanitizedBasename}${ext}`);
  }
});

// 文件过滤器 - 支持 PDF、图片、音频、视频格式
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    // PDF
    'application/pdf',
    // 图片
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/webp',
    // 音频
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/aac',
    'audio/m4a',
    // 视频
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-ms-wmv',
    'video/webm'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`不支持的文件类型: ${file.mimetype}。仅支持 PDF、图片、音频、视频格式。`), false);
  }
};

// 配置上传中间件 - 限制文件大小为 100MB
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

/**
 * 上传证据文件
 * @route   POST /api/evidence/upload
 * @access  Private
 */
const uploadEvidence = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请选择要上传的文件' });
    }

    const { case_id, category, tags } = req.body;

    if (!case_id) {
      // 删除已上传的文件
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: '案件 ID 不能为空' });
    }

    // 创建证据记录
    const evidenceData = {
      case_id: parseInt(case_id),
      file_name: req.file.originalname,
      file_type: req.file.mimetype,
      file_size: req.file.size,
      storage_path: req.file.path,
      category: category || '未分类',
      tags: tags || '',
      uploaded_by: req.username,
      version: 1
    };

    const evidenceId = await Evidence.create(evidenceData);
    const evidence = await Evidence.findById(evidenceId);

    res.status(201).json({
      message: '证据上传成功',
      evidence: evidence
    });
  } catch (error) {
    console.error('上传证据失败:', error);
    // 如果创建记录失败，删除已上传的文件
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: '上传证据失败: ' + error.message });
  }
};

module.exports = {
  upload,
  uploadEvidence
};

/**
 * 获取案件的证据列表
 * @route   GET /api/cases/:caseId/evidence
 * @access  Private
 */
const getEvidenceByCaseId = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { category, file_type } = req.query;

    const filters = {};
    if (category) filters.category = category;
    if (file_type) filters.file_type = file_type;

    const evidenceList = await Evidence.findByCaseId(parseInt(caseId), filters);

    res.json({
      count: evidenceList.length,
      evidence: evidenceList
    });
  } catch (error) {
    console.error('获取证据列表失败:', error);
    res.status(500).json({ error: '获取证据列表失败: ' + error.message });
  }
};

/**
 * 获取证据详情
 * @route   GET /api/evidence/:id
 * @access  Private
 */
const getEvidenceById = async (req, res) => {
  try {
    const { id } = req.params;
    const evidence = await Evidence.findById(parseInt(id));

    if (!evidence) {
      return res.status(404).json({ error: '证据不存在' });
    }

    res.json({ evidence });
  } catch (error) {
    console.error('获取证据详情失败:', error);
    res.status(500).json({ error: '获取证据详情失败: ' + error.message });
  }
};

/**
 * 下载证据文件
 * @route   GET /api/evidence/:id/download
 * @access  Private
 */
const downloadEvidence = async (req, res) => {
  try {
    const { id } = req.params;
    const evidence = await Evidence.findById(parseInt(id));

    if (!evidence) {
      return res.status(404).json({ error: '证据不存在' });
    }

    // 检查文件是否存在
    if (!fs.existsSync(evidence.storage_path)) {
      return res.status(404).json({ error: '证据文件不存在' });
    }

    // 设置响应头
    res.setHeader('Content-Type', evidence.file_type);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(evidence.file_name)}"`);
    res.setHeader('Content-Length', evidence.file_size);

    // 创建文件流并发送
    const fileStream = fs.createReadStream(evidence.storage_path);
    fileStream.pipe(res);
  } catch (error) {
    console.error('下载证据失败:', error);
    res.status(500).json({ error: '下载证据失败: ' + error.message });
  }
};

/**
 * 更新证据信息（分类、标签）
 * @route   PUT /api/evidence/:id
 * @access  Private
 */
const updateEvidence = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, tags } = req.body;

    const evidence = await Evidence.findById(parseInt(id));
    if (!evidence) {
      return res.status(404).json({ error: '证据不存在' });
    }

    const updateData = {};
    if (category !== undefined) updateData.category = category;
    if (tags !== undefined) updateData.tags = tags;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: '没有提供要更新的字段' });
    }

    await Evidence.update(parseInt(id), updateData);
    const updatedEvidence = await Evidence.findById(parseInt(id));

    res.json({
      message: '证据信息更新成功',
      evidence: updatedEvidence
    });
  } catch (error) {
    console.error('更新证据信息失败:', error);
    res.status(500).json({ error: '更新证据信息失败: ' + error.message });
  }
};

/**
 * 删除证据
 * @route   DELETE /api/evidence/:id
 * @access  Private
 */
const deleteEvidence = async (req, res) => {
  try {
    const { id } = req.params;
    const evidence = await Evidence.findById(parseInt(id));

    if (!evidence) {
      return res.status(404).json({ error: '证据不存在' });
    }

    // 删除文件
    if (fs.existsSync(evidence.storage_path)) {
      fs.unlinkSync(evidence.storage_path);
    }

    // 删除数据库记录
    await Evidence.delete(parseInt(id));

    res.json({ message: '证据删除成功' });
  } catch (error) {
    console.error('删除证据失败:', error);
    res.status(500).json({ error: '删除证据失败: ' + error.message });
  }
};

module.exports = {
  upload,
  uploadEvidence,
  getEvidenceByCaseId,
  getEvidenceById,
  downloadEvidence,
  updateEvidence,
  deleteEvidence
};

/**
 * 上传证据新版本
 * @route   POST /api/evidence/:id/version
 * @access  Private
 */
const uploadNewVersion = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请选择要上传的文件' });
    }

    const { id } = req.params;
    const evidence = await Evidence.findById(parseInt(id));

    if (!evidence) {
      // 删除已上传的文件
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: '证据不存在' });
    }

    // 保存当前版本到历史记录
    await EvidenceVersion.create({
      evidence_id: evidence.id,
      version: evidence.version,
      file_name: evidence.file_name,
      file_type: evidence.file_type,
      file_size: evidence.file_size,
      storage_path: evidence.storage_path,
      category: evidence.category,
      tags: evidence.tags,
      uploaded_by: evidence.uploaded_by
    });

    // 更新主记录为新版本
    const newVersion = evidence.version + 1;
    await Evidence.update(parseInt(id), {
      file_name: req.file.originalname,
      file_type: req.file.mimetype,
      file_size: req.file.size,
      storage_path: req.file.path,
      version: newVersion,
      uploaded_by: req.username
    });

    const updatedEvidence = await Evidence.findById(parseInt(id));

    res.status(201).json({
      message: '证据新版本上传成功',
      evidence: updatedEvidence
    });
  } catch (error) {
    console.error('上传证据新版本失败:', error);
    // 如果失败，删除已上传的文件
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: '上传证据新版本失败: ' + error.message });
  }
};

/**
 * 获取证据版本历史
 * @route   GET /api/evidence/:id/versions
 * @access  Private
 */
const getVersionHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const evidence = await Evidence.findById(parseInt(id));

    if (!evidence) {
      return res.status(404).json({ error: '证据不存在' });
    }

    const versions = await EvidenceVersion.findByEvidenceId(parseInt(id));

    // 包含当前版本
    const currentVersion = {
      id: evidence.id,
      evidence_id: evidence.id,
      version: evidence.version,
      file_name: evidence.file_name,
      file_type: evidence.file_type,
      file_size: evidence.file_size,
      storage_path: evidence.storage_path,
      category: evidence.category,
      tags: evidence.tags,
      uploaded_by: evidence.uploaded_by,
      uploaded_at: evidence.uploaded_at,
      is_current: true
    };

    res.json({
      current: currentVersion,
      history: versions,
      total_versions: versions.length + 1
    });
  } catch (error) {
    console.error('获取版本历史失败:', error);
    res.status(500).json({ error: '获取版本历史失败: ' + error.message });
  }
};

/**
 * 下载特定版本的证据
 * @route   GET /api/evidence/:id/versions/:version/download
 * @access  Private
 */
const downloadVersion = async (req, res) => {
  try {
    const { id, version } = req.params;
    const versionData = await EvidenceVersion.findByVersion(parseInt(id), parseInt(version));

    if (!versionData) {
      return res.status(404).json({ error: '指定版本不存在' });
    }

    // 检查文件是否存在
    if (!fs.existsSync(versionData.storage_path)) {
      return res.status(404).json({ error: '版本文件不存在' });
    }

    // 设置响应头
    res.setHeader('Content-Type', versionData.file_type);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(versionData.file_name)}"`);
    res.setHeader('Content-Length', versionData.file_size);

    // 创建文件流并发送
    const fileStream = fs.createReadStream(versionData.storage_path);
    fileStream.pipe(res);
  } catch (error) {
    console.error('下载版本失败:', error);
    res.status(500).json({ error: '下载版本失败: ' + error.message });
  }
};

module.exports = {
  upload,
  uploadEvidence,
  getEvidenceByCaseId,
  getEvidenceById,
  downloadEvidence,
  updateEvidence,
  deleteEvidence,
  uploadNewVersion,
  getVersionHistory,
  downloadVersion
};

/**
 * 获取证据操作日志
 * @route   GET /api/evidence/:id/logs
 * @access  Private
 */
const getOperationLogs = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 100, offset = 0 } = req.query;

    const evidence = await Evidence.findById(parseInt(id));
    if (!evidence) {
      return res.status(404).json({ error: '证据不存在' });
    }

    const logs = await EvidenceOperationLog.findByEvidenceId(
      parseInt(id),
      { limit: parseInt(limit), offset: parseInt(offset) }
    );

    const stats = await EvidenceOperationLog.getOperationStats(parseInt(id));

    res.json({
      evidence_id: parseInt(id),
      logs: logs,
      stats: stats,
      count: logs.length
    });
  } catch (error) {
    console.error('获取操作日志失败:', error);
    res.status(500).json({ error: '获取操作日志失败: ' + error.message });
  }
};

/**
 * 获取案件所有证据的操作日志
 * @route   GET /api/cases/:caseId/evidence/logs
 * @access  Private
 */
const getCaseEvidenceLogs = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { limit = 100, offset = 0 } = req.query;

    const logs = await EvidenceOperationLog.findByCaseId(
      parseInt(caseId),
      { limit: parseInt(limit), offset: parseInt(offset) }
    );

    res.json({
      case_id: parseInt(caseId),
      logs: logs,
      count: logs.length
    });
  } catch (error) {
    console.error('获取案件证据日志失败:', error);
    res.status(500).json({ error: '获取案件证据日志失败: ' + error.message });
  }
};

module.exports = {
  upload,
  uploadEvidence,
  getEvidenceByCaseId,
  getEvidenceById,
  downloadEvidence,
  updateEvidence,
  deleteEvidence,
  uploadNewVersion,
  getVersionHistory,
  downloadVersion,
  getOperationLogs,
  getCaseEvidenceLogs
};
