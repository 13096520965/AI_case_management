const KnowledgeModel = require('../models/knowledgeModel');

/**
 * 知识库控制器
 * 处理案例知识库相关的 HTTP 请求
 */

/**
 * 获取知识列表（支持分页和筛选）
 */
exports.getList = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      case_cause,
      dispute_focus,
      keywords,
      tags,
      case_result
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      case_cause,
      dispute_focus,
      keywords,
      tags,
      case_result
    };

    const knowledge = await KnowledgeModel.findAll(options);
    const total = await KnowledgeModel.count({
      case_cause,
      dispute_focus,
      keywords,
      tags,
      case_result
    });

    res.json({
      data: {
        knowledge,
        pagination: {
          page: options.page,
          limit: options.limit,
          total,
          totalPages: Math.ceil(total / options.limit)
        }
      }
    });
  } catch (error) {
    console.error('获取知识列表错误:', error);
    res.status(500).json({
      error: {
        message: '获取知识列表失败',
        status: 500
      }
    });
  }
};

/**
 * 创建知识条目
 */
exports.create = async (req, res) => {
  try {
    const knowledgeData = req.body;

    // 验证必填字段
    if (!knowledgeData.case_cause || !knowledgeData.dispute_focus) {
      return res.status(400).json({
        error: {
          message: '案由和争议焦点为必填项',
          status: 400
        }
      });
    }

    const knowledgeId = await KnowledgeModel.create(knowledgeData);
    const newKnowledge = await KnowledgeModel.findById(knowledgeId);

    res.status(201).json({
      message: '知识条目创建成功',
      data: {
        knowledge: newKnowledge
      }
    });
  } catch (error) {
    console.error('创建知识条目错误:', error);
    res.status(500).json({
      error: {
        message: '创建知识条目失败，请稍后重试',
        status: 500
      }
    });
  }
};

/**
 * 获取知识详情
 */
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const knowledge = await KnowledgeModel.findById(id);

    if (!knowledge) {
      return res.status(404).json({
        error: {
          message: '知识条目不存在',
          status: 404
        }
      });
    }

    res.json({
      data: {
        knowledge
      }
    });
  } catch (error) {
    console.error('获取知识详情错误:', error);
    res.status(500).json({
      error: {
        message: '获取知识详情失败',
        status: 500
      }
    });
  }
};

/**
 * 更新知识条目
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // 检查知识条目是否存在
    const existingKnowledge = await KnowledgeModel.findById(id);
    if (!existingKnowledge) {
      return res.status(404).json({
        error: {
          message: '知识条目不存在',
          status: 404
        }
      });
    }

    const changes = await KnowledgeModel.update(id, updateData);

    if (changes === 0) {
      return res.status(400).json({
        error: {
          message: '没有数据被更新',
          status: 400
        }
      });
    }

    const updatedKnowledge = await KnowledgeModel.findById(id);

    res.json({
      message: '知识条目更新成功',
      data: {
        knowledge: updatedKnowledge
      }
    });
  } catch (error) {
    console.error('更新知识条目错误:', error);
    res.status(500).json({
      error: {
        message: '更新知识条目失败',
        status: 500
      }
    });
  }
};

/**
 * 删除知识条目
 */
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    // 检查知识条目是否存在
    const existingKnowledge = await KnowledgeModel.findById(id);
    if (!existingKnowledge) {
      return res.status(404).json({
        error: {
          message: '知识条目不存在',
          status: 404
        }
      });
    }

    await KnowledgeModel.delete(id);

    res.json({
      message: '知识条目删除成功'
    });
  } catch (error) {
    console.error('删除知识条目错误:', error);
    res.status(500).json({
      error: {
        message: '删除知识条目失败',
        status: 500
      }
    });
  }
};

/**
 * 搜索知识条目
 */
exports.search = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      case_cause,
      dispute_focus,
      keywords,
      tags,
      case_result
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      case_cause,
      dispute_focus,
      keywords,
      tags,
      case_result
    };

    const knowledge = await KnowledgeModel.findAll(options);
    const total = await KnowledgeModel.count({
      case_cause,
      dispute_focus,
      keywords,
      tags,
      case_result
    });

    res.json({
      data: {
        knowledge,
        pagination: {
          page: options.page,
          limit: options.limit,
          total,
          totalPages: Math.ceil(total / options.limit)
        }
      }
    });
  } catch (error) {
    console.error('搜索知识条目错误:', error);
    res.status(500).json({
      error: {
        message: '搜索知识条目失败',
        status: 500
      }
    });
  }
};

/**
 * 解析案例文件
 * 从上传的文件中提取案例信息并返回
 */
exports.parseCase = async (req, res) => {
  try {
    const { fileUrl, fileName } = req.body;

    if (!fileUrl) {
      return res.status(400).json({
        error: {
          message: '文件URL不能为空',
          status: 400
        }
      });
    }

    // 模拟解析结果 - 实际项目中可以接入OCR或AI服务进行文档解析
    // 这里根据文件名生成一些示例数据
    const fileNameLower = (fileName || '').toLowerCase();
    
    // 根据文件名推断案由
    let caseCause = '';
    if (fileNameLower.includes('合同') || fileNameLower.includes('买卖')) {
      caseCause = '买卖合同纠纷';
    } else if (fileNameLower.includes('借款') || fileNameLower.includes('借贷')) {
      caseCause = '借款合同纠纷';
    } else if (fileNameLower.includes('劳动') || fileNameLower.includes('工资')) {
      caseCause = '劳动争议';
    } else if (fileNameLower.includes('房屋') || fileNameLower.includes('房产')) {
      caseCause = '房屋买卖合同纠纷';
    } else if (fileNameLower.includes('租赁') || fileNameLower.includes('租房')) {
      caseCause = '租赁合同纠纷';
    } else if (fileNameLower.includes('建设') || fileNameLower.includes('工程')) {
      caseCause = '建设工程施工合同纠纷';
    } else if (fileNameLower.includes('股权') || fileNameLower.includes('股份')) {
      caseCause = '股权转让纠纷';
    } else if (fileNameLower.includes('侵权')) {
      caseCause = '侵权责任纠纷';
    } else if (fileNameLower.includes('婚姻') || fileNameLower.includes('离婚')) {
      caseCause = '婚姻家庭纠纷';
    } else if (fileNameLower.includes('继承') || fileNameLower.includes('遗产')) {
      caseCause = '继承纠纷';
    }

    // 返回解析结果
    const parsedData = {
      case_cause: caseCause,
      dispute_focus: '',
      legal_issues: '',
      case_result: '',
      key_evidence: '',
      legal_basis: '',
      case_analysis: '',
      practical_significance: '',
      keywords: '',
      tags: '',
      win_rate_reference: ''
    };

    // 如果能识别出案由，添加一些相关的默认内容
    if (caseCause) {
      parsedData.dispute_focus = `关于${caseCause}的核心争议焦点`;
      parsedData.keywords = caseCause.replace('纠纷', '');
    }

    res.json({
      message: '文件解析成功',
      data: parsedData
    });
  } catch (error) {
    console.error('解析案例文件错误:', error);
    res.status(500).json({
      error: {
        message: '解析案例文件失败',
        status: 500
      }
    });
  }
};
