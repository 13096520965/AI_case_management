const LitigationParty = require('../models/LitigationParty');
const Case = require('../models/Case');

/**
 * 添加诉讼主体
 */
exports.createParty = async (req, res) => {
  try {
    const { caseId } = req.params;
    const partyData = { ...req.body, case_id: caseId };

    // 验证案件是否存在
    const caseExists = await Case.findById(caseId);
    if (!caseExists) {
      return res.status(404).json({
        error: {
          message: '案件不存在',
          status: 404
        }
      });
    }

    // 验证必填字段
    if (!partyData.party_type || !partyData.entity_type || !partyData.name) {
      return res.status(400).json({
        error: {
          message: '主体类型、实体类型和名称为必填项',
          status: 400
        }
      });
    }

    const partyId = await LitigationParty.create(partyData);
    const newParty = await LitigationParty.findById(partyId);

    res.status(201).json({
      message: '诉讼主体添加成功',
      data: {
        party: newParty
      }
    });
  } catch (error) {
    console.error('添加诉讼主体错误:', error);
    res.status(500).json({
      error: {
        message: '添加诉讼主体失败，请稍后重试',
        status: 500
      }
    });
  }
};

/**
 * 获取诉讼主体列表
 */
exports.getPartiesByCaseId = async (req, res) => {
  try {
    const { caseId } = req.params;

    // 验证案件是否存在
    const caseExists = await Case.findById(caseId);
    if (!caseExists) {
      return res.status(404).json({
        error: {
          message: '案件不存在',
          status: 404
        }
      });
    }

    const parties = await LitigationParty.findByCaseId(caseId);

    res.json({
      data: {
        parties
      }
    });
  } catch (error) {
    console.error('获取诉讼主体列表错误:', error);
    res.status(500).json({
      error: {
        message: '获取诉讼主体列表失败',
        status: 500
      }
    });
  }
};

/**
 * 更新诉讼主体
 */
exports.updateParty = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // 检查主体是否存在
    const existingParty = await LitigationParty.findById(id);
    if (!existingParty) {
      return res.status(404).json({
        error: {
          message: '诉讼主体不存在',
          status: 404
        }
      });
    }

    const changes = await LitigationParty.update(id, updateData);

    if (changes === 0) {
      return res.status(400).json({
        error: {
          message: '没有数据被更新',
          status: 400
        }
      });
    }

    const updatedParty = await LitigationParty.findById(id);

    // 记录日志
    const { logCaseAction } = require('../middleware/caseLogger');
    await logCaseAction(
      existingParty.case_id,
      'UPDATE_PARTY',
      `更新诉讼主体: ${existingParty.name}`,
      req.user,
      {
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get('user-agent'),
        data: {
          party_id: id,
          party_name: existingParty.name
        }
      }
    );

    res.json({
      message: '诉讼主体更新成功',
      data: {
        party: updatedParty
      }
    });
  } catch (error) {
    console.error('更新诉讼主体错误:', error);
    res.status(500).json({
      error: {
        message: '更新诉讼主体失败',
        status: 500
      }
    });
  }
};

/**
 * 删除诉讼主体
 */
exports.deleteParty = async (req, res) => {
  try {
    const { id } = req.params;

    // 检查主体是否存在
    const existingParty = await LitigationParty.findById(id);
    if (!existingParty) {
      return res.status(404).json({
        error: {
          message: '诉讼主体不存在',
          status: 404
        }
      });
    }

    const changes = await LitigationParty.delete(id);

    if (changes === 0) {
      return res.status(400).json({
        error: {
          message: '删除失败',
          status: 400
        }
      });
    }

    // 记录日志
    const { logCaseAction } = require('../middleware/caseLogger');
    await logCaseAction(
      existingParty.case_id,
      'DELETE_PARTY',
      `删除诉讼主体: ${existingParty.name}`,
      req.user,
      {
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get('user-agent'),
        data: {
          party_id: id,
          party_name: existingParty.name
        }
      }
    );

    res.json({
      message: '诉讼主体删除成功'
    });
  } catch (error) {
    console.error('删除诉讼主体错误:', error);
    res.status(500).json({
      error: {
        message: '删除诉讼主体失败',
        status: 500
      }
    });
  }
};

/**
 * 查询主体历史案件
 */
exports.getPartyHistory = async (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({
        error: {
          message: '主体名称为必填项',
          status: 400
        }
      });
    }

    const historyCases = await LitigationParty.findHistoryCases(name);

    res.json({
      data: {
        name,
        cases: historyCases,
        total: historyCases.length
      }
    });
  } catch (error) {
    console.error('查询主体历史案件错误:', error);
    res.status(500).json({
      error: {
        message: '查询主体历史案件失败',
        status: 500
      }
    });
  }
};

