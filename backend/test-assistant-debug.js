/**
 * 调试助手API
 */

require('dotenv').config();
const axios = require('axios');

async function testAPI() {
  console.log('测试助手API...\n');
  
  try {
    console.log('发送请求到: http://localhost:3000/api/assistant/chat');
    console.log('请求数据:', JSON.stringify({
      message: '你好',
      context: {}
    }, null, 2));
    
    const response = await axios.post('http://localhost:3000/api/assistant/chat', {
      message: '你好',
      context: {}
    }, {
      timeout: 30000
    });
    
    console.log('\n✅ 请求成功');
    console.log('响应状态:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('\n❌ 请求失败');
    
    if (error.response) {
      console.log('响应状态:', error.response.status);
      console.log('响应数据:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('没有收到响应');
      console.log('请求:', error.request);
    } else {
      console.log('错误信息:', error.message);
    }
    
    console.log('\n完整错误:', error);
  }
}

testAPI();
