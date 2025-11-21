/**
 * 测试获取文书列表
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

// 测试用户登录凭证
const TEST_USER = {
  username: 'admin',
  password: 'admin123'
};

let authToken = '';

// 登录获取token
async function login() {
  try {
    console.log('1. 登录获取token...');
    const response = await axios.post(`${API_BASE_URL}/auth/login`, TEST_USER);
    authToken = response.data.data.token;
    console.log('✓ 登录成功');
    return true;
  } catch (error) {
    console.error('✗ 登录失败:', error.response?.data || error.message);
    return false;
  }
}

// 测试获取文书列表
async function testGetDocuments(caseId) {
  try {
    console.log(`\n2. 测试获取案件 ${caseId} 的文书列表...`);
    
    const response = await axios.get(
      `${API_BASE_URL}/cases/${caseId}/documents`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    console.log('\n完整响应:');
    console.log(JSON.stringify(response.data, null, 2));

    const documents = response.data.data?.documents || [];
    console.log(`\n✓ 获取文书列表成功，共 ${documents.length} 条记录`);
    
    if (documents.length > 0) {
      console.log('\n文书列表:');
      documents.forEach((doc, index) => {
        console.log(`\n${index + 1}. 文书 ID: ${doc.id}`);
        console.log(`   名称: ${doc.document_name}`);
        console.log(`   类型: ${doc.document_type}`);
        console.log(`   文件名: ${doc.file_name || '无'}`);
        console.log(`   文件路径: ${doc.file_path || '无'}`);
        console.log(`   创建时间: ${doc.created_at}`);
      });
    }

    return true;
  } catch (error) {
    console.error('✗ 获取文书列表失败:', error.response?.data || error.message);
    return false;
  }
}

// 运行测试
async function runTests() {
  console.log('='.repeat(60));
  console.log('获取文书列表测试');
  console.log('='.repeat(60));

  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n测试终止：登录失败');
    return;
  }

  await testGetDocuments(1);

  console.log('\n' + '='.repeat(60));
  console.log('✓ 测试完成！');
  console.log('='.repeat(60));
}

runTests().catch(error => {
  console.error('测试执行出错:', error);
  process.exit(1);
});
