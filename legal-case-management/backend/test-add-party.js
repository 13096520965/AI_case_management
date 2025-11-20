/**
 * 测试添加诉讼主体功能
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

let authToken = '';
let testCaseId = null;

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
      console.log('✓ 登录成功\n');
      return true;
    }
    return false;
  } catch (error) {
    console.error('✗ 登录失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 获取第一个案件ID用于测试
 */
async function getTestCaseId() {
  try {
    console.log('--- 获取测试案件 ---');
    const response = await axios.get(`${API_BASE_URL}/cases`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      },
      params: {
        page: 1,
        limit: 1
      }
    });
    
    if (response.data && response.data.data && response.data.data.cases && response.data.data.cases.length > 0) {
      testCaseId = response.data.data.cases[0].id;
      console.log(`✓ 找到测试案件 ID: ${testCaseId}`);
      console.log(`  案号: ${response.data.data.cases[0].case_number || response.data.data.cases[0].internal_number}\n`);
      return true;
    } else {
      console.log('✗ 没有找到案件，请先创建案件\n');
      return false;
    }
  } catch (error) {
    console.error('✗ 获取案件失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试添加企业诉讼主体
 */
async function testAddCompanyParty() {
  try {
    console.log('--- 测试1: 添加企业诉讼主体 ---');
    
    const partyData = {
      party_type: '原告',
      entity_type: '企业',
      name: '北京科技有限公司',
      unified_credit_code: '91110000MA01234567',
      legal_representative: '张三',
      contact_phone: '13800138000',
      contact_email: 'contact@company.com',
      address: '北京市朝阳区某某街道123号'
    };
    
    console.log('请求数据:', JSON.stringify(partyData, null, 2));
    
    const response = await axios.post(
      `${API_BASE_URL}/cases/${testCaseId}/parties`,
      partyData,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✓ 添加成功');
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.data && response.data.data.party) {
      const party = response.data.data.party;
      console.log('\n新添加的诉讼主体:');
      console.log(`  ID: ${party.id}`);
      console.log(`  主体身份: ${party.party_type}`);
      console.log(`  实体类型: ${party.entity_type}`);
      console.log(`  名称: ${party.name}`);
      console.log(`  统一社会信用代码: ${party.unified_credit_code}`);
      console.log(`  法定代表人: ${party.legal_representative}`);
      console.log(`  联系电话: ${party.contact_phone}\n`);
      return party.id;
    }
    
    return null;
  } catch (error) {
    console.error('✗ 添加失败');
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
 * 测试添加个人诉讼主体
 */
async function testAddIndividualParty() {
  try {
    console.log('--- 测试2: 添加个人诉讼主体 ---');
    
    const partyData = {
      party_type: '被告',
      entity_type: '个人',
      name: '李四',
      id_number: '110101199001011234',
      contact_phone: '13900139000',
      contact_email: 'lisi@example.com',
      address: '北京市海淀区某某小区456号'
    };
    
    console.log('请求数据:', JSON.stringify(partyData, null, 2));
    
    const response = await axios.post(
      `${API_BASE_URL}/cases/${testCaseId}/parties`,
      partyData,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✓ 添加成功');
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.data && response.data.data.party) {
      const party = response.data.data.party;
      console.log('\n新添加的诉讼主体:');
      console.log(`  ID: ${party.id}`);
      console.log(`  主体身份: ${party.party_type}`);
      console.log(`  实体类型: ${party.entity_type}`);
      console.log(`  姓名: ${party.name}`);
      console.log(`  身份证号: ${party.id_number}`);
      console.log(`  联系电话: ${party.contact_phone}\n`);
      return party.id;
    }
    
    return null;
  } catch (error) {
    console.error('✗ 添加失败');
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
 * 测试缺少必填字段
 */
async function testMissingRequiredFields() {
  try {
    console.log('--- 测试3: 缺少必填字段 ---');
    
    const partyData = {
      party_type: '原告',
      // 缺少 entity_type 和 name
    };
    
    console.log('请求数据:', JSON.stringify(partyData, null, 2));
    
    const response = await axios.post(
      `${API_BASE_URL}/cases/${testCaseId}/parties`,
      partyData,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✗ 应该失败但成功了');
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
    return null;
  } catch (error) {
    console.log('✓ 正确返回错误');
    if (error.response) {
      console.log('状态码:', error.response.status);
      console.log('错误信息:', JSON.stringify(error.response.data, null, 2));
      console.log();
    }
    return null;
  }
}

/**
 * 获取案件的诉讼主体列表
 */
async function getPartiesList() {
  try {
    console.log('--- 测试4: 获取诉讼主体列表 ---');
    
    const response = await axios.get(
      `${API_BASE_URL}/cases/${testCaseId}/parties`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }
    );
    
    console.log('✓ 获取成功');
    
    if (response.data && response.data.data && response.data.data.parties) {
      const parties = response.data.data.parties;
      console.log(`  共有 ${parties.length} 个诉讼主体:`);
      parties.forEach((party, index) => {
        console.log(`  ${index + 1}. ${party.party_type} - ${party.name} (${party.entity_type})`);
      });
      console.log();
      return true;
    }
    
    return false;
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
  console.log('  添加诉讼主体功能测试');
  console.log('========================================\n');
  
  // 登录
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.error('测试终止: 登录失败');
    return;
  }
  
  // 获取测试案件
  const hasCaseId = await getTestCaseId();
  if (!hasCaseId) {
    console.error('测试终止: 没有可用的测试案件');
    return;
  }
  
  // 测试1: 添加企业诉讼主体
  await testAddCompanyParty();
  
  // 测试2: 添加个人诉讼主体
  await testAddIndividualParty();
  
  // 测试3: 缺少必填字段
  await testMissingRequiredFields();
  
  // 测试4: 获取诉讼主体列表
  await getPartiesList();
  
  console.log('========================================');
  console.log('  测试完成');
  console.log('========================================');
}

// 运行测试
runTests().catch(error => {
  console.error('测试执行出错:', error);
  process.exit(1);
});
