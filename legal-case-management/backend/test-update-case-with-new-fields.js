const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testUpdateCase() {
  try {
    console.log('=== 测试更新案件新字段 ===\n');
    
    // 1. 登录
    console.log('1. 登录...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    const token = loginResponse.data.data.token;
    console.log('✓ 登录成功\n');
    
    // 2. 获取案件列表
    console.log('2. 获取案件列表...');
    const casesResponse = await axios.get(`${BASE_URL}/cases`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { limit: 1 }
    });
    
    if (!casesResponse.data.data.cases || casesResponse.data.data.cases.length === 0) {
      console.log('没有找到案件');
      return;
    }
    
    const firstCase = casesResponse.data.data.cases[0];
    console.log(`✓ 找到案件 ID: ${firstCase.id}, 案号: ${firstCase.case_number}\n`);
    
    // 3. 更新案件，添加新字段
    console.log('3. 更新案件，添加新字段...');
    const updateData = {
      industry_segment: '新奥新智',
      handler: '张三',
      is_external_agent: true,
      law_firm_name: '北京市某某律师事务所',
      agent_lawyer: '李律师',
      agent_contact: '13800138000'
    };
    
    const updateResponse = await axios.put(
      `${BASE_URL}/cases/${firstCase.id}`,
      updateData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('✓ 更新成功\n');
    
    // 4. 重新获取案件详情验证
    console.log('4. 验证更新结果...');
    const detailResponse = await axios.get(`${BASE_URL}/cases/${firstCase.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const updatedCase = detailResponse.data.data.case;
    console.log('更新后的案件信息:');
    console.log(`  产业板块: ${updatedCase.industry_segment}`);
    console.log(`  案件承接人: ${updatedCase.handler}`);
    console.log(`  是否外部代理: ${updatedCase.is_external_agent ? '是' : '否'}`);
    console.log(`  律所名称: ${updatedCase.law_firm_name}`);
    console.log(`  代理律师: ${updatedCase.agent_lawyer}`);
    console.log(`  联系方式: ${updatedCase.agent_contact}`);
    
    console.log('\n✓ 测试完成！');
    
  } catch (error) {
    console.error('测试失败:', error.response?.data || error.message);
  }
}

testUpdateCase();
