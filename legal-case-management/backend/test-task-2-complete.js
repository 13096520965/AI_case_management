const Case = require('./src/models/Case');
const { run, query } = require('./src/config/database');

async function testTask2() {
  console.log('=== Testing Task 2: 案件查询API增强 ===\n');
  
  let testCaseId;
  
  try {
    // Setup: Create a test case with multiple parties
    console.log('Setup: Creating test case...');
    await run('INSERT INTO cases (case_number, internal_number, case_type, case_cause, court, status) VALUES (?, ?, ?, ?, ?, ?)', 
      ['TASK2-TEST', 'TASK2-TEST', '民事', '合同纠纷', '北京市朝阳区人民法院', 'active']);
    
    const caseResult = await query('SELECT id FROM cases WHERE case_number = ?', ['TASK2-TEST']);
    testCaseId = caseResult[0].id;
    
    // Add parties
    await run('INSERT INTO litigation_parties (case_id, party_type, entity_type, name, contact_phone, is_primary) VALUES (?, ?, ?, ?, ?, ?)',
      [testCaseId, '原告', '企业', '北京科技有限公司', '010-88888888', 1]);
    await run('INSERT INTO litigation_parties (case_id, party_type, entity_type, name, contact_phone, is_primary) VALUES (?, ?, ?, ?, ?, ?)',
      [testCaseId, '原告', '个人', '王五', '13900000001', 0]);
    await run('INSERT INTO litigation_parties (case_id, party_type, entity_type, name, contact_phone, is_primary) VALUES (?, ?, ?, ?, ?, ?)',
      [testCaseId, '被告', '企业', '上海贸易公司', '021-66666666', 1]);
    await run('INSERT INTO litigation_parties (case_id, party_type, entity_type, name, contact_phone, is_primary) VALUES (?, ?, ?, ?, ?, ?)',
      [testCaseId, '第三人', '个人', '赵六', '13700000001', 1]);
    
    console.log('✓ Test case created with ID:', testCaseId);
    
    // Test 2.1: 增强案件列表查询接口
    console.log('\n--- Test 2.1: 增强案件列表查询接口 ---');
    
    // Test 2.1.1: 返回数据包含 plaintiffs、defendants、third_parties 三个数组
    console.log('\n2.1.1: Testing party arrays in list response...');
    const listCases = await Case.findAllWithParties({ page: 1, limit: 10, search: 'TASK2-TEST' });
    
    if (listCases.length === 0) {
      throw new Error('No cases found');
    }
    
    const testCase = listCases[0];
    if (!Array.isArray(testCase.plaintiffs)) {
      throw new Error('plaintiffs is not an array');
    }
    if (!Array.isArray(testCase.defendants)) {
      throw new Error('defendants is not an array');
    }
    if (!Array.isArray(testCase.third_parties)) {
      throw new Error('third_parties is not an array');
    }
    
    console.log('✓ Response contains plaintiffs, defendants, third_parties arrays');
    console.log('  - Plaintiffs:', testCase.plaintiffs.length);
    console.log('  - Defendants:', testCase.defendants.length);
    console.log('  - Third Parties:', testCase.third_parties.length);
    
    // Test 2.1.2: 验证主体信息正确分组
    console.log('\n2.1.2: Testing party grouping by type...');
    if (testCase.plaintiffs.length !== 2) {
      throw new Error(`Expected 2 plaintiffs, got ${testCase.plaintiffs.length}`);
    }
    if (testCase.defendants.length !== 1) {
      throw new Error(`Expected 1 defendant, got ${testCase.defendants.length}`);
    }
    if (testCase.third_parties.length !== 1) {
      throw new Error(`Expected 1 third party, got ${testCase.third_parties.length}`);
    }
    
    console.log('✓ Parties correctly grouped by type');
    console.log('  - Plaintiffs:', testCase.plaintiffs.map(p => p.name).join(', '));
    console.log('  - Defendants:', testCase.defendants.map(p => p.name).join(', '));
    console.log('  - Third Parties:', testCase.third_parties.map(p => p.name).join(', '));
    
    // Test 2.1.3: 支持 partyName 查询参数进行当事人搜索
    console.log('\n2.1.3: Testing partyName search parameter...');
    const searchResults = await Case.findAllWithParties({ 
      page: 1, 
      limit: 10, 
      partyName: '北京科技' 
    });
    
    const foundTestCase = searchResults.find(c => c.id === testCaseId);
    if (!foundTestCase) {
      throw new Error('Test case not found in partyName search results');
    }
    
    console.log('✓ partyName search works correctly');
    console.log(`  - Found ${searchResults.length} cases with party name containing "北京科技"`);
    
    // Test 2.2: 增强案件详情查询接口
    console.log('\n--- Test 2.2: 增强案件详情查询接口 ---');
    
    // Test 2.2.1: 返回按类型分组的主体信息
    console.log('\n2.2.1: Testing party grouping in detail response...');
    const caseDetail = await Case.findByIdWithParties(testCaseId);
    
    if (!caseDetail) {
      throw new Error('Case detail not found');
    }
    
    if (!Array.isArray(caseDetail.plaintiffs) || caseDetail.plaintiffs.length !== 2) {
      throw new Error('Plaintiffs not correctly returned in detail');
    }
    if (!Array.isArray(caseDetail.defendants) || caseDetail.defendants.length !== 1) {
      throw new Error('Defendants not correctly returned in detail');
    }
    if (!Array.isArray(caseDetail.third_parties) || caseDetail.third_parties.length !== 1) {
      throw new Error('Third parties not correctly returned in detail');
    }
    
    console.log('✓ Detail response contains grouped parties');
    
    // Test 2.2.2: 包含每个主体的历史案件数量
    console.log('\n2.2.2: Testing case_count in party data...');
    const plaintiff = caseDetail.plaintiffs[0];
    if (typeof plaintiff.case_count !== 'number') {
      throw new Error('case_count not present in party data');
    }
    
    console.log('✓ Each party includes case_count');
    console.log(`  - ${plaintiff.name}: ${plaintiff.case_count} cases`);
    
    console.log('\n=== All Task 2 tests passed! ===');
    
  } catch (error) {
    console.error('\n✗ Test failed:', error.message);
    throw error;
  } finally {
    // Cleanup
    if (testCaseId) {
      console.log('\nCleaning up test data...');
      await run('DELETE FROM litigation_parties W