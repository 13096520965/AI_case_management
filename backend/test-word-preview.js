/**
 * 测试 Word 文档预览（应该返回错误）
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

const TEST_USER = {
  username: 'admin',
  password: 'admin123'
};

let authToken = '';

async function login() {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, TEST_USER);
    authToken = response.data.data.token;
    console.log('✓ 登录成功');
    return true;
  } catch (error) {
    console.error('✗ 登录失败');
    return false;
  }
}

async function testWordPreview() {
  try {
    console.log('\n测试 Word 文档预览（ID: 6）...');
    
    const response = await axios.get(
      `${API_BASE_URL}/documents/6/preview`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    console.log('✗ 应该返回错误，但返回了成功响应');
    console.log('响应:', response.data);
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✓ 正确返回错误：', error.response.data.error.message);
    } else {
      console.log('✗ 返回了意外的错误:', error.message);
    }
  }
}

async function run() {
  console.log('='.repeat(60));
  console.log('Word 文档预览测试');
  console.log('='.repeat(60));

  await login();
  await testWordPreview();

  console.log('\n' + '='.repeat(60));
  console.log('测试完成');
  console.log('='.repeat(60));
}

run();
