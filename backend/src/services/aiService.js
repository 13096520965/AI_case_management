/**
 * AI服务集成模块
 * 支持多种AI服务提供商
 */

const axios = require('axios');

// AI服务配置
const AI_CONFIG = {
  provider: process.env.AI_PROVIDER || 'mock', // mock, openai, qianwen, wenxin
  apiKey: process.env.AI_API_KEY || '',
  apiUrl: process.env.AI_API_URL || '',
  model: process.env.AI_MODEL || 'gpt-3.5-turbo',
  timeout: parseInt(process.env.AI_TIMEOUT || '30000'),
  maxTokens: parseInt(process.env.AI_MAX_TOKENS || '2000')
};

/**
 * 调用AI服务生成文书
 */
async function generateDocumentWithAI(templateType, caseInfo, parties, extraInfo) {
  const prompt = buildDocumentPrompt(templateType, caseInfo, parties, extraInfo);
  
  try {
    const response = await callAIService(prompt, {
      temperature: 0.7,
      maxTokens: AI_CONFIG.maxTokens
    });
    
    return response;
  } catch (error) {
    console.error('AI文书生成失败:', error.message);
    // 降级到模板生成
    return generateDocumentByTemplate(templateType, caseInfo, parties, extraInfo);
  }
}

/**
 * 调用AI服务审核文书
 */
async function reviewDocumentWithAI(content, options, caseInfo) {
  const prompt = buildReviewPrompt(content, options, caseInfo);
  
  try {
    const response = await callAIService(prompt, {
      temperature: 0.3,
      maxTokens: AI_CONFIG.maxTokens
    });
    
    // 解析AI返回的审核结果
    return parseReviewResult(response);
  } catch (error) {
    console.error('AI文书审核失败:', error.message);
    // 降级到规则审核
    return performRuleBasedReview(content, options, caseInfo);
  }
}

/**
 * 构建文书生成提示词
 */
function buildDocumentPrompt(templateType, caseInfo, parties, extraInfo) {
  const templateNames = {
    complaint: '民事起诉状',
    defense: '民事答辩状',
    agency_opinion: '代理词',
    case_report: '案件汇报',
    evidence_list: '证据清单',
    legal_opinion: '法律意见书'
  };
  
  const templateName = templateNames[templateType] || '法律文书';
  
  const plaintiff = parties.find(p => p.party_type === '原告') || {};
  const defendant = parties.find(p => p.party_type === '被告') || {};
  
  return `你是一位专业的法律文书撰写专家。请根据以下案件信息，生成一份规范的${templateName}。

案件信息：
- 案由：${caseInfo.case_cause || '未提供'}
- 案号：${caseInfo.case_number || caseInfo.internal_number || '未提供'}
- 受理法院：${caseInfo.court || '未提供'}
- 标的额：${caseInfo.target_amount ? caseInfo.target_amount.toLocaleString() + '元' : '未提供'}
- 立案日期：${caseInfo.filing_date || '未提供'}

当事人信息：
${parties.map(p => `- ${p.party_type}：${p.name}（${p.entity_type}），联系电话：${p.contact_phone || '未提供'}，地址：${p.address || '未提供'}`).join('\n')}

补充信息：
${extraInfo.notes ? `- 案件说明：${extraInfo.notes}` : ''}
${extraInfo.lawyer ? `- 代理律师：${extraInfo.lawyer}` : ''}
${extraInfo.lawFirm ? `- 律师事务所：${extraInfo.lawFirm}` : ''}

要求：
1. 严格按照法律文书格式规范撰写
2. 内容完整、逻辑清晰、用语规范
3. 引用相关法律条文
4. 符合诉讼程序要求
5. 使用中文撰写

请直接输出文书内容，不要添加额外的说明。`;
}

/**
 * 构建文书审核提示词
 */
function buildReviewPrompt(content, options, caseInfo) {
  const checkItems = [];
  
  if (options.includes('compliance')) {
    checkItems.push('合规性检查：检查文书是否符合法律规定和诉讼程序要求');
  }
  if (options.includes('format')) {
    checkItems.push('格式检查：检查文书格式是否规范、结构是否完整');
  }
  if (options.includes('logic')) {
    checkItems.push('逻辑检查：检查论述逻辑是否清晰、前后是否一致');
  }
  if (options.includes('language')) {
    checkItems.push('语言检查：检查用语是否规范、是否有错别字或语病');
  }
  
  return `你是一位专业的法律文书审核专家。请对以下法律文书进行全面审核。

案件信息：
- 案由：${caseInfo.case_cause || '未提供'}
- 案号：${caseInfo.case_number || caseInfo.internal_number || '未提供'}
- 受理法院：${caseInfo.court || '未提供'}

审核项目：
${checkItems.join('\n')}

文书内容：
${content}

请按照以下JSON格式输出审核结果：
{
  "score": 85,
  "summary": "整体评价",
  "issues": [
    {
      "severity": "critical|warning|info",
      "category": "合规性|格式|逻辑|语言",
      "title": "问题标题",
      "location": "问题位置",
      "description": "问题描述",
      "suggestion": "修改建议",
      "reference": "法律依据（如有）"
    }
  ],
  "suggestions": [
    {
      "category": "分类",
      "content": "建议内容"
    }
  ]
}

请直接输出JSON格式的审核结果，不要添加其他内容。`;
}

/**
 * 调用AI服务
 */
async function callAIService(prompt, options = {}) {
  const provider = AI_CONFIG.provider;
  
  switch (provider) {
    case 'openai':
      return await callOpenAI(prompt, options);
    case 'qianwen':
      return await callQianwen(prompt, options);
    case 'wenxin':
      return await callWenxin(prompt, options);
    case 'mock':
    default:
      console.log('使用模拟AI服务');
      return null; // 返回null表示使用降级方案
  }
}

/**
 * 调用OpenAI API
 */
async function callOpenAI(prompt, options) {
  if (!AI_CONFIG.apiKey) {
    throw new Error('OpenAI API Key未配置');
  }
  
  const apiUrl = AI_CONFIG.apiUrl || 'https://api.openai.com/v1/chat/completions';
  
  const response = await axios.post(
    apiUrl,
    {
      model: AI_CONFIG.model,
      messages: [
        {
          role: 'system',
          content: '你是一位专业的法律文书撰写和审核专家，精通中国法律和诉讼程序。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || AI_CONFIG.maxTokens
    },
    {
      headers: {
        'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: AI_CONFIG.timeout
    }
  );
  
  return response.data.choices[0].message.content;
}

/**
 * 调用通义千问API
 */
async function callQianwen(prompt, options) {
  if (!AI_CONFIG.apiKey) {
    throw new Error('通义千问 API Key未配置');
  }
  
  const apiUrl = AI_CONFIG.apiUrl || 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
  
  const response = await axios.post(
    apiUrl,
    {
      model: AI_CONFIG.model || 'qwen-turbo',
      input: {
        messages: [
          {
            role: 'system',
            content: '你是一位专业的法律文书撰写和审核专家，精通中国法律和诉讼程序。'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      },
      parameters: {
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || AI_CONFIG.maxTokens
      }
    },
    {
      headers: {
        'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: AI_CONFIG.timeout
    }
  );
  
  return response.data.output.text;
}

/**
 * 调用文心一言API
 */
async function callWenxin(prompt, options) {
  if (!AI_CONFIG.apiKey) {
    throw new Error('文心一言 API Key未配置');
  }
  
  // 文心一言需要先获取access_token
  const accessToken = await getWenxinAccessToken();
  
  const apiUrl = AI_CONFIG.apiUrl || `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/${AI_CONFIG.model || 'completions'}?access_token=${accessToken}`;
  
  const response = await axios.post(
    apiUrl,
    {
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: options.temperature || 0.7,
      max_output_tokens: options.maxTokens || AI_CONFIG.maxTokens
    },
    {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: AI_CONFIG.timeout
    }
  );
  
  return response.data.result;
}

/**
 * 获取文心一言access_token
 */
async function getWenxinAccessToken() {
  const apiKey = AI_CONFIG.apiKey;
  const secretKey = process.env.AI_SECRET_KEY || '';
  
  const response = await axios.post(
    `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`,
    {},
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
  
  return response.data.access_token;
}

/**
 * 解析AI审核结果
 */
function parseReviewResult(aiResponse) {
  try {
    // 尝试解析JSON
    const result = JSON.parse(aiResponse);
    return result;
  } catch (error) {
    console.error('解析AI审核结果失败:', error.message);
    // 如果解析失败，返回基本结构
    return {
      score: 70,
      summary: 'AI审核结果解析失败，请手动检查',
      issues: [],
      suggestions: [
        {
          category: '系统提示',
          content: 'AI返回的结果格式不正确，建议使用规则审核'
        }
      ]
    };
  }
}

/**
 * 模板生成文书（降级方案）
 */
function generateDocumentByTemplate(templateType, caseInfo, parties, extraInfo) {
  const templates = {
    complaint: generateComplaint,
    defense: generateDefense,
    agency_opinion: generateAgencyOpinion,
    case_report: generateCaseReport,
    evidence_list: generateEvidenceList,
    legal_opinion: generateLegalOpinion
  };
  
  const generator = templates[templateType];
  if (!generator) {
    throw new Error('不支持的文书类型');
  }
  
  return generator(caseInfo, parties, extraInfo);
}

/**
 * 规则审核文书（降级方案）
 */
function performRuleBasedReview(content, options, caseInfo) {
  const issues = [];
  const suggestions = [];
  let score = 100;
  
  // 合规性检查
  if (options.includes('compliance')) {
    if (caseInfo.court && !content.includes(caseInfo.court)) {
      issues.push({
        severity: 'critical',
        category: '合规性',
        title: '管辖法院信息缺失',
        location: '文书抬头',
        description: `文书中未包含受理法院"${caseInfo.court}"的信息`,
        suggestion: `请在文书中明确标注受理法院为"${caseInfo.court}"`,
        reference: '《民事诉讼法》第21条'
      });
      score -= 15;
    }
    
    if (caseInfo.case_number && !content.includes(caseInfo.case_number)) {
      issues.push({
        severity: 'warning',
        category: '合规性',
        title: '案号信息缺失',
        location: '文书抬头',
        description: '文书中未包含案号信息',
        suggestion: `请添加案号：${caseInfo.case_number}`,
        reference: ''
      });
      score -= 10;
    }
  }
  
  // 格式检查
  if (options.includes('format')) {
    if (content.length < 100) {
      issues.push({
        severity: 'warning',
        category: '格式',
        title: '文书内容过短',
        location: '整体',
        description: '文书内容可能不够完整',
        suggestion: '请补充完整的事实陈述和法律依据',
        reference: ''
      });
      score -= 10;
    }
    
    if (!content.includes('此致') && !content.includes('具状人')) {
      suggestions.push({
        category: '格式',
        content: '建议添加规范的结尾格式，如"此致"、"具状人"等'
      });
    }
  }
  
  // 逻辑检查
  if (options.includes('logic')) {
    suggestions.push({
      category: '逻辑',
      content: '建议检查论述逻辑是否清晰，事实与理由是否充分'
    });
  }
  
  // 语言检查
  if (options.includes('language')) {
    // 简单的错别字检查
    const typos = [
      { wrong: '以至', correct: '以致', context: '表示因果关系' },
      { wrong: '即使', correct: '即便', context: '表示假设' }
    ];
    
    typos.forEach(typo => {
      if (content.includes(typo.wrong)) {
        issues.push({
          severity: 'info',
          category: '语言',
          title: '可能的用词不当',
          location: `包含"${typo.wrong}"的位置`,
          description: `"${typo.wrong}"在${typo.context}时，建议使用"${typo.correct}"`,
          suggestion: `将"${typo.wrong}"改为"${typo.correct}"`,
          reference: ''
        });
        score -= 2;
      }
    });
  }
  
  return {
    score: Math.max(score, 0),
    summary: score >= 90 ? '文书质量良好' : score >= 70 ? '文书基本符合要求，建议优化' : '文书存在较多问题，需要修改',
    issues,
    suggestions
  };
}

// 以下是模板生成函数（保持原有实现）
function generateComplaint(caseInfo, parties, extraInfo) {
  const plaintiff = parties.find(p => p.party_type === '原告') || {};
  const defendant = parties.find(p => p.party_type === '被告') || {};
  
  return `民事起诉状

原告：${plaintiff.name || '___'}，${plaintiff.entity_type === '自然人' ? '身份证号：' + (plaintiff.id_number || '___') : '统一社会信用代码：' + (plaintiff.unified_credit_code || '___')}
联系电话：${plaintiff.contact_phone || '___'}
住所地：${plaintiff.address || '___'}

被告：${defendant.name || '___'}，${defendant.entity_type === '自然人' ? '身份证号：' + (defendant.id_number || '___') : '统一社会信用代码：' + (defendant.unified_credit_code || '___')}
联系电话：${defendant.contact_phone || '___'}
住所地：${defendant.address || '___'}

诉讼请求：
1. 请求依法判令被告${defendant.name || '___'}支付原告${plaintiff.name || '___'}款项人民币${(caseInfo.target_amount || 0).toLocaleString()}元；
2. 本案诉讼费用由被告承担。

事实与理由：
${caseInfo.case_cause || '___'}纠纷一案，原告与被告之间存在${caseInfo.case_cause || '___'}关系。${extraInfo.notes || '（此处应详细陈述案件事实和理由）'}

综上所述，原告认为被告的行为已严重侵害了原告的合法权益，为维护原告的合法权益，特依法向贵院提起诉讼，请求依法支持原告的诉讼请求。

此致
${caseInfo.court || '___人民法院'}

具状人（原告）：${plaintiff.name || '___'}
代理律师：${extraInfo.lawyer || '___'}
律师事务所：${extraInfo.lawFirm || '___'}

${new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}`;
}

function generateDefense(caseInfo, parties, extraInfo) {
  const defendant = parties.find(p => p.party_type === '被告') || {};
  const plaintiff = parties.find(p => p.party_type === '原告') || {};
  
  return `民事答辩状

答辩人：${defendant.name || '___'}，${defendant.entity_type === '自然人' ? '身份证号：' + (defendant.id_number || '___') : '统一社会信用代码：' + (defendant.unified_credit_code || '___')}
联系电话：${defendant.contact_phone || '___'}
住所地：${defendant.address || '___'}

针对原告：${plaintiff.name || '___'}
案由：${caseInfo.case_cause || '___'}纠纷
案号：${caseInfo.case_number || caseInfo.internal_number || '___'}

答辩意见：

一、原告的诉讼请求缺乏事实和法律依据
${extraInfo.notes || '（此处应详细陈述答辩理由）'}

二、答辩人依法不应承担相关责任
（此处应详细说明答辩理由）

综上所述，原告的诉讼请求缺乏事实和法律依据，请求贵院依法驳回原告的诉讼请求。

此致
${caseInfo.court || '___人民法院'}

答辩人：${defendant.name || '___'}
代理律师：${extraInfo.lawyer || '___'}
律师事务所：${extraInfo.lawFirm || '___'}

${new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}`;
}

function generateAgencyOpinion(caseInfo, parties, extraInfo) {
  return `代理词

审判长、审判员：
受${parties[0]?.name || '___'}的委托，${extraInfo.lawFirm || '___律师事务所'}指派我担任其在${caseInfo.case_cause || '___'}纠纷一案中的诉讼代理人。现根据庭审查明的事实和相关法律规定，发表如下代理意见：

一、案件事实清楚，证据充分
${extraInfo.notes || '（此处应详细陈述案件事实）'}

二、法律适用正确
（此处应引用相关法律条文）

三、诉讼请求合理合法
（此处应说明诉讼请求的合理性）

综上所述，请求贵院依法支持我方的诉讼请求。

代理人：${extraInfo.lawyer || '___'}
${extraInfo.lawFirm || '___'}

${new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}`;
}

function generateCaseReport(caseInfo, parties, extraInfo) {
  return `案件汇报

案号：${caseInfo.case_number || caseInfo.internal_number || '___'}
案由：${caseInfo.case_cause || '___'}纠纷
受理法院：${caseInfo.court || '___'}
标的额：${(caseInfo.target_amount || 0).toLocaleString()}元
立案日期：${caseInfo.filing_date || '___'}

一、案件基本情况
${extraInfo.notes || '（此处应详细说明案件基本情况）'}

二、当事人情况
${parties.map((p, i) => `${i + 1}. ${p.party_type}：${p.name}，${p.entity_type}，联系电话：${p.contact_phone}`).join('\n')}

三、案件进展情况
（此处应说明案件当前进展）

四、存在的问题和风险
（此处应分析案件风险）

五、下一步工作计划
（此处应说明后续工作安排）

汇报人：${extraInfo.lawyer || '___'}
汇报日期：${new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}`;
}

function generateEvidenceList(caseInfo, parties, extraInfo) {
  return `证据清单

案号：${caseInfo.case_number || caseInfo.internal_number || '___'}
案由：${caseInfo.case_cause || '___'}纠纷
提交人：${parties[0]?.name || '___'}

序号 | 证据名称 | 证据来源 | 证明目的 | 页数 | 备注
-----|----------|----------|----------|------|------
1    | （待补充）| （待补充）| （待补充）| （待补充）| （待补充）
2    | （待补充）| （待补充）| （待补充）| （待补充）| （待补充）
3    | （待补充）| （待补充）| （待补充）| （待补充）| （待补充）

${extraInfo.notes || ''}

提交人：${parties[0]?.name || '___'}
代理律师：${extraInfo.lawyer || '___'}
提交日期：${new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}`;
}

function generateLegalOpinion(caseInfo, parties, extraInfo) {
  return `法律意见书

致：${parties[0]?.name || '___'}

关于：${caseInfo.case_cause || '___'}纠纷的法律意见

${extraInfo.lawFirm || '___律师事务所'}接受您的委托，就${caseInfo.case_cause || '___'}纠纷一案进行法律分析，现出具法律意见如下：

一、案件基本情况
${extraInfo.notes || '（此处应详细说明案件情况）'}

二、法律分析
（此处应进行详细的法律分析）

三、风险提示
（此处应说明可能存在的法律风险）

四、法律建议
（此处应提出具体的法律建议）

以上意见，供参考。

${extraInfo.lawFirm || '___'}
律师：${extraInfo.lawyer || '___'}

${new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}`;
}

/**
 * 通用对话接口
 * 用于法盾助手等对话场景
 */
async function chat(prompt, options = {}) {
  try {
    const response = await callAIService(prompt, {
      temperature: options.temperature || 0.7,
      maxTokens: options.maxTokens || 1000
    });
    
    return response;
  } catch (error) {
    console.error('AI对话失败:', error.message);
    // 降级到默认回复
    return getMockChatResponse(prompt);
  }
}

/**
 * 模拟对话回复（降级方案）
 */
function getMockChatResponse(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  
  // 简单的关键词匹配
  if (lowerPrompt.includes('案件') || lowerPrompt.includes('诉讼')) {
    return '您好！关于案件管理，您可以在"案件列表"页面查看所有案件信息，或使用搜索功能快速定位特定案件。如需详细帮助，请告诉我具体需求。';
  }
  
  if (lowerPrompt.includes('文书') || lowerPrompt.includes('起诉状') || lowerPrompt.includes('答辩状')) {
    return '关于法律文书，系统提供了智能文书生成功能。您可以前往"文书管理"→"智能文书"，选择文书类型和案件信息，系统会自动生成规范的法律文书。';
  }
  
  if (lowerPrompt.includes('费用') || lowerPrompt.includes('成本') || lowerPrompt.includes('诉讼费')) {
    return '关于费用管理，您可以使用"费用计算器"功能，系统会根据标的额自动计算诉讼费用。同时在"成本分析"页面可以查看详细的费用统计。';
  }
  
  if (lowerPrompt.includes('提醒') || lowerPrompt.includes('待办') || lowerPrompt.includes('通知')) {
    return '系统会自动跟踪案件进度并发送提醒。您可以在"提醒中心"查看所有待办事项和超期节点。重要节点会通过系统通知提醒您。';
  }
  
  if (lowerPrompt.includes('帮助') || lowerPrompt.includes('怎么') || lowerPrompt.includes('如何')) {
    return '我是法盾助手，可以帮您：\n1. 查询和管理案件信息\n2. 生成和审核法律文书\n3. 计算诉讼费用\n4. 提醒重要节点\n5. 解答系统使用问题\n\n请告诉我您需要什么帮助？';
  }
  
  // 默认回复
  return '感谢您的咨询。我是法盾助手，专注于法律案件管理。请告诉我您的具体需求，我会尽力帮助您。您也可以输入"帮助"查看我能提供的服务。';
}

module.exports = {
  generateDocumentWithAI,
  reviewDocumentWithAI,
  chat,
  AI_CONFIG
};
