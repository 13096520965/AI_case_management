/**
 * 测试AI服务集成
 */

require('dotenv').config();
const { generateDocumentWithAI, reviewDocumentWithAI, AI_CONFIG } = require('./src/services/aiService');

console.log('========================================');
console.log('   AI服务集成测试');
console.log('========================================\n');

console.log('当前配置:');
console.log('- AI提供商:', AI_CONFIG.provider);
console.log('- API Key:', AI_CONFIG.apiKey ? `${AI_CONFIG.apiKey.substring(0, 10)}...` : '未配置');
console.log('- 模型:', AI_CONFIG.model);
console.log('- 最大Tokens:', AI_CONFIG.maxTokens);
console.log('- 超时时间:', AI_CONFIG.timeout, 'ms\n');

async function testDocumentGeneration() {
  console.log('========================================');
  console.log('测试 1: 文书生成');
  console.log('========================================\n');
  
  const caseInfo = {
    case_cause: '合同纠纷',
    case_number: '(2024)京0105民初12345号',
    internal_number: 'AN202411000001',
    court: '北京市朝阳区人民法院',
    target_amount: 100000,
    filing_date: '2024-01-15'
  };
  
  const parties = [
    {
      party_type: '原告',
      name: '张三',
      entity_type: '自然人',
      id_number: '110101199001011234',
      contact_phone: '13800138000',
      address: '北京市朝阳区某某街道1号'
    },
    {
      party_type: '被告',
      name: '李四',
      entity_type: '自然人',
      id_number: '110101199002021234',
      contact_phone: '13900139000',
      address: '北京市海淀区某某路2号'
    }
  ];
  
  const extraInfo = {
    lawyer: '王律师',
    lawFirm: '北京某某律师事务所',
    notes: '双方于2023年10月签订买卖合同，约定被告向原告购买货物，总价款10万元。合同签订后，原告按约交付了货物，但被告至今未支付货款。'
  };
  
  try {
    console.log('生成起诉状...');
    const startTime = Date.now();
    
    const content = await generateDocumentWithAI('complaint', caseInfo, parties, extraInfo);
    
    const duration = Date.now() - startTime;
    
    if (content) {
      console.log('\n✅ 文书生成成功');
      console.log('- 耗时:', duration, 'ms');
      console.log('- 内容长度:', content.length, '字符');
      console.log('- 前100字符:', content.substring(0, 100).replace(/\n/g, ' ') + '...');
      
      if (AI_CONFIG.provider !== 'mock') {
        console.log('\n📝 生成的文书内容:');
        console.log('---');
        console.log(content);
        console.log('---');
      }
      
      return content;
    } else {
      console.log('\n⚠️  AI服务未启用或失败，使用模板生成');
      console.log('- 耗时:', duration, 'ms');
      return null;
    }
  } catch (error) {
    console.error('\n❌ 文书生成失败:', error.message);
    return null;
  }
}

async function testDocumentReview(content) {
  console.log('\n========================================');
  console.log('测试 2: 文书审核');
  console.log('========================================\n');
  
  // 如果没有生成的内容，使用示例内容
  if (!content) {
    content = `民事起诉状

原告：张三，身份证号：110101199001011234
联系电话：13800138000
住所地：北京市朝阳区某某街道1号

被告：李四，身份证号：110101199002021234
联系电话：13900139000
住所地：北京市海淀区某某路2号

诉讼请求：
1. 请求依法判令被告李四支付原告张三款项人民币100,000元；
2. 本案诉讼费用由被告承担。

事实与理由：
合同纠纷一案，原告与被告之间存在合同关系。双方于2023年10月签订买卖合同，约定被告向原告购买货物，总价款10万元。

综上所述，原告认为被告的行为已严重侵害了原告的合法权益，为维护原告的合法权益，特依法向贵院提起诉讼，请求依法支持原告的诉讼请求。

此致
北京市朝阳区人民法院

具状人（原告）：张三
代理律师：王律师
律师事务所：北京某某律师事务所

2024年1月15日`;
  }
  
  const options = ['compliance', 'format', 'logic', 'language'];
  const caseInfo = {
    case_cause: '合同纠纷',
    case_number: '(2024)京0105民初12345号',
    court: '北京市朝阳区人民法院'
  };
  
  try {
    console.log('审核文书...');
    console.log('- 审核项目:', options.join(', '));
    
    const startTime = Date.now();
    
    const result = await reviewDocumentWithAI(content, options, caseInfo);
    
    const duration = Date.now() - startTime;
    
    if (result && result.score !== undefined) {
      console.log('\n✅ 文书审核成功');
      console.log('- 耗时:', duration, 'ms');
      console.log('- 评分:', result.score, '/ 100');
      console.log('- 问题数量:', result.issues?.length || 0);
      console.log('- 建议数量:', result.suggestions?.length || 0);
      
      if (result.summary) {
        console.log('\n📊 审核总结:');
        console.log(result.summary);
      }
      
      if (result.issues && result.issues.length > 0) {
        console.log('\n⚠️  发现的问题:');
        result.issues.forEach((issue, index) => {
          console.log(`\n${index + 1}. ${issue.title} [${issue.severity}]`);
          console.log('   分类:', issue.category);
          console.log('   位置:', issue.location);
          console.log('   描述:', issue.description);
          console.log('   建议:', issue.suggestion);
          if (issue.reference) {
            console.log('   依据:', issue.reference);
          }
        });
      }
      
      if (result.suggestions && result.suggestions.length > 0) {
        console.log('\n💡 优化建议:');
        result.suggestions.forEach((suggestion, index) => {
          console.log(`\n${index + 1}. [${suggestion.category}]`);
          console.log('   ', suggestion.content);
        });
      }
      
      return true;
    } else {
      console.log('\n⚠️  AI服务未启用或失败，使用规则审核');
      console.log('- 耗时:', duration, 'ms');
      return false;
    }
  } catch (error) {
    console.error('\n❌ 文书审核失败:', error.message);
    return false;
  }
}

async function testDifferentTemplates() {
  console.log('\n========================================');
  console.log('测试 3: 不同文书类型');
  console.log('========================================\n');
  
  const templates = [
    { type: 'complaint', name: '起诉状' },
    { type: 'defense', name: '答辩状' },
    { type: 'agency_opinion', name: '代理词' }
  ];
  
  const caseInfo = {
    case_cause: '劳动争议',
    court: '上海市浦东新区人民法院',
    target_amount: 50000
  };
  
  const parties = [
    { party_type: '原告', name: '员工A', entity_type: '自然人' },
    { party_type: '被告', name: '公司B', entity_type: '企业法人' }
  ];
  
  const extraInfo = {
    lawyer: '李律师',
    lawFirm: '上海某某律师事务所'
  };
  
  for (const template of templates) {
    try {
      console.log(`生成${template.name}...`);
      const startTime = Date.now();
      
      const content = await generateDocumentWithAI(template.type, caseInfo, parties, extraInfo);
      
      const duration = Date.now() - startTime;
      
      if (content) {
        console.log(`✅ ${template.name}生成成功 (${duration}ms, ${content.length}字符)`);
      } else {
        console.log(`⚠️  ${template.name}使用模板生成 (${duration}ms)`);
      }
    } catch (error) {
      console.log(`❌ ${template.name}生成失败:`, error.message);
    }
  }
}

async function runTests() {
  try {
    // 测试1: 文书生成
    const generatedContent = await testDocumentGeneration();
    
    // 等待1秒，避免API限流
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 测试2: 文书审核
    await testDocumentReview(generatedContent);
    
    // 等待1秒
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 测试3: 不同文书类型
    await testDifferentTemplates();
    
    console.log('\n========================================');
    console.log('   测试完成');
    console.log('========================================\n');
    
    if (AI_CONFIG.provider === 'mock') {
      console.log('💡 提示: 当前使用模拟模式');
      console.log('   要测试真实AI服务，请在 .env 文件中配置:');
      console.log('   - AI_PROVIDER=openai (或 qianwen, wenxin)');
      console.log('   - AI_API_KEY=your-api-key');
      console.log('   然后重新运行测试\n');
    } else {
      console.log('✅ AI服务工作正常\n');
    }
  } catch (error) {
    console.error('\n❌ 测试执行出错:', error);
    process.exit(1);
  }
}

// 运行测试
runTests();
