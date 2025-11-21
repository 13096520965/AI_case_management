/**
 * 测试案件编号生成逻辑
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

// 测试用的 token（需要先登录获取）
let authToken = '';

/**
 * 登录获取 token
 */
async function login() {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
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

/**
 * 测试自动生成内部编号
 */
async function testAutoGenerateInternalNumber() {
  console.log('\n--- 测试1: 自动生成内部编号 ---');
  try {
    const response = await axios.post(
      `${API_BASE_URL}/cases`,
      {
        case_type: '民事',
        case_cause: '合同纠纷',
        court: '北京市朝阳区人民法院',
        target_amount: 100000,
        filing_date: '2024-11-14'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    const internalNumber = response.data.data.case.internal_number;
    console.log('✓ 自动生成的内部编号:', internalNumber);
    
    // 验证格式: AN + 年份 + 月份 + 6位序号
    const pattern = /^AN\d{6}\d{6}$/;
    if (pattern.test(internalNumber)) {
      console.log('✓ 内部编号格式正确');
    } else {
      console.log('✗ 内部编号格式错误');
    }
    
    return response.data.data.case.id;
  } catch (error) {
    console.error('✗ 测试失败:', error.response?.data || error.message);
    return null;
  }
}

/**
 * 测试案号唯一性验证
 */
async function testCaseNumberUniqueness() {
  console.log('\n--- 测试2: 案号唯一性验证 ---');
  
  const caseNumber = `(2024)京0105民初${Date.now()}号`;
  
  try {
    // 创建第一个案件
    const response1 = await axios.post(
      `${API_BASE_URL}/cases`,
      {
        case_number: caseNumber,
        case_type: '民事',
        case_cause: '借款纠纷',
        court: '北京市朝阳区人民法院',
        target_amount: 50000,
        filing_date: '2024-11-14'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    console.log('✓ 第一个案件创建成功，案号:', caseNumber);

    // 尝试创建相同案号的案件
    try {
      await axios.post(
        `${API_BASE_URL}/cases`,
        {
          case_number: caseNumber,
          case_type: '民事',
          case_cause: '另一个案件',
          court: '北京市朝阳区人民法院',
          target_amount: 30000,
          filing_date: '2024-11-14'
        },
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      console.log('✗ 应该拒绝重复案号，但创建成功了');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('✓ 正确拒绝了重复案号');
      } else {
        console.log('✗ 错误类型不正确:', error.response?.data);
      }
    }
    
    return response1.data.data.case.id;
  } catch (error) {
    console.error('✗ 测试失败:', error.response?.data || error.message);
    return null;
  }
}

/**
 * 测试内部编号唯一性验证
 */
async function testInternalNumberUniqueness() {
  console.log('\n--- 测试3: 内部编号唯一性验证 ---');
  
  const internalNumber = `AN202411${String(Date.now()).slice(-6)}`;
  
  try {
    // 创建第一个案件
    const response1 = await axios.post(
      `${API_BASE_URL}/cases`,
      {
        internal_number: internalNumber,
        case_type: '刑事',
        case_cause: '盗窃罪',
        court: '北京市朝阳区人民法院',
        filing_date: '2024-11-14'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    console.log('✓ 第一个案件创建成功，内部编号:', internalNumber);

    // 尝试创建相同内部编号的案件
    try {
      await axios.post(
        `${API_BASE_URL}/cases`,
        {
          internal_number: internalNumber,
          case_type: '民事',
          case_cause: '另一个案件',
          court: '北京市朝阳区人民法院',
          filing_date: '2024-11-14'
        },
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      console.log('✗ 应该拒绝重复内部编号，但创建成功了');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('✓ 正确拒绝了重复内部编号');
      } else {
        console.log('✗ 错误类型不正确:', error.response?.data);
      }
    }
    
    return response1.data.data.case.id;
  } catch (error) {
    console.error('✗ 测试失败:', error.response?.data || error.message);
    return null;
  }
}

/**
 * 测试连续生成多个内部编号
 */
async function testSequentialGeneration() {
  console.log('\n--- 测试4: 连续生成多个内部编号 ---');
  
  const internalNumbers = [];
  
  try {
    for (let i = 0; i < 3; i++) {
      const response = await axios.post(
        `${API_BASE_URL}/cases`,
        {
          case_type: '民事',
          case_cause: `测试案件 ${i + 1}`,
          court: '北京市朝阳区人民法院',
          target_amount: 10000 * (i + 1),
          filing_date: '2024-11-14'
        },
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      
      const internalNumber = response.data.data.case.internal_number;
      internalNumbers.push(internalNumber);
      console.log(`✓ 案件 ${i + 1} 内部编号:`, internalNumber);
    }
    
    // 验证编号是递增的
    const sequences = internalNumbers.map(num => parseInt(num.slice(-6)));
    let isSequential = true;
    for (let i = 1; i < sequences.length; i++) {
      if (sequences[i] !== sequences[i - 1] + 1) {
        isSequential = false;
        break;
      }
    }
    
    if (isSequential) {
      console.log('✓ 内部编号序号递增正确');
    } else {
      console.log('✗ 内部编号序号递增不正确');
    }
    
  } catch (error) {
    console.error('✗ 测试失败:', error.response?.data || error.message);
  }
}

/**
 * 运行所有测试
 */
async function runTests() {
  console.log('=== 案件编号生成逻辑测试 ===\n');
  
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n请确保后端服务正在运行，并且已创建测试用户');
    console.log('可以运行: node create-test-user.js');
    return;
  }
  
  await testAutoGenerateInternalNumber();
  await testCaseNumberUniqueness();
  await testInternalNumberUniqueness();
  await testSequentialGeneration();
  
  console.log('\n=== 测试完成 ===');
}

// 运行测试
runTests();
