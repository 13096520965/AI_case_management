/**
 * 法盾助手功能测试
 */

require('dotenv').config();
const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

// 测试用例
const testCases = [
  {
    name: '法律咨询 - 合同纠纷',
    message: '我想咨询一下合同纠纷的诉讼时效是多久？'
  },
  {
    name: '系统使用 - 文书生成',
    message: '如何生成起诉状？'
  },
  {
    name: '案件查询',
    message: '帮我查询一下民事案件'
  },
  {
    name: '法律知识 - 证据规则',
    message: '民事诉讼中，证据的举证责任是如何分配的？'
  },
  {
    name: '功能介绍',
    message: '这个系统有哪些主要功能？'
  }
];

async function testAssistantChat() {
  console.log('========================================');
  console.log('   法盾助手功能测试');
  console.log('========================================\n');

  console.log('当前配置:');
  console.log(`- AI提供商: ${process.env.AI_PROVIDER || 'mock'}`);
  console.log(`- API Key: ${process.env.AI_API_KEY ? process.env.AI_API_KEY.substring(0, 10) + '...' : '未配置'}`);
  console.log(`- 模型: ${process.env.AI_MODEL || 'gpt-3.5-turbo'}`);
  console.log('');

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    
    console.log('========================================');
    console.log(`测试 ${i + 1}: ${testCase.name}`);
    console.log('========================================\n');
    
    console.log(`用户问题: ${testCase.message}\n`);
    
    try {
      const startTime = Date.now();
      
      const response = await axios.post(`${API_BASE}/assistant/chat`, {
        message: testCase.message,
        context: {
          history: []
        }
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      if (response.data.success) {
        console.log('✅ 对话成功');
        console.log(`- 耗时: ${duration} ms`);
        console.log(`- 回复长度: ${response.data.data.message.length} 字符\n`);
        console.log('助手回复:');
        console.log('---');
        console.log(response.data.data.message);
        console.log('---\n');
        successCount++;
      } else {
        console.log('❌ 对话失败');
        console.log(`- 错误: ${response.data.message}\n`);
        failCount++;
      }
    } catch (error) {
      console.log('❌ 请求失败');
      console.log(`- 错误: ${error.message}\n`);
      failCount++;
    }
    
    // 添加延迟，避免请求过快
    if (i < testCases.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log('========================================');
  console.log('   测试总结');
  console.log('========================================\n');
  console.log(`总测试数: ${testCases.length}`);
  console.log(`成功: ${successCount}`);
  console.log(`失败: ${failCount}`);
  console.log(`成功率: ${((successCount / testCases.length) * 100).toFixed(1)}%\n`);

  if (successCount === testCases.length) {
    console.log('🎉 所有测试通过！法盾助手工作正常。\n');
  } else if (successCount > 0) {
    console.log('⚠️  部分测试失败，请检查配置。\n');
  } else {
    console.log('❌ 所有测试失败，请检查服务状态和配置。\n');
  }

  console.log('========================================\n');
}

// 运行测试
testAssistantChat().catch(error => {
  console.error('测试执行失败:', error);
  process.exit(1);
});
