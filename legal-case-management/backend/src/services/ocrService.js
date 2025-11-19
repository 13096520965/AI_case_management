/**
 * OCR 识别服务
 * 当前为模拟实现，预留对接第三方 OCR 服务的接口
 */

/**
 * 模拟 OCR 识别结果
 * @param {string} documentType - 文书类型
 * @returns {Object} 模拟的识别结果
 */
const generateMockOCRResult = (documentType) => {
  const mockResults = {
    '起诉状': {
      title: '民事起诉状',
      plaintiff: '张三',
      defendant: '李四',
      case_cause: '合同纠纷',
      claims: [
        '请求判令被告支付货款人民币100,000元',
        '请求判令被告承担本案诉讼费用'
      ],
      facts: '原告与被告于2023年1月签订买卖合同，约定被告向原告购买货物，总价款100,000元。原告已按约交付货物，但被告至今未支付货款。',
      evidence: ['买卖合同', '送货单', '催款函'],
      court: '某某区人民法院',
      date: '2024年1月15日'
    },
    '判决书': {
      title: '民事判决书',
      case_number: '(2024)某0101民初1234号',
      plaintiff: '张三',
      defendant: '李四',
      case_cause: '合同纠纷',
      judgment: '一、被告李四于本判决生效之日起十日内支付原告张三货款人民币100,000元；二、案件受理费2,300元，由被告李四负担。',
      court: '某某区人民法院',
      judge: '王法官',
      date: '2024年3月20日'
    },
    '合同': {
      title: '买卖合同',
      party_a: '甲方：某某公司',
      party_b: '乙方：某某企业',
      contract_number: 'HT-2024-001',
      subject: '货物买卖',
      amount: '人民币100,000元',
      payment_terms: '货到付款',
      delivery_date: '2024年2月1日',
      signing_date: '2024年1月15日'
    }
  };

  return mockResults[documentType] || {
    title: '文书标题',
    content: '这是模拟的OCR识别内容。实际使用时，此处将返回第三方OCR服务识别的真实文本内容。',
    confidence: 0.95,
    note: '当前为模拟数据，需对接真实OCR服务'
  };
};

/**
 * 执行 OCR 识别（模拟实现）
 * @param {string} filePath - 文件路径
 * @param {string} documentType - 文书类型
 * @returns {Promise<Object>} OCR 识别结果
 */
const performOCR = async (filePath, documentType) => {
  // 模拟 OCR 处理延迟
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 返回模拟结果
  const result = generateMockOCRResult(documentType);
  
  return {
    success: true,
    file_path: filePath,
    document_type: documentType,
    extracted_data: result,
    confidence: 0.95,
    processing_time: '1.2s',
    note: '这是模拟的OCR识别结果。实际使用时需要对接第三方OCR服务（如百度OCR、腾讯OCR、阿里云OCR等）。'
  };
};

/**
 * 对接第三方 OCR 服务的接口（预留）
 * @param {string} filePath - 文件路径
 * @param {Object} options - OCR 选项
 * @returns {Promise<Object>} OCR 识别结果
 */
const callThirdPartyOCR = async (filePath, options = {}) => {
  // TODO: 实现对接第三方 OCR 服务
  // 示例：
  // const response = await axios.post('https://ocr-api.example.com/recognize', {
  //   image: fs.readFileSync(filePath, 'base64'),
  //   language: options.language || 'zh-CN',
  //   document_type: options.documentType
  // });
  // return response.data;

  throw new Error('第三方OCR服务尚未配置。请在此方法中实现具体的OCR服务对接逻辑。');
};

/**
 * 提取文书关键信息
 * @param {Object} ocrResult - OCR 识别结果
 * @param {string} documentType - 文书类型
 * @returns {Object} 结构化的关键信息
 */
const extractKeyInformation = (ocrResult, documentType) => {
  // 根据文书类型提取关键信息
  const keyInfo = {
    document_type: documentType,
    extracted_fields: {}
  };

  if (documentType === '起诉状') {
    keyInfo.extracted_fields = {
      plaintiff: ocrResult.plaintiff || null,
      defendant: ocrResult.defendant || null,
      case_cause: ocrResult.case_cause || null,
      claims: ocrResult.claims || [],
      court: ocrResult.court || null
    };
  } else if (documentType === '判决书') {
    keyInfo.extracted_fields = {
      case_number: ocrResult.case_number || null,
      plaintiff: ocrResult.plaintiff || null,
      defendant: ocrResult.defendant || null,
      judgment: ocrResult.judgment || null,
      judge: ocrResult.judge || null
    };
  } else if (documentType === '合同') {
    keyInfo.extracted_fields = {
      party_a: ocrResult.party_a || null,
      party_b: ocrResult.party_b || null,
      contract_number: ocrResult.contract_number || null,
      amount: ocrResult.amount || null,
      signing_date: ocrResult.signing_date || null
    };
  }

  return keyInfo;
};

module.exports = {
  performOCR,
  callThirdPartyOCR,
  extractKeyInformation,
  generateMockOCRResult
};
