const Document = require('../models/Document');
const DocumentTemplate = require('../models/DocumentTemplate');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { performOCR, extractKeyInformation } = require('../services/ocrService');
const { generateDocument, getDefaultTemplates } = require('../services/documentTemplateService');

/**
 * 自动识别文书类型
 * @param {string} fileName - 文件名
 * @returns {string} 文书类型
 */
const identifyDocumentType = (fileName) => {
  const lowerFileName = fileName.toLowerCase();
  
  // 定义文书类型关键词映射
  const typeKeywords = {
    '起诉状': ['起诉状', '诉状', '起诉书'],
    '答辩状': ['答辩状', '答辩书'],
    '上诉状': ['上诉状', '上诉书'],
    '申请书': ['申请书', '申请'],
    '判决书': ['判决书', '判决'],
    '裁定书': ['裁定书', '裁定'],
    '调解书': ['调解书', '调解'],
    '决定书': ['决定书', '决定'],
    '通知书': ['通知书', '通知'],
    '传票': ['传票'],
    '证据清单': ['证据清单', '证据目录'],
    '代理词': ['代理词'],
    '辩护词': ['辩护词'],
    '委托书': ['委托书', '授权委托书'],
    '合同': ['合同', '协议'],
    '证明': ['证明', '证明书'],
    '鉴定意见': ['鉴定意见', '鉴定书', '鉴定报告'],
    '笔录': ['笔录', '询问笔录', '调查笔录']
  };
  
  // 遍历关键词映射，匹配文件名
  for (const [type, keywords] of Object.entries(typeKeywords)) {
    for (const keyword of keywords) {
      if (lowerFileName.includes(keyword)) {
        return type;
      }
    }
  }
  
  return '其他';
};

// 配置 Multer 文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/documents');
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

// 文件过滤器 - 支持常见文书格式
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'text/plain'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`不支持的文件类型: ${file.mimetype}。仅支持 PDF、Word、Excel、图片、文本格式。`), false);
  }
};

// 配置上传中间件 - 限制文件大小为 50MB
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

/**
 * 上传文书
 * @route   POST /api/documents/upload
 * @access  Private
 */
const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请选择要上传的文件' });
    }

    const { case_id, document_type } = req.body;

    if (!case_id) {
      // 删除已上传的文件
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: '案件 ID 不能为空' });
    }

    // 自动识别文书类型（如果未指定）
    const finalDocumentType = document_type || identifyDocumentType(req.file.originalname);

    // 创建文书记录
    const documentData = {
      case_id: parseInt(case_id),
      document_type: finalDocumentType,
      file_name: req.file.originalname,
      storage_path: req.file.path,
      extracted_content: null
    };

    const documentId = await Document.create(documentData);
    const document = await Document.findById(documentId);

    res.status(201).json({
      message: '文书上传成功',
      document: document
    });
  } catch (error) {
    console.error('上传文书失败:', error);
    // 如果创建记录失败，删除已上传的文件
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: '上传文书失败: ' + error.message });
  }
};

/**
 * 获取案件的文书列表
 * @route   GET /api/cases/:caseId/documents
 * @access  Private
 */
const getDocumentsByCaseId = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { document_type } = req.query;

    const documents = await Document.findByCaseId(
      parseInt(caseId),
      document_type || null
    );

    res.json({
      count: documents.length,
      documents: documents
    });
  } catch (error) {
    console.error('获取文书列表失败:', error);
    res.status(500).json({ error: '获取文书列表失败: ' + error.message });
  }
};

/**
 * 获取文书详情
 * @route   GET /api/documents/:id
 * @access  Private
 */
const getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await Document.findById(parseInt(id));

    if (!document) {
      return res.status(404).json({ error: '文书不存在' });
    }

    res.json({ document });
  } catch (error) {
    console.error('获取文书详情失败:', error);
    res.status(500).json({ error: '获取文书详情失败: ' + error.message });
  }
};

/**
 * 下载文书文件
 * @route   GET /api/documents/:id/download
 * @access  Private
 */
const downloadDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await Document.findById(parseInt(id));

    if (!document) {
      return res.status(404).json({ error: '文书不存在' });
    }

    // 检查文件是否存在
    if (!fs.existsSync(document.storage_path)) {
      return res.status(404).json({ error: '文书文件不存在' });
    }

    // 获取文件信息
    const stats = fs.statSync(document.storage_path);
    const ext = path.extname(document.file_name).toLowerCase();
    
    // 根据文件扩展名设置 Content-Type
    let contentType = 'application/octet-stream';
    if (ext === '.pdf') contentType = 'application/pdf';
    else if (ext === '.doc') contentType = 'application/msword';
    else if (ext === '.docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    else if (ext === '.xls') contentType = 'application/vnd.ms-excel';
    else if (ext === '.xlsx') contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    else if (['.jpg', '.jpeg'].includes(ext)) contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.txt') contentType = 'text/plain';

    // 设置响应头
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(document.file_name)}"`);
    res.setHeader('Content-Length', stats.size);

    // 创建文件流并发送
    const fileStream = fs.createReadStream(document.storage_path);
    fileStream.pipe(res);
  } catch (error) {
    console.error('下载文书失败:', error);
    res.status(500).json({ error: '下载文书失败: ' + error.message });
  }
};

/**
 * 删除文书
 * @route   DELETE /api/documents/:id
 * @access  Private
 */
const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await Document.findById(parseInt(id));

    if (!document) {
      return res.status(404).json({ error: '文书不存在' });
    }

    // 删除文件
    if (fs.existsSync(document.storage_path)) {
      fs.unlinkSync(document.storage_path);
    }

    // 删除数据库记录
    await Document.delete(parseInt(id));

    res.json({ message: '文书删除成功' });
  } catch (error) {
    console.error('删除文书失败:', error);
    res.status(500).json({ error: '删除文书失败: ' + error.message });
  }
};

/**
 * 获取案件文书分类统计
 * @route   GET /api/cases/:caseId/documents/statistics
 * @access  Private
 */
const getDocumentStatistics = async (req, res) => {
  try {
    const { caseId } = req.params;
    const documents = await Document.findByCaseId(parseInt(caseId));

    // 按类型统计
    const statistics = {};
    documents.forEach(doc => {
      const type = doc.document_type || '其他';
      if (!statistics[type]) {
        statistics[type] = {
          count: 0,
          documents: []
        };
      }
      statistics[type].count++;
      statistics[type].documents.push({
        id: doc.id,
        file_name: doc.file_name,
        uploaded_at: doc.uploaded_at
      });
    });

    res.json({
      case_id: parseInt(caseId),
      total_count: documents.length,
      statistics: statistics
    });
  } catch (error) {
    console.error('获取文书统计失败:', error);
    res.status(500).json({ error: '获取文书统计失败: ' + error.message });
  }
};

/**
 * 对文书执行 OCR 识别
 * @route   POST /api/documents/:id/ocr
 * @access  Private
 */
const recognizeDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await Document.findById(parseInt(id));

    if (!document) {
      return res.status(404).json({ error: '文书不存在' });
    }

    // 检查文件是否存在
    if (!fs.existsSync(document.storage_path)) {
      return res.status(404).json({ error: '文书文件不存在' });
    }

    // 执行 OCR 识别（当前为模拟实现）
    const ocrResult = await performOCR(document.storage_path, document.document_type);

    // 提取关键信息
    const keyInfo = extractKeyInformation(ocrResult.extracted_data, document.document_type);

    // 将识别结果保存到数据库
    const extractedContent = JSON.stringify(ocrResult.extracted_data);
    await Document.update(parseInt(id), { extracted_content: extractedContent });

    res.json({
      message: 'OCR识别完成',
      document_id: parseInt(id),
      ocr_result: ocrResult,
      key_information: keyInfo
    });
  } catch (error) {
    console.error('OCR识别失败:', error);
    res.status(500).json({ error: 'OCR识别失败: ' + error.message });
  }
};

/**
 * 获取文书的 OCR 识别结果
 * @route   GET /api/documents/:id/ocr
 * @access  Private
 */
const getOCRResult = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await Document.findById(parseInt(id));

    if (!document) {
      return res.status(404).json({ error: '文书不存在' });
    }

    if (!document.extracted_content) {
      return res.status(404).json({ 
        error: '该文书尚未进行OCR识别',
        suggestion: '请先调用 POST /api/documents/:id/ocr 进行识别'
      });
    }

    // 解析识别结果
    const extractedData = JSON.parse(document.extracted_content);
    const keyInfo = extractKeyInformation(extractedData, document.document_type);

    res.json({
      document_id: parseInt(id),
      document_type: document.document_type,
      file_name: document.file_name,
      extracted_data: extractedData,
      key_information: keyInfo
    });
  } catch (error) {
    console.error('获取OCR结果失败:', error);
    res.status(500).json({ error: '获取OCR结果失败: ' + error.message });
  }
};

/**
 * 创建文书模板
 * @route   POST /api/document-templates
 * @access  Private
 */
const createTemplate = async (req, res) => {
  try {
    const { template_name, document_type, content, variables, description } = req.body;

    if (!template_name || !document_type || !content) {
      return res.status(400).json({ error: '模板名称、文书类型和内容不能为空' });
    }

    const templateData = {
      template_name,
      document_type,
      content,
      variables: variables || [],
      description
    };

    const templateId = await DocumentTemplate.create(templateData);
    const template = await DocumentTemplate.findById(templateId);

    res.status(201).json({
      message: '模板创建成功',
      template: template
    });
  } catch (error) {
    console.error('创建模板失败:', error);
    res.status(500).json({ error: '创建模板失败: ' + error.message });
  }
};

/**
 * 获取所有文书模板
 * @route   GET /api/document-templates
 * @access  Private
 */
const getTemplates = async (req, res) => {
  try {
    const { document_type } = req.query;
    const templates = await DocumentTemplate.findAll(document_type || null);

    res.json({
      count: templates.length,
      templates: templates
    });
  } catch (error) {
    console.error('获取模板列表失败:', error);
    res.status(500).json({ error: '获取模板列表失败: ' + error.message });
  }
};

/**
 * 获取模板详情
 * @route   GET /api/document-templates/:id
 * @access  Private
 */
const getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;
    const template = await DocumentTemplate.findById(parseInt(id));

    if (!template) {
      return res.status(404).json({ error: '模板不存在' });
    }

    res.json({ template });
  } catch (error) {
    console.error('获取模板详情失败:', error);
    res.status(500).json({ error: '获取模板详情失败: ' + error.message });
  }
};

/**
 * 更新文书模板
 * @route   PUT /api/document-templates/:id
 * @access  Private
 */
const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { template_name, document_type, content, variables, description } = req.body;

    const template = await DocumentTemplate.findById(parseInt(id));
    if (!template) {
      return res.status(404).json({ error: '模板不存在' });
    }

    const updateData = {};
    if (template_name !== undefined) updateData.template_name = template_name;
    if (document_type !== undefined) updateData.document_type = document_type;
    if (content !== undefined) updateData.content = content;
    if (variables !== undefined) updateData.variables = variables;
    if (description !== undefined) updateData.description = description;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: '没有提供要更新的字段' });
    }

    await DocumentTemplate.update(parseInt(id), updateData);
    const updatedTemplate = await DocumentTemplate.findById(parseInt(id));

    res.json({
      message: '模板更新成功',
      template: updatedTemplate
    });
  } catch (error) {
    console.error('更新模板失败:', error);
    res.status(500).json({ error: '更新模板失败: ' + error.message });
  }
};

/**
 * 删除文书模板
 * @route   DELETE /api/document-templates/:id
 * @access  Private
 */
const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const template = await DocumentTemplate.findById(parseInt(id));

    if (!template) {
      return res.status(404).json({ error: '模板不存在' });
    }

    await DocumentTemplate.delete(parseInt(id));

    res.json({ message: '模板删除成功' });
  } catch (error) {
    console.error('删除模板失败:', error);
    res.status(500).json({ error: '删除模板失败: ' + error.message });
  }
};

/**
 * 基于模板生成文书
 * @route   POST /api/document-templates/:id/generate
 * @access  Private
 */
const generateFromTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const generatedDoc = await generateDocument(parseInt(id), data);

    res.json({
      message: '文书生成成功',
      document: generatedDoc
    });
  } catch (error) {
    console.error('生成文书失败:', error);
    res.status(500).json({ error: '生成文书失败: ' + error.message });
  }
};

/**
 * 获取默认模板列表
 * @route   GET /api/document-templates/defaults
 * @access  Private
 */
const getDefaultTemplatesList = async (req, res) => {
  try {
    const defaults = getDefaultTemplates();
    res.json({
      count: defaults.length,
      templates: defaults
    });
  } catch (error) {
    console.error('获取默认模板失败:', error);
    res.status(500).json({ error: '获取默认模板失败: ' + error.message });
  }
};

module.exports = {
  upload,
  uploadDocument,
  getDocumentsByCaseId,
  getDocumentById,
  downloadDocument,
  deleteDocument,
  getDocumentStatistics,
  recognizeDocument,
  getOCRResult,
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  generateFromTemplate,
  getDefaultTemplatesList
};
