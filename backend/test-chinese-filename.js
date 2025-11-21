/**
 * 测试中文文件名上传
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:3000/api';

// 测试用户登录凭证
const TEST_USER = {
  username: 'admin',
  password: 'admin123'
};

let authToken = '';

// 登录获取token
async function login() {
  try {
    console.log('1. 登录获取token...');
    const response = await axios.post(`${API_BASE_URL}/auth/login`, TEST_USER);
    authToken = response.data.data.token;
    console.log('✓ 登录成功');
    return true;
  } catch (error) {
    console.error('✗ 登录失败:', error.response?.data || error.message);
    return false;
  }
}

// 创建测试文件
function createTestFile(filename) {
  const testContent = `测试文书内容

这是一个测试中文文件名的文书。
文件名：${filename}
创建时间：${new Date().toLocaleString('zh-CN')}

测试内容：
1. 中文字符测试
2. 特殊符号测试：！@#￥%……&*（）
3. 数字测试：1234567890`;

  const testFilePath = path.join(__dirname, filename);
  fs.writeFileSync(testFilePath, testContent, 'utf8');
  console.log('✓ 测试文件创建成功:', filename);
  return testFilePath;
}

// 测试上传中文文件名
async function testUploadChineseFilename() {
  try {
    console.log('\n2. 测试上传中文文件名...');
    
    const filename = '测试文书-起诉状.txt';
    const testFilePath = createTestFile(filename);
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath), {
      filename: filename,
      contentType: 'text/plain'
    });
    formData.append('case_id', '1');
    formData.append('document_type', '起诉状');
    formData.append('description', '测试中文文件名上传');

    const response = await axios.post(
      `${API_BASE_URL}/documents/upload`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    console.log('✓ 文书上传成功');
    console.log('  文书ID:', response.data.data.id);
    console.log('  文件名:', response.data.data.fileName);
    console.log('  文件大小:', response.data.data.fileSize, 'bytes');

    // 清理测试文件
    fs.unlinkSync(testFilePath);
    console.log('✓ 测试文件已清理');

    return response.data.data.id;
  } catch (error) {
    console.error('✗ 上传文书失败:', error.response?.data || error.message);
    return null;
  }
}

// 验证文件名
async function verifyFilename(documentId) {
  try {
    console.log('\n3. 验证文件名...');
    
    const response = await axios.get(
      `${API_BASE_URL}/documents/${documentId}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    const doc = response.data.data.document;
    console.log('✓ 获取文书信息成功');
    console.log('  文书名称:', doc.document_name);
    console.log('  文书类型:', doc.document_type);
    
    // 检查是否有乱码
    const hasGarbled = doc.document_name && (
      doc.document_name.includes('\\x') || 
      doc.document_name.includes('æ') ||
      doc.document_name.includes('è') ||
      doc.document_name.includes('ä')
    );
    
    if (hasGarbled) {
      console.log('✗ 文件名包含乱码！');
      return false;
    } else {
      console.log('✓ 文件名正确，无乱码');
      return true;
    }
  } catch (error) {
    console.error('✗ 验证失败:', error.response?.data || error.message);
    return false;
  }
}

// 运行测试
async function runTests() {
  console.log('='.repeat(60));
  console.log('中文文件名上传测试');
  console.log('='.repeat(60));

  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n测试终止：登录失败');
    return;
  }

  const documentId = await testUploadChineseFilename();
  if (!documentId) {
    console.log('\n测试终止：上传失败');
    return;
  }

  const verified = await verifyFilename(documentId);

  console.log('\n' + '='.repeat(60));
  if (verified) {
    console.log('✓ 所有测试通过！中文文件名处理正确');
  } else {
    console.log('✗ 测试失败！中文文件名存在问题');
  }
  console.log('='.repeat(60));
}

runTests().catch(error => {
  console.error('测试执行出错:', error);
  process.exit(1);
});
