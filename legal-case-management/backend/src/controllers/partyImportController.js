const multer = require('multer');
const XLSX = require('xlsx');
const LitigationParty = require('../models/LitigationParty');
const Case = require('../models/Case');
const PartyHistory = require('../models/PartyHistory');

// 使用内存存储，避免临时写磁盘
const upload = multer({ 
  storage: multer.memoryStorage(), 
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

/**
 * 验证主体数据
 * @param {Object} row - 数据行
 * @param {string} partyType - 主体类型（如果是多sheet模式）
 * @returns {Object} { valid: boolean, errors: Array }
 */
function validatePartyData(row, partyType = null) {
  const errors = [];
  
  // 确定主体类型
  const finalPartyType = partyType || row['主体类型'];
  
  // 验证必填字段
  if (!row['案件编号']) {
    errors.push({ field: '案件编号', message: '案件编号不能为空' });
  }
  
  if (!row['主体名称']) {
    errors.push({ field: '主体名称', message: '主体名称不能为空' });
  }
  
  if (!finalPartyType) {
    errors.push({ field: '主体类型', message: '主体类型不能为空' });
  }
  
  // 验证主体类型的有效性
  const validTypes = ['原告', '被告', '第三人', '代理律师'];
  if (finalPartyType && !validTypes.includes(finalPartyType)) {
    errors.push({ 
      field: '主体类型', 
      message: `主体类型必须是: ${validTypes.join('、')}` 
    });
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 处理单个sheet的数据
 * @param {Array} data - sheet数据
 * @param {string} fixedPartyType - 固定的主体类型（多sheet模式）
 * @param {Object} results - 结果对象
 * @param {string} sheetName - sheet名称
 * @param {string} operator - 操作人
 * @param {string} updateMode - 更新模式（skip/update）
 */
async function processSheetData(data, fixedPartyType, results, sheetName, operator, updateMode = 'skip') {
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNumber = i + 2; // Excel行号（从2开始，因为第1行是表头）
    
    results.total++;
    
    try {
      // 确定主体类型
      const partyType = fixedPartyType || row['主体类型'];
      
      // 验证数据
      const validation = validatePartyData(row, partyType);
      if (!validation.valid) {
        results.failed++;
        if (fixedPartyType) {
          results.byType[fixedPartyType].failed++;
        }
        
        validation.errors.forEach(error => {
          results.errors.push({
            sheet: sheetName,
            row: rowNumber,
            partyType: partyType || '未知',
            field: error.field,
            message: error.message,
            data: row
          });
        });
        continue;
      }
      
      // 查找案件ID
      const caseNumber = row['案件编号'];
      const caseInfo = await Case.findByCaseNumber(caseNumber);
      
      if (!caseInfo) {
        // 尝试通过内部编号查找
        const caseByInternal = await Case.findByInternalNumber(caseNumber);
        if (!caseByInternal) {
          results.failed++;
          if (fixedPartyType) {
            results.byType[fixedPartyType].failed++;
          }
          results.errors.push({
            sheet: sheetName,
            row: rowNumber,
            partyType: partyType,
            field: '案件编号',
            message: `案件不存在: ${caseNumber}`,
            data: row
          });
          continue;
        }
        // 使用内部编号找到的案件
        var finalCaseId = caseByInternal.id;
      } else {
        var finalCaseId = caseInfo.id;
      }
      
      // 检查重复主体（案件+名称+类型）
      const existingParties = await LitigationParty.findByCaseId(finalCaseId);
      const duplicate = existingParties.find(p => 
        p.name === row['主体名称'] && p.party_type === partyType
      );
      
      if (duplicate) {
        if (updateMode === 'skip') {
          // 跳过重复数据
          results.skipped++;
          if (fixedPartyType) {
            results.byType[fixedPartyType].skipped = (results.byType[fixedPartyType].skipped || 0) + 1;
          }
          continue;
        } else if (updateMode === 'update') {
          // 更新现有记录
          const updateData = {
            entity_type: row['实体类型'] || duplicate.entity_type,
            contact_phone: row['联系电话'] || duplicate.contact_phone,
            contact_email: row['联系邮箱'] || duplicate.contact_email,
            address: row['地址'] || duplicate.address,
            unified_credit_code: row['统一社会信用代码'] || duplicate.unified_credit_code,
            legal_representative: row['法定代表人'] || duplicate.legal_representative,
            id_number: row['身份证号'] || duplicate.id_number,
            birth_date: row['出生日期'] || duplicate.birth_date
          };
          
          await LitigationParty.update(duplicate.id, updateData);
          
          // 记录更新历史
          await PartyHistory.create({
            party_id: duplicate.id,
            case_id: finalCaseId,
            action: 'UPDATE',
            changed_fields: { updated: updateData },
            changed_by: operator
          });
          
          results.updated++;
          if (fixedPartyType) {
            results.byType[fixedPartyType].updated = (results.byType[fixedPartyType].updated || 0) + 1;
          }
          continue;
        }
      }
      
      // 统计该案件该类型的现有主体数量
      const typeCount = existingParties.filter(p => p.party_type === partyType).length;
      const isPrimary = typeCount === 0;
      
      // 插入新记录
      const partyData = {
        case_id: finalCaseId,
        party_type: partyType,
        entity_type: row['实体类型'] || null,
        name: row['主体名称'],
        unified_credit_code: row['统一社会信用代码'] || null,
        legal_representative: row['法定代表人'] || null,
        id_number: row['身份证号'] || null,
        birth_date: row['出生日期'] || null,
        contact_phone: row['联系电话'] || null,
        contact_email: row['联系邮箱'] || null,
        address: row['地址'] || null,
        region_code: row['地区代码'] || null,
        detail_address: row['详细地址'] || null,
        is_primary: isPrimary ? 1 : 0
      };
      
      const partyId = await LitigationParty.create(partyData);
      
      // 记录创建历史
      await PartyHistory.create({
        party_id: partyId,
        case_id: finalCaseId,
        action: 'CREATE',
        changed_fields: { created: partyData },
        changed_by: operator
      });
      
      // 记录案件日志
      await Case.addLog(
        finalCaseId,
        operator,
        `批量导入诉讼主体：${row['主体名称']}（${partyType}）${isPrimary ? ' [主要当事人]' : ''}`,
        'IMPORT_PARTY'
      );
      
      results.success++;
      if (fixedPartyType) {
        results.byType[fixedPartyType].success++;
      }
      
    } catch (error) {
      console.error('处理行数据错误:', error);
      results.failed++;
      if (fixedPartyType) {
        results.byType[fixedPartyType].failed++;
      }
      results.errors.push({
        sheet: sheetName,
        row: rowNumber,
        partyType: fixedPartyType || row['主体类型'] || '未知',
        field: '系统错误',
        message: error.message || '处理数据失败',
        data: row
      });
    }
  }
}

/**
 * 批量导入主体信息
 * POST /api/parties/import
 * 
 * 支持两种导入模式：
 * 1. multi-sheet: 按主体类型分sheet（原告信息、被告信息、第三人信息）
 * 2. single-sheet: 单sheet包含主体类型列
 * 
 * 请求参数：
 * - file: Excel文件（必填）
 * - importMode: 导入模式（multi-sheet / single-sheet，默认multi-sheet）
 * - updateMode: 重复数据处理模式（skip / update，默认skip）
 */
exports.importParties = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        error: {
          message: '请上传文件',
          status: 400
        }
      });
    }
    
    // 验证文件类型
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];
    
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({
        error: {
          message: '不支持的文件格式，请上传Excel或CSV文件',
          status: 400
        }
      });
    }
    
    const importMode = req.body.importMode || 'multi-sheet';
    const updateMode = req.body.updateMode || 'skip';
    const operator = req.user?.real_name || req.user?.username || '系统';
    
    // 读取Excel文件
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    
    // 初始化结果对象
    const results = {
      total: 0,
      success: 0,
      failed: 0,
      skipped: 0,
      updated: 0,
      byType: {
        '原告': { success: 0, failed: 0, skipped: 0, updated: 0 },
        '被告': { success: 0, failed: 0, skipped: 0, updated: 0 },
        '第三人': { success: 0, failed: 0, skipped: 0, updated: 0 }
      },
      errors: []
    };
    
    if (importMode === 'multi-sheet') {
      // 多sheet模式：按主体类型分sheet
      const sheetMapping = {
        '原告信息': '原告',
        '被告信息': '被告',
        '第三人信息': '第三人'
      };
      
      for (const [sheetName, partyType] of Object.entries(sheetMapping)) {
        if (workbook.Sheets[sheetName]) {
          const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
          if (data.length > 0) {
            await processSheetData(data, partyType, results, sheetName, operator, updateMode);
          }
        }
      }
      
      // 如果没有找到任何预定义的sheet，返回错误
      if (results.total === 0) {
        return res.status(400).json({
          error: {
            message: '未找到有效的sheet。多sheet模式需要包含"原告信息"、"被告信息"或"第三人信息"sheet',
            status: 400
          }
        });
      }
      
    } else {
      // 单sheet模式：包含主体类型列
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        return res.status(400).json({
          error: {
            message: 'Excel文件中未找到工作表',
            status: 400
          }
        });
      }
      
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet);
      
      if (data.length === 0) {
        return res.status(400).json({
          error: {
            message: 'Excel中没有数据',
            status: 400
          }
        });
      }
      
      await processSheetData(data, null, results, sheetName, operator, updateMode);
    }
    
    // 返回结果
    res.json({
      message: '导入完成',
      data: {
        summary: {
          total: results.total,
          success: results.success,
          failed: results.failed,
          skipped: results.skipped,
          updated: results.updated
        },
        byType: results.byType,
        errors: results.errors
      }
    });
    
  } catch (error) {
    console.error('批量导入主体信息错误:', error);
    res.status(500).json({
      error: {
        message: '批量导入失败: ' + error.message,
        status: 500
      }
    });
  }
};

/**
 * 下载导入模板
 * GET /api/parties/import/template
 * 
 * 生成包含三个sheet的Excel模板文件
 */
exports.downloadTemplate = async (req, res) => {
  try {
    const workbook = XLSX.utils.book_new();
    
    // 原告信息sheet
    const plaintiffData = [
      {
        '案件编号': '2024民初001',
        '主体名称': '张三',
        '实体类型': '个人',
        '身份证号': '110101199001011234',
        '出生日期': '1990-01-01',
        '联系电话': '13800138000',
        '联系邮箱': 'zhangsan@example.com',
        '地址': '北京市朝阳区某某街道'
      }
    ];
    const plaintiffSheet = XLSX.utils.json_to_sheet(plaintiffData);
    XLSX.utils.book_append_sheet(workbook, plaintiffSheet, '原告信息');
    
    // 被告信息sheet
    const defendantData = [
      {
        '案件编号': '2024民初001',
        '主体名称': '某某科技有限公司',
        '实体类型': '企业',
        '统一社会信用代码': '91110000XXXXXXXX',
        '法定代表人': '李四',
        '联系电话': '010-12345678',
        '联系邮箱': 'contact@company.com',
        '地址': '北京市海淀区某某大厦'
      }
    ];
    const defendantSheet = XLSX.utils.json_to_sheet(defendantData);
    XLSX.utils.book_append_sheet(workbook, defendantSheet, '被告信息');
    
    // 第三人信息sheet
    const thirdPartyData = [
      {
        '案件编号': '2024民初001',
        '主体名称': '王五',
        '实体类型': '个人',
        '身份证号': '110101199002021234',
        '出生日期': '1990-02-02',
        '联系电话': '13900139000',
        '联系邮箱': 'wangwu@example.com',
        '地址': '北京市东城区某某胡同'
      }
    ];
    const thirdPartySheet = XLSX.utils.json_to_sheet(thirdPartyData);
    XLSX.utils.book_append_sheet(workbook, thirdPartySheet, '第三人信息');

    // 字段说明 sheet（单独一页，包含字段名、说明、是否必填、示例、适用范围）
    const fieldDesc = [
      { 字段: '案件编号', 说明: '系统中的案件编号或内部编号，用于关联案件', 必填: '是', 示例: '2024民初001', 适用: '所有sheet' },
      { 字段: '主体类型', 说明: '主体角色：原告/被告/第三人（单sheet模式需要）', 必填: '单sheet模式必填', 示例: '原告', 适用: '单sheet' },
      { 字段: '主体名称', 说明: '主体的名称（个人姓名或公司名称）', 必填: '是', 示例: '张三/某某科技有限公司', 适用: '所有sheet' },
      { 字段: '实体类型', 说明: '主体是个人还是企业', 必填: '否', 示例: '个人/企业', 适用: '所有sheet' },
      { 字段: '统一社会信用代码', 说明: '企业的统一社会信用代码（企业适用）', 必填: '企业建议填写', 示例: '91110000XXXXXXXX', 适用: '企业' },
      { 字段: '法定代表人', 说明: '企业法定代表人姓名', 必填: '否', 示例: '李四', 适用: '企业' },
      { 字段: '身份证号', 说明: '个人身份证号码（个人适用）', 必填: '个人建议填写', 示例: '110101199001011234', 适用: '个人' },
      { 字段: '出生日期', 说明: '出生日期，格式 YYYY-MM-DD', 必填: '否', 示例: '1990-01-01', 适用: '个人' },
      { 字段: '联系电话', 说明: '联系电话或座机', 必填: '否', 示例: '13800138000/010-12345678', 适用: '所有sheet' },
      { 字段: '联系邮箱', 说明: '电子邮件地址', 必填: '否', 示例: 'zhangsan@example.com', 适用: '所有sheet' },
      { 字段: '地址', 说明: '通讯地址', 必填: '否', 示例: '北京市朝阳区某某街道', 适用: '所有sheet' },
      { 字段: '地区代码', 说明: '行政区划代码（可用于统计、定位）', 必填: '否', 示例: '110101', 适用: '所有sheet' },
      { 字段: '详细地址', 说明: '更细粒度的地址信息', 必填: '否', 示例: '朝阳区某某小区A座101', 适用: '所有sheet' }
    ];
    const descSheet = XLSX.utils.json_to_sheet(fieldDesc);
    XLSX.utils.book_append_sheet(workbook, descSheet, '字段说明');
    
    // 生成Excel文件
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    // 设置响应头
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=party_import_template.xlsx');
    
    res.send(buffer);
    
  } catch (error) {
    console.error('生成导入模板错误:', error);
    res.status(500).json({
      error: {
        message: '生成导入模板失败',
        status: 500
      }
    });
  }
};

// module exports: use the exported functions (some were attached to exports earlier)
module.exports = {
  upload,
  importParties: exports.importParties,
  downloadTemplate: exports.downloadTemplate
};
