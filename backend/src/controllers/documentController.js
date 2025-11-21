const { query, run, get } = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { generateDocumentWithAI, reviewDocumentWithAI } = require('../services/aiService');

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/documents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 解决中文文件名乱码问题
    const originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型，仅支持 PDF、Word、TXT 格式'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
}).single('file');

/**
 * 上传文书
 * POST /api/documents/upload
 */
exports.uploadDocument = (req, res) => {
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        error: {
          message: err.message === 'File too large' ? '文件大小超过限制（最大50MB）' : err.message,
          status: 400
        }
      });
    } else if (err) {
      return res.status(400).json({
        error: {
          message: err.message,
          status: 400
        }
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: {
          message: '请选择要上传的文件',
          status: 400
        }
      });
    }

    try {
      const { case_id, document_type, description } = req.body;

      if (!case_id || !document_type) {
        // 删除已上传的文件
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          error: {
            message: '案件ID和文书类型为必填项',
            status: 400
          }
        });
      }

      // 解决中文文件名乱码问题
      const originalname = Buffer.from(req.file.originalname, 'latin1').toString('utf8');

      // 保存到数据库
      const result = await run(
        `INSERT INTO smart_documents (
          case_id, 
          document_type, 
          document_name, 
          file_name,
          file_path,
          file_size,
          content, 
          created_by, 
          created_at, 
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [
          case_id,
          document_type,
          originalname,
          req.file.filename,
          req.file.path,
          req.file.size,
          description || '',
          req.user?.id || 1
        ]
      );

      res.json({
        message: '文书上传成功',
        data: {
          id: result.lastID,
          fileName: originalname,
          fileSize: req.file.size
        }
      });
    } catch (error) {
      console.error('上传文书错误:', error);
      // 删除已上传的文件
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error('删除文件失败:', unlinkError);
        }
      }
      res.status(500).json({
        error: {
          message: '上传文书失败',
          status: 500
        }
      });
    }
  });
};

/**
 * 智能生成文书
 * POST /api/documents/generate
 */
exports.generateDocument = async (req, res) => {
  try {
    const { caseId, templateType, caseInfo, parties, extraInfo } = req.body;

    // 验证必填字段
    if (!caseId || !templateType) {
      return res.status(400).json({
        error: {
          message: '案件ID和模板类型为必填项',
          status: 400
        }
      });
    }

    // 根据模板类型生成文书内容
    const content = await generateDocumentContent(templateType, caseInfo, parties, extraInfo);

    res.json({
      message: '文书生成成功',
      data: {
        content,
        templateType,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('生成文书错误:', error);
    res.status(500).json({
      error: {
        message: '生成文书失败',
        status: 500
      }
    });
  }
};

/**
 * 智能审核文书
 * POST /api/documents/review
 */
exports.reviewDocument = async (req, res) => {
  try {
    const { caseId, content, options, caseInfo } = req.body;

    // 验证必填字段
    if (!content) {
      return res.status(400).json({
        error: {
          message: '文书内容不能为空',
          status: 400
        }
      });
    }

    // 执行智能审核
    const reviewResult = await performDocumentReview(content, options, caseInfo);

    res.json({
      message: '文书审核完成',
      data: reviewResult
    });
  } catch (error) {
    console.error('审核文书错误:', error);
    res.status(500).json({
      error: {
        message: '审核文书失败',
        status: 500
      }
    });
  }
};

/**
 * 保存文书
 * POST /api/documents/save
 */
exports.saveDocument = async (req, res) => {
  try {
    const { caseId, documentType, documentName, content } = req.body;

    // 验证必填字段
    if (!caseId || !documentName || !content) {
      return res.status(400).json({
        error: {
          message: '案件ID、文书名称和内容为必填项',
          status: 400
        }
      });
    }

    // 保存到数据库
    const result = await run(
      `INSERT INTO smart_documents (case_id, document_type, document_name, content, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [caseId, documentType, documentName, content, req.user?.id || 1]
    );

    res.json({
      message: '文书保存成功',
      data: {
        id: result.lastID
      }
    });
  } catch (error) {
    console.error('保存文书错误:', error);
    res.status(500).json({
      error: {
        message: '保存文书失败',
        status: 500
      }
    });
  }
};

/**
 * 获取案件文书列表
 * GET /api/cases/:caseId/documents
 */
exports.getDocumentsByCaseId = async (req, res) => {
  try {
    const { caseId } = req.params;

    const documents = await query(
      `SELECT d.*, u.real_name as creator_name
       FROM smart_documents d
       LEFT JOIN users u ON d.created_by = u.id
       WHERE d.case_id = ?
       ORDER BY d.created_at DESC`,
      [caseId]
    );

    res.json({
      data: {
        documents
      }
    });
  } catch (error) {
    console.error('获取文书列表错误:', error);
    res.status(500).json({
      error: {
        message: '获取文书列表失败',
        status: 500
      }
    });
  }
};

/**
 * 获取文书详情
 * GET /api/documents/:id
 */
exports.getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await get(
      `SELECT d.*, u.real_name as creator_name
       FROM smart_documents d
       LEFT JOIN users u ON d.created_by = u.id
       WHERE d.id = ?`,
      [id]
    );

    if (!document) {
      return res.status(404).json({
        error: {
          message: '文书不存在',
          status: 404
        }
      });
    }

    res.json({
      data: {
        document
      }
    });
  } catch (error) {
    console.error('获取文书详情错误:', error);
    res.status(500).json({
      error: {
        message: '获取文书详情失败',
        status: 500
      }
    });
  }
};

/**
 * 删除文书
 * DELETE /api/documents/:id
 */
exports.deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    // 先获取文书信息，以便删除文件
    const document = await get('SELECT * FROM smart_documents WHERE id = ?', [id]);

    if (!document) {
      return res.status(404).json({
        error: {
          message: '文书不存在',
          status: 404
        }
      });
    }

    // 删除数据库记录
    const result = await run('DELETE FROM smart_documents WHERE id = ?', [id]);

    // 如果有文件，删除文件
    if (document.file_path && fs.existsSync(document.file_path)) {
      try {
        fs.unlinkSync(document.file_path);
      } catch (fileError) {
        console.error('删除文件失败:', fileError);
      }
    }

    res.json({
      message: '文书删除成功'
    });
  } catch (error) {
    console.error('删除文书错误:', error);
    res.status(500).json({
      error: {
        message: '删除文书失败',
        status: 500
      }
    });
  }
};

/**
 * 下载文书
 * GET /api/documents/:id/download
 */
exports.downloadDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await get('SELECT * FROM smart_documents WHERE id = ?', [id]);

    if (!document) {
      return res.status(404).json({
        error: {
          message: '文书不存在',
          status: 404
        }
      });
    }

    // 如果是上传的文件，直接下载文件
    if (document.file_path && fs.existsSync(document.file_path)) {
      res.download(document.file_path, document.document_name, (err) => {
        if (err) {
          console.error('下载文件失败:', err);
          res.status(500).json({
            error: {
              message: '下载文件失败',
              status: 500
            }
          });
        }
      });
    } else if (document.content) {
      // 如果是智能生成的文书，生成文本文件下载
      const fileName = document.document_name + '.txt';
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
      res.send(document.content);
    } else {
      res.status(404).json({
        error: {
          message: '文书内容不存在',
          status: 404
        }
      });
    }
  } catch (error) {
    console.error('下载文书错误:', error);
    res.status(500).json({
      error: {
        message: '下载文书失败',
        status: 500
      }
    });
  }
};

/**
 * 预览文书
 * GET /api/documents/:id/preview
 */
exports.previewDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await get('SELECT * FROM smart_documents WHERE id = ?', [id]);

    if (!document) {
      return res.status(404).json({
        error: {
          message: '文书不存在',
          status: 404
        }
      });
    }

    // 如果是上传的文件
    if (document.file_path && fs.existsSync(document.file_path)) {
      const ext = path.extname(document.file_path).toLowerCase();
      
      // 只支持文本文件的预览
      if (ext === '.txt') {
        // 读取文本文件内容
        const content = fs.readFileSync(document.file_path, 'utf8');
        res.json({
          data: {
            id: document.id,
            documentName: document.document_name,
            documentType: document.document_type,
            content: content,
            fileType: 'text',
            createdAt: document.created_at
          }
        });
      } else {
        // 其他文件类型不支持预览
        return res.status(400).json({
          error: {
            message: '该文件类型不支持在线预览，请下载后查看',
            status: 400,
            fileType: ext
          }
        });
      }
    } else if (document.content) {
      // 如果是智能生成的文书，返回文本内容
      res.json({
        data: {
          id: document.id,
          documentName: document.document_name,
          documentType: document.document_type,
          content: document.content,
          createdAt: document.created_at
        }
      });
    } else {
      res.status(404).json({
        error: {
          message: '文书内容不存在',
          status: 404
        }
      });
    }
  } catch (error) {
    console.error('预览文书错误:', error);
    res.status(500).json({
      error: {
        message: '预览文书失败',
        status: 500
      }
    });
  }
};

/**
 * 生成文书内容（使用AI服务或模板）
 */
async function generateDocumentContent(templateType, caseInfo, parties, extraInfo) {
  // 尝试使用AI服务生成
  const aiResult = await generateDocumentWithAI(templateType, caseInfo, parties, extraInfo);
  
  // 如果AI服务返回结果，使用AI生成的内容
  if (aiResult) {
    console.log('使用AI服务生成文书');
    return aiResult;
  }
  
  // 否则使用模板生成（降级方案）
  console.log('使用模板生成文书');
  const templates = {
    complaint: generateComplaint,
    defense: generateDefense,
    agency_opinion: generateAgencyOpinion,
    case_report: generateCaseReport,
    evidence_list: generateEvidenceList,
    legal_opinion: generateLegalOpinion
  };

  const generator = templates[templateType];
  if (!generator) {
    throw new Error('不支持的文书类型');
  }

  return generator(caseInfo, parties, extraInfo);
}

/**
 * 生成起诉状
 */
function generateComplaint(caseInfo, parties, extraInfo) {
  const plaintiff = parties.find(p => p.party_type === '原告') || {};
  const defendant = parties.find(p => p.party_type === '被告') || {};

  return `民事起诉状

原告：${plaintiff.name || '___'}，${plaintiff.entity_type === '自然人' ? '身份证号：' + (plaintiff.id_number || '___') : '统一社会信用代码：' + (plaintiff.unified_credit_code || '___')}
联系电话：${plaintiff.contact_phone || '___'}
住所地：${plaintiff.address || '___'}

被告：${defendant.name || '___'}，${defendant.entity_type === '自然人' ? '身份证号：' + (defendant.id_number || '___') : '统一社会信用代码：' + (defendant.unified_credit_code || '___')}
联系电话：${defendant.contact_phone || '___'}
住所地：${defendant.address || '___'}

诉讼请求：
1. 请求依法判令被告${defendant.name || '___'}支付原告${plaintiff.name || '___'}款项人民币${(caseInfo.target_amount || 0).toLocaleString()}元；
2. 本案诉讼费用由被告承担。

事实与理由：
${caseInfo.case_cause || '___'}纠纷一案，原告与被告之间存在${caseInfo.case_cause || '___'}关系。${extraInfo.notes || '（此处应详细陈述案件事实和理由）'}

综上所述，原告认为被告的行为已严重侵害了原告的合法权益，为维护原告的合法权益，特依法向贵院提起诉讼，请求依法支持原告的诉讼请求。

此致
${caseInfo.court || '___人民法院'}

具状人（原告）：${plaintiff.name || '___'}
代理律师：${extraInfo.lawyer || '___'}
律师事务所：${extraInfo.lawFirm || '___'}

${new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}

附：
1. 本诉状副本___份；
2. 证据材料___份。`;
}

/**
 * 生成答辩状
 */
function generateDefense(caseInfo, parties, extraInfo) {
  const defendant = parties.find(p => p.party_type === '被告') || {};
  const plaintiff = parties.find(p => p.party_type === '原告') || {};

  return `民事答辩状

答辩人：${defendant.name || '___'}，${defendant.entity_type === '自然人' ? '身份证号：' + (defendant.id_number || '___') : '统一社会信用代码：' + (defendant.unified_credit_code || '___')}
联系电话：${defendant.contact_phone || '___'}
住所地：${defendant.address || '___'}

针对原告：${plaintiff.name || '___'}
案由：${caseInfo.case_cause || '___'}纠纷
案号：${caseInfo.case_number || caseInfo.internal_number || '___'}

答辩意见：
答辩人对原告的起诉不予认可，具体答辩意见如下：

一、原告的诉讼请求缺乏事实和法律依据
${extraInfo.notes || '（此处应详细陈述答辩理由）'}

二、答辩人依法不应承担相关责任
（此处应详细说明不承担责任的理由）

三、原告的诉讼请求应当依法驳回
综上所述，原告的诉讼请求缺乏事实和法律依据，请求贵院依法驳回原告的全部诉讼请求。

此致
${caseInfo.court || '___人民法院'}

答辩人：${defendant.name || '___'}
代理律师：${extraInfo.lawyer || '___'}
律师事务所：${extraInfo.lawFirm || '___'}

${new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}`;
}

/**
 * 生成代理词
 */
function generateAgencyOpinion(caseInfo, parties, extraInfo) {
  return `代理词

审判长、审判员：
受${parties[0]?.name || '___'}的委托，${extraInfo.lawFirm || '___律师事务所'}指派我担任其在${caseInfo.case_cause || '___'}纠纷一案中的诉讼代理人。现根据庭审查明的事实和相关法律规定，发表如下代理意见：

一、案件基本事实
${extraInfo.notes || '（此处应详细陈述案件事实）'}

二、法律分析
（此处应进行详细的法律分析）

三、代理意见
综上所述，我方认为${parties[0]?.name || '___'}的诉讼请求合法有据，请求法庭依法支持。

以上代理意见，请合议庭予以采纳。

代理人：${extraInfo.lawyer || '___'}
${extraInfo.lawFirm || '___'}

${new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}`;
}

/**
 * 生成案件汇报材料
 */
function generateCaseReport(caseInfo, parties, extraInfo) {
  return `案件汇报材料

案件编号：${caseInfo.internal_number || '___'}
案号：${caseInfo.case_number || '___'}
案件类型：${caseInfo.case_type || '___'}
案由：${caseInfo.case_cause || '___'}
受理法院：${caseInfo.court || '___'}
标的额：${(caseInfo.target_amount || 0).toLocaleString()}元
立案日期：${caseInfo.filing_date || '___'}

一、案件基本情况
${extraInfo.notes || '（此处应详细说明案件基本情况）'}

二、当事人情况
${parties.map((p, i) => `${i + 1}. ${p.party_type}：${p.name}，${p.entity_type}，联系电话：${p.contact_phone}`).join('\n')}

三、案件进展情况
（此处应说明案件当前进展）

四、存在的问题和风险
（此处应分析案件风险）

五、下一步工作计划
（此处应说明后续工作安排）

汇报人：${extraInfo.lawyer || '___'}
汇报日期：${new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}`;
}

/**
 * 生成证据清单
 */
function generateEvidenceList(caseInfo, parties, extraInfo) {
  return `证据清单

案号：${caseInfo.case_number || caseInfo.internal_number || '___'}
案由：${caseInfo.case_cause || '___'}纠纷
提交人：${parties[0]?.name || '___'}

序号 | 证据名称 | 证据来源 | 证明目的 | 页数 | 备注
-----|----------|----------|----------|------|------
1    | （待补充）| （待补充）| （待补充）| （待补充）| （待补充）
2    | （待补充）| （待补充）| （待补充）| （待补充）| （待补充）
3    | （待补充）| （待补充）| （待补充）| （待补充）| （待补充）

${extraInfo.notes || ''}

提交人：${parties[0]?.name || '___'}
代理律师：${extraInfo.lawyer || '___'}
提交日期：${new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}`;
}

/**
 * 生成法律意见书
 */
function generateLegalOpinion(caseInfo, parties, extraInfo) {
  return `法律意见书

致：${parties[0]?.name || '___'}

关于：${caseInfo.case_cause || '___'}纠纷的法律意见

${extraInfo.lawFirm || '___律师事务所'}接受您的委托，就${caseInfo.case_cause || '___'}纠纷一案进行法律分析，现出具法律意见如下：

一、案件基本情况
${extraInfo.notes || '（此处应详细说明案件情况）'}

二、法律分析
（此处应进行详细的法律分析）

三、风险提示
（此处应说明可能存在的法律风险）

四、法律建议
（此处应提出具体的法律建议）

以上意见，供参考。

${extraInfo.lawFirm || '___'}
律师：${extraInfo.lawyer || '___'}

${new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}`;
}

/**
 * 执行文书审核（使用AI服务或规则）
 */
async function performDocumentReview(content, options, caseInfo) {
  // 尝试使用AI服务审核
  const aiResult = await reviewDocumentWithAI(content, options, caseInfo);
  
  // 如果AI服务返回结果，使用AI审核结果
  if (aiResult) {
    console.log('使用AI服务审核文书');
    return aiResult;
  }
  
  // 否则使用规则审核（降级方案）
  console.log('使用规则审核文书');
  const issues = [];
  const suggestions = [];

  // 合规性检查
  if (options.includes('compliance')) {
    // 检查管辖法院
    if (caseInfo.court && !content.includes(caseInfo.court)) {
      issues.push({
        severity: 'critical',
        category: '合规性',
        title: '管辖法院信息缺失',
        location: '文书抬头',
        description: `文书中未包含受理法院"${caseInfo.court}"的信息`,
        suggestion: `请在文书中明确标注受理法院为"${caseInfo.court}"`,
        reference: '《民事诉讼法》第21条'
      });
    }

    // 检查案号
    if (caseInfo.case_number && !content.includes(caseInfo.case_number)) {
      issues.push({
        severity: 'warning',
        category: '合规性',
        title: '案号信息缺失',
        location: '文书标题',
        description: '文书中未包含案号信息',
        suggestion: `建议在文书中标注案号"${caseInfo.case_number}"`,
        reference: '法律文书规范要求'
      });
    }

    // 检查日期格式
    const datePattern = /\d{4}年\d{1,2}月\d{1,2}日/g;
    if (!datePattern.test(content)) {
      issues.push({
        severity: 'suggestion',
        category: '合规性',
        title: '日期格式不规范',
        location: '文书末尾',
        description: '文书中的日期格式不符合规范',
        suggestion: '建议使用"YYYY年MM月DD日"格式',
        reference: '法律文书格式规范'
      });
    }
  }

  // 逻辑性检查
  if (options.includes('logic')) {
    // 检查诉讼请求与事实理由的一致性
    if (content.includes('诉讼请求') && content.includes('事实与理由')) {
      const requestSection = content.split('诉讼请求')[1]?.split('事实与理由')[0] || '';
      const reasonSection = content.split('事实与理由')[1] || '';
      
      if (requestSection.length > 0 && reasonSection.length < 100) {
        issues.push({
          severity: 'warning',
          category: '逻辑性',
          title: '事实理由阐述不充分',
          location: '事实与理由部分',
          description: '事实与理由部分内容过于简单，可能无法充分支持诉讼请求',
          suggestion: '建议详细阐述案件事实和法律依据，增强说服力',
          reference: '法律文书写作规范'
        });
      }
    }

    // 检查逻辑连贯性
    if (content.includes('综上所述') && content.split('综上所述')[0].length < 200) {
      issues.push({
        severity: 'suggestion',
        category: '逻辑性',
        title: '论述不够充分',
        location: '全文',
        description: '在使用"综上所述"前，论述内容较少',
        suggestion: '建议在总结前增加更多的事实陈述和法律分析',
        reference: '法律文书写作技巧'
      });
    }
  }

  // 格式规范检查
  if (options.includes('format')) {
    // 检查标题
    if (!content.trim().startsWith('民事起诉状') && 
        !content.trim().startsWith('民事答辩状') &&
        !content.trim().startsWith('代理词') &&
        !content.trim().startsWith('案件汇报材料') &&
        !content.trim().startsWith('证据清单') &&
        !content.trim().startsWith('法律意见书')) {
      issues.push({
        severity: 'warning',
        category: '格式规范',
        title: '文书标题不规范',
        location: '文书开头',
        description: '文书缺少规范的标题',
        suggestion: '建议在文书开头添加规范的标题，如"民事起诉状"、"民事答辩状"等',
        reference: '法律文书格式规范'
      });
    }

    // 检查段落格式
    const lines = content.split('\n');
    if (lines.length < 5) {
      issues.push({
        severity: 'suggestion',
        category: '格式规范',
        title: '段落划分不清晰',
        location: '全文',
        description: '文书段落划分不够清晰，影响阅读',
        suggestion: '建议合理划分段落，使文书结构更加清晰',
        reference: '法律文书写作规范'
      });
    }
  }

  // 完整性检查
  if (options.includes('completeness')) {
    // 检查必要要素
    const requiredElements = ['原告', '被告', '诉讼请求', '事实与理由', '此致'];
    const missingElements = requiredElements.filter(elem => !content.includes(elem));
    
    if (missingElements.length > 0) {
      issues.push({
        severity: 'critical',
        category: '完整性',
        title: '文书要素不完整',
        location: '全文',
        description: `文书缺少以下必要要素：${missingElements.join('、')}`,
        suggestion: `请补充完整的文书要素：${missingElements.join('、')}`,
        reference: '法律文书基本要求'
      });
    }

    // 检查签名和日期
    if (!content.includes('具状人') && !content.includes('答辩人') && !content.includes('代理人')) {
      issues.push({
        severity: 'warning',
        category: '完整性',
        title: '缺少签名信息',
        location: '文书末尾',
        description: '文书末尾缺少具状人/答辩人/代理人签名',
        suggestion: '请在文书末尾添加签名信息',
        reference: '法律文书格式要求'
      });
    }
  }

  // 生成优化建议
  if (issues.length === 0) {
    suggestions.push({
      priority: 'low',
      title: '文书质量良好',
      content: '文书整体质量较好，未发现明显问题。建议在提交前再次仔细核对所有信息。'
    });
  } else {
    if (issues.filter(i => i.severity === 'critical').length > 0) {
      suggestions.push({
        priority: 'high',
        title: '立即修改严重问题',
        content: '文书存在严重问题，可能影响诉讼效果，建议立即修改后再提交。'
      });
    }
    
    suggestions.push({
      priority: 'medium',
      title: '完善事实陈述',
      content: '建议进一步完善事实陈述部分，增加具体细节和证据支持，提高文书的说服力。'
    });
    
    suggestions.push({
      priority: 'medium',
      title: '加强法律依据',
      content: '建议引用更多相关法律条文和司法解释，增强法律论证的权威性。'
    });
  }

  // 统计问题数量
  const criticalIssues = issues.filter(i => i.severity === 'critical').length;
  const warningIssues = issues.filter(i => i.severity === 'warning').length;
  const suggestionIssues = issues.filter(i => i.severity === 'suggestion').length;

  return {
    totalIssues: issues.length,
    criticalIssues,
    warningIssues,
    suggestionIssues,
    issues,
    suggestions,
    reviewedAt: new Date().toISOString()
  };
}

/**
 * 获取文书统计
 * GET /api/cases/:caseId/documents/statistics
 */
exports.getDocumentStatistics = async (req, res) => {
  try {
    const { caseId } = req.params;

    const stats = await query(
      `SELECT 
        document_type,
        COUNT(*) as count
       FROM smart_documents
       WHERE case_id = ?
       GROUP BY document_type`,
      [caseId]
    );

    const total = await get(
      'SELECT COUNT(*) as total FROM smart_documents WHERE case_id = ?',
      [caseId]
    );

    res.json({
      data: {
        total: total.total || 0,
        byType: stats
      }
    });
  } catch (error) {
    console.error('获取文书统计错误:', error);
    res.status(500).json({
      error: {
        message: '获取文书统计失败',
        status: 500
      }
    });
  }
};

module.exports = exports;
