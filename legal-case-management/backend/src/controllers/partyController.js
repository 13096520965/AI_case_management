const LitigationParty = require('../models/LitigationParty');
const Case = require('../models/Case');
const PartyHistory = require('../models/PartyHistory');

/**
 * 添加诉讼主体（支持批量创建）
 */
exports.createParty = async (req, res) => {
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

    // 获取操作人信息
    const operator = req.user?.real_name || req.user?.username || '系统';

    // 判断是单个创建还是批量创建
    const isBatch = Array.isArray(req.body);
    const partiesData = isBatch ? req.body : [req.body];

    // 验证所有主体数据
    for (let i = 0; i < partiesData.length; i++) {
      const incoming = { ...partiesData[i] };
      if (incoming.birthDate && !incoming.birth_date) incoming.birth_date = incoming.birthDate;
      partiesData[i] = incoming;

      const partyData = partiesData[i];

      // 验证必填字段
      if (!partyData.party_type || !partyData.entity_type || !partyData.name) {
        return res.status(400).json({
          error: {
            message: `第 ${i + 1} 个主体：主体类型、实体类型和名称为必填项`,
            status: 400
          }
        });
      }

      // 如果是个人，出生日期为必填
      if (partyData.entity_type === '个人' && !partyData.birth_date) {
        return res.status(400).json({
          error: {
            message: `第 ${i + 1} 个主体：实体类型为个人时，出生日期为必填项`,
            status: 400
          }
        });
      }
    }

    // 按主体类型分组，统计每个类型的现有数量
    const existingParties = await LitigationParty.findByCaseId(caseId);
    const typeCount = {};
    existingParties.forEach(party => {
      typeCount[party.party_type] = (typeCount[party.party_type] || 0) + 1;
    });

    // 创建所有主体
    const createdParties = [];
    for (const partyData of partiesData) {
      const partyType = partyData.party_type;
      
      // 如果该类型还没有主体，设置为主要主体
      const isPrimary = (typeCount[partyType] || 0) === 0;
      
      const fullPartyData = {
        ...partyData,
        case_id: caseId,
        is_primary: isPrimary ? 1 : 0
      };

      const partyId = await LitigationParty.create(fullPartyData);
      const newParty = await LitigationParty.findById(partyId);
      createdParties.push(newParty);

      // 更新类型计数
      typeCount[partyType] = (typeCount[partyType] || 0) + 1;

      // 记录创建历史到 party_history 表
      await PartyHistory.create({
        party_id: partyId,
        case_id: caseId,
        action: 'CREATE',
        changed_fields: {
          created: fullPartyData
        },
        changed_by: operator
      });

      // 记录操作日志
      await Case.addLog(
        caseId,
        operator,
        `进行了诉讼主体添加操作：${newParty.name}（${newParty.party_type}）${isPrimary ? ' [主要当事人]' : ''}`,
        'CREATE_PARTY'
      );
    }

    res.status(201).json({
      message: isBatch ? `成功添加 ${createdParties.length} 个诉讼主体` : '诉讼主体添加成功',
      data: {
        parties: createdParties,
        count: createdParties.length
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
    // 兼容 camelCase -> snake_case 映射
    const incomingUpdate = { ...req.body };
    if (incomingUpdate.birthDate && !incomingUpdate.birth_date) incomingUpdate.birth_date = incomingUpdate.birthDate;
    const updateData = incomingUpdate;

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

    // 如果最终实体类型为个人，确保 birth_date 存在（要么在 updateData 中，要么在已有记录中）
    const finalEntityType = updateData.entity_type || existingParty.entity_type;
    if (finalEntityType === '个人') {
      const hasBirth = updateData.birth_date !== undefined ? !!updateData.birth_date : !!existingParty.birth_date;
      if (!hasBirth) {
        return res.status(400).json({
          error: {
            message: '实体类型为个人时，出生日期为必填项',
            status: 400
          }
        });
      }
    }

    // 计算变更字段
    const changedFields = {};
    for (const key in updateData) {
      if (updateData[key] !== undefined && existingParty[key] !== updateData[key]) {
        changedFields[key] = {
          old: existingParty[key],
          new: updateData[key]
        };
      }
    }

    // 如果没有实际变更，直接返回
    if (Object.keys(changedFields).length === 0) {
      return res.json({
        message: '没有数据需要更新',
        data: {
          party: existingParty
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

    // 获取操作人信息
    const operator = req.user?.real_name || req.user?.username || '系统';

    // 记录变更历史到 party_history 表
    await PartyHistory.create({
      party_id: id,
      case_id: existingParty.case_id,
      action: 'UPDATE',
      changed_fields: changedFields,
      changed_by: operator
    });

    // 记录操作日志
    await Case.addLog(
      existingParty.case_id,
      operator,
      `进行了诉讼主体编辑操作：${existingParty.name}（${existingParty.party_type}）`,
      'UPDATE_PARTY'
    );

    res.json({
      message: '诉讼主体更新成功',
      data: {
        party: updatedParty,
        changedFields: changedFields
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

    // 获取操作人信息
    const operator = req.user?.real_name || req.user?.username || '系统';

    // 检查该主体是否被其他案件引用
    const references = await LitigationParty.checkReferences(
      existingParty.name,
      existingParty.entity_type
    );

    let deleteMessage = '';
    let isFullDelete = false;

    if (references.count > 1) {
      // 被多个案件引用，只删除当前案件的关联关系
      deleteMessage = `诉讼主体删除成功（该主体在其他 ${references.count - 1} 个案件中仍有记录）`;
      isFullDelete = false;
    } else {
      // 只被当前案件引用，完全删除
      deleteMessage = '诉讼主体删除成功';
      isFullDelete = true;
    }

    // 记录删除历史到 party_history 表（在删除前记录）
    await PartyHistory.create({
      party_id: id,
      case_id: existingParty.case_id,
      action: 'DELETE',
      changed_fields: {
        deleted: existingParty,
        isFullDelete: isFullDelete,
        referencedCases: references.caseIds
      },
      changed_by: operator
    });

    // 记录操作日志（在删除前记录）
    await Case.addLog(
      existingParty.case_id,
      operator,
      `进行了诉讼主体删除操作：${existingParty.name}（${existingParty.party_type}）${!isFullDelete ? ' [仅删除关联]' : ''}`,
      'DELETE_PARTY'
    );

    // 执行删除
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
      message: deleteMessage,
      data: {
        isFullDelete: isFullDelete,
        remainingReferences: references.count - 1,
        referencedCases: references.caseIds.filter(caseId => caseId !== existingParty.case_id)
      }
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

/**
 * 获取主体搜索建议
 * GET /api/parties/suggestions?keyword=张&partyType=原告
 */
exports.getPartySuggestions = async (req, res) => {
  try {
    const { keyword, partyType } = req.query;

    if (!keyword) {
      return res.status(400).json({
        error: {
          message: '搜索关键词不能为空',
          status: 400
        }
      });
    }

    const suggestions = await LitigationParty.getSuggestions(keyword, partyType);

    res.json({
      data: {
        suggestions
      }
    });
  } catch (error) {
    console.error('获取主体搜索建议错误:', error);
    res.status(500).json({
      error: {
        message: '获取主体搜索建议失败',
        status: 500
      }
    });
  }
};

/**
 * 获取主体历史信息（包含基本信息和历史案件列表）
 * GET /api/parties/:id/history
 */
exports.getPartyHistoryById = async (req, res) => {
  try {
    const { id } = req.params;

    // 获取主体基本信息
    const party = await LitigationParty.findById(id);
    if (!party) {
      return res.status(404).json({
        error: {
          message: '主体不存在',
          status: 404
        }
      });
    }

    // 获取该主体的历史案件列表
    const historyCases = await LitigationParty.findHistoryCases(party.name);

    res.json({
      data: {
        party: {
          id: party.id,
          name: party.name,
          entity_type: party.entity_type,
          contact_phone: party.contact_phone,
          contact_email: party.contact_email,
          address: party.address,
          unified_credit_code: party.unified_credit_code,
          legal_representative: party.legal_representative
        },
        cases: historyCases.map(c => ({
          id: c.id,
          case_number: c.case_number,
          internal_number: c.internal_number,
          case_cause: c.case_cause,
          case_type: c.case_type,
          filing_date: c.filing_date,
          status: c.status
        }))
      }
    });
  } catch (error) {
    console.error('获取主体历史信息错误:', error);
    res.status(500).json({
      error: {
        message: '获取主体历史信息失败',
        status: 500
      }
    });
  }
};

/**
 * 获取主体模板（用于快速录入）
 * GET /api/parties/templates/:name
 */
exports.getPartyTemplate = async (req, res) => {
  try {
    const { name } = req.params;

    if (!name) {
      return res.status(400).json({
        error: {
          message: '主体名称不能为空',
          status: 400
        }
      });
    }

    const template = await LitigationParty.getTemplate(name);

    if (!template) {
      return res.status(404).json({
        error: {
          message: '未找到该主体的模板信息',
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
    console.error('获取主体模板错误:', error);
    res.status(500).json({
      error: {
        message: '获取主体模板失败',
        status: 500
      }
    });
  }
};

