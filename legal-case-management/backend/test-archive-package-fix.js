const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

// 创建一个带认证的 axios 实例
let authAxios;

async function login() {
  console.log('登录获取 token...');
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = response.data.data.token;
    console.log('✓ 登录成功\n');
    
    // 创建带 token 的 axios 实例
    authAxios = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return true;
  } catch (error) {
    console.error('❌ 登录失败:', error.message);
    return false;
  }
}

async function testArchivePackageCreation() {
  console.log('============================================================');
  console.log('测试归档包创建接口');
  console.log('============================================================\n');

  try {
    // 1. 先获取一个已结案的案件
    console.log('1. 获取已结案案件列表...');
    const casesResponse = await authAxios.get('/cases', {
      params: { status: '已结案', limit: 1 }
    });
    
    const cases = casesResponse.data.data.cases;
    if (!cases || cases.length === 0) {
      console.log('❌ 没有找到已结案的案件');
      console.log('提示: 请先创建一个已结案的案件');
      return;
    }

    const testCase = cases[0];
    console.log(`✓ 找到案件: ${testCase.case_number} (ID: ${testCase.id})`);
    console.log(`  案由: ${testCase.case_cause}`);
    console.log(`  状态: ${testCase.status}\n`);

    // 2. 测试创建归档包 - 正确的请求格式
    console.log('2. 创建归档包（正确格式）...');
    const correctData = {
      case_id: testCase.id,  // 使用下划线命名
      archived_by: '测试归档员',
      notes: '这是一个测试归档包'
    };
    
    console.log('请求数据:', JSON.stringify(correctData, null, 2));
    
    try {
      const createResponse = await authAxios.post('/archive/package', correctData);
      
      console.log('✓ 归档包创建成功！');
      console.log('归档包信息:');
      console.log(`  归档编号: ${createResponse.data.data.package.archive_number}`);
      console.log(`  归档日期: ${createResponse.data.data.package.archive_date}`);
      console.log(`  归档人: ${createResponse.data.data.package.archived_by}`);
      console.log(`  包大小: ${createResponse.data.data.package.package_size} bytes`);
      console.log('\n数据摘要:');
      console.log(`  诉讼主体数: ${createResponse.data.data.summary.parties_count}`);
      console.log(`  流程节点数: ${createResponse.data.data.summary.nodes_count}`);
      console.log(`  证据数: ${createResponse.data.data.summary.evidence_count}`);
      console.log(`  文书数: ${createResponse.data.data.summary.documents_count}`);
      console.log(`  费用记录数: ${createResponse.data.data.summary.costs_count}`);
      console.log(`  结案报告: ${createResponse.data.data.summary.has_closure_report ? '有' : '无'}\n`);
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('⚠ 该案件已存在归档包（这是正常的）');
        console.log(`  错误信息: ${error.response.data.error.message}\n`);
      } else {
        throw error;
      }
    }

    // 3. 测试错误的请求格式（缺少 case_id）
    console.log('3. 测试错误格式（缺少 case_id）...');
    const wrongData = {
      archived_by: '测试归档员',
      notes: '缺少案件ID'
    };
    
    try {
      await authAxios.post('/archive/package', wrongData);
      console.log('❌ 应该返回错误，但请求成功了');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✓ 正确返回 400 错误');
        console.log(`  错误信息: ${error.response.data.error.message}\n`);
      } else {
        console.log(`❌ 返回了意外的错误: ${error.message}\n`);
      }
    }

    // 4. 测试使用驼峰命名（错误格式）
    console.log('4. 测试驼峰命名格式（caseId）...');
    const camelCaseData = {
      caseId: testCase.id,  // 错误：使用驼峰命名
      archivedBy: '测试归档员',
      notes: '使用驼峰命名'
    };
    
    try {
      await authAxios.post('/archive/package', camelCaseData);
      console.log('❌ 应该返回错误，但请求成功了');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✓ 正确返回 400 错误（后端不识别驼峰命名）');
        console.log(`  错误信息: ${error.response.data.error.message}\n`);
      } else {
        console.log(`❌ 返回了意外的错误: ${error.message}\n`);
      }
    }

    console.log('============================================================');
    console.log('✓ 测试完成！');
    console.log('============================================================');
    console.log('\n修复说明:');
    console.log('1. 前端 TypeScript 接口已更新为使用下划线命名（case_id）');
    console.log('2. 表单验证规则已更新，trigger 改为 "change"（适用于下拉选择）');
    console.log('3. 后端接口正常工作，期望接收 case_id 字段');
    console.log('\n请在前端测试:');
    console.log('1. 硬刷新浏览器（Ctrl+Shift+R 或 Cmd+Shift+R）');
    console.log('2. 进入"归档案件检索"页面');
    console.log('3. 点击"创建归档包"按钮');
    console.log('4. 选择一个已结案的案件');
    console.log('5. 填写归档人信息');
    console.log('6. 点击确定，应该能成功创建归档包');

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// 运行测试
(async () => {
  const loggedIn = await login();
  if (loggedIn) {
    await testArchivePackageCreation();
  }
})();
