/**
 * 证据材料预览功能修复验证测试脚本
 * 
 * 测试目标:
 * 1. 验证文件上传后的路径格式（相对路径格式）
 * 2. 验证文件通过HTTP访问的可用性
 * 3. 验证预览和下载功能
 * 4. 验证错误处理场景
 * 
 * 使用方法:
 * 1. 确保后端服务正在运行 (npm run dev)
 * 2. 运行此脚本: node test-evidence-preview-fix.js
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000/api';
const STATIC_BASE_URL = 'http://localhost:3000';
let authToken = '';
let testCaseId = null;
let testEvidenceId = null;
let testImageEvidenceId = null;
let testPdfEvidenceId = null;

// 创建测试用的文本文件
function createTestTextFile() {
  const testFilePath = path.join(__dirname, 'test-evidence-text.txt');
  fs.writeFileSync(testFilePath, '这是一个测试证据文件\nTest Evidence File\n测试内容');
  return testFilePath;
}

// 创建测试用的图片文件（简单的1x1像素PNG）
function createTestImageFile() {
  const testFilePath = path.join(__dirname, 'test-evidence-image.png');
  // 1x1 像素的透明PNG文件的base64数据
  const pngData = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  fs.writeFileSync(testFilePath, pngData);
  return testFilePath;
}

// 创建测试用的PDF文件（最小的有效PDF）
function createTestPdfFile() {
  const testFilePath = path.join(__dirname, 'test-evidence-doc.pdf');
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test PDF) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000317 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
410
%%EOF`;
  fs.writeFileSync(testFilePath, pdfContent);
  return testFilePath;
}

// 清理测试文件
function cleanupTestFiles() {
  const files = [
    'test-evidence-image.png',
    'test-evidence-doc.pdf'
  ];
  files.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });
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
        case_cause: '证据预览测试',
        court: '测试法院',
        target_amount: 100000,
        filing_date: '2024-01-01',
        status: 'active'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    testCaseId = response.data.data?.case?.id || response.data.case?.id || response.data.data?.id;
    console.log('✓ 案件创建成功，案件 ID:', testCaseId);
    return true;
  } catch (error) {
    console.error('✗ 创建案件失败:', error.response?.data || error.message);
    return false;
  }
}

// 3. 测试文件上传后的路径格式
async function testUploadPathFormat() {
  try {
    console.log('\n=== 3. 测试文件上传路径格式 ===');
    const testFilePath = createTestPdfFile();
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath));
    formData.append('case_id', testCaseId);
    formData.append('category', '书证');
    formData.append('tags', '测试');

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
    const storagePath = response.data.evidence.storage_path;
    
    console.log('✓ 文件上传成功');
    console.log('  证据 ID:', testEvidenceId);
    console.log('  存储路径:', storagePath);
    
    // 验证路径格式
    if (storagePath.startsWith('/uploads/evidence/')) {
      console.log('✓ 路径格式正确：使用相对路径格式');
    } else {
      console.log('✗ 路径格式错误：应该是 /uploads/evidence/ 开头的相对路径');
      console.log('  实际路径:', storagePath);
      return false;
    }
    
    // 验证路径不包含完整文件系统路径
    if (!storagePath.includes(':\\') && !storagePath.includes('backend')) {
      console.log('✓ 路径不包含文件系统绝对路径');
    } else {
      console.log('✗ 路径包含文件系统绝对路径，应该使用相对路径');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('✗ 测试上传路径格式失败:', error.response?.data || error.message);
    return false;
  }
}

// 4. 测试文件通过HTTP访问的可用性
async function testHttpAccessibility() {
  try {
    console.log('\n=== 4. 测试文件HTTP访问可用性 ===');
    
    // 获取证据详情
    const evidenceResponse = await axios.get(
      `${BASE_URL}/evidence/${testEvidenceId}`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    const storagePath = evidenceResponse.data.evidence.storage_path;
    const fileUrl = `${STATIC_BASE_URL}${storagePath}`;
    
    console.log('  文件URL:', fileUrl);
    
    // 尝试通过HTTP访问文件
    const fileResponse = await axios.get(fileUrl, {
      responseType: 'arraybuffer'
    });
    
    if (fileResponse.status === 200) {
      console.log('✓ 文件可通过HTTP访问');
      console.log('  响应状态:', fileResponse.status);
      console.log('  Content-Type:', fileResponse.headers['content-type']);
      console.log('  文件大小:', fileResponse.data.length, 'bytes');
      
      // 验证文件内容（PDF文件）
      const content = fileResponse.data.toString();
      if (content.includes('%PDF')) {
        console.log('✓ 文件内容正确（PDF格式）');
      } else {
        console.log('✗ 文件内容不匹配');
        return false;
      }
      
      return true;
    } else {
      console.log('✗ 文件访问失败，状态码:', fileResponse.status);
      return false;
    }
  } catch (error) {
    console.error('✗ 测试HTTP访问失败:', error.response?.status, error.message);
    return false;
  }
}

// 5. 测试图片文件预览
async function testImagePreview() {
  try {
    console.log('\n=== 5. 测试图片文件预览 ===');
    const testFilePath = createTestImageFile();
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath));
    formData.append('case_id', testCaseId);
    formData.append('category', '图片证据');

    const uploadResponse = await axios.post(
      `${BASE_URL}/evidence/upload`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${authToken}`
        }
      }
    );

    testImageEvidenceId = uploadResponse.data.evidence.id;
    const storagePath = uploadResponse.data.evidence.storage_path;
    const fileUrl = `${STATIC_BASE_URL}${storagePath}`;
    
    console.log('✓ 图片上传成功');
    console.log('  证据 ID:', testImageEvidenceId);
    console.log('  文件类型:', uploadResponse.data.evidence.file_type);
    console.log('  访问URL:', fileUrl);
    
    // 验证图片可访问
    const imageResponse = await axios.get(fileUrl, {
      responseType: 'arraybuffer'
    });
    
    if (imageResponse.status === 200 && imageResponse.headers['content-type'].startsWith('image/')) {
      console.log('✓ 图片可通过HTTP访问');
      console.log('  Content-Type:', imageResponse.headers['content-type']);
      return true;
    } else {
      console.log('✗ 图片访问失败');
      return false;
    }
  } catch (error) {
    console.error('✗ 测试图片预览失败:', error.response?.data || error.message);
    return false;
  }
}

// 6. 测试PDF文件预览
async function testPdfPreview() {
  try {
    console.log('\n=== 6. 测试PDF文件预览 ===');
    const testFilePath = createTestPdfFile();
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath));
    formData.append('case_id', testCaseId);
    formData.append('category', 'PDF文档');

    const uploadResponse = await axios.post(
      `${BASE_URL}/evidence/upload`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${authToken}`
        }
      }
    );

    testPdfEvidenceId = uploadResponse.data.evidence.id;
    const storagePath = uploadResponse.data.evidence.storage_path;
    const fileUrl = `${STATIC_BASE_URL}${storagePath}`;
    
    console.log('✓ PDF上传成功');
    console.log('  证据 ID:', testPdfEvidenceId);
    console.log('  文件类型:', uploadResponse.data.evidence.file_type);
    console.log('  访问URL:', fileUrl);
    
    // 验证PDF可访问
    const pdfResponse = await axios.get(fileUrl, {
      responseType: 'arraybuffer'
    });
    
    if (pdfResponse.status === 200 && pdfResponse.headers['content-type'] === 'application/pdf') {
      console.log('✓ PDF可通过HTTP访问');
      console.log('  Content-Type:', pdfResponse.headers['content-type']);
      return true;
    } else {
      console.log('✗ PDF访问失败');
      return false;
    }
  } catch (error) {
    console.error('✗ 测试PDF预览失败:', error.response?.data || error.message);
    return false;
  }
}

// 7. 测试下载功能
async function testDownloadFunction() {
  try {
    console.log('\n=== 7. 测试下载功能 ===');
    
    const downloadResponse = await axios.get(
      `${BASE_URL}/evidence/${testEvidenceId}/download`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        responseType: 'arraybuffer'
      }
    );
    
    if (downloadResponse.status === 200) {
      console.log('✓ 下载功能正常');
      console.log('  响应状态:', downloadResponse.status);
      console.log('  Content-Type:', downloadResponse.headers['content-type']);
      console.log('  Content-Disposition:', downloadResponse.headers['content-disposition']);
      
      // 验证Content-Disposition包含文件名
      if (downloadResponse.headers['content-disposition']?.includes('attachment')) {
        console.log('✓ Content-Disposition头设置正确');
      } else {
        console.log('✗ Content-Disposition头设置不正确');
        return false;
      }
      
      return true;
    } else {
      console.log('✗ 下载失败，状态码:', downloadResponse.status);
      return false;
    }
  } catch (error) {
    console.error('✗ 测试下载功能失败:', error.response?.data || error.message);
    return false;
  }
}

// 8. 测试错误处理：文件不存在
async function testFileNotFoundError() {
  try {
    console.log('\n=== 8. 测试错误处理：文件不存在 ===');
    
    // 使用一个不存在的证据ID
    const nonExistentId = 999999;
    
    try {
      await axios.get(
        `${BASE_URL}/evidence/${nonExistentId}/download`,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      console.log('✗ 应该返回404错误，但请求成功了');
      return false;
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✓ 正确返回404错误');
        console.log('  错误信息:', error.response.data.error);
        return true;
      } else {
        console.log('✗ 返回了错误的状态码:', error.response?.status);
        return false;
      }
    }
  } catch (error) {
    console.error('✗ 测试文件不存在错误失败:', error.message);
    return false;
  }
}

// 9. 测试错误处理：无效的路径访问
async function testInvalidPathAccess() {
  try {
    console.log('\n=== 9. 测试错误处理：无效路径访问 ===');
    
    // 尝试访问一个不存在的文件路径
    const invalidUrl = `${STATIC_BASE_URL}/uploads/evidence/nonexistent-file.txt`;
    
    try {
      await axios.get(invalidUrl);
      console.log('✗ 应该返回404错误，但请求成功了');
      return false;
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✓ 访问不存在的文件正确返回404');
        return true;
      } else {
        console.log('✗ 返回了错误的状态码:', error.response?.status);
        return false;
      }
    }
  } catch (error) {
    console.error('✗ 测试无效路径访问失败:', error.message);
    return false;
  }
}

// 10. 测试版本上传后的路径格式
async function testVersionUploadPathFormat() {
  try {
    console.log('\n=== 10. 测试版本上传路径格式 ===');
    const testFilePath = createTestPdfFile();
    
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

    const storagePath = response.data.evidence.storage_path;
    
    console.log('✓ 版本上传成功');
    console.log('  当前版本:', response.data.evidence.version);
    console.log('  存储路径:', storagePath);
    
    // 验证路径格式
    if (storagePath.startsWith('/uploads/evidence/')) {
      console.log('✓ 版本文件路径格式正确');
      
      // 验证新版本文件可访问
      const fileUrl = `${STATIC_BASE_URL}${storagePath}`;
      const fileResponse = await axios.get(fileUrl, {
        responseType: 'arraybuffer'
      });
      
      if (fileResponse.status === 200) {
        console.log('✓ 新版本文件可通过HTTP访问');
        return true;
      } else {
        console.log('✗ 新版本文件访问失败');
        return false;
      }
    } else {
      console.log('✗ 版本文件路径格式错误');
      return false;
    }
  } catch (error) {
    console.error('✗ 测试版本上传路径格式失败:', error.response?.data || error.message);
    return false;
  }
}

// 11. 测试获取证据列表中的路径格式
async function testEvidenceListPathFormat() {
  try {
    console.log('\n=== 11. 测试证据列表路径格式 ===');
    
    const response = await axios.get(
      `${BASE_URL}/cases/${testCaseId}/evidence`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    console.log('✓ 获取证据列表成功');
    console.log('  证据数量:', response.data.count);
    
    let allPathsValid = true;
    for (const evidence of response.data.evidence) {
      console.log(`  - 证据 ${evidence.id}: ${evidence.storage_path}`);
      
      if (!evidence.storage_path.startsWith('/uploads/evidence/')) {
        console.log(`    ✗ 路径格式错误`);
        allPathsValid = false;
      }
    }
    
    if (allPathsValid) {
      console.log('✓ 所有证据的路径格式都正确');
      return true;
    } else {
      console.log('✗ 存在路径格式错误的证据');
      return false;
    }
  } catch (error) {
    console.error('✗ 测试证据列表路径格式失败:', error.response?.data || error.message);
    return false;
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('========================================');
  console.log('证据材料预览功能修复验证测试');
  console.log('========================================');

  const tests = [
    { name: '用户登录', fn: login },
    { name: '创建测试案件', fn: createTestCase },
    { name: '测试上传路径格式', fn: testUploadPathFormat },
    { name: '测试HTTP访问可用性', fn: testHttpAccessibility },
    { name: '测试图片预览', fn: testImagePreview },
    { name: '测试PDF预览', fn: testPdfPreview },
    { name: '测试下载功能', fn: testDownloadFunction },
    { name: '测试文件不存在错误', fn: testFileNotFoundError },
    { name: '测试无效路径访问', fn: testInvalidPathAccess },
    { name: '测试版本上传路径格式', fn: testVersionUploadPathFormat },
    { name: '测试证据列表路径格式', fn: testEvidenceListPathFormat }
  ];

  let passed = 0;
  let failed = 0;
  const results = [];

  for (const test of tests) {
    const result = await test.fn();
    results.push({ name: test.name, passed: result });
    if (result) {
      passed++;
    } else {
      failed++;
    }
    // 等待一小段时间，避免请求过快
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // 清理测试文件
  cleanupTestFiles();

  console.log('\n========================================');
  console.log('测试完成');
  console.log('========================================');
  console.log(`总计: ${tests.length} 个测试`);
  console.log(`通过: ${passed} 个`);
  console.log(`失败: ${failed} 个`);
  console.log('');
  
  console.log('测试结果详情:');
  results.forEach((result, index) => {
    const status = result.passed ? '✓' : '✗';
    console.log(`  ${status} ${index + 1}. ${result.name}`);
  });
  
  console.log('\n========================================');
  
  if (failed === 0) {
    console.log('🎉 所有测试通过！证据预览功能修复验证成功！');
  } else {
    console.log('⚠️  部分测试失败，请检查上述错误信息');
  }
  
  console.log('========================================');
}

// 执行测试
runAllTests().catch(error => {
  console.error('测试执行出错:', error);
  cleanupTestFiles();
  process.exit(1);
});
