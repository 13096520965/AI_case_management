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
