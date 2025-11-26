const { ProcessTemplate, ProcessTemplateNode } = require('../models/ProcessTemplate');
const ProcessNode = require('../models/ProcessNode');
const { beijingNow, formatToBeijing } = require('../utils/time');

/**
 * 默认流程模板数据
 */
const DEFAULT_TEMPLATES = [
  {
    template_name: '民事案件标准流程',
    case_type: '民事',
    description: '民事案件标准诉讼流程',
    is_default: 1,
    nodes: [
      { node_type: '立案', node_name: '立案受理', deadline_days: 7, node_order: 1, description: '法院受理案件' },
      { node_type: '送达', node_name: '送达起诉状副本', deadline_days: 5, node_order: 2, description: '向被告送达起诉状副本' },
      { node_type: '答辩', node_name: '被告答辩', deadline_days: 15, node_order: 3, description: '被告提交答辩状' },
      { node_type: '举证', node_name: '举证期限', deadline_days: 30, node_order: 4, description: '双方提交证据材料' },
      { node_type: '开庭', node_name: '庭前准备', deadline_days: 3, node_order: 5, description: '庭前证据交换和调解' },
      { node_type: '开庭', node_name: '开庭审理', deadline_days: 0, node_order: 6, description: '法庭审理' },
      { node_type: '判决', node_name: '宣判', deadline_days: 30, node_order: 7, description: '法院作出判决' },
      { node_type: '送达', node_name: '送达判决书', deadline_days: 5, node_order: 8, description: '向当事人送达判决书' }
    ]
  },
  {
    template_name: '刑事案件标准流程',
    case_type: '刑事',
    description: '刑事案件标准诉讼流程',
    is_default: 1,
    nodes: [
      { node_type: '侦查', node_name: '立案侦查', deadline_days: 30, node_order: 1, description: '公安机关立案侦查' },
      { node_type: '侦查', node_name: '侦查终结', deadline_days: 60, node_order: 2, description: '侦查终结移送审查起诉' },
      { node_type: '审查起诉', node_name: '审查起诉', deadline_days: 30, node_order: 3, description: '检察院审查起诉' },
      { node_type: '审查起诉', node_name: '提起公诉', deadline_days: 7, node_order: 4, description: '检察院向法院提起公诉' },
      { node_type: '审判', node_name: '法院受理', deadline_days: 7, node_order: 5, description: '法院受理案件' },
      { node_type: '审判', node_name: '开庭审理', deadline_days: 30, node_order: 6, description: '法庭审理' },
      { node_type: '判决', node_name: '宣判', deadline_days: 30, node_order: 7, description: '法院作出判决' },
      { node_type: '执行', node_name: '判决执行', deadline_days: 10, node_order: 8, description: '判决生效执行' }
    ]
  },
  {
    template_name: '行政案件标准流程',
    case_type: '行政',
    description: '行政诉讼标准流程',
    is_default: 1,
    nodes: [
      { node_type: '立案', node_name: '立案审查', deadline_days: 7, node_order: 1, description: '法院审查是否受理' },
      { node_type: '立案', node_name: '立案受理', deadline_days: 3, node_order: 2, description: '法院受理案件' },
      { node_type: '送达', node_name: '送达起诉状副本', deadline_days: 5, node_order: 3, description: '向被告送达起诉状副本' },
      { node_type: '答辩', node_name: '被告答辩', deadline_days: 15, node_order: 4, description: '被告提交答辩状和证据' },
      { node_type: '举证', node_name: '举证期限', deadline_days: 30, node_order: 5, description: '双方提交证据材料' },
      { node_type: '开庭', node_name: '开庭审理', deadline_days: 0, node_order: 6, description: '法庭审理' },
      { node_type: '判决', node_name: '宣判', deadline_days: 45, node_order: 7, description: '法院作出判决' },
      { node_type: '送达', node_name: '送达判决书', deadline_days: 10, node_order: 8, description: '向当事人送达判决书' }
    ]
  },
  {
    template_name: '劳动仲裁标准流程',
    case_type: '劳动仲裁',
    description: '劳动争议仲裁标准流程',
    is_default: 1,
    nodes: [
      { node_type: '申请', node_name: '提交仲裁申请', deadline_days: 1, node_order: 1, description: '向仲裁委提交申请' },
      { node_type: '受理', node_name: '仲裁受理', deadline_days: 5, node_order: 2, description: '仲裁委受理案件' },
      { node_type: '送达', node_name: '送达申请书副本', deadline_days: 5, node_order: 3, description: '向被申请人送达申请书副本' },
      { node_type: '答辩', node_name: '被申请人答辩', deadline_days: 10, node_order: 4, description: '被申请人提交答辩' },
      { node_type: '开庭', node_name: '开庭审理', deadline_days: 15, node_order: 5, description: '仲裁庭审理' },
      { node_type: '调解', node_name: '调解', deadline_days: 7, node_order: 6, description: '仲裁庭组织调解' },
      { node_type: '裁决', node_name: '作出裁决', deadline_days: 30, node_order: 7, description: '仲裁委作出裁决' },
      { node_type: '送达', node_name: '送达裁决书', deadline_days: 5, node_order: 8, description: '向当事人送达裁决书' }
    ]
  }
];

/**
 * 流程模板服务
 */
class ProcessTemplateService {
  /**
   * 初始化默认模板
   * @returns {Promise<void>}
   */
  static async initializeDefaultTemplates() {
    try {
      // 检查是否已有模板
      const existingTemplates = await ProcessTemplate.findAll();
      if (existingTemplates.length > 0) {
        console.log('默认流程模板已存在，跳过初始化');
        return;
      }

      // 创建默认模板
      for (const template of DEFAULT_TEMPLATES) {
        const { nodes, ...templateData } = template;
        const templateId = await ProcessTemplate.create(templateData);
        
        // 创建模板节点
        const nodesWithTemplateId = nodes.map(node => ({
          ...node,
          template_id: templateId
        }));
        await ProcessTemplateNode.createBatch(nodesWithTemplateId);
        
        console.log(`创建默认模板: ${template.template_name}`);
      }

      console.log('默认流程模板初始化完成');
    } catch (error) {
      console.error('初始化默认模板失败:', error);
      throw error;
    }
  }

  /**
   * 根据案件类型应用流程模板
   * @param {number} caseId - 案件 ID
   * @param {string} caseType - 案件类型
   * @param {number} templateId - 模板 ID（可选，不传则使用默认模板）
   * @returns {Promise<Array>} 创建的节点列表
   */
  static async applyTemplateToCase(caseId, caseType, templateId = null) {
    try {
      let template;
      
      if (templateId) {
        // 使用指定模板
        template = await ProcessTemplate.findById(templateId);
      } else {
        // 使用默认模板
        template = await ProcessTemplate.findDefaultByCaseType(caseType);
      }

      if (!template) {
        throw new Error(`未找到案件类型 "${caseType}" 的流程模板`);
      }

      // 获取模板节点
      const templateNodes = await ProcessTemplateNode.findByTemplateId(template.id);

      if (templateNodes.length === 0) {
        throw new Error('模板中没有定义节点');
      }

      // 创建案件流程节点
    const createdNodes = [];
    const currentDate = new Date();

      for (let i = 0; i < templateNodes.length; i++) {
        const templateNode = templateNodes[i];
        
        // 计算截止日期
        let deadline = null;
        if (templateNode.deadline_days > 0) {
          deadline = new Date(currentDate);
          deadline.setDate(deadline.getDate() + templateNode.deadline_days);
        }

        // 智能设置节点状态
        // 第一个节点设为进行中，其他节点设为待处理
        let status = 'pending';
        let startTime = null;
        
        if (i === 0) {
          // 第一个节点自动开始
          status = 'in_progress';
          startTime = formatToBeijing(currentDate);
        }

        const nodeData = {
          case_id: caseId,
          node_type: templateNode.node_type,
          node_name: templateNode.node_name,
          start_time: startTime,
          deadline: deadline ? formatToBeijing(deadline) : null,
          status: status,
          node_order: templateNode.node_order,
          progress: templateNode.description
        };

        const nodeId = await ProcessNode.create(nodeData);
        const newNode = await ProcessNode.findById(nodeId);
        createdNodes.push(newNode);
      }

      return createdNodes;
    } catch (error) {
      console.error('应用流程模板失败:', error);
      throw error;
    }
  }

  /**
   * 获取模板详情（包含节点）
   * @param {number} templateId - 模板 ID
   * @returns {Promise<Object>} 模板详情
   */
  static async getTemplateWithNodes(templateId) {
    const template = await ProcessTemplate.findById(templateId);
    if (!template) {
      return null;
    }

    const nodes = await ProcessTemplateNode.findByTemplateId(templateId);
    return {
      ...template,
      nodes
    };
  }
}

module.exports = ProcessTemplateService;
