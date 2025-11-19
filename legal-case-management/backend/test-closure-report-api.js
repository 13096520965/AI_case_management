const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Test credentials
const testUser = {
  username: 'testuser',
  password: 'password123'
};

let authToken = '';
let testCaseId = null;
let testReportId = null;

/**
 * 登录获取 token
 */
async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, testUser);
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
    const caseData = {
      case_number: `TEST-${Date.now()}`,
      internal_number: `INT-${Date.now()}`,
      case_type: '民事',
      case_cause: '合同纠纷',
      court: '测试法院',
      target_amount: 100000,
      filing_date: '2024-01-15',
      status: 'closed'
    };

    const response = await axios.post(`${BASE_URL}/cases`, caseData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    testCaseId = response.data.data.case.id;
    console.log('✓ 创建测试案件成功, ID:', testCaseId);
    return true;
  } catch (error) {
    console.error('✗ 创建测试案件失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试 1: 创建结案报告
 */
async function testCreateClosureReport() {
  console.log('\n--- 测试 1: 创建结案报告 ---');
  
  try {
    const reportData = {
      case_id: testCaseId,
      case_summary: '本案为合同纠纷案件，原告与被告签订买卖合同后，被告未按约定支付货款。',
      case_result: '胜诉',
      experience_summary: '1. 证据准备充分，合同、发票、送货单等证据链完整\n2. 庭审中充分阐述法律依据\n3. 与对方律师沟通顺畅',
      risk_warnings: '1. 注意合同条款的明确性\n2. 及时保存交易凭证\n3. 注意诉讼时效',
      lessons_learned: '1. 合同签订前应充分审查对方资信\n2. 履行过程中及时固定证据\n3. 发生纠纷后及时采取法律措施',
      created_by: 'testuser',
      approval_status: 'draft'
    };

    const response = await axios.post(
      `${BASE_URL}/archive/closure-report`,
      reportData,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    testReportId = response.data.data.report.id;
    console.log('✓ 创建结案报告成功');
    console.log('  报告ID:', testReportId);
    console.log('  案件ID:', response.data.data.report.case_id);
    console.log('  审批状态:', response.data.data.report.approval_status);
    return true;
  } catch (error) {
    console.error('✗ 创建结案报告失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试 2: 根据案件ID获取结案报告
 */
async function testGetClosureReportByCaseId() {
  console.log('\n--- 测试 2: 根据案件ID获取结案报告 ---');
  
  try {
    const response = await axios.get(
      `${BASE_URL}/archive/closure-report/${testCaseId}`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    console.log('✓ 获取结案报告成功');
    console.log('  报告ID:', response.data.data.report.id);
    console.log('  案件ID:', response.data.data.report.case_id);
    console.log('  案件结果:', response.data.data.report.case_result);
    console.log('  审批状态:', response.data.data.report.approval_status);
    console.log('  创建时间:', response.data.data.report.created_at);
    return true;
  } catch (error) {
    console.error('✗ 获取结案报告失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试 3: 更新结案报告
 */
async function testUpdateClosureReport() {
  console.log('\n--- 测试 3: 更新结案报告 ---');
  
  try {
    const updateData = {
      approval_status: 'approved',
      approved_by: 'manager',
      experience_summary: '1. 证据准备充分，合同、发票、送货单等证据链完整\n2. 庭审中充分阐述法律依据\n3. 与对方律师沟通顺畅\n4. 判决结果符合预期',
      risk_warnings: '1. 注意合同条款的明确性\n2. 及时保存交易凭证\n3. 注意诉讼时效\n4. 关注执行阶段的风险'
    };

    const response = await axios.put(
      `${BASE_URL}/archive/closure-report/${testReportId}`,
      updateData,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    console.log('✓ 更新结案报告成功');
    console.log('  报告ID:', response.data.data.report.id);
    console.log('  审批状态:', response.data.data.report.approval_status);
    console.log('  审批人:', response.data.data.report.approved_by);
    console.log('  更新时间:', response.data.data.report.updated_at);
    return true;
  } catch (error) {
    console.error('✗ 更新结案报告失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试 4: 重复创建结案报告（应该失败）
 */
async function testDuplicateClosureReport() {
  console.log('\n--- 测试 4: 重复创建结案报告（预期失败）---');
  
  try {
    const reportData = {
      case_id: testCaseId,
      case_summary: '重复的结案报告',
      case_result: '胜诉',
      created_by: 'testuser'
    };

    await axios.post(
      `${BASE_URL}/archive/closure-report`,
      reportData,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    console.error('✗ 测试失败：应该阻止重复创建结案报告');
    return false;
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('✓ 正确阻止了重复创建结案报告');
      console.log('  错误信息:', error.response.data.error.message);
      return true;
    } else {
      console.error('✗ 意外的错误:', error.response?.data || error.message);
      return false;
    }
  }
}

/**
 * 测试 5: 获取不存在的结案报告（应该失败）
 */
async function testGetNonExistentReport() {
  console.log('\n--- 测试 5: 获取不存在的结案报告（预期失败）---');
  
  try {
    await axios.get(
      `${BASE_URL}/archive/closure-report/99999`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    console.error('✗ 测试失败：应该返回404错误');
    return false;
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('✓ 正确返回404错误');
      console.log('  错误信息:', error.response.data.error.message);
      return true;
    } else {
      console.error('✗ 意外的错误:', error.response?.data || error.message);
      return false;
    }
  }
}

/**
 * 测试 6: 未认证访问（应该失败）
 */
async function testUnauthorizedAccess() {
  console.log('\n--- 测试 6: 未认证访问（预期失败）---');
  
  try {
    await axios.get(`${BASE_URL}/archive/closure-report/${testCaseId}`);
    console.error('✗ 测试失败：应该要求认证');
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✓ 正确要求认证');
      console.log('  错误信息:', error.response.data.error.message);
      return true;
    } else {
      console.error('✗ 意外的错误:', error.response?.data || error.message);
      return false;
    }
  }
}

/**
 * 清理测试数据
 */
async function cleanup() {
  console.log('\n--- 清理测试数据 ---');
  
  try {
    // 删除测试案件（会级联删除结案报告）
    if (testCaseId) {
      await axios.delete(`${BASE_URL}/cases/${testCaseId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('✓ 清理测试数据成功');
    }
  } catch (error) {
    console.error('✗ 清理测试数据失败:', error.response?.data || error.message);
  }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('========================================');
  console.log('结案报告管理 API 测试');
  console.log('========================================');

  // 登录
  if (!await login()) {
    console.log('\n测试终止：登录失败');
    return;
  }

  // 创建测试案件
  if (!await createTestCase()) {
    console.log('\n测试终止：创建测试案件失败');
    return;
  }

  // 运行测试
  const results = [];
  results.push(await testCreateClosureReport());
  results.push(await testGetClosureReportByCaseId());
  results.push(await testUpdateClosureReport());
  results.push(await testDuplicateClosureReport());
  results.push(await testGetNonExistentReport());
  results.push(await testUnauthorizedAccess());

  // 清理
  await cleanup();

  // 统计结果
  const passed = results.filter(r => r).length;
  const total = results.length;

  console.log('\n========================================');
  console.log('测试完成');
  console.log(`通过: ${passed}/${total}`);
  console.log('========================================');

  process.exit(passed === total ? 0 : 1);
}

// 运行测试
runAllTests().catch(error => {
  console.error('测试执行出错:', error);
  process.exit(1);
});
