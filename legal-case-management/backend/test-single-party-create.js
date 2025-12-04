const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function test() {
  try {
    // Login
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    const token = loginRes.data.data.token;
    console.log('✓ 登录成功');

    // Create test case
    const caseRes = await axios.post(
      `${BASE_URL}/cases`,
      {
        case_number: `TEST-SINGLE-${Date.now()}`,
        case_cause: '合同纠纷',
        case_type: '民事案件',
        court: '北京市朝阳区人民法院',
        filing_date: '2024-01-01',
        handler: '测试人员',
        industry_segment: '科技',
        case_background: '测试单个主体创建'
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const caseId = caseRes.data.data.case.id;
    console.log(`✓ 创建测试案件成功 (ID: ${caseId})`);

    // Test single party creation
    console.log('\n测试单个主体创建:');
    const singleParty = {
      party_type: '原告',
      entity_type: '个人',
      name: '张三',
      birth_date: '1990-01-01',
      contact_phone: '13800138001',
      address: '北京市朝阳区'
    };
    console.log('发送数据:', JSON.stringify(singleParty, null, 2));

    const singleRes = await axios.post(
      `${BASE_URL}/cases/${caseId}/parties`,
      singleParty,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✓ 单个主体创建成功');
    console.log('响应:', JSON.stringify(singleRes.data, null, 2));

    // Test batch party creation
    console.log('\n测试批量主体创建:');
    const batchParties = [
      {
        party_type: '被告',
        entity_type: '个人',
        name: '李四',
        birth_date: '1985-05-15',
        contact_phone: '13800138002',
        address: '北京市海淀区'
      },
      {
        party_type: '第三人',
        entity_type: '个人',
        name: '王五',
        birth_date: '1992-08-20',
        contact_phone: '13800138003',
        address: '北京市西城区'
      }
    ];
    console.log('发送数据:', JSON.stringify(batchParties, null, 2));

    const batchRes = await axios.post(
      `${BASE_URL}/cases/${caseId}/parties`,
      batchParties,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✓ 批量主体创建成功');
    console.log('响应:', JSON.stringify(batchRes.data, null, 2));

    // Cleanup
    await axios.delete(`${BASE_URL}/cases/${caseId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('\n✓ 测试案件已删除');

  } catch (error) {
    console.error('✗ 错误:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('详细信息:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

test();
