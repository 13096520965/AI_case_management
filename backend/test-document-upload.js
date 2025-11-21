/**
 * 测试文书上传功能
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
    console.log('✓ 登录成功，token:', authToken.substring(0, 20) + '...');
    return true;
  } catch (error) {
    console.error('✗ 登录失败:', error.response?.data || error.message);
    return false;
  }
}

// 创建测试文件
function createTestFile() {
  const testContent = `民事起诉状

原告：张三，身份证号：110101199001011234
联系电话：13800138000
住所地：北京市朝阳区XX路XX号

被告：李四，身份证号：110101199002021234
联系电话：13900139000
住所地：北京市海淀区XX路XX号

诉讼请求：
1. 请求依法判令被告李四支付原告张三款项人民币100,000元；
2. 本案诉讼费用由被告承担。

事实与理由：
合同纠纷一案，原告与被告之间存在合同关系。被告未按约定履行合同义务，给原告造成经济损失。

综上所述，原告认为被告的行为已严重侵害了原告的合法权益，为维护原告的合法权益，特依法向贵院提起诉讼，请求依法支持原告的诉讼请求。

此致
北京市朝阳区人民法院

具状人（原告）：张三
代理律师：王律师
律师事务所：XX律师事务所

${new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}

附：
1. 本诉状副本1份；
2. 证据材料3份。`;

  const testFilePath = path.join(__dirname, 'test-complaint.txt');
  fs.writeFileSync(testFilePath, testContent, 'utf8');
  console.log('✓ 测试文件创建成功:', testFilePath);
  return testFilePath;
}

// 测试上传文书
async function testUploadDocument() {
  try {
    console.log('\n2. 测试上传文书...');
    
    const testFilePath = createTestFile();
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath));
    formData.append('case_id', '1');
    formData.append('document_type', '起诉状');
    formData.append('description', '这是一个测试上传的起诉状');

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

// 测试获取文书列表
async function testGetDocuments(caseId) {
  try {
    console.log('\n3. 测试获取文书列表...');
    
    const response = await axios.get(
      `${API_BASE_URL}/cases/${caseId}/documents`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    const documents = response.data.data.documents || [];
    console.log('✓ 获取文书列表成功');
    console.log('  文书数量:', documents.length);
    
    if (documents.length > 0) {
      console.log('\n  最新文书:');
      const latest = documents[0];
      console.log('    ID:', latest.id);
      console.log('    名称:', latest.document_name);
      console.log('    类型:', latest.document_type);
      console.log('    文件名:', latest.file_name || '无');
      console.log('    创建时间:', latest.created_at);
    }

    return true;
  } catch (error) {
    console.error('✗ 获取文书列表失败:', error.response?.data || error.message);
    return false;
  }
}

// 运行所有测试
async function runTests() {
  console.log('='.repeat(60));
  console.log('文书上传功能测试');
  console.log('='.repeat(60));

  // 登录
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n测试终止：登录失败');
    return;
  }

  // 上传文书
  const documentId = await testUploadDocument();
  if (!documentId) {
    console.log('\n测试终止：上传文书失败');
    return;
  }

  // 获取文书列表
  await testGetDocuments(1);

  console.log('\n' + '='.repeat(60));
  console.log('✓ 所有测试完成！');
  console.log('='.repeat(60));
}

// 执行测试
runTests().catch(error => {
  console.error('测试执行出错:', error);
  process.exit(1);
});
