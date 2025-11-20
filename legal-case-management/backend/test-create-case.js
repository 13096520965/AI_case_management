/**
 * 测试创建案件功能
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

// 测试用户凭证
let authToken = '';

/**
 * 登录获取token
 */
async function login() {
  try {
    console.log('正在登录...');
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    if (response.data && response.data.data && response.data.data.token) {
      authToken = response.data.data.token;
      console.log('✓ 登录成功');
      console.log('Token:', authToken.substring(0, 20) + '...');
      return true;
    }
    console.error('✗ 登录失败: 未获取到token');
    return false;
  } catch (error) {
    console.error('✗ 登录失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试创建案件
 */
async function testCreateCase() {
  try {
    console.log('\n--- 测试创建案件 ---');
    
    const caseData = {
      case_type: '民事',
      case_cause: '劳动争议',
      court: '北京市朝阳区人民法院',
      target_amount: 50000.00,
      filing_date: '2024-01-15',
      status: '立案'
    };
    
    console.log('请求数据:', JSON.stringify(caseData, null, 2));
    
    const response = await axios.post(`${API_BASE_URL}/cases`, caseData, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✓ 创建成功');
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.data && response.data.data.case) {
      const newCase = response.data.data.case;
      console.log('\n新建案件信息:');
      console.log(`  ID: ${newCase.id}`);
      console.log(`  内部编号: ${newCase.internal_number}`);
      console.log(`  案件类型: ${newCase.case_type}`);
      console.log(`  案由: ${newCase.case_cause}`);
      console.log(`  法院: ${newCase.court}`);
      console.log(`  标的额: ${newCase.target_amount}`);
      console.log(`  立案日期: ${newCase.filing_date}`);
      console.log(`  状态: ${newCase.status}`);
      
      return newCase.id;
    }
    
    return null;
  } catch (error) {
    console.error('✗ 创建失败');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('请求已发送但未收到响应');
      console.error('请求:', error.request);
    } else {
      console.error('错误:', error.message);
    }
    return null;
  }
}

/**
 * 测试创建案件（带案号）
 */
async function testCreateCaseWithNumber() {
  try {
    console.log('\n--- 测试创建案件（带案号） ---');
    
    const caseData = {
      case_number: '(2024)京0105民初12345号',
      case_type: '刑事',
      case_cause: '盗窃罪',
      court: '北京市朝阳区人民法院',
      target_amount: 10000.00,
      filing_date: '2024-01-20',
      status: '审理中'
    };
    
    console.log('请求数据:', JSON.stringify(caseData, null, 2));
    
    const response = await axios.post(`${API_BASE_URL}/cases`, caseData, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✓ 创建成功');
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.data && response.data.data.case) {
      const newCase = response.data.data.case;
      console.log('\n新建案件信息:');
      console.log(`  ID: ${newCase.id}`);
      console.log(`  案号: ${newCase.case_number}`);
      console.log(`  内部编号: ${newCase.internal_number}`);
      console.log(`  案件类型: ${newCase.case_type}`);
      console.log(`  案由: ${newCase.case_cause}`);
      
      return newCase.id;
    }
    
    return null;
  } catch (error) {
    console.error('✗ 创建失败');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('错误:', error.message);
    }
    return null;
  }
}

/**
 * 测试创建案件（缺少必填字段）
 */
async function testCreateCaseWithMissingFields() {
  try {
    console.log('\n--- 测试创建案件（缺少必填字段） ---');
    
    const caseData = {
      case_type: '民事'
      // 缺少 case_cause
    };
    
    console.log('请求数据:', JSON.stringify(caseData, null, 2));
    
    const response = await axios.post(`${API_BASE_URL}/cases`, caseData, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✗ 应该失败但成功了');
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
    return null;
  } catch (error) {
    console.log('✓ 正确返回错误');
    if (error.response) {
      console.log('状态码:', error.response.status);
      console.log('错误信息:', JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

/**
 * 验证创建的案件
 */
async function verifyCaseCreated(caseId) {
  try {
    console.log(`\n--- 验证案件 ${caseId} ---`);
    
    const response = await axios.get(`${API_BASE_URL}/cases/${caseId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });
    
    console.log('✓ 获取成功');
    console.log('案件数据:', JSON.stringify(response.data, null, 2));
    
    return true;
  } catch (error) {
    console.error('✗ 获取失败');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

/**
 * 主测试函数
 */
async function runTests() {
  console.log('========================================');
  console.log('  创建案件功能测试');
  console.log('========================================');
  
  // 登录
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.error('\n测试终止: 登录失败');
    return;
  }
  
  // 测试1: 创建基本案件
  const caseId1 = await testCreateCase();
  if (caseId1) {
    await verifyCaseCreated(caseId1);
  }
  
  // 测试2: 创建带案号的案件
  const caseId2 = await testCreateCaseWithNumber();
  if (caseId2) {
    await verifyCaseCreated(caseId2);
  }
  
  // 测试3: 测试缺少必填字段
  await testCreateCaseWithMissingFields();
  
  console.log('\n========================================');
  console.log('  测试完成');
  console.log('========================================');
}

// 运行测试
runTests().catch(error => {
  console.error('测试执行出错:', error);
  process.exit(1);
});
