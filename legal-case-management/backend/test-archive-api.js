/**
 * 归档管理 API 测试脚本
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// 测试用户凭证
let authToken = '';
let testCaseId = null;
let testReportId = null;
let testPackageId = null;
let testKnowledgeId = null;

/**
 * 登录获取 token
 */
async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'testuser',
      password: 'password123'
    });
    authToken = response.data.data.token;
    console.log('✓ 登录成功');
    return true;
  } catch (error) {
    console.error('✗ 登录失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 创建测试案件
 */
async function createTestCase() {
  try {
    const response = await axios.post(
      `${BASE_URL}/cases`,
      {
        case_type: '民事',
        case_cause: '合同纠纷',
        court: '北京市朝阳区人民法院',
        target_amount: 100000,
        filing_date: '2024-01-15',
        status: 'closed'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    testCaseId = response.data.data.case.id;
    console.log('✓ 创建测试案件成功, ID:', testCaseId);
    return true;
  } catch (error) {
    console.error('✗ 创建测试案件失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试创建结案报告
 */
async function testCreateClosureReport() {
  try {
    const response = await axios.post(
      `${BASE_URL}/archive/closure-report`,
      {
        case_id: testCaseId,
        case_summary: '本案为合同纠纷案件，原告诉被告违约，要求赔偿损失。',
        case_result: '胜诉',
        experience_summary: '本案关键在于证据链的完整性，成功举证了被告的违约行为。',
        risk_warnings: '注意合同条款的明确性，避免歧义。',
        lessons_learned: '及时固定证据，保留完整的交易记录。',
        created_by: 'testuser',
        approval_status: 'draft'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    testReportId = response.data.data.report.id;
    console.log('✓ 创建结案报告成功');
    console.log('  报告ID:', testReportId);
    return true;
  } catch (error) {
    console.error('✗ 创建结案报告失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试获取结案报告
 */
async function testGetClosureReport() {
  try {
    const response = await axios.get(
      `${BASE_URL}/archive/closure-report/${testCaseId}`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    console.log('✓ 获取结案报告成功');
    console.log('  案件总结:', response.data.data.report.case_summary.substring(0, 30) + '...');
    return true;
  } catch (error) {
    console.error('✗ 获取结案报告失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试更新结案报告
 */
async function testUpdateClosureReport() {
  try {
    const response = await axios.put(
      `${BASE_URL}/archive/closure-report/${testReportId}`,
      {
        approval_status: 'approved',
        approved_by: 'manager'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    console.log('✓ 更新结案报告成功');
    console.log('  审批状态:', response.data.data.report.approval_status);
    return true;
  } catch (error) {
    console.error('✗ 更新结案报告失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试创建归档包
 */
async function testCreateArchivePackage() {
  try {
    const response = await axios.post(
      `${BASE_URL}/archive/package`,
      {
        case_id: testCaseId,
        archived_by: 'testuser',
        notes: '案件已结案，所有材料齐全，可以归档。'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    testPackageId = response.data.data.package.id;
    console.log('✓ 创建归档包成功');
    console.log('  归档编号:', response.data.data.package.archive_number);
    console.log('  归档日期:', response.data.data.package.archive_date);
    console.log('  数据摘要:');
    console.log('    - 诉讼主体数量:', response.data.data.summary.parties_count);
    console.log('    - 流程节点数量:', response.data.data.summary.nodes_count);
    console.log('    - 证据数量:', response.data.data.summary.evidence_count);
    console.log('    - 文书数量:', response.data.data.summary.documents_count);
    console.log('    - 成本记录数量:', response.data.data.summary.costs_count);
    return true;
  } catch (error) {
    console.error('✗ 创建归档包失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试检索归档案件
 */
async function testSearchArchivePackages() {
  try {
    const response = await axios.get(
      `${BASE_URL}/archive/search`,
      {
        params: {
          page: 1,
          limit: 10,
          case_cause: '合同'
        },
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    console.log('✓ 检索归档案件成功');
    console.log('  找到归档包数量:', response.data.data.packages.length);
    console.log('  总数:', response.data.data.pagination.total);
    return true;
  } catch (error) {
    console.error('✗ 检索归档案件失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试获取归档包详情
 */
async function testGetArchivePackageById() {
  try {
    const response = await axios.get(
      `${BASE_URL}/archive/package/${testPackageId}`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    console.log('✓ 获取归档包详情成功');
    console.log('  归档编号:', response.data.data.package.archive_number);
    console.log('  案件编号:', response.data.data.case.internal_number);
    return true;
  } catch (error) {
    console.error('✗ 获取归档包详情失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试创建案例知识
 */
async function testCreateCaseKnowledge() {
  try {
    const response = await axios.post(
      `${BASE_URL}/archive/knowledge`,
      {
        case_id: testCaseId,
        archive_package_id: testPackageId,
        case_cause: '合同纠纷',
        dispute_focus: '合同履行义务的认定',
        legal_issues: '合同法第107条、第113条的适用',
        case_result: '胜诉',
        key_evidence: '合同原件、付款凭证、催告函',
        legal_basis: '《民法典》合同编相关规定',
        case_analysis: '本案争议焦点在于被告是否履行了合同约定的义务。通过完整的证据链证明被告存在违约行为。',
        practical_significance: '本案对于类似合同纠纷案件具有参考价值，特别是在证据固定和举证责任分配方面。',
        keywords: '合同纠纷,违约责任,损害赔偿',
        tags: '民事,合同,胜诉',
        win_rate_reference: 85.5,
        created_by: 'testuser'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    testKnowledgeId = response.data.data.knowledge.id;
    console.log('✓ 创建案例知识成功');
    console.log('  知识ID:', testKnowledgeId);
    return true;
  } catch (error) {
    console.error('✗ 创建案例知识失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试检索案例知识库
 */
async function testSearchCaseKnowledge() {
  try {
    const response = await axios.get(
      `${BASE_URL}/archive/knowledge`,
      {
        params: {
          page: 1,
          limit: 10,
          keywords: '合同'
        },
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    console.log('✓ 检索案例知识库成功');
    console.log('  找到案例数量:', response.data.data.knowledge.length);
    console.log('  总数:', response.data.data.pagination.total);
    return true;
  } catch (error) {
    console.error('✗ 检索案例知识库失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试按案由分类统计
 */
async function testGetCaseKnowledgeStatistics() {
  try {
    const response = await axios.get(
      `${BASE_URL}/archive/knowledge/statistics`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    console.log('✓ 获取案例知识统计成功');
    console.log('  分类统计:', response.data.data.statistics);
    return true;
  } catch (error) {
    console.error('✗ 获取案例知识统计失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试更新案例知识
 */
async function testUpdateCaseKnowledge() {
  try {
    const response = await axios.put(
      `${BASE_URL}/archive/knowledge/${testKnowledgeId}`,
      {
        win_rate_reference: 90.0,
        tags: '民事,合同,胜诉,典型案例'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    console.log('✓ 更新案例知识成功');
    console.log('  胜诉率参考:', response.data.data.knowledge.win_rate_reference);
    return true;
  } catch (error) {
    console.error('✗ 更新案例知识失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 运行所有测试
 */
async function runTests() {
  console.log('\n========================================');
  console.log('归档管理 API 测试');
  console.log('========================================\n');

  // 登录
  console.log('1. 用户认证测试');
  if (!await login()) {
    console.log('\n测试终止：无法登录');
    return;
  }

  // 创建测试案件
  console.log('\n2. 创建测试案件');
  if (!await createTestCase()) {
    console.log('\n测试终止：无法创建测试案件');
    return;
  }

  // 结案报告测试
  console.log('\n3. 结案报告管理测试');
  await testCreateClosureReport();
  await testGetClosureReport();
  await testUpdateClosureReport();

  // 归档包测试
  console.log('\n4. 归档包管理测试');
  await testCreateArchivePackage();
  await testSearchArchivePackages();
  await testGetArchivePackageById();

  // 案例知识库测试
  console.log('\n5. 案例知识库测试');
  await testCreateCaseKnowledge();
  await testSearchCaseKnowledge();
  await testGetCaseKnowledgeStatistics();
  await testUpdateCaseKnowledge();

  console.log('\n========================================');
  console.log('测试完成');
  console.log('========================================\n');
}

// 运行测试
runTests().catch(error => {
  console.error('测试执行出错:', error);
  process.exit(1);
});
