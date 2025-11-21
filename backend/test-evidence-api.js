/**
 * 证据管理 API 测试脚本
 * 
 * 使用方法:
 * 1. 确保后端服务正在运行 (npm run dev)
 * 2. 运行此脚本: node test-evidence-api.js
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000/api';
let authToken = '';
let testCaseId = null;
let testEvidenceId = null;

// 创建测试用的临时文件
function createTestFile() {
  const testFilePath = path.join(__dirname, 'test-evidence.txt');
  fs.writeFileSync(testFilePath, '这是一个测试证据文件\nTest Evidence File\n测试内容');
  return testFilePath;
}

// 1. 登录获取 token
async function login() {
  try {
    console.log('\n=== 1. 用户登录 ===');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'testuser',
      password: 'password123'
    });
    authToken = response.data.token;
    console.log('✓ 登录成功');
    console.log('Token:', authToken.substring(0, 20) + '...');
    return true;
  } catch (error) {
    console.error('✗ 登录失败:', error.response?.data || error.message);
    return false;
  }
}

// 2. 创建测试案件
async function createTestCase() {
  try {
    console.log('\n=== 2. 创建测试案件 ===');
    const response = await axios.post(
      `${BASE_URL}/cases`,
      {
        case_type: '民事',
        case_cause: '合同纠纷',
        court: '测试法院',
        target_amount: 100000,
        filing_date: '2024-01-01',
        status: 'active'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    testCaseId = response.data.case.id;
    console.log('✓ 案件创建成功');
    console.log('案件 ID:', testCaseId);
    return true;
  } catch (error) {
    console.error('✗ 创建案件失败:', error.response?.data || error.message);
    return false;
  }
}

// 3. 上传证据文件
async function uploadEvidence() {
  try {
    console.log('\n=== 3. 上传证据文件 ===');
    const testFilePath = createTestFile();
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath));
    formData.append('case_id', testCaseId);
    formData.append('category', '书证');
    formData.append('tags', '合同,协议');

    const response = await axios.post(
      `${BASE_URL}/evidence/upload`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${authToken}`
        }
      }
    );

    testEvidenceId = response.data.evidence.id;
    console.log('✓ 证据上传成功');
    console.log('证据 ID:', testEvidenceId);
    console.log('文件名:', response.data.evidence.file_name);
    
    // 清理测试文件
    fs.unlinkSync(testFilePath);
    return true;
  } catch (error) {
    console.error('✗ 上传证据失败:', error.response?.data || error.message);
    return false;
  }
}

// 4. 获取案件证据列表
async function getEvidenceList() {
  try {
    console.log('\n=== 4. 获取案件证据列表 ===');
    const response = await axios.get(
      `${BASE_URL}/cases/${testCaseId}/evidence`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    console.log('✓ 获取证据列表成功');
    console.log('证据数量:', response.data.count);
    console.log('证据列表:', response.data.evidence.map(e => ({
      id: e.id,
      file_name: e.file_name,
      category: e.category
    })));
    return true;
  } catch (error) {
    console.error('✗ 获取证据列表失败:', error.response?.data || error.message);
    return false;
  }
}

// 5. 获取证据详情
async function getEvidenceDetail() {
  try {
    console.log('\n=== 5. 获取证据详情 ===');
    const response = await axios.get(
      `${BASE_URL}/evidence/${testEvidenceId}`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    console.log('✓ 获取证据详情成功');
    console.log('证据信息:', {
      id: response.data.evidence.id,
      file_name: response.data.evidence.file_name,
      category: response.data.evidence.category,
      version: response.data.evidence.version
    });
    return true;
  } catch (error) {
    console.error('✗ 获取证据详情失败:', error.response?.data || error.message);
    return false;
  }
}

// 6. 更新证据信息
async function updateEvidence() {
  try {
    console.log('\n=== 6. 更新证据信息 ===');
    const response = await axios.put(
      `${BASE_URL}/evidence/${testEvidenceId}`,
      {
        category: '物证',
        tags: '合同,协议,更新'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    console.log('✓ 更新证据信息成功');
    console.log('更新后分类:', response.data.evidence.category);
    console.log('更新后标签:', response.data.evidence.tags);
    return true;
  } catch (error) {
    console.error('✗ 更新证据信息失败:', error.response?.data || error.message);
    return false;
  }
}

// 7. 上传新版本
async function uploadNewVersion() {
  try {
    console.log('\n=== 7. 上传证据新版本 ===');
    const testFilePath = createTestFile();
    fs.appendFileSync(testFilePath, '\n这是第二版的内容\nVersion 2 content');
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath));

    const response = await axios.post(
      `${BASE_URL}/evidence/${testEvidenceId}/version`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${authToken}`
        }
      }
    );

    console.log('✓ 上传新版本成功');
    console.log('当前版本:', response.data.evidence.version);
    
    // 清理测试文件
    fs.unlinkSync(testFilePath);
    return true;
  } catch (error) {
    console.error('✗ 上传新版本失败:', error.response?.data || error.message);
    return false;
  }
}

// 8. 获取版本历史
async function getVersionHistory() {
  try {
    console.log('\n=== 8. 获取版本历史 ===');
    const response = await axios.get(
      `${BASE_URL}/evidence/${testEvidenceId}/versions`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    console.log('✓ 获取版本历史成功');
    console.log('总版本数:', response.data.total_versions);
    console.log('当前版本:', response.data.current.version);
    console.log('历史版本数:', response.data.history.length);
    return true;
  } catch (error) {
    console.error('✗ 获取版本历史失败:', error.response?.data || error.message);
    return false;
  }
}

// 9. 获取操作日志
async function getOperationLogs() {
  try {
    console.log('\n=== 9. 获取操作日志 ===');
    const response = await axios.get(
      `${BASE_URL}/evidence/${testEvidenceId}/logs`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    console.log('✓ 获取操作日志成功');
    console.log('日志数量:', response.data.count);
    console.log('操作统计:', response.data.stats);
    console.log('最近操作:', response.data.logs.slice(0, 3).map(log => ({
      operation: log.operation_type,
      operator: log.operator,
      time: log.operation_time
    })));
    return true;
  } catch (error) {
    console.error('✗ 获取操作日志失败:', error.response?.data || error.message);
    return false;
  }
}

// 10. 获取案件证据日志
async function getCaseEvidenceLogs() {
  try {
    console.log('\n=== 10. 获取案件证据日志 ===');
    const response = await axios.get(
      `${BASE_URL}/cases/${testCaseId}/evidence/logs`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    console.log('✓ 获取案件证据日志成功');
    console.log('日志数量:', response.data.count);
    return true;
  } catch (error) {
    console.error('✗ 获取案件证据日志失败:', error.response?.data || error.message);
    return false;
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('========================================');
  console.log('证据管理 API 测试');
  console.log('========================================');

  const tests = [
    login,
    createTestCase,
    uploadEvidence,
    getEvidenceList,
    getEvidenceDetail,
    updateEvidence,
    uploadNewVersion,
    getVersionHistory,
    getOperationLogs,
    getCaseEvidenceLogs
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = await test();
    if (result) {
      passed++;
    } else {
      failed++;
    }
    // 等待一小段时间，避免请求过快
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n========================================');
  console.log('测试完成');
  console.log(`通过: ${passed}/${tests.length}`);
  console.log(`失败: ${failed}/${tests.length}`);
  console.log('========================================');
}

// 执行测试
runAllTests().catch(error => {
  console.error('测试执行出错:', error);
  process.exit(1);
});
