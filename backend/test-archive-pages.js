const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
let authToken = '';
let testCaseId = null;
let testReportId = null;
let testPackageId = null;
let testKnowledgeId = null;

// 测试用户登录
async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    authToken = response.data.data.token;
    console.log('✓ 登录成功');
    return true;
  } catch (error) {
    console.error('✗ 登录失败:', error.response?.data || error.message);
    return false;
  }
}

// 创建测试案件
async function createTestCase() {
  try {
    const response = await axios.post(
      `${BASE_URL}/cases`,
      {
        case_number: 'TEST-2024-001',
        internal_number: 'INT-2024-001',
        case_type: '民事',
        case_cause: '买卖合同纠纷',
        court: '测试法院',
        target_amount: 100000,
        filing_date: '2024-01-01',
        status: '已结案'
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

// 测试创建结案报告
async function testCreateClosureReport() {
  try {
    const response = await axios.post(
      `${BASE_URL}/archive/closure-report`,
      {
        case_id: testCaseId,
        case_summary: '这是一个测试案件的概述',
        case_result: '胜诉',
        experience_summary: '成功的经验总结',
        risk_warnings: '需要注意的风险点',
        lessons_learned: '经验教训',
        approval_status: '草稿',
        created_by: 'admin'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    testReportId = response.data.data.report.id;
    console.log('✓ 创建结案报告成功, ID:', testReportId);
    return true;
  } catch (error) {
    console.error('✗ 创建结案报告失败:', error.response?.data || error.message);
    return false;
  }
}

// 测试获取结案报告
async function testGetClosureReport() {
  try {
    const response = await axios.get(
      `${BASE_URL}/archive/closure-report/${testCaseId}`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    console.log('✓ 获取结案报告成功');
    return true;
  } catch (error) {
    console.error('✗ 获取结案报告失败:', error.response?.data || error.message);
    return false;
  }
}

// 测试更新结案报告
async function testUpdateClosureReport() {
  try {
    await axios.put(
      `${BASE_URL}/archive/closure-report/${testReportId}`,
      {
        approval_status: '待审批'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    console.log('✓ 更新结案报告成功');
    return true;
  } catch (error) {
    console.error('✗ 更新结案报告失败:', error.response?.data || error.message);
    return false;
  }
}

// 测试创建归档包
async function testCreateArchivePackage() {
  try {
    const response = await axios.post(
      `${BASE_URL}/archive/package`,
      {
        case_id: testCaseId,
        archived_by: 'admin',
        notes: '测试归档包'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    testPackageId = response.data.data.package.id;
    console.log('✓ 创建归档包成功, ID:', testPackageId);
    console.log('  归档编号:', response.data.data.package.archive_number);
    return true;
  } catch (error) {
    console.error('✗ 创建归档包失败:', error.response?.data || error.message);
    return false;
  }
}

// 测试检索归档案件
async function testSearchArchive() {
  try {
    const response = await axios.get(
      `${BASE_URL}/archive/search`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        params: {
          page: 1,
          limit: 10
        }
      }
    );
    console.log('✓ 检索归档案件成功, 找到', response.data.data.packages.length, '个归档包');
    return true;
  } catch (error) {
    console.error('✗ 检索归档案件失败:', error.response?.data || error.message);
    return false;
  }
}

// 测试获取归档包详情
async function testGetArchivePackage() {
  try {
    const response = await axios.get(
      `${BASE_URL}/archive/package/${testPackageId}`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    console.log('✓ 获取归档包详情成功');
    return true;
  } catch (error) {
    console.error('✗ 获取归档包详情失败:', error.response?.data || error.message);
    return false;
  }
}

// 测试创建案例知识
async function testCreateKnowledge() {
  try {
    const response = await axios.post(
      `${BASE_URL}/archive/knowledge`,
      {
        case_id: testCaseId,
        case_cause: '买卖合同纠纷',
        dispute_focus: '合同效力问题',
        legal_issues: '合同是否有效',
        case_result: '胜诉',
        key_evidence: '合同原件、付款凭证',
        legal_basis: '合同法相关条款',
        case_analysis: '详细的案例分析',
        practical_significance: '对类似案件的指导意义',
        keywords: '买卖合同,合同效力,违约',
        tags: '经典案例,重要',
        win_rate_reference: '85%',
        created_by: 'admin'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    testKnowledgeId = response.data.data.knowledge.id;
    console.log('✓ 创建案例知识成功, ID:', testKnowledgeId);
    return true;
  } catch (error) {
    console.error('✗ 创建案例知识失败:', error.response?.data || error.message);
    return false;
  }
}

// 测试检索案例知识库
async function testSearchKnowledge() {
  try {
    const response = await axios.get(
      `${BASE_URL}/archive/knowledge`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        params: {
          page: 1,
          limit: 10,
          case_cause: '买卖合同纠纷'
        }
      }
    );
    console.log('✓ 检索案例知识库成功, 找到', response.data.data.knowledge.length, '条知识');
    return true;
  } catch (error) {
    console.error('✗ 检索案例知识库失败:', error.response?.data || error.message);
    return false;
  }
}

// 测试获取案例知识详情
async function testGetKnowledge() {
  try {
    const response = await axios.get(
      `${BASE_URL}/archive/knowledge/${testKnowledgeId}`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    console.log('✓ 获取案例知识详情成功');
    return true;
  } catch (error) {
    console.error('✗ 获取案例知识详情失败:', error.response?.data || error.message);
    return false;
  }
}

// 测试更新案例知识
async function testUpdateKnowledge() {
  try {
    await axios.put(
      `${BASE_URL}/archive/knowledge/${testKnowledgeId}`,
      {
        win_rate_reference: '90%'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    console.log('✓ 更新案例知识成功');
    return true;
  } catch (error) {
    console.error('✗ 更新案例知识失败:', error.response?.data || error.message);
    return false;
  }
}

// 运行所有测试
async function runTests() {
  console.log('\n========== 归档管理功能测试 ==========\n');
  
  console.log('--- 准备工作 ---');
  if (!await login()) return;
  if (!await createTestCase()) return;
  
  console.log('\n--- 结案报告测试 ---');
  await testCreateClosureReport();
  await testGetClosureReport();
  await testUpdateClosureReport();
  
  console.log('\n--- 归档包测试 ---');
  await testCreateArchivePackage();
  await testSearchArchive();
  await testGetArchivePackage();
  
  console.log('\n--- 案例知识库测试 ---');
  await testCreateKnowledge();
  await testSearchKnowledge();
  await testGetKnowledge();
  await testUpdateKnowledge();
  
  console.log('\n========== 测试完成 ==========\n');
}

// 执行测试
runTests().catch(console.error);
