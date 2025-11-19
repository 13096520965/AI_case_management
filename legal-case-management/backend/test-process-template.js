const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

// Test credentials
const testUser = {
  username: 'testuser',
  password: 'password123'
};

let authToken = '';

/**
 * 登录获取 token
 */
async function login() {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, testUser);
    authToken = response.data.data.token;
    console.log('✓ 登录成功');
    return true;
  } catch (error) {
    console.error('✗ 登录失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 获取所有流程模板
 */
async function getTemplates() {
  try {
    const response = await axios.get(`${API_BASE_URL}/templates`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('\n✓ 获取流程模板列表成功');
    console.log(`  找到 ${response.data.data.templates.length} 个模板:`);
    response.data.data.templates.forEach(t => {
      console.log(`  - ${t.template_name} (${t.case_type}) ${t.is_default ? '[默认]' : ''}`);
    });
    return response.data.data.templates;
  } catch (error) {
    console.error('✗ 获取流程模板列表失败:', error.response?.data || error.message);
    return [];
  }
}

/**
 * 获取特定案件类型的模板
 */
async function getTemplatesByCaseType(caseType) {
  try {
    const response = await axios.get(`${API_BASE_URL}/templates`, {
      params: { case_type: caseType },
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log(`\n✓ 获取 "${caseType}" 类型的模板成功`);
    console.log(`  找到 ${response.data.data.templates.length} 个模板`);
    return response.data.data.templates;
  } catch (error) {
    console.error(`✗ 获取 "${caseType}" 类型的模板失败:`, error.response?.data || error.message);
    return [];
  }
}

/**
 * 获取模板详情（包含节点）
 */
async function getTemplateDetail(templateId) {
  try {
    const response = await axios.get(`${API_BASE_URL}/templates/${templateId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const template = response.data.data.template;
    console.log(`\n✓ 获取模板详情成功: ${template.template_name}`);
    console.log(`  案件类型: ${template.case_type}`);
    console.log(`  节点数量: ${template.nodes.length}`);
    console.log('  节点列表:');
    template.nodes.forEach(node => {
      console.log(`    ${node.node_order}. ${node.node_name} (${node.node_type}) - ${node.deadline_days}天`);
    });
    return template;
  } catch (error) {
    console.error('✗ 获取模板详情失败:', error.response?.data || error.message);
    return null;
  }
}

/**
 * 创建自定义模板
 */
async function createCustomTemplate() {
  try {
    const customTemplate = {
      template_name: '简易民事案件流程',
      case_type: '民事',
      description: '简易程序民事案件流程',
      is_default: 0,
      nodes: [
        { node_type: '立案', node_name: '立案受理', deadline_days: 3, node_order: 1, description: '简易程序立案' },
        { node_type: '送达', node_name: '送达起诉状', deadline_days: 3, node_order: 2, description: '送达起诉状副本' },
        { node_type: '开庭', node_name: '开庭审理', deadline_days: 15, node_order: 3, description: '简易程序开庭' },
        { node_type: '判决', node_name: '宣判', deadline_days: 15, node_order: 4, description: '作出判决' }
      ]
    };

    const response = await axios.post(`${API_BASE_URL}/templates`, customTemplate, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('\n✓ 创建自定义模板成功');
    console.log(`  模板ID: ${response.data.data.template.id}`);
    console.log(`  模板名称: ${response.data.data.template.template_name}`);
    return response.data.data.template;
  } catch (error) {
    console.error('✗ 创建自定义模板失败:', error.response?.data || error.message);
    return null;
  }
}

/**
 * 更新模板
 */
async function updateTemplate(templateId) {
  try {
    const updateData = {
      description: '更新后的描述信息',
      nodes: [
        { node_type: '立案', node_name: '立案受理（更新）', deadline_days: 5, node_order: 1, description: '更新后的立案' },
        { node_type: '开庭', node_name: '开庭审理（更新）', deadline_days: 20, node_order: 2, description: '更新后的开庭' }
      ]
    };

    const response = await axios.put(`${API_BASE_URL}/templates/${templateId}`, updateData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('\n✓ 更新模板成功');
    console.log(`  模板ID: ${response.data.data.template.id}`);
    console.log(`  节点数量: ${response.data.data.template.nodes.length}`);
    return response.data.data.template;
  } catch (error) {
    console.error('✗ 更新模板失败:', error.response?.data || error.message);
    return null;
  }
}

/**
 * 创建测试案件
 */
async function createTestCase() {
  try {
    const caseData = {
      case_number: 'TEST-2024-001',
      case_type: '民事',
      case_cause: '合同纠纷',
      court: '测试法院',
      target_amount: 100000,
      filing_date: '2024-01-15'
    };

    const response = await axios.post(`${API_BASE_URL}/cases`, caseData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('\n✓ 创建测试案件成功');
    console.log(`  案件ID: ${response.data.data.case.id}`);
    console.log(`  案号: ${response.data.data.case.case_number}`);
    return response.data.data.case;
  } catch (error) {
    console.error('✗ 创建测试案件失败:', error.response?.data || error.message);
    return null;
  }
}

/**
 * 应用模板到案件（使用默认模板）
 */
async function applyDefaultTemplateToCase(caseId, caseType) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/templates/apply/${caseId}`,
      { case_type: caseType },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    console.log(`\n✓ 应用默认模板到案件成功`);
    console.log(`  创建了 ${response.data.data.nodes.length} 个流程节点`);
    response.data.data.nodes.forEach(node => {
      console.log(`    - ${node.node_name} (${node.status})`);
    });
    return response.data.data.nodes;
  } catch (error) {
    console.error('✗ 应用模板到案件失败:', error.response?.data || error.message);
    return [];
  }
}

/**
 * 应用指定模板到案件
 */
async function applySpecificTemplateToCase(caseId, templateId, caseType) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/templates/apply/${caseId}`,
      { template_id: templateId, case_type: caseType },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    console.log(`\n✓ 应用指定模板到案件成功`);
    console.log(`  创建了 ${response.data.data.nodes.length} 个流程节点`);
    return response.data.data.nodes;
  } catch (error) {
    console.error('✗ 应用指定模板到案件失败:', error.response?.data || error.message);
    return [];
  }
}

/**
 * 删除模板
 */
async function deleteTemplate(templateId) {
  try {
    await axios.delete(`${API_BASE_URL}/templates/${templateId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log(`\n✓ 删除模板成功 (ID: ${templateId})`);
    return true;
  } catch (error) {
    console.error('✗ 删除模板失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 运行所有测试
 */
async function runTests() {
  console.log('========================================');
  console.log('流程模板管理功能测试');
  console.log('========================================');

  // 1. 登录
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.error('\n测试终止：登录失败');
    return;
  }

  // 2. 获取所有模板（应该包含4个默认模板）
  const allTemplates = await getTemplates();

  // 3. 获取特定类型的模板
  await getTemplatesByCaseType('民事');
  await getTemplatesByCaseType('刑事');

  // 4. 获取模板详情
  if (allTemplates.length > 0) {
    await getTemplateDetail(allTemplates[0].id);
  }

  // 5. 创建自定义模板
  const customTemplate = await createCustomTemplate();

  // 6. 更新模板
  if (customTemplate) {
    await updateTemplate(customTemplate.id);
  }

  // 7. 创建测试案件
  const testCase = await createTestCase();

  // 8. 应用默认模板到案件
  if (testCase) {
    await applyDefaultTemplateToCase(testCase.id, '民事');
  }

  // 9. 创建另一个测试案件并应用自定义模板
  const testCase2Data = {
    case_number: 'TEST-2024-002',
    case_type: '民事',
    case_cause: '借款纠纷',
    court: '测试法院',
    target_amount: 50000,
    filing_date: '2024-01-20'
  };

  try {
    const response = await axios.post(`${API_BASE_URL}/cases`, testCase2Data, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const testCase2 = response.data.data.case;
    console.log(`\n✓ 创建第二个测试案件成功 (ID: ${testCase2.id})`);

    if (customTemplate) {
      await applySpecificTemplateToCase(testCase2.id, customTemplate.id, '民事');
    }
  } catch (error) {
    console.error('✗ 创建第二个测试案件失败');
  }

  // 10. 删除自定义模板
  if (customTemplate) {
    await deleteTemplate(customTemplate.id);
  }

  // 11. 再次获取所有模板，验证删除成功
  console.log('\n--- 验证删除后的模板列表 ---');
  await getTemplates();

  console.log('\n========================================');
  console.log('测试完成！');
  console.log('========================================');
}

// 运行测试
runTests().catch(error => {
  console.error('测试执行出错:', error);
  process.exit(1);
});
