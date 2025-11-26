const DocumentTemplate = require('../models/DocumentTemplate');

/**
 * 替换模板变量
 * @param {string} content - 模板内容
 * @param {Object} data - 数据对象
 * @returns {string} 替换后的内容
 */
const replaceVariables = (content, data) => {
  let result = content;
  
  // 替换 {{variable}} 格式的变量
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    result = result.replace(regex, data[key] || '');
  });
  
  return result;
};

/**
 * 根据模板生成文书
 * @param {number} templateId - 模板 ID
 * @param {Object} data - 填充数据
 * @returns {Promise<Object>} 生成的文书内容
 */
const generateDocument = async (templateId, data) => {
  const template = await DocumentTemplate.findById(templateId);
  
  if (!template) {
    throw new Error('模板不存在');
  }
  
  // 检查必需变量
  const requiredVars = template.variables.filter(v => v.required);
  const missingVars = requiredVars.filter(v => !data[v.name]);
  
  if (missingVars.length > 0) {
    throw new Error(`缺少必需变量: ${missingVars.map(v => v.name).join(', ')}`);
  }
  
  // 替换变量生成内容
  const generatedContent = replaceVariables(template.content, data);
  
  const { beijingNow } = require('../utils/time');
  return {
    template_id: templateId,
    template_name: template.template_name,
    document_type: template.document_type,
    content: generatedContent,
    generated_at: beijingNow(new Date())
  };
};

/**
 * 获取默认模板
 * @returns {Array} 默认模板列表
 */
const getDefaultTemplates = () => {
  return [
    {
      template_name: '民事起诉状模板',
      document_type: '起诉状',
      content: `民事起诉状

原告：{{plaintiff_name}}，{{plaintiff_gender}}，{{plaintiff_birth_date}}出生，{{plaintiff_ethnicity}}，住{{plaintiff_address}}，联系电话：{{plaintiff_phone}}。

被告：{{defendant_name}}，{{defendant_gender}}，{{defendant_birth_date}}出生，{{defendant_ethnicity}}，住{{defendant_address}}，联系电话：{{defendant_phone}}。

诉讼请求：
{{claims}}

事实与理由：
{{facts_and_reasons}}

证据和证据来源：
{{evidence_list}}

此致
{{court}}

                                                原告：{{plaintiff_name}}
                                                {{filing_date}}`,
      variables: [
        { name: 'plaintiff_name', label: '原告姓名', type: 'text', required: true },
        { name: 'plaintiff_gender', label: '原告性别', type: 'text', required: false },
        { name: 'plaintiff_birth_date', label: '原告出生日期', type: 'date', required: false },
        { name: 'plaintiff_ethnicity', label: '原告民族', type: 'text', required: false },
        { name: 'plaintiff_address', label: '原告住址', type: 'text', required: true },
        { name: 'plaintiff_phone', label: '原告电话', type: 'text', required: true },
        { name: 'defendant_name', label: '被告姓名', type: 'text', required: true },
        { name: 'defendant_gender', label: '被告性别', type: 'text', required: false },
        { name: 'defendant_birth_date', label: '被告出生日期', type: 'date', required: false },
        { name: 'defendant_ethnicity', label: '被告民族', type: 'text', required: false },
        { name: 'defendant_address', label: '被告住址', type: 'text', required: true },
        { name: 'defendant_phone', label: '被告电话', type: 'text', required: false },
        { name: 'claims', label: '诉讼请求', type: 'textarea', required: true },
        { name: 'facts_and_reasons', label: '事实与理由', type: 'textarea', required: true },
        { name: 'evidence_list', label: '证据清单', type: 'textarea', required: true },
        { name: 'court', label: '受理法院', type: 'text', required: true },
        { name: 'filing_date', label: '起诉日期', type: 'date', required: true }
      ],
      description: '标准民事起诉状模板'
    },
    {
      template_name: '授权委托书模板',
      document_type: '委托书',
      content: `授权委托书

委托人：{{client_name}}，{{client_gender}}，{{client_birth_date}}出生，住{{client_address}}，联系电话：{{client_phone}}。

受托人：{{attorney_name}}，{{attorney_firm}}律师，执业证号：{{attorney_license}}，联系电话：{{attorney_phone}}。

委托人因{{case_cause}}一案，依法委托上列受托人作为委托人的诉讼代理人。

代理权限：{{authority_scope}}

委托期限：{{delegation_period}}


                                                委托人：{{client_name}}
                                                {{delegation_date}}`,
      variables: [
        { name: 'client_name', label: '委托人姓名', type: 'text', required: true },
        { name: 'client_gender', label: '委托人性别', type: 'text', required: false },
        { name: 'client_birth_date', label: '委托人出生日期', type: 'date', required: false },
        { name: 'client_address', label: '委托人住址', type: 'text', required: true },
        { name: 'client_phone', label: '委托人电话', type: 'text', required: true },
        { name: 'attorney_name', label: '律师姓名', type: 'text', required: true },
        { name: 'attorney_firm', label: '律师事务所', type: 'text', required: true },
        { name: 'attorney_license', label: '律师执业证号', type: 'text', required: true },
        { name: 'attorney_phone', label: '律师电话', type: 'text', required: true },
        { name: 'case_cause', label: '案由', type: 'text', required: true },
        { name: 'authority_scope', label: '代理权限', type: 'textarea', required: true },
        { name: 'delegation_period', label: '委托期限', type: 'text', required: true },
        { name: 'delegation_date', label: '委托日期', type: 'date', required: true }
      ],
      description: '标准授权委托书模板'
    },
    {
      template_name: '答辩状模板',
      document_type: '答辩状',
      content: `答辩状

答辩人：{{defendant_name}}，{{defendant_gender}}，{{defendant_birth_date}}出生，住{{defendant_address}}，联系电话：{{defendant_phone}}。

针对原告{{plaintiff_name}}诉答辩人{{case_cause}}一案，答辩人提出如下答辩意见：

答辩意见：
{{defense_opinions}}

事实与理由：
{{facts_and_reasons}}

证据和证据来源：
{{evidence_list}}

综上所述，答辩人认为原告的诉讼请求缺乏事实和法律依据，请求人民法院依法驳回原告的诉讼请求。

此致
{{court}}

                                                答辩人：{{defendant_name}}
                                                {{response_date}}`,
      variables: [
        { name: 'defendant_name', label: '答辩人姓名', type: 'text', required: true },
        { name: 'defendant_gender', label: '答辩人性别', type: 'text', required: false },
        { name: 'defendant_birth_date', label: '答辩人出生日期', type: 'date', required: false },
        { name: 'defendant_address', label: '答辩人住址', type: 'text', required: true },
        { name: 'defendant_phone', label: '答辩人电话', type: 'text', required: false },
        { name: 'plaintiff_name', label: '原告姓名', type: 'text', required: true },
        { name: 'case_cause', label: '案由', type: 'text', required: true },
        { name: 'defense_opinions', label: '答辩意见', type: 'textarea', required: true },
        { name: 'facts_and_reasons', label: '事实与理由', type: 'textarea', required: true },
        { name: 'evidence_list', label: '证据清单', type: 'textarea', required: false },
        { name: 'court', label: '受理法院', type: 'text', required: true },
        { name: 'response_date', label: '答辩日期', type: 'date', required: true }
      ],
      description: '标准答辩状模板'
    }
  ];
};

module.exports = {
  generateDocument,
  replaceVariables,
  getDefaultTemplates
};
