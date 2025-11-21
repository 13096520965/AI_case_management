const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// 测试用户凭证
let authToken = '';
let testCaseId = null;
let testCostId = null;

// 辅助函数：打印测试结果
function logTest(testName, success, data = null, error = null) {
  console.log('\n' + '='.repeat(60));
  console.log(`测试: ${testName}`);
  console.log('结果:', success ? '✓ 成功' : '✗ 失败');
  if (data) {
    console.log('响应数据:', JSON.stringify(data, null, 2));
  }
  if (error) {
    console.log('错误信息:', error.response?.data || error.message);
  }
  console.log('='.repeat(60));
}

// 1. 用户登录
async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'testuser',
      password: 'password123'
    });
    authToken = response.data.data.token;
    logTest('用户登录', true, { token: authToken.substring(0, 20) + '...' });
    return true;
  } catch (error) {
    logTest('用户登录', false, null, error);
    return false;
  }
}

// 2. 创建测试案件
async function createTestCase() {
  try {
    const response = await axios.post(
      `${BASE_URL}/cases`,
      {
        case_type: '民事',
        case_cause: '合同纠纷',
        court: '北京市朝阳区人民法院',
        target_amount: 500000,
        filing_date: '2024-01-15',
        status: 'active'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    testCaseId = response.data.data.case.id;
    logTest('创建测试案件', true, response.data.data);
    return true;
  } catch (error) {
    logTest('创建测试案件', false, null, error);
    return false;
  }
}

// 3. 创建成本记录
async function createCost() {
  try {
    const response = await axios.post(
      `${BASE_URL}/costs`,
      {
        case_id: testCaseId,
        cost_type: '诉讼费',
        amount: 8800,
        payment_date: '2024-01-20',
        payment_method: '银行转账',
        voucher_number: 'V20240120001',
        payer: '张三',
        payee: '北京市朝阳区人民法院',
        status: 'paid',
        due_date: '2024-01-25'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    testCostId = response.data.data.cost.id;
    logTest('创建成本记录', true, response.data.data);
    return true;
  } catch (error) {
    logTest('创建成本记录', false, null, error);
    return false;
  }
}

// 4. 创建多条成本记录用于测试
async function createMultipleCosts() {
  try {
    const costs = [
      {
        case_id: testCaseId,
        cost_type: '律师费',
        amount: 50000,
        payment_date: '2024-02-01',
        payment_method: '银行转账',
        payer: '张三',
        payee: '某律师事务所',
        status: 'paid'
      },
      {
        case_id: testCaseId,
        cost_type: '保全费',
        amount: 3020,
        payment_date: '2024-01-18',
        payment_method: '现金',
        payer: '张三',
        payee: '北京市朝阳区人民法院',
        status: 'paid'
      },
      {
        case_id: testCaseId,
        cost_type: '鉴定费',
        amount: 15000,
        status: 'unpaid',
        due_date: '2024-12-31'
      }
    ];

    for (const cost of costs) {
      await axios.post(`${BASE_URL}/costs`, cost, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
    }
    logTest('创建多条成本记录', true, { count: costs.length });
    return true;
  } catch (error) {
    logTest('创建多条成本记录', false, null, error);
    return false;
  }
}

// 5. 获取案件成本列表
async function getCostsByCaseId() {
  try {
    const response = await axios.get(`${BASE_URL}/costs/cases/${testCaseId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logTest('获取案件成本列表', true, response.data.data);
    return true;
  } catch (error) {
    logTest('获取案件成本列表', false, null, error);
    return false;
  }
}

// 6. 按类型筛选成本
async function getCostsByType() {
  try {
    const response = await axios.get(
      `${BASE_URL}/costs/cases/${testCaseId}?cost_type=律师费`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    logTest('按类型筛选成本', true, response.data.data);
    return true;
  } catch (error) {
    logTest('按类型筛选成本', false, null, error);
    return false;
  }
}

// 7. 按状态筛选成本
async function getCostsByStatus() {
  try {
    const response = await axios.get(
      `${BASE_URL}/costs/cases/${testCaseId}?status=unpaid`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    logTest('按状态筛选成本', true, response.data.data);
    return true;
  } catch (error) {
    logTest('按状态筛选成本', false, null, error);
    return false;
  }
}

// 8. 更新成本记录
async function updateCost() {
  try {
    const response = await axios.put(
      `${BASE_URL}/costs/${testCostId}`,
      {
        status: 'paid',
        payment_date: '2024-01-22',
        voucher_number: 'V20240122001'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    logTest('更新成本记录', true, response.data.data);
    return true;
  } catch (error) {
    logTest('更新成本记录', false, null, error);
    return false;
  }
}

// 9. 计算诉讼费
async function calculateLitigationFee() {
  try {
    const response = await axios.post(
      `${BASE_URL}/costs/calculate`,
      {
        calculationType: 'litigation_fee',
        params: {
          targetAmount: 500000,
          caseType: '财产案件'
        }
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    logTest('计算诉讼费', true, response.data.data);
    return true;
  } catch (error) {
    logTest('计算诉讼费', false, null, error);
    return false;
  }
}

// 10. 计算律师费（按比例）
async function calculateLawyerFeePercentage() {
  try {
    const response = await axios.post(
      `${BASE_URL}/costs/calculate`,
      {
        calculationType: 'lawyer_fee',
        params: {
          feeType: 'percentage',
          targetAmount: 500000,
          percentage: 10
        }
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    logTest('计算律师费（按比例）', true, response.data.data);
    return true;
  } catch (error) {
    logTest('计算律师费（按比例）', false, null, error);
    return false;
  }
}

// 11. 计算律师费（固定收费）
async function calculateLawyerFeeFixed() {
  try {
    const response = await axios.post(
      `${BASE_URL}/costs/calculate`,
      {
        calculationType: 'lawyer_fee',
        params: {
          feeType: 'fixed',
          fixedAmount: 30000
        }
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    logTest('计算律师费（固定收费）', true, response.data.data);
    return true;
  } catch (error) {
    logTest('计算律师费（固定收费）', false, null, error);
    return false;
  }
}

// 12. 计算律师费（按时计费）
async function calculateLawyerFeeHourly() {
  try {
    const response = await axios.post(
      `${BASE_URL}/costs/calculate`,
      {
        calculationType: 'lawyer_fee',
        params: {
          feeType: 'hourly',
          hourlyRate: 500,
          hours: 100
        }
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    logTest('计算律师费（按时计费）', true, response.data.data);
    return true;
  } catch (error) {
    logTest('计算律师费（按时计费）', false, null, error);
    return false;
  }
}

// 13. 计算保全费
async function calculatePreservationFee() {
  try {
    const response = await axios.post(
      `${BASE_URL}/costs/calculate`,
      {
        calculationType: 'preservation_fee',
        params: {
          preservationAmount: 500000
        }
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    logTest('计算保全费', true, response.data.data);
    return true;
  } catch (error) {
    logTest('计算保全费', false, null, error);
    return false;
  }
}

// 14. 计算违约金（单利）
async function calculatePenaltySimple() {
  try {
    const response = await axios.post(
      `${BASE_URL}/costs/calculate`,
      {
        calculationType: 'penalty',
        params: {
          principal: 100000,
          rate: 6,
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          compoundInterest: false
        }
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    logTest('计算违约金（单利）', true, response.data.data);
    return true;
  } catch (error) {
    logTest('计算违约金（单利）', false, null, error);
    return false;
  }
}

// 15. 计算违约金（复利）
async function calculatePenaltyCompound() {
  try {
    const response = await axios.post(
      `${BASE_URL}/costs/calculate`,
      {
        calculationType: 'penalty',
        params: {
          principal: 100000,
          rate: 6,
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          compoundInterest: true,
          compoundFrequency: 'monthly'
        }
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    logTest('计算违约金（复利）', true, response.data.data);
    return true;
  } catch (error) {
    logTest('计算违约金（复利）', false, null, error);
    return false;
  }
}

// 16. 获取成本统计分析
async function getCostAnalytics() {
  try {
    const response = await axios.get(`${BASE_URL}/costs/analytics/${testCaseId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logTest('获取成本统计分析', true, response.data.data);
    return true;
  } catch (error) {
    logTest('获取成本统计分析', false, null, error);
    return false;
  }
}

// 17. 删除成本记录
async function deleteCost() {
  try {
    const response = await axios.delete(`${BASE_URL}/costs/${testCostId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logTest('删除成本记录', true, response.data);
    return true;
  } catch (error) {
    logTest('删除成本记录', false, null, error);
    return false;
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('\n开始测试成本管理 API...\n');

  // 认证测试
  if (!(await login())) return;

  // 创建测试案件
  if (!(await createTestCase())) return;

  // 成本记录 CRUD 测试
  await createCost();
  await createMultipleCosts();
  await getCostsByCaseId();
  await getCostsByType();
  await getCostsByStatus();
  await updateCost();

  // 费用计算器测试
  await calculateLitigationFee();
  await calculateLawyerFeePercentage();
  await calculateLawyerFeeFixed();
  await calculateLawyerFeeHourly();
  await calculatePreservationFee();
  await calculatePenaltySimple();
  await calculatePenaltyCompound();

  // 成本统计分析测试
  await getCostAnalytics();

  // 删除测试
  await deleteCost();

  console.log('\n所有测试完成！\n');
}

// 执行测试
runAllTests().catch(console.error);
