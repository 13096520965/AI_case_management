const { ProcessTemplate, ProcessTemplateNode } = require('../models/ProcessTemplate');
const ProcessTemplateService = require('../services/processTemplateService');
const enhancedScheduler = require('../services/notificationSchedulerEnhanced');

/**
 * 创建流程模板
 */
exports.createTemplate = async (req, res) => {
  try {
    const { template_name, case_type, description, is_default, nodes } = req.body;

    // 验证必填字段
    if (!template_name || !case_type) {
      return res.status(400).json({
        error: {
          message: '模板名称和案件类型为必填项',
          status: 400
        }
      });
    }

    // 创建模板
    const templateId = await ProcessTemplate.create({
      template_name,
      case_type,
      description,
      is_default: is_default || 0
    });

    // 如果提供了节点数据，创建节点
    if (nodes && Array.isArray(nodes) && nodes.length > 0) {
      const nodesWithTemplateId = nodes.map(node => ({
        ...node,
        template_id: templateId
      }));
      await ProcessTemplateNode.createBatch(nodesWithTemplateId);
    }

    // 如果设置为默认模板，更新其他模板
    if (is_default) {
      await ProcessTemplate.setDefault(templateId, case_type);
    }

    const newTemplate = await ProcessTemplateService.getTemplateWithNodes(templateId);

    res.status(201).json({
      message: '流程模板创建成功',
      data: {
        template: newTemplate
      }
    });
  } catch (error) {
    console.error('创建流程模板错误:', error);
    res.status(500).json({
      error: {
        message: '创建流程模板失败，请稍后重试',
        status: 500
      }
    });
  }
};

/**
 * 获取所有流程模板
 */
exports.getTemplates = async (req, res) => {
  try {
    const { case_type } = req.query;

    let templates;
    if (case_type) {
      templates = await ProcessTemplate.findByCaseType(case_type);
    } else {
      templates = await ProcessTemplate.findAll();
    }

    res.json({
      data: {
        templates
      }
    });
  } catch (error) {
    console.error('获取流程模板列表错误:', error);
    res.status(500).json({
      error: {
        message: '获取流程模板列表失败',
        status: 500
      }
    });
  }
};

/**
 * 获取流程模板详情
 */
exports.getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;

    const template = await ProcessTemplateService.getTemplateWithNodes(id);

    if (!template) {
      return res.status(404).json({
        error: {
          message: '流程模板不存在',
          status: 404
        }
      });
    }

    res.json({
      data: {
        template
      }
    });
  } catch (error) {
    console.error('获取流程模板详情错误:', error);
    res.status(500).json({
      error: {
        message: '获取流程模板详情失败',
        status: 500
      }
    });
  }
};

/**
 * 更新流程模板
 */
exports.updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { template_name, case_type, description, is_default, nodes } = req.body;

    // 检查模板是否存在
    const existingTemplate = await ProcessTemplate.findById(id);
    if (!existingTemplate) {
      return res.status(404).json({
        error: {
          message: '流程模板不存在',
          status: 404
        }
      });
    }

    // 更新模板基本信息
    const updateData = {};
    if (template_name !== undefined && template_name !== null) updateData.template_name = template_name;
    if (case_type !== undefined && case_type !== null) updateData.case_type = case_type;
    if (description !== undefined) updateData.description = description || null;
    if (is_default !== undefined && is_default !== null) updateData.is_default = is_default;

    if (Object.keys(updateData).length > 0) {
      await ProcessTemplate.update(id, updateData);
    }

    // 如果设置为默认模板，更新其他模板
    if (is_default) {
      const finalCaseType = case_type || existingTemplate.case_type;
      await ProcessTemplate.setDefault(id, finalCaseType);
    }

    // 如果提供了节点数据，更新节点
    if (nodes && Array.isArray(nodes)) {
      // 删除旧节点
      await ProcessTemplateNode.deleteByTemplateId(id);
      // 创建新节点
      if (nodes.length > 0) {
        const nodesWithTemplateId = nodes.map(node => ({
          ...node,
          template_id: id
        }));
        await ProcessTemplateNode.createBatch(nodesWithTemplateId);
      }
    }

    const updatedTemplate = await ProcessTemplateService.getTemplateWithNodes(id);

    res.json({
      message: '流程模板更新成功',
      data: {
        template: updatedTemplate
      }
    });
  } catch (error) {
    console.error('更新流程模板错误:', error);
    res.status(500).json({
      error: {
        message: '更新流程模板失败',
        status: 500
      }
    });
  }
};

/**
 * 删除流程模板
 */
exports.deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    // 检查模板是否存在
    const existingTemplate = await ProcessTemplate.findById(id);
    if (!existingTemplate) {
      return res.status(404).json({
        error: {
          message: '流程模板不存在',
          status: 404
        }
      });
    }

    // 删除模板（会级联删除节点）
    const changes = await ProcessTemplate.delete(id);

    if (changes === 0) {
      return res.status(400).json({
        error: {
          message: '删除失败',
          status: 400
        }
      });
    }

    res.json({
      message: '流程模板删除成功'
    });
  } catch (error) {
    console.error('删除流程模板错误:', error);
    res.status(500).json({
      error: {
        message: '删除流程模板失败',
        status: 500
      }
    });
  }
};

/**
 * 应用流程模板到案件
 */
exports.applyTemplateToCase = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { template_id, case_type } = req.body;

    if (!case_type && !template_id) {
      return res.status(400).json({
        error: {
          message: '必须提供案件类型或模板ID',
          status: 400
        }
      });
    }

    const nodes = await ProcessTemplateService.applyTemplateToCase(
      caseId,
      case_type,
      template_id
    );

    // 引入节点后触发提醒检查
    if (nodes && nodes.length > 0) {
      setImmediate(async () => {
        try {
          console.log(`[提醒触发] 应用模板到案件 ${caseId}，创建了 ${nodes.length} 个节点，触发提醒检查...`);
          await enhancedScheduler.checkNodeDeadlines();
          await enhancedScheduler.checkOverdueNodes();
        } catch (err) {
          console.error('[提醒触发] 检查失败:', err);
        }
      });
    }

    res.status(201).json({
      message: '流程模板应用成功',
      data: {
        nodes
      }
    });
  } catch (error) {
    console.error('应用流程模板错误:', error);
    res.status(500).json({
      error: {
        message: error.message || '应用流程模板失败',
        status: 500
      }
    });
  }
};

/**
 * 初始化默认模板
 */
exports.initializeDefaultTemplates = async (req, res) => {
  try {
    await ProcessTemplateService.initializeDefaultTemplates();

    res.json({
      message: '默认流程模板初始化成功'
    });
  } catch (error) {
    console.error('初始化默认模板错误:', error);
    res.status(500).json({
      error: {
        message: '初始化默认模板失败',
        status: 500
      }
    });
  }
};
