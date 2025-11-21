/**
 * 简单的助手测试
 */

require('dotenv').config();
const axios = require('axios');

async function test() {
  console.log('测试法盾助手...\n');
  console.log(`AI提供商: ${process.env.AI_PROVIDER}`);
  console.log(`API Key: ${process.env.AI_API_KEY ? process.env.AI_API_KEY.substring(0, 15) + '...' : '未配置'}\n`);
  
  try {
    const response = await axios.post('http://localhost:3000/api/assistant/chat', {
      message: '什么是合同纠纷的诉讼时效？',
      context: {}
    });
    
    console.log('✅ 测试成功\n');
    console.log('助手回复:');
    console.log(response.data.data.message);
  } catch (error) {
    console.log('❌ 测试失败');
    console.log(error.response?.data || error.message);
  }
}

test();
