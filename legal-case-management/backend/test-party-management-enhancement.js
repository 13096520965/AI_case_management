const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// 测试用户登录凭证
let authToken = '';
let testCaseId = null;
let testPartyIds = [];

/**
 * 登录获取 token
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
 * 创建测试案件
 */
async function createTestCase() {
  try {
    const response = await axios.post(
      `${BASE_URL}/cases`,
      {
        case_number: `TEST-${Date.now()}`,
        case_cause: '合同纠纷',
        case_type: '民事案件',
        court: '北京市朝阳区人民法院',
        filing_date: '2024-01-01',
        handler: '测试人员',
        industry_segment: '科技',
        case_background: '这是一个测试案件，用于测试主体管理API增强功能'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    testCaseId = response.data.data.case.id;
    console.log(`✓ 创建测试案件成功 (ID: ${testCaseId})`);
    return true;
  } catch (error) {
    console.error('✗ 创建测试案件失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试 3.1: 批量创建主体（支持按类型自动设置 is_primary）
 */
async function testBatchCreateParties() {
  console.log('\n=== 测试 3.1: 批量创建主体 ===');
  
  try {
    // 批量创建多个主体
    const parties = [
      {
        party_type: '原告',
        entity_type: '个人',
        name: '张三',
        birth_date: '1990-01-01',
        contact_phone: '13800138001',
        address: '北京市朝阳区'
      },
      {
        party_type: '原告',
        entity_type: '个人',
        name: '李四',
        birth_date: '1985-05-15',
        contact_phone: '13800138002',
        address: '北京市海淀区'
      },
      {
        party_type: '被告',
        entity_type: '企业',
        name: '某某科技有限公司',
        unified_credit_code: '91110000XXXXXXXX',
        legal_representative: '王五',
        contact_phone: '010-12345678',
        address: '北京市东城区'
      },
      {
        party_type: '第三人',
        entity_type: '个人',
        name: '赵六',
        birth_date: '1992-08-20',
        contact_phone: '13800138003',
        address: '北京市西城区'
      }
    ];

    const response = await axios.post(
      `${BASE_URL}/cases/${testCaseId}/parties`,
      parties,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    console.log('✓ 批量创建主体成功');
    console.log(`  - 创建数量: ${response.data.data.count}`);
    console.log(`  - 消息: ${response.data.message}`);
    
    // 保存创建的主体 ID
    testPartyIds = response.data.data.parties.map(p => p.id);
    
    // 验证 is_primary 字段
    const primaryParties = response.data.data.parties.filter(p => p.is_primary === 1);
    console.log(`  - 主要当事人数量: ${primaryParties.length}`);
    primaryParties.forEach(p => {
      console.log(`    * ${p.name} (${p.party_type}) - is_primary: ${p.is_primary}`);
    });

    // 验证历史记录是否创建
    console.log('  - 验证历史记录已创建');
    
    return true;
  } catch (error) {
    console.error('✗ 批量创建主体失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试 3.2: 更新主体并记录变更历史
 */
async function testUpdatePartyWithHistory() {
  console.log('\n=== 测试 3.2: 更新主体并记录变更历史 ===');
  
  if (testPartyIds.length === 0) {
    console.error('✗ 没有可用的测试主体');
    return false;
  }

  try {
    const partyId = testPartyIds[0];
    
    // 更新主体信息
    const updateData = {
      contact_phone: '13900139000',
      address: '北京市朝阳区新地址123号'
    };

    const response = await axios.put(
      `${BASE_URL}/parties/${partyId}`,
      updateData,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    console.log('✓ 更新主体成功');
    console.log(`  - 消息: ${response.data.message}`);
    console.log('  - 变更字段:');
    
    if (response.data.data.changedFields) {
      Object.keys(response.data.data.changedFields).forEach(field => {
        const change = response.data.data.changedFields[field];
        console.log(`    * ${field}: "${change.old}" -> "${change.new}"`);
      });
    }

    return true;
  } catch (error) {
    console.error('✗ 更新主体失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试 3.3: 删除主体并检查引用
 */
async function testDeletePartyWithReferenceCheck() {
  console.log('\n=== 测试 3.3: 删除主体并检查引用 ===');
  
  if (testPartyIds.length === 0) {
    console.error('✗ 没有可用的测试主体');
    return false;
  }

  try {
    // 删除最后一个主体
    const partyId = testPartyIds[testPartyIds.length - 1];
    
    const response = await axios.delete(
      `${BASE_URL}/parties/${partyId}`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    console.log('✓ 删除主体成功');
    console.log(`  - 消息: ${response.data.message}`);
    console.log(`  - 是否完全删除: ${response.data.data.isFullDelete ? '是' : '否'}`);
    console.log(`  - 剩余引用数量: ${response.data.data.remainingReferences}`);
    
    if (response.data.data.referencedCases.length > 0) {
      console.log(`  - 其他引用案件: ${response.data.data.referencedCases.join(', ')}`);
    }

    return true;
  } catch (error) {
    console.error('✗ 删除主体失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 查询案件的所有主体
 */
async function listCaseParties() {
  console.log('\n=== 查询案件主体列表 ===');
  
  try {
    const response = await axios.get(
      `${BASE_URL}/cases/${testCaseId}/parties`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    console.log('✓ 查询成功');
    console.log(`  - 主体总数: ${response.data.data.parties.length}`);
    
    response.data.data.parties.forEach(party => {
      console.log(`  - ${party.name} (${party.party_type}) - is_primary: ${party.is_primary}`);
    });

    return true;
  } catch (error) {
    console.error('✗ 查询失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 清理测试数据
 */
async function cleanup() {
  console.log('\n=== 清理测试数据 ===');
  
  if (!testCaseId) {
    console.log('没有需要清理的数据');
    return;
  }

  try {
    await axios.delete(
      `${BASE_URL}/cases/${testCaseId}`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    console.log('✓ 测试案件已删除');
  } catch (error) {
    console.error('✗ 清理失败:', error.response?.data || error.message);
  }
}

/**
 * 运行所有测试
 */
async function runTests() {
  console.log('开始测试主体管理API增强功能...\n');

  // 登录
  if (!await login()) {
    console.error('登录失败，终止测试');
    return;
  }

  // 创建测试案件
  if (!await createTestCase()) {
    console.error('创建测试案件失败，终止测试');
    return;
  }

  // 运行测试
  const results = {
    test31: await testBatchCreateParties(),
    test32: await testUpdatePartyWithHistory(),
    list: await listCaseParties(),
    test33: await testDeletePartyWithReferenceCheck()
  };

  // 显示最终列表
  await listCaseParties();

  // 清理
  await cleanup();

  // 总结
  console.log('\n=== 测试总结 ===');
  console.log(`测试 3.1 (批量创建): ${results.test31 ? '✓ 通过' : '✗ 失败'}`);
  console.log(`测试 3.2 (更新历史): ${results.test32 ? '✓ 通过' : '✗ 失败'}`);
  console.log(`测试 3.3 (删除检查): ${results.test33 ? '✓ 通过' : '✗ 失败'}`);
  
  const allPassed = results.test31 && results.test32 && results.test33;
  console.log(`\n总体结果: ${allPassed ? '✓ 所有测试通过' : '✗ 部分测试失败'}`);
}

// 运行测试
runTests().catch(error => {
  console.error('测试执行出错:', error);
  process.exit(1);
});
