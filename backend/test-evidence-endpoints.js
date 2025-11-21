/**
 * 简化的证据管理 API 测试脚本
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000/api';
let authToken = '';
let testCaseId = null;
let testEvidenceId = null;

// 创建测试用的临时文件 (创建一个简单的图片文件)
function createTestFile() {
  const testFilePath = path.join(__dirname, 'test-evidence.jpg');
  // 创建一个最小的 JPEG 文件 (1x1 像素)
  const minimalJpeg = Buffer.from([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
    0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
    0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
    0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
    0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
    0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
    0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
    0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x03, 0xFF, 0xC4, 0x00, 0x14, 0x10, 0x01, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00,
    0x7F, 0x80, 0xFF, 0xD9
  ]);
  fs.writeFileSync(testFilePath, minimalJpeg);
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
    authToken = response.data.data.token;
    console.log('✓ 登录成功');
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
    testCaseId = response.data.data.case.id;
    console.log('✓ 案件创建成功, ID:', testCaseId);
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
    console.log('✓ 证据上传成功, ID:', testEvidenceId);
    
    // 清理测试文件
    fs.unlinkSync(testFilePath);
    return true;
  } catch (error) {
    console.error('✗ 上传证据失败:', error.response?.data || error.message);
    return false;
  }
}

// 4. 获取案件证据列表 (Task 8.2 - Endpoint 1)
async function getEvidenceList() {
  try {
    console.log('\n=== 4. 获取案件证据列表 (GET /api/cases/:caseId/evidence) ===');
    const response = await axios.get(
      `${BASE_URL}/cases/${testCaseId}/evidence`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    console.log('✓ 获取证据列表成功');
    console.log('  证据数量:', response.data.count);
    return true;
  } catch (error) {
    console.error('✗ 获取证据列表失败:', error.response?.data || error.message);
    return false;
  }
}

// 5. 获取证据详情 (Task 8.2 - Endpoint 2)
async function getEvidenceDetail() {
  try {
    console.log('\n=== 5. 获取证据详情 (GET /api/evidence/:id) ===');
    const response = await axios.get(
      `${BASE_URL}/evidence/${testEvidenceId}`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    console.log('✓ 获取证据详情成功');
    console.log('  文件名:', response.data.evidence.file_name);
    console.log('  分类:', response.data.evidence.category);
    return true;
  } catch (error) {
    console.error('✗ 获取证据详情失败:', error.response?.data || error.message);
    return false;
  }
}

// 6. 更新证据信息 (Task 8.2 - Endpoint 5)
async function updateEvidence() {
  try {
    console.log('\n=== 6. 更新证据信息 (PUT /api/evidence/:id) ===');
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
    console.log('  新分类:', response.data.evidence.category);
    console.log('  新标签:', response.data.evidence.tags);
    return true;
  } catch (error) {
    console.error('✗ 更新证据信息失败:', error.response?.data || error.message);
    return false;
  }
}

// 7. 下载证据文件 (Task 8.2 - Endpoint 3)
async function downloadEvidence() {
  try {
    console.log('\n=== 7. 下载证据文件 (GET /api/evidence/:id/download) ===');
    const response = await axios.get(
      `${BASE_URL}/evidence/${testEvidenceId}/download`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        responseType: 'arraybuffer'
      }
    );
    console.log('✓ 下载证据文件成功');
    console.log('  文件大小:', response.data.byteLength, 'bytes');
    return true;
  } catch (error) {
    console.error('✗ 下载证据文件失败:', error.response?.data || error.message);
    return false;
  }
}

// 8. 删除证据 (Task 8.2 - Endpoint 4)
async function deleteEvidence() {
  try {
    console.log('\n=== 8. 删除证据 (DELETE /api/evidence/:id) ===');
    const response = await axios.delete(
      `${BASE_URL}/evidence/${testEvidenceId}`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    console.log('✓ 删除证据成功');
    console.log('  消息:', response.data.message);
    return true;
  } catch (error) {
    console.error('✗ 删除证据失败:', error.response?.data || error.message);
    return false;
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('========================================');
  console.log('证据管理 API 测试 (Task 8.2)');
  console.log('========================================');

  const tests = [
    { name: '登录', fn: login },
    { name: '创建测试案件', fn: createTestCase },
    { name: '上传证据', fn: uploadEvidence },
    { name: 'GET /api/cases/:caseId/evidence', fn: getEvidenceList },
    { name: 'GET /api/evidence/:id', fn: getEvidenceDetail },
    { name: 'PUT /api/evidence/:id', fn: updateEvidence },
    { name: 'GET /api/evidence/:id/download', fn: downloadEvidence },
    { name: 'DELETE /api/evidence/:id', fn: deleteEvidence }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = await test.fn();
    if (result) {
      passed++;
    } else {
      failed++;
      break; // 如果某个测试失败，停止后续测试
    }
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log('\n========================================');
  console.log('测试完成');
  console.log(`通过: ${passed}/${tests.length}`);
  console.log(`失败: ${failed}/${tests.length}`);
  console.log('========================================');
  
  if (passed === tests.length) {
    console.log('\n✓ 所有 Task 8.2 的接口都已正确实现！');
  }
}

// 执行测试
runAllTests().catch(error => {
  console.error('测试执行出错:', error);
  process.exit(1);
});
