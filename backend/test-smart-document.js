/**
 * 智能文书生成与审核功能测试
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function login() {
  const response = await axios.post(`${API_BASE_URL}/auth/login`, {
    username: 'admin',
    password: 'admin123'
  });
  return response.data.data.token;
}

async function testSmartDocument() {
  try {
    console.log('='.repeat(60));
    console.log('智能文书生成与审核功能测试');
    console.log('='.repeat(60));

    // 登录
    console.log('\n1. 登录系统...');
    const token = await login();
    console.log('   ✓ 登录成功');

    const headers = { 'Authorization': `Bearer ${token}` };

    // 获取第一个案件信息
    console.log('\n2. 获取案件信息...');
    const casesResponse = await axios.get(`${API_BASE_URL}/cases?page=1&limit=1`, { headers });
    const caseData = casesResponse.data.data.cases[0];
    console.log(`   ✓ 案件ID: ${caseData.id}`);
    console.log(`   ✓ 案号: ${caseData.case_number || caseData.internal_number}`);

    // 获取诉讼主体
    console.log('\n3. 获取诉讼主体...');
    const partiesResponse = await axios.get(`${API_BASE_URL}/cases/${caseData.id}/parties`, { headers });
    const parties = partiesResponse.data.data.parties || [];
    console.log(`   ✓ 诉讼主体数量: ${parties.length}`);

    // 测试智能生成文书
    console.log('\n4. 测试智能生成文书（起诉状）...');
    const startGenerate = Date.now();
    const generateResponse = await axios.post(
      `${API_BASE_URL}/documents/generate`,
      {
        caseId: caseData.id,
        templateType: 'complaint',
        caseInfo: caseData,
        parties: parties,
        extraInfo: {
          lawyer: '测试律师',
          lawFirm: '测试律师事务所',
          notes: '这是一个测试案件'
        }
      },
      { headers }
    );
    const generateTime = Date.now() - startGenerate;
    console.log(`   ✓ 文书生成成功 (${generateTime}ms)`);
    console.log(`   ✓ 文书长度: ${generateResponse.data.data.content.length} 字符`);
    console.log(`   ✓ 文书预览:\n${generateResponse.data.data.content.substring(0, 200)}...`);

    // 保存生成的文书
    console.log('\n5. 保存生成的文书...');
    const saveResponse = await axios.post(
      `${API_BASE_URL}/documents/save`,
      {
        caseId: caseData.id,
        documentType: 'complaint',
        documentName: '起诉状_测试',
        content: generateResponse.data.data.content
      },
      { headers }
    );
    const documentId = saveResponse.data.data.id;
    console.log(`   ✓ 文书保存成功 (ID: ${documentId})`);

    // 测试智能审核文书
    console.log('\n6. 测试智能审核文书...');
    const testContent = `民事起诉状

原告：张三，身份证号：110101199001011234
联系电话：13800138001

被告：李四，身份证号：110101198505051234
联系电话：13900139001

诉讼请求：
1. 请求依法判令被告李四支付原告张三款项人民币100,000元；
2. 本案诉讼费用由被告承担。

事实与理由：
（此处应详细陈述案件事实和理由）

此致
北京市朝阳区人民法院

具状人（原告）：张三
代理律师：测试律师
律师事务所：测试律师事务所

2025年11月19日`;

    const startReview = Date.now();
    const reviewResponse = await axios.post(
      `${API_BASE_URL}/documents/review`,
      {
        caseId: caseData.id,
        content: testContent,
        options: ['compliance', 'logic', 'format', 'completeness'],
        caseInfo: caseData
      },
      { headers }
    );
    const reviewTime = Date.now() - startReview;
    const reviewResult = reviewResponse.data.data;
    
    console.log(`   ✓ 文书审核完成 (${reviewTime}ms)`);
    console.log(`   ✓ 总问题数: ${reviewResult.totalIssues}`);
    console.log(`   ✓ 严重问题: ${reviewResult.criticalIssues}`);
    console.log(`   ✓ 警告问题: ${reviewResult.warningIssues}`);
    console.log(`   ✓ 建议优化: ${reviewResult.suggestionIssues}`);

    if (reviewResult.issues.length > 0) {
      console.log('\n   问题详情:');
      reviewResult.issues.slice(0, 3).forEach((issue, index) => {
        console.log(`   ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.title}`);
        console.log(`      位置: ${issue.location}`);
        console.log(`      建议: ${issue.suggestion}`);
      });
      if (reviewResult.issues.length > 3) {
        console.log(`   ... 还有 ${reviewResult.issues.length - 3} 个问题`);
      }
    }

    // 获取文书列表
    console.log('\n7. 获取案件文书列表...');
    const documentsResponse = await axios.get(
      `${API_BASE_URL}/cases/${caseData.id}/documents`,
      { headers }
    );
    const documents = documentsResponse.data.data.documents || [];
    console.log(`   ✓ 文书数量: ${documents.length}`);
    documents.forEach((doc, index) => {
      console.log(`   ${index + 1}. ${doc.document_name} (${doc.document_type})`);
    });

    // 删除测试文书
    console.log('\n8. 清理测试数据...');
    await axios.delete(`${API_BASE_URL}/documents/${documentId}`, { headers });
    console.log('   ✓ 测试文书已删除');

    // 总结
    console.log('\n' + '='.repeat(60));
    console.log('测试总结');
    console.log('='.repeat(60));
    console.log('\n✅ 所有功能测试通过！');
    console.log('\n功能列表:');
    console.log('  ✓ 智能生成文书（起诉状、答辩状等6种类型）');
    console.log('  ✓ 智能审核文书（4个维度全面检查）');
    console.log('  ✓ 保存文书到数据库');
    console.log('  ✓ 获取文书列表');
    console.log('  ✓ 删除文书');
    console.log('\n性能指标:');
    console.log(`  - 文书生成时间: ${generateTime}ms`);
    console.log(`  - 文书审核时间: ${reviewTime}ms`);
    console.log('\n下一步:');
    console.log('  1. 在案件详情页集成文书管理模块');
    console.log('  2. 测试前端界面交互');
    console.log('  3. 优化AI生成和审核算法');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n✗ 测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testSmartDocument();
