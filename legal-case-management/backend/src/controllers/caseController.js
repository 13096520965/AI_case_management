const Case = require('../models/Case');
const XLSX = require('xlsx');

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
      partyName,
      handler,
      industry_segment,
      includeParties = 'true' // 默认包含主体信息
    } = req.query;

    // 支持 party_name 和 partyName 两种参数名
    const partyNameFilter = party_name || partyName;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      case_type,
      search,
      partyName: partyNameFilter,
      handler,
      industry_segment
    };

    // 根据 includeParties 参数决定是否包含主体信息
    const shouldIncludeParties = includeParties === 'true' || includeParties === true;
    const cases = shouldIncludeParties 
      ? await Case.findAllWithParties(options)
      : await Case.findAll(options);
    
    const total = await Case.count({ 
      status, 
      case_type, 
      search, 
      partyName: partyNameFilter, 
      handler, 
      industry_segment 
    });

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
    const { includeParties = 'true' } = req.query;

    // 根据 includeParties 参数决定是否包含主体信息
    const shouldIncludeParties = includeParties === 'true' || includeParties === true;
    const caseData = shouldIncludeParties
      ? await Case.findByIdWithParties(id)
      : await Case.findById(id);

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

/**
 * 导出案件数据
 * GET /api/cases/export
 * 支持参数：includeParties (true/false)、exportMode (multi-sheet|single-sheet)、format (xlsx|csv)、caseIds (逗号分隔)
 */
exports.exportCases = async (req, res) => {
  try {
    const {
      includeParties = 'true',
      exportMode = 'multi-sheet',
      format = 'xlsx',
      caseIds
    } = req.query;

    const shouldIncludeParties = includeParties === 'true' || includeParties === true;
    const mode = exportMode === 'single-sheet' ? 'single-sheet' : 'multi-sheet';
    const outFormat = (format === 'csv') ? 'csv' : 'xlsx';

    let cases = [];

    if (caseIds) {
      // 按指定 caseIds 导出
      const ids = caseIds.split(',').map(s => s.trim()).filter(Boolean);
      for (const id of ids) {
        const c = shouldIncludeParties ? await Case.findByIdWithParties(id) : await Case.findById(id);
        if (c) cases.push(c);
      }
    } else {
      // 导出全部匹配的案件（不进行分页，设置较大limit）
      cases = shouldIncludeParties
        ? await Case.findAllWithParties({ page: 1, limit: 10000 })
        : await Case.findAll({ page: 1, limit: 10000 });
    }

    if (cases.length === 0) {
      return res.status(400).json({ error: { message: '未找到要导出的案件', status: 400 } });
    }

    // 如果 user requested csv but multi-sheet -> reject
    if (outFormat === 'csv' && mode === 'multi-sheet') {
      return res.status(400).json({ error: { message: 'CSV 格式仅支持 single-sheet 导出，请将 exportMode 设置为 single-sheet 或使用 xlsx', status: 400 } });
    }

    const workbook = XLSX.utils.book_new();

    if (!shouldIncludeParties) {
      // 仅导出案件基本信息
      const rows = cases.map(c => ({
        '案件ID': c.id,
        '内部编号': c.internal_number || '',
        '案号': c.case_number || '',
        '案件类型': c.case_type || '',
        '案由': c.case_cause || '',
        '法院': c.court || '',
        '标的额': c.target_amount || '',
        '承接人': c.handler || ''
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(workbook, ws, '案件信息');

      if (outFormat === 'csv') {
        const csv = XLSX.utils.sheet_to_csv(ws);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=cases_export.csv');
        return res.send(csv);
      }

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=cases_export.xlsx');
      return res.send(buffer);
    }

    // include parties
    if (mode === 'multi-sheet') {
      const plaintiffRows = [];
      const defendantRows = [];
      const thirdPartyRows = [];

      cases.forEach(c => {
        const caseNumber = c.case_number || c.internal_number || '';
        const caseCause = c.case_cause || '';

        const addRow = (p, target) => {
          target.push({
            '案件ID': c.id,
            '案件编号': caseNumber,
            '案由': caseCause,
            '主体名称': p.name || '',
            '主体类型': p.party_type || '',
            '实体类型': p.entity_type || '',
            '联系电话': p.contact_phone || '',
            '地址': p.address || '',
            '是否主要当事人': p.is_primary ? '是' : '否'
          });
        };

        if (c.plaintiffs && c.plaintiffs.length > 0) {
          c.plaintiffs.forEach(p => addRow(p, plaintiffRows));
        }

        if (c.defendants && c.defendants.length > 0) {
          c.defendants.forEach(p => addRow(p, defendantRows));
        }

        if (c.third_parties && c.third_parties.length > 0) {
          c.third_parties.forEach(p => addRow(p, thirdPartyRows));
        }
      });

      if (plaintiffRows.length > 0) {
        const ws1 = XLSX.utils.json_to_sheet(plaintiffRows);
        XLSX.utils.book_append_sheet(workbook, ws1, '原告信息');
      }

      if (defendantRows.length > 0) {
        const ws2 = XLSX.utils.json_to_sheet(defendantRows);
        XLSX.utils.book_append_sheet(workbook, ws2, '被告信息');
      }

      if (thirdPartyRows.length > 0) {
        const ws3 = XLSX.utils.json_to_sheet(thirdPartyRows);
        XLSX.utils.book_append_sheet(workbook, ws3, '第三人信息');
      }

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=cases_with_parties.xlsx');
      return res.send(buffer);
    }

    // single-sheet mode
    const rows = [];
    cases.forEach(c => {
      const caseNumber = c.case_number || c.internal_number || '';
      const caseCause = c.case_cause || '';

      const allParties = [
        ...(c.plaintiffs || []).map(p => ({ ...p, party_type: '原告' })),
        ...(c.defendants || []).map(p => ({ ...p, party_type: '被告' })),
        ...((c.third_parties || []).map(p => ({ ...p, party_type: '第三人' })))
      ];

      if (allParties.length === 0) {
        rows.push({
          '案件ID': c.id,
          '案件编号': caseNumber,
          '案由': caseCause,
          '主体类型': '',
          '主体名称': '',
          '联系电话': '',
          '地址': ''
        });
      } else {
        allParties.forEach(party => {
          rows.push({
            '案件ID': c.id,
            '案件编号': caseNumber,
            '案由': caseCause,
            '主体类型': party.party_type || party.party_type,
            '主体名称': party.name || '',
            '实体类型': party.entity_type || '',
            '联系电话': party.contact_phone || '',
            '地址': party.address || ''
          });
        });
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, '案件主体信息');

    if (outFormat === 'csv') {
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=cases_with_parties.csv');
      return res.send(csv);
    }

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=cases_with_parties.xlsx');
    return res.send(buffer);

  } catch (error) {
    console.error('导出案件错误:', error);
    res.status(500).json({ error: { message: '导出案件失败', status: 500 } });
  }
};
