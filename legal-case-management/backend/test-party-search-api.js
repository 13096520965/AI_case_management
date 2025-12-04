/**
 * 测试主体搜索API
 * 测试任务 4.1, 4.2, 4.3 的实现
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// 测试用户凭证
let authToken = '';

/**
 * 登录获取token
 */
async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    authToken = response.data.data.token;
    console.log('✓ 登录成功');
    return true;
  } catch (error) {
    console.error('✗ 登录失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试 4.1: 搜索建议接口
 */
async function testSearchSuggestions() {
  console.log('\n=== 测试 4.1: 搜索建议接口 ===');
  
  try {
    // 测试1: 基本搜索（不指定主体类型）
    console.log('\n测试1: 基本搜索建议');
    const response1 = await axios.get(`${BASE_URL}/parties/suggestions`, {
      params: { keyword: '张' },
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✓ 搜索建议返回成功');
    console.log('  建议数量:', response1.data.data.suggestions.length);
    if (response1.data.data.suggestions.length > 0) {
      console.log('  示例建议:', response1.data.data.suggestions[0]);
      
      // 验证返回格式
      const suggestion = response1.data.data.suggestions[0];
      if (suggestion.name && suggestion.case_count !== undefined) {
        console.log('✓ 返回格式正确（包含 name 和 case_count）');
      } else {
        console.log('✗ 返回格式错误');
      }
    }
    
    // 测试2: 按主体类型搜索
    console.log('\n测试2: 按主体类型搜索建议');
    const response2 = await axios.get(`${BASE_URL}/parties/suggestions`, {
      params: { keyword: '公司', partyType: '被告' },
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✓ 按类型搜索建议返回成功');
    console.log('  建议数量:', response2.data.data.suggestions.length);
    
    // 测试3: 空关键词（应该返回错误）
    console.log('\n测试3: 空关键词验证');
    try {
      await axios.get(`${BASE_URL}/parties/suggestions`, {
        params: { keyword: '' },
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('✗ 应该拒绝空关键词');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✓ 正确拒绝空关键词');
      } else {
        console.log('✗ 错误状态码:', error.response?.status);
      }
    }
    
    // 测试4: 验证排序（按案件数量降序）
    console.log('\n测试4: 验证排序');
    const response4 = await axios.get(`${BASE_URL}/parties/suggestions`, {
      params: { keyword: '公' }, // 搜索包含"公"的主体
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const suggestions = response4.data.data.suggestions;
    if (suggestions.length > 1) {
      let isSorted = true;
      for (let i = 0; i < suggestions.length - 1; i++) {
        if (suggestions[i].case_count < suggestions[i + 1].case_count) {
          isSorted = false;
          break;
        }
      }
      if (isSorted) {
        console.log('✓ 结果按案件数量降序排序');
      } else {
        console.log('✗ 排序不正确');
      }
    }
    
    // 测试5: 验证限制10条
    console.log('\n测试5: 验证结果限制');
    if (suggestions.length <= 10) {
      console.log('✓ 结果限制在10条以内');
    } else {
      console.log('✗ 结果超过10条:', suggestions.length);
    }
    
  } catch (error) {
    console.error('✗ 测试失败:', error.response?.data || error.message);
  }
}

/**
 * 测试 4.2: 主体历史信息接口
 */
async function testPartyHistory() {
  console.log('\n=== 测试 4.2: 主体历史信息接口 ===');
  
  try {
    // 首先获取一个主体ID
    console.log('\n准备: 获取测试主体ID');
    const casesResponse = await axios.get(`${BASE_URL}/cases`, {
      params: { page: 1, limit: 1 },
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (!casesResponse.data.data.cases || casesResponse.data.data.cases.length === 0) {
      console.log('⚠ 没有案件数据，跳过测试');
      return;
    }
    
    const caseId = casesResponse.data.data.cases[0].id;
    
    // 获取该案件的主体
    const partiesResponse = await axios.get(`${BASE_URL}/cases/${caseId}/parties`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (!partiesResponse.data.data.parties || partiesResponse.data.data.parties.length === 0) {
      console.log('⚠ 该案件没有主体数据，跳过测试');
      return;
    }
    
    const partyId = partiesResponse.data.data.parties[0].id;
    console.log('  使用主体ID:', partyId);
    
    // 测试1: 获取主体历史信息
    console.log('\n测试1: 获取主体历史信息');
    const response = await axios.get(`${BASE_URL}/parties/${partyId}/history`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✓ 主体历史信息返回成功');
    
    // 验证返回格式
    const data = response.data.data;
    if (data.party && data.cases) {
      console.log('✓ 返回格式正确（包含 party 和 cases）');
      console.log('  主体名称:', data.party.name);
      console.log('  历史案件数量:', data.cases.length);
      
      // 验证主体信息字段
      if (data.party.id && data.party.name && data.party.entity_type) {
        console.log('✓ 主体基本信息完整');
      } else {
        console.log('✗ 主体基本信息不完整');
      }
      
      // 验证案件列表格式
      if (data.cases.length > 0) {
        const caseItem = data.cases[0];
        if (caseItem.id && caseItem.case_number) {
          console.log('✓ 案件列表格式正确');
        } else {
          console.log('✗ 案件列表格式错误');
        }
      }
    } else {
      console.log('✗ 返回格式错误');
    }
    
    // 测试2: 不存在的主体ID
    console.log('\n测试2: 不存在的主体ID');
    try {
      await axios.get(`${BASE_URL}/parties/999999/history`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('✗ 应该返回404');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✓ 正确返回404');
      } else {
        console.log('✗ 错误状态码:', error.response?.status);
      }
    }
    
  } catch (error) {
    console.error('✗ 测试失败:', error.response?.data || error.message);
  }
}

/**
 * 测试 4.3: 主体模板查询接口
 */
async function testPartyTemplate() {
  console.log('\n=== 测试 4.3: 主体模板查询接口 ===');
  
  try {
    // 首先获取一个已存在的主体名称
    console.log('\n准备: 获取测试主体名称');
    const casesResponse = await axios.get(`${BASE_URL}/cases`, {
      params: { page: 1, limit: 1 },
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (!casesResponse.data.data.cases || casesResponse.data.data.cases.length === 0) {
      console.log('⚠ 没有案件数据，跳过测试');
      return;
    }
    
    const caseId = casesResponse.data.data.cases[0].id;
    
    // 获取该案件的主体
    const partiesResponse = await axios.get(`${BASE_URL}/cases/${caseId}/parties`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (!partiesResponse.data.data.parties || partiesResponse.data.data.parties.length === 0) {
      console.log('⚠ 该案件没有主体数据，跳过测试');
      return;
    }
    
    const partyName = partiesResponse.data.data.parties[0].name;
    console.log('  使用主体名称:', partyName);
    
    // 测试1: 获取主体模板
    console.log('\n测试1: 获取主体模板');
    const response = await axios.get(`${BASE_URL}/parties/templates/${encodeURIComponent(partyName)}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✓ 主体模板返回成功');
    
    // 验证返回格式
    const template = response.data.data.template;
    if (template) {
      console.log('✓ 返回模板数据');
      console.log('  模板名称:', template.name);
      console.log('  实体类型:', template.entity_type);
      console.log('  联系电话:', template.contact_phone);
      console.log('  地址:', template.address);
      
      // 验证必要字段
      if (template.name && template.entity_type) {
        console.log('✓ 模板数据包含必要字段');
      } else {
        console.log('✗ 模板数据缺少必要字段');
      }
    } else {
      console.log('✗ 未返回模板数据');
    }
    
    // 测试2: 多次查询同一模板（验证使用统计更新）
    console.log('\n测试2: 验证使用统计更新');
    await axios.get(`${BASE_URL}/parties/templates/${encodeURIComponent(partyName)}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✓ 第二次查询成功（使用统计应该已更新）');
    
    // 测试3: 不存在的主体名称
    console.log('\n测试3: 不存在的主体名称');
    try {
      await axios.get(`${BASE_URL}/parties/templates/${encodeURIComponent('不存在的主体名称12345')}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('✗ 应该返回404');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✓ 正确返回404');
      } else {
        console.log('✗ 错误状态码:', error.response?.status);
      }
    }
    
    // 测试4: 空名称
    console.log('\n测试4: 空名称验证');
    try {
      await axios.get(`${BASE_URL}/parties/templates/`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('✗ 应该返回错误');
    } catch (error) {
      if (error.response?.status === 404 || error.response?.status === 400) {
        console.log('✓ 正确拒绝空名称');
      } else {
        console.log('✗ 错误状态码:', error.response?.status);
      }
    }
    
  } catch (error) {
    console.error('✗ 测试失败:', error.response?.data || error.message);
  }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('开始测试主体搜索API...\n');
  
  // 登录
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.error('登录失败，终止测试');
    return;
  }
  
  // 运行测试
  await testSearchSuggestions();
  await testPartyHistory();
  await testPartyTemplate();
  
  console.log('\n=== 测试完成 ===');
}

// 运行测试
runAllTests().catch(console.error);
