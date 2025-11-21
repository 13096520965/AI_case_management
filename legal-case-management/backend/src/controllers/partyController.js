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

    // 记录操作日志
    const operator = req.user?.real_name || req.user?.username || '系统';
    await Case.addLog(
      caseId,
      operator,
      `进行了诉讼主体添加操作：${newParty.name}（${newParty.party_type}）`
    );

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

    // 记录操作日志
    const operator = req.user?.real_name || req.user?.username || '系统';
    await Case.addLog(
      existingParty.case_id,
      operator,
      `进行了诉讼主体编辑操作：${existingParty.name}（${existingParty.party_type}）`
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

    // 记录操作日志（在删除前记录）
    const operator = req.user?.real_name || req.user?.username || '系统';
    await Case.addLog(
      existingParty.case_id,
      operator,
      `进行了诉讼主体删除操作：${existingParty.name}（${existingParty.party_type}）`
    );

    const changes = await LitigationParty.delete(id);

    if (changes === 0) {
      return res.status(400).json({
        error: {
          message: '删除失败',
          status: 400
        }
      });
    }

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

