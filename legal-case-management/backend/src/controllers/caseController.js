const Case = require('../models/Case');

/**
 * 创建案件
 */
exports.createCase = async (req, res) => {
  try {
    const caseData = req.body;

    // 验证必填字段
    if (!caseData.case_type || !caseData.case_cause || !caseData.industry_segment || !caseData.case_background) {
      return res.status(400).json({
        error: {
          message: '案件类型、案由、产业板块和案件背景为必填项',
          status: 400
        }
      });
    }

    // 如果没有提供内部编号，自动生成
    if (!caseData.internal_number) {
      caseData.internal_number = await generateInternalNumber();
    }

    // 验证案号唯一性（如果提供了案号）
    if (caseData.case_number) {
      const existingCase = await Case.findByCaseNumber(caseData.case_number);
      if (existingCase) {
        return res.status(409).json({
          error: {
            message: '案号已存在',
            status: 409
          }
        });
      }
    }

    // 验证内部编号唯一性
    const existingInternalCase = await Case.findByInternalNumber(caseData.internal_number);
    if (existingInternalCase) {
      return res.status(409).json({
        error: {
          message: '内部编号已存在',
          status: 409
        }
      });
    }

    const caseId = await Case.create(caseData);
    const newCase = await Case.findById(caseId);

    // 记录操作日志
    const operator = req.user?.real_name || req.user?.username || '系统';
    await Case.addLog(
      caseId,
      operator,
      `进行了案件创建操作：${newCase.internal_number || newCase.case_number || '新案件'}`,
      'CREATE_CASE'
    );

    res.status(201).json({
      message: '案件创建成功',
      data: {
        case: newCase
      }
    });
  } catch (error) {
    console.error('创建案件错误:', error);
    res.status(500).json({
      error: {
        message: '创建案件失败，请稍后重试',
        status: 500
      }
    });
  }
};

/**
 * 获取案件列表（支持分页、筛选、搜索）
 */
exports.getCases = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      case_type,
      search,
      party_name,
      handler,
      industry_segment
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      case_type,
      search,
      party_name,
      handler,
      industry_segment
    };

    const cases = await Case.findAll(options);
    const total = await Case.count({ status, case_type, search, party_name, handler, industry_segment });

    res.json({
      data: {
        cases,
        pagination: {
          page: options.page,
          limit: options.limit,
          total,
          totalPages: Math.ceil(total / options.limit)
        }
      }
    });
  } catch (error) {
    console.error('获取案件列表错误:', error);
    res.status(500).json({
      error: {
        message: '获取案件列表失败',
        status: 500
      }
    });
  }
};

/**
 * 获取案件详情
 */
exports.getCaseById = async (req, res) => {
  try {
    const { id } = req.params;
    const caseData = await Case.findById(id);

    if (!caseData) {
      return res.status(404).json({
        error: {
          message: '案件不存在',
          status: 404
        }
      });
    }

    res.json({
      data: {
        case: caseData
      }
    });
  } catch (error) {
    console.error('获取案件详情错误:', error);
    res.status(500).json({
      error: {
        message: '获取案件详情失败',
        status: 500
      }
    });
  }
};

/**
 * 更新案件信息
 */
exports.updateCase = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // 检查案件是否存在
    const existingCase = await Case.findById(id);
    if (!existingCase) {
      return res.status(404).json({
        error: {
          message: '案件不存在',
          status: 404
        }
      });
    }

    // 如果更新案号，验证唯一性
    if (updateData.case_number && updateData.case_number !== existingCase.case_number) {
      const caseWithSameNumber = await Case.findByCaseNumber(updateData.case_number);
      if (caseWithSameNumber) {
        return res.status(409).json({
          error: {
            message: '案号已存在',
            status: 409
          }
        });
      }
    }

    // 如果更新内部编号，验证唯一性
    if (updateData.internal_number && updateData.internal_number !== existingCase.internal_number) {
      const caseWithSameInternal = await Case.findByInternalNumber(updateData.internal_number);
      if (caseWithSameInternal) {
        return res.status(409).json({
          error: {
            message: '内部编号已存在',
            status: 409
          }
        });
      }
    }

    const changes = await Case.update(id, updateData);

    if (changes === 0) {
      return res.status(400).json({
        error: {
          message: '没有数据被更新',
          status: 400
        }
      });
    }

    const updatedCase = await Case.findById(id);

    // 记录操作日志
    const operator = req.user?.real_name || req.user?.username || '系统';
    const logActions = [];
    
    // 检查状态变更
    if (updateData.status && updateData.status !== existingCase.status) {
      logActions.push(`状态变更：${existingCase.status} → ${updateData.status}`);
    }
    
    // 检查其他重要字段变更
    const importantFields = {
      case_number: '案号',
      case_type: '案件类型',
      case_cause: '案由',
      court: '法院',
      target_amount: '标的额'
    };
    
    for (const [field, label] of Object.entries(importantFields)) {
      if (updateData[field] !== undefined && updateData[field] !== existingCase[field]) {
        logActions.push(`修改${label}`);
      }
    }
    
    if (logActions.length > 0) {
      await Case.addLog(
        id,
        operator,
        `进行了案件编辑操作：${logActions.join('、')}`,
        'UPDATE_CASE'
      );
    }

    res.json({
      message: '案件更新成功',
      data: {
        case: updatedCase
      }
    });
  } catch (error) {
    console.error('更新案件错误:', error);
    res.status(500).json({
      error: {
        message: '更新案件失败',
        status: 500
      }
    });
  }
};

/**
 * 删除案件
 */
exports.deleteCase = async (req, res) => {
  try {
    const { id } = req.params;

    // 检查案件是否存在
    const existingCase = await Case.findById(id);
    if (!existingCase) {
      return res.status(404).json({
        error: {
          message: '案件不存在',
          status: 404
        }
      });
    }

    // 记录操作日志（在删除前记录）
    const operator = req.user?.real_name || req.user?.username || '系统';
    await Case.addLog(
      id,
      operator,
      `进行了案件删除操作：${existingCase.internal_number || existingCase.case_number || '案件'}`,
      'DELETE_CASE'
    );

    const changes = await Case.delete(id);

    if (changes === 0) {
      return res.status(400).json({
        error: {
          message: '删除失败',
          status: 400
        }
      });
    }

    res.json({
      message: '案件删除成功'
    });
  } catch (error) {
    console.error('删除案件错误:', error);
    res.status(500).json({
      error: {
        message: '删除案件失败',
        status: 500
      }
    });
  }
};

/**
 * 生成唯一的内部案件编号
 * 格式: AN + 年份 + 月份 + 6位序号
 * 例如: AN202411000001
 */
async function generateInternalNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `AN${year}${month}`;

  // 查询当月最大序号
  const lastCase = await Case.findLastByPrefix(prefix);
  
  let sequence = 1;
  if (lastCase && lastCase.internal_number) {
    const lastSequence = parseInt(lastCase.internal_number.slice(-6));
    sequence = lastSequence + 1;
  }

  const sequenceStr = String(sequence).padStart(6, '0');
  return `${prefix}${sequenceStr}`;
}



/**
 * 获取案件操作日志
 */
exports.getCaseLogs = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // 检查案件是否存在
    const existingCase = await Case.findById(id);
    if (!existingCase) {
      return res.status(404).json({
        error: {
          message: '案件不存在',
          status: 404
        }
      });
    }

    const logs = await Case.getLogs(id, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    const total = await Case.countLogs(id);

    res.json({
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('获取案件日志错误:', error);
    res.status(500).json({
      error: {
        message: '获取案件日志失败',
        status: 500
      }
    });
  }
};
