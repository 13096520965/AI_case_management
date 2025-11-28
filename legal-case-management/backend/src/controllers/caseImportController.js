const multer = require('multer');
let XLSX;
try {
  XLSX = require('xlsx');
} catch (e) {
  console.warn('xlsx 模块未安装，Excel 导入功能将不可用');
}
const Case = require('../models/Case');

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
        filing_date: mapped.filing_date || null,
        // 将中文状态转换为系统内部代码（如果是中文），否则保持原样
        status: statusChineseToInternal(mapped.status) ,
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

    res.json({ message: '导入完成', results });
  } catch (error) {
    console.error('导入案件失败:', error);
    res.status(500).json({ error: '导入案件失败: ' + error.message });
  }
};

module.exports = {
  upload,
  importCases
};
