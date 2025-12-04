const multer = require('multer');
let XLSX;
try {
  XLSX = require('xlsx');
} catch (e) {
  console.warn('xlsx 模块未安装，Excel 导入功能将不可用');
}
const Case = require('../models/Case');
const LitigationParty = require('../models/LitigationParty');
const PartyHistory = require('../models/PartyHistory');

// 生成唯一的内部案件编号（与 caseController.generateInternalNumber 保持一致）
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
    if (!isNaN(lastSequence)) sequence = lastSequence + 1;
  }

  const sequenceStr = String(sequence).padStart(6, '0');
  return `${prefix}${sequenceStr}`;
}

// 使用内存存储，避免临时写磁盘（小文件导入场景）
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

/**
 * 导入案件（Excel）
 * 支持的列（可使用英文或常用中文列名）：
 * case_number / 案号
 * internal_number / 内部编号
 * case_type / 案件类型 (必填)
 * case_cause / 案由 (必填)
 * court / 法院
 * target_amount / 标的额
 * filing_date / 立案日期 (YYYY-MM-DD)
 * industry_segment / 产业板块 (必填)
 * handler / 承接人
 * is_external_agent / 是否外部代理 (0/1 或 true/false)
 * law_firm_name / 律所名称
 * agent_lawyer / 代理律师
 * agent_contact / 代理联系方式
 * case_background / 案件背景
 */
const importCases = async (req, res) => {
  try {
    // 检查 xlsx 模块是否可用
    if (!XLSX) {
      return res.status(500).json({ error: 'Excel 导入功能不可用，请安装 xlsx 模块' });
    }
    
    // multer 会把文件放在 req.file
    const file = req.file;
    if (!file) return res.status(400).json({ error: '请上传 Excel 文件（字段名为 file）' });

    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return res.status(400).json({ error: 'Excel 文件中未找到工作表' });

    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'Excel 中没有数据' });
    }

  // 列名映射（支持中文/英文）
    const headerMap = (row) => {
      const mapped = {};
      for (const key of Object.keys(row)) {
        const lower = key.toString().trim().toLowerCase();
        if (/^(case[_ ]?number|案号)$/i.test(lower)) mapped.case_number = row[key];
        else if (/^(internal[_ ]?number|内部编号)$/i.test(lower)) mapped.internal_number = row[key];
        else if (/^(case[_ ]?type|案件类型)$/i.test(lower)) mapped.case_type = row[key];
        else if (/^(case[_ ]?cause|案由)$/i.test(lower)) mapped.case_cause = row[key];
        else if (/^(court|法院)$/i.test(lower)) mapped.court = row[key];
        else if (/^(target[_ ]?amount|标的额)$/i.test(lower)) mapped.target_amount = row[key];
        else if (/^(filing[_ ]?date|立案日期)$/i.test(lower)) mapped.filing_date = row[key];
        else if (/^(industry[_ ]?segment|产业板块)$/i.test(lower)) mapped.industry_segment = row[key];
        else if (/^(handler|承接人)$/i.test(lower)) mapped.handler = row[key];
        else if (/^(is[_ ]?external[_ ]?agent|外部代理)$/i.test(lower)) mapped.is_external_agent = row[key];
        else if (/^(case[_ ]?background|案件背景)$/i.test(lower)) mapped.case_background = row[key];
  else if (/^(status|案件状态)$/i.test(lower)) mapped.status = row[key];
  else if (/^(law[_ ]?firm[_ ]?name|律所名称)$/i.test(lower)) mapped.law_firm_name = row[key];
  else if (/^(agent[_ ]?lawyer|代理律师)$/i.test(lower)) mapped.agent_lawyer = row[key];
  else if (/^(agent[_ ]?contact|代理联系方式|联系方式)$/i.test(lower)) mapped.agent_contact = row[key];
        else mapped[key] = row[key]; // 其它列保留原名（不使用也无害）
      }
      return mapped;
    };

    // 状态映射：将常见中文状态转换为系统内部英文代码
    const statusChineseToInternal = (s) => {
      if (!s && s !== 0) return null;
      const str = String(s).trim();
      const map = {
        'active': '立案',
        'in_trial': '审理中',
        'closed': '已结案',
        'archived': '已归档',
        '立案': '立案',
        '审理中': '审理中',
        '已结案': '已结案',
        '结案': '结案',
        '已归档': '已归档',
        '归档': '已归档'
      };
      return map[str] || str; // 如果已经是内部代码（英文），直接返回
    };

    const results = {
      total: rows.length,
      success: 0,
      failures: []
    };

    // 逐行校验并创建（顺序处理，便于返回行号）
    for (let i = 0; i < rows.length; i++) {
      const originalRow = rows[i];
      const mapped = headerMap(originalRow);
      const rowNumber = i + 2; // Excel 第一行为表头

      // 必填字段校验
      if (!mapped.case_type || !mapped.case_cause || !mapped.industry_segment) {
        results.failures.push({ row: rowNumber, reason: '缺少必填字段：案件类型/案由/产业板块' });
        continue;
      }

      // 预处理字段名与类型
        const caseData = {
        internal_number: mapped.internal_number || await generateInternalNumber(),
        case_number: mapped.case_number || null,
        case_type: mapped.case_type,
        case_cause: mapped.case_cause,
        court: mapped.court || null,
        target_amount: mapped.target_amount ? Number(mapped.target_amount) : null,
        filing_date: null,
  // 将中文状态转换为系统内部代码（如果是中文），否则保持原样
  // 若未提供状态，导入时默认设置为中文 '立案'
  status: statusChineseToInternal(mapped.status) || '立案',
        industry_segment: mapped.industry_segment,
        handler: mapped.handler || null,
        is_external_agent: mapped.is_external_agent ? (['1','true','是','y','yes'].includes(String(mapped.is_external_agent).toLowerCase()) ? 1 : 0) : 0,
        law_firm_name: mapped.law_firm_name || null,
        agent_lawyer: mapped.agent_lawyer || null,
        agent_contact: mapped.agent_contact || null,
        case_background: mapped.case_background || null
      };

      // 唯一性校验：案号/内部编号
      try {
        if (caseData.case_number) {
          const existing = await Case.findByCaseNumber(caseData.case_number);
          if (existing) {
            results.failures.push({ row: rowNumber, reason: `案号已存在: ${caseData.case_number}` });
            continue;
          }
        }
        if (caseData.internal_number) {
          const existingI = await Case.findByInternalNumber(caseData.internal_number);
          if (existingI) {
            results.failures.push({ row: rowNumber, reason: `内部编号已存在: ${caseData.internal_number}` });
            continue;
          }
        }

        const newId = await Case.create(caseData);
        // 添加日志也在 createCase 控制器中处理，导入场景这里可简化不额外写日志；若需要可调用 Case.addLog
        results.success++;
      } catch (err) {
        console.error('导入行错误:', err);
        results.failures.push({ row: rowNumber, reason: err.message || '创建案件失败' });
      }
    }

    // 处理可能存在的主体sheet（多sheet模式），如果存在则导入主体并关联到已创建或已有案件
    try {
      const sheetMapping = {
        '原告信息': '原告',
        '被告信息': '被告',
        '第三人信息': '第三人'
      };

      for (const [sheetName, partyType] of Object.entries(sheetMapping)) {
        if (workbook.SheetNames.includes(sheetName)) {
          const partyRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
          for (let i = 0; i < partyRows.length; i++) {
            const prow = partyRows[i];
            const rowNumber = `party:${sheetName}:${i+2}`;
            try {
              // 简单列映射，兼容中英文表头
              const caseRef = prow['案件编号'] || prow['case_number'] || prow['内部编号'] || prow['internal_number'];
              const partyName = prow['主体名称'] || prow['name'];
              if (!caseRef || !partyName) {
                results.failures.push({ row: rowNumber, reason: '缺少案件编号或主体名称' });
                continue;
              }

              // 查找案件：优先按案号，再按内部编号
              let caseInfo = await Case.findByCaseNumber(caseRef);
              if (!caseInfo) caseInfo = await Case.findByInternalNumber(caseRef);
              if (!caseInfo) {
                results.failures.push({ row: rowNumber, reason: `未找到案件：${caseRef}` });
                continue;
              }

              const existingParties = await LitigationParty.findByCaseId(caseInfo.id);
              const duplicate = existingParties.find(p => p.name === partyName && p.party_type === partyType);
              if (duplicate) {
                // skip duplicate
                results.skipped++;
                continue;
              }

              const partyData = {
                case_id: caseInfo.id,
                party_type: partyType,
                entity_type: prow['实体类型'] || prow['entity_type'] || null,
                name: partyName,
                unified_credit_code: prow['统一社会信用代码'] || prow['unified_credit_code'] || null,
                legal_representative: prow['法定代表人'] || prow['legal_representative'] || null,
                id_number: prow['身份证号'] || prow['id_number'] || null,
                birth_date: prow['出生日期'] || prow['birth_date'] || null,
                contact_phone: prow['联系电话'] || prow['contact_phone'] || prow['phone'] || null,
                contact_email: prow['联系邮箱'] || prow['contact_email'] || null,
                address: prow['地址'] || prow['address'] || null,
                region_code: prow['地区代码'] || prow['region_code'] || null,
                detail_address: prow['详细地址'] || prow['detail_address'] || null,
                is_primary: (existingParties.filter(p=>p.party_type===partyType).length === 0) ? 1 : 0
              };

              const pid = await LitigationParty.create(partyData);
              await PartyHistory.create({ party_id: pid, case_id: caseInfo.id, action: 'CREATE', changed_fields: { created: partyData }, changed_by: req.user?.username || 'system' });
              await Case.addLog(caseInfo.id, req.user?.real_name || req.user?.username || '系统', `导入主体：${partyName} (${partyType})`, 'IMPORT_PARTY');
              results.success++;
            } catch (pe) {
              console.error('导入主体行错误:', pe);
              results.failures.push({ row: rowNumber, reason: pe.message || '导入主体失败' });
            }
          }
        }
      }
    } catch (partyImportErr) {
      console.error('处理主体sheet错误:', partyImportErr);
      // 不让主体导入阻塞案件导入总体响应
    }

    res.json({ message: '导入完成', results });
  } catch (error) {
    console.error('导入案件失败:', error);
    res.status(500).json({ error: '导入案件失败: ' + error.message });
  }
};

// exports will be set at the end after downloadTemplate is defined

/**
 * 下载导入模板（包含案件信息与主体三类sheet）
 * GET /api/cases/import/template
 */
exports.downloadTemplate = async (req, res) => {
  try {
    if (!XLSX) return res.status(500).json({ error: '需要安装 xlsx 模块以生成模板' });

    const workbook = XLSX.utils.book_new();

    // 案件信息sheet
    const caseSample = [
      {
        '案号': '2025120301',
        '内部编号': 'AN202512000005',
        '案件类型': '行政',
        '案由': '行政案由',
        '法院': '高级法院',
        '标的额': 3000,
        '立案日期': '2025-12-03',
        '产业板块': '新奥新智',
        '承接人': '张三',
        '外部代理': 1,
        '律所名称': '某某律所',
        '代理律师': '涨涨涨',
        '代理联系方式': '123456787654',
        '案件背景': '示例案件背景'
      }
    ];
    const caseSheet = XLSX.utils.json_to_sheet(caseSample);
    XLSX.utils.book_append_sheet(workbook, caseSheet, '案件信息');

    // 原告/被告/第三人 sample sheets (同 partyImportController 格式)
    const plaintiffSample = [
      {
        '案件编号': '2025120301',
        '主体名称': '新奥燃气发展有限公司',
        '实体类型': '企业',
        '统一社会信用代码': '91110000XXXXXXXX',
        '法定代表人': '李四',
        '联系电话': '010-12345678',
        '联系邮箱': 'contact@company.com',
        '地址': '北京市海淀区某某大厦'
      }
    ];
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(plaintiffSample), '原告信息');

    const defendantSample = [
      {
        '案件编号': '2025120301',
        '主体名称': '王武',
        '实体类型': '个人',
        '身份证号': '110101199001011234',
        '出生日期': '1990-01-01',
        '联系电话': '13900139000',
        '联系邮箱': 'wangwu@example.com',
        '地址': '北京市东城区某某胡同'
      }
    ];
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(defendantSample), '被告信息');

    const thirdSample = [
      {
        '案件编号': '2025120301',
        '主体名称': '张三',
        '实体类型': '个人',
        '身份证号': '110101199002021234',
        '出生日期': '1990-02-02',
        '联系电话': '13800138000',
        '联系邮箱': 'zhangsan@example.com',
        '地址': '北京市朝阳区某某街道'
      }
    ];
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(thirdSample), '第三人信息');

    // 字段说明 sheet
    const fieldDesc = [
      { 字段: '案号 / 内部编号', 说明: '用于唯一标识案件，主体表使用该字段关联案件（优先按案号匹配）', 必填: '案件sheet: 否；主体sheet: 是', 示例: '2025120301 / AN202512000005', 适用: '案件信息 / 原告信息 / 被告信息 / 第三人信息' },
      { 字段: '案件类型', 说明: '案件类别，如 民事/刑事/行政', 必填: '是', 示例: '行政', 适用: '案件信息' },
      { 字段: '案由', 说明: '案件案由', 必填: '是', 示例: '行政案由', 适用: '案件信息' },
      { 字段: '主体名称', 说明: '当事人名称（个人或企业）', 必填: '主体sheet: 是', 示例: '张三 / 某某科技有限公司', 适用: '主体sheet' },
      { 字段: '实体类型', 说明: '个人/企业', 必填: '否', 示例: '个人', 适用: '主体sheet' },
      { 字段: '统一社会信用代码', 说明: '企业标识', 必填: '企业建议填写', 示例: '91110000XXXXXXXX', 适用: '主体sheet' },
      { 字段: '身份证号', 说明: '个人身份证号', 必填: '个人建议填写', 示例: '110101199001011234', 适用: '主体sheet' },
      { 字段: '联系电话', 说明: '联系电话或座机', 必填: '否', 示例: '13800138000', 适用: '所有sheet' },
      { 字段: '联系邮箱', 说明: '电子邮件', 必填: '否', 示例: 'zhangsan@example.com', 适用: '所有sheet' },
      { 字段: '地址', 说明: '通讯地址', 必填: '否', 示例: '北京市朝阳区某某街道', 适用: '所有sheet' }
    ];
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(fieldDesc), '字段说明');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=case_import_template.xlsx');
    return res.send(buffer);
  } catch (err) {
    console.error('生成案件导入模板失败:', err);
    return res.status(500).json({ error: '生成案件导入模板失败' });
  }
};

  // 最终导出（确保 downloadTemplate 已定义）
  module.exports = {
    upload,
    importCases,
    downloadTemplate: exports.downloadTemplate
  };
