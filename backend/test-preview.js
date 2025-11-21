/**
 * 测试文书预览功能
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

// 测试预览文书
async function testPreviewDocument(documentId) {
  try {
    console.log(`\n2. 测试预览文书 ID: ${documentId}...`);
    
    const response = await axios.get(
      `${API_BASE_URL}/documents/${documentId}/preview`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    console.log('\n响应类型:', response.headers['content-type']);
    console.log('响应数据类型:', typeof response.data);
    
    if (typeof response.data === 'object') {
      console.log('\n✓ 返回JSON格式（智能生成的文书）');
      console.log('文书内容预览:');
      console.log(response.data.data.content.substring(0, 200) + '...');
    } else {
      console.log('\n✓ 返回文件流（上传的文件）');
      console.log('数据长度:', response.data.length);
    }

    return true;
  } catch (error) {
    console.error('✗ 预览文书失败:', error.response?.data || error.message);
    return false;
  }
}

// 运行测试
async function runTests() {
  console.log('='.repeat(60));
  console.log('文书预览功能测试');
  console.log('='.repeat(60));

  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n测试终止：登录失败');
    return;
  }

  // 测试不同的文书ID
  await testPreviewDocument(4); // 上传的文件
  await testPreviewDocument(2); // 智能生成的文书

  console.log('\n' + '='.repeat(60));
  console.log('✓ 测试完成！');
  console.log('='.repeat(60));
}

runTests().catch(error => {
  console.error('测试执行出错:', error);
  process.exit(1);
});
