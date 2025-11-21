const { query, run, get } = require('../config/database');

/**
 * 获取所有文书模板
 * GET /api/document-templates
 */
exports.getTemplates = async (req, res) => {
  try {
    const { documentType } = req.query;
    
    let sql = `SELECT 
      id,
      template_name as name,
      document_type as documentType,
      content,
      variables,
      description,
      created_at as createdAt,
      updated_at as updatedAt
    FROM document_templates WHERE 1=1`;
    const params = [];
    
    if (documentType) {
      sql += ' AND document_type = ?';
      params.push(documentType);
    }
    
    sql += ' ORDER BY created_at DESC';
    
    const templates = await query(sql, params);
    
    res.json({
      data: templates
    });
  } catch (error) {
    console.error('获取模板列表错误:', error);
    res.status(500).json({
      error: {
        message: '获取模板列表失败',
        status: 500
      }
    });
  }
};

/**
 * 获取模板详情
 * GET /api/document-templates/:id
 */
exports.getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const template = await get(`SELECT 
      id,
      template_name as name,
      document_type as documentType,
      content,
      variables,
      description,
      created_at as createdAt,
      updated_at as updatedAt
    FROM document_templates WHERE id = ?`, [id]);
    
    if (!template) {
      return res.status(404).json({
        error: {
          message: '模板不存在',
          status: 404
        }
      });
    }
    
    res.json({
      data: template
    });
  } catch (error) {
    console.error('获取模板详情错误:', error);
    res.status(500).json({
      error: {
        message: '获取模板详情失败',
        status: 500
      }
    });
  }
};

/**
 * 创建文书模板
 * POST /api/document-templates
 */
exports.createTemplate = async (req, res) => {
  try {
    const { name, documentType, content, description } = req.body;
    
    if (!name || !documentType || !content) {
      return res.status(400).json({
        error: {
          message: '模板名称、文书类型和内容为必填项',
          status: 400
        }
      });
    }
    
    // 提取变量
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const variables = [];
    let match;
    while ((match = variableRegex.exec(content)) !== null) {
      if (!variables.includes(match[1].trim())) {
        variables.push(match[1].trim());
      }
    }
    
    const result = await run(
      `INSERT INTO document_templates (template_name, document_type, content, variables, description, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [name, documentType, content, JSON.stringify(variables), description || '']
    );
    
    res.status(201).json({
      message: '模板创建成功',
      data: {
        id: result.lastID
      }
    });
  } catch (error) {
    console.error('创建模板错误:', error);
    res.status(500).json({
      error: {
        message: '创建模板失败',
        status: 500
      }
    });
  }
};

/**
 * 更新文书模板
 * PUT /api/document-templates/:id
 */
exports.updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, documentType, content, description } = req.body;
    
    const template = await get('SELECT * FROM document_templates WHERE id = ?', [id]);
    
    if (!template) {
      return res.status(404).json({
        error: {
          message: '模板不存在',
          status: 404
        }
      });
    }
    
    // 提取变量
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const variables = [];
    let match;
    const contentToUse = content || template.content;
    while ((match = variableRegex.exec(contentToUse)) !== null) {
      if (!variables.includes(match[1].trim())) {
        variables.push(match[1].trim());
      }
    }
    
    await run(
      `UPDATE document_templates 
       SET template_name = ?, document_type = ?, content = ?, variables = ?, description = ?, updated_at = datetime('now')
       WHERE id = ?`,
      [
        name || template.template_name,
        documentType || template.document_type,
        content || template.content,
        JSON.stringify(variables),
        description !== undefined ? description : template.description,
        id
      ]
    );
    
    res.json({
      message: '模板更新成功'
    });
  } catch (error) {
    console.error('更新模板错误:', error);
    res.status(500).json({
      error: {
        message: '更新模板失败',
        status: 500
      }
    });
  }
};

/**
 * 删除文书模板
 * DELETE /api/document-templates/:id
 */
exports.deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await run('DELETE FROM document_templates WHERE id = ?', [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({
        error: {
          message: '模板不存在',
          status: 404
        }
      });
    }
    
    res.json({
      message: '模板删除成功'
    });
  } catch (error) {
    console.error('删除模板错误:', error);
    res.status(500).json({
      error: {
        message: '删除模板失败',
        status: 500
      }
    });
  }
};

/**
 * 基于模板生成文书
 * POST /api/document-templates/:id/generate
 */
exports.generateFromTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { caseId, variables } = req.body;
    
    const template = await get('SELECT * FROM document_templates WHERE id = ?', [id]);
    
    if (!template) {
      return res.status(404).json({
        error: {
          message: '模板不存在',
          status: 404
        }
      });
    }
    
    // 替换变量
    let content = template.content;
    if (variables) {
      Object.keys(variables).forEach(key => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        content = content.replace(regex, variables[key] || '');
      });
    }
    
    res.json({
      message: '文书生成成功',
      data: {
        content,
        templateName: template.name,
        documentType: template.document_type
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
 * 获取默认模板列表
 * GET /api/document-templates/defaults
 */
exports.getDefaultTemplatesList = async (req, res) => {
  try {
    const templates = await query(
      'SELECT id, name, document_type, description FROM document_templates ORDER BY document_type, name'
    );
    
    res.json({
      data: templates
    });
  } catch (error) {
    console.error('获取默认模板列表错误:', error);
    res.status(500).json({
      error: {
        message: '获取默认模板列表失败',
        status: 500
      }
    });
  }
};
