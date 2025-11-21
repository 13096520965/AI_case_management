const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000/api';
let authToken = '';
let testCaseId = null;
let testDocumentId = null;
let testTemplateId = null;

// 测试用户登录
async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'testuser',
      password: 'password123'
    });
    authToken = response.data.token;
    console.log('✓ 登录成功');
    return true;
  } catch (error) {
    console.error('✗ 登录失败:', error.response?.data || error.message);
    return false;
  }
}

// 创建测试案件
async function createTestCase() {
  try {
    const response = await axios.post(`${BASE_URL}/cases`, {
      case_type: '民事',
      case_cause: '合同纠纷',
      court: '某某区人民法院',
      target_amount: 100000,
      filing_date: '2024-01-15'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    testCaseId = response.data.case.id;
    console.log('✓ 创建测试案件成功, ID:', testCaseId);
    return true;
  } catch (error) {
    console.error('✗ 创建测试案件失败:', error.response?.data || error.message);
    return false;
  }
}

// 测试文书上传
async function testDocumentUpload() {
  try {
    // 创建测试文件
    const testFilePath = path.join(__dirname, 'test-document.txt');
    fs.writeFileSync(testFilePath, '这是一个测试文书文件内容');

    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath));
    formData.append('case_id', testCaseId);
    formData.append('document_type', '起诉状');

    const response = await axios.post(`${BASE_URL}/documents/upload`, formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${authToken}`
      }
    });

    testDocumentId = response.data.document.id;
    console.log('✓ 文书上传成功, ID:', testDocumentId);
    console.log('  - 文件名:', response.data.document.file_name);
    console.log('  - 文书类型:', response.data.document.document_type);

    // 清理测试文件
    fs.unlinkSync(testFilePath);
    return true;
  } catch (error) {
    console.error('✗ 文书上传失败:', error.response?.data || error.message);
    return false;
  }
}

// 测试获取案件文书列表
async function testGetDocuments() {
  try {
    const response = await axios.get(`${BASE_URL}/cases/${testCaseId}/documents`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✓ 获取文书列表成功');
    console.log('  - 文书数量:', response.data.count);
    return true;
  } catch (error) {
    console.error('✗ 获取文书列表失败:', error.response?.data || error.message);
    return false;
  }
}

// 测试获取文书详情
async function testGetDocumentById() {
  try {
    const response = await axios.get(`${BASE_URL}/documents/${testDocumentId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✓ 获取文书详情成功');
    console.log('  - 文书ID:', response.data.document.id);
    console.log('  - 文书类型:', response.data.document.document_type);
    return true;
  } catch (error) {
    console.error('✗ 获取文书详情失败:', error.response?.data || error.message);
    return false;
  }
}

// 测试文书分类统计
async function testDocumentStatistics() {
  try {
    const response = await axios.get(`${BASE_URL}/cases/${testCaseId}/documents/statistics`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✓ 获取文书统计成功');
    console.log('  - 总数:', response.data.total_count);
    console.log('  - 分类统计:', JSON.stringify(response.data.statistics, null, 2));
    return true;
  } catch (error) {
    console.error('✗ 获取文书统计失败:', error.response?.data || error.message);
    return false;
  }
}

// 测试OCR识别
async function testOCRRecognition() {
  try {
    const response = await axios.post(`${BASE_URL}/documents/${testDocumentId}/ocr`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✓ OCR识别成功');
    console.log('  - 识别结果:', response.data.ocr_result.note);
    return true;
  } catch (error) {
    console.error('✗ OCR识别失败:', error.response?.data || error.message);
    return false;
  }
}

// 测试获取OCR结果
async function testGetOCRResult() {
  try {
    const response = await axios.get(`${BASE_URL}/documents/${testDocumentId}/ocr`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✓ 获取OCR结果成功');
    console.log('  - 文书类型:', response.data.document_type);
    return true;
  } catch (error) {
    console.error('✗ 获取OCR结果失败:', error.response?.data || error.message);
    return false;
  }
}

// 测试创建文书模板
async function testCreateTemplate() {
  try {
    const response = await axios.post(`${BASE_URL}/document-templates`, {
      template_name: '测试模板',
      document_type: '起诉状',
      content: '原告：{{plaintiff}}，被告：{{defendant}}',
      variables: [
        { name: 'plaintiff', label: '原告', type: 'text', required: true },
        { name: 'defendant', label: '被告', type: 'text', required: true }
      ],
      description: '这是一个测试模板'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    testTemplateId = response.data.template.id;
    console.log('✓ 创建文书模板成功, ID:', testTemplateId);
    return true;
  } catch (error) {
    console.error('✗ 创建文书模板失败:', error.response?.data || error.message);
    return false;
  }
}

// 测试获取模板列表
async function testGetTemplates() {
  try {
    const response = await axios.get(`${BASE_URL}/document-templates`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✓ 获取模板列表成功');
    console.log('  - 模板数量:', response.data.count);
    return true;
  } catch (error) {
    console.error('✗ 获取模板列表失败:', error.response?.data || error.message);
    return false;
  }
}

// 测试基于模板生成文书
async function testGenerateFromTemplate() {
  try {
    const response = await axios.post(`${BASE_URL}/document-templates/${testTemplateId}/generate`, {
      plaintiff: '张三',
      defendant: '李四'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✓ 基于模板生成文书成功');
    console.log('  - 生成内容:', response.data.document.content);
    return true;
  } catch (error) {
    console.error('✗ 基于模板生成文书失败:', error.response?.data || error.message);
    return false;
  }
}

// 测试获取默认模板
async function testGetDefaultTemplates() {
  try {
    const response = await axios.get(`${BASE_URL}/document-templates/defaults`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✓ 获取默认模板成功');
    console.log('  - 默认模板数量:', response.data.count);
    return true;
  } catch (error) {
    console.error('✗ 获取默认模板失败:', error.response?.data || error.message);
    return false;
  }
}

// 测试删除文书
async function testDeleteDocument() {
  try {
    await axios.delete(`${BASE_URL}/documents/${testDocumentId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✓ 删除文书成功');
    return true;
  } catch (error) {
    console.error('✗ 删除文书失败:', error.response?.data || error.message);
    return false;
  }
}

// 运行所有测试
async function runTests() {
  console.log('\n========== 文书管理 API 测试 ==========\n');

  if (!await login()) return;
  if (!await createTestCase()) return;

  console.log('\n--- 文书上传和管理测试 ---');
  await testDocumentUpload();
  await testGetDocuments();
  await testGetDocumentById();
  await testDocumentStatistics();

  console.log('\n--- OCR识别测试 ---');
  await testOCRRecognition();
  await testGetOCRResult();

  console.log('\n--- 文书模板管理测试 ---');
  await testGetDefaultTemplates();
  await testCreateTemplate();
  await testGetTemplates();
  await testGenerateFromTemplate();

  console.log('\n--- 清理测试数据 ---');
  await testDeleteDocument();

  console.log('\n========== 测试完成 ==========\n');
}

// 执行测试
runTests().catch(console.error);
