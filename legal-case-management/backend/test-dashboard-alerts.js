const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testDashboardAlerts() {
  console.log('=== 测试首页待办事项接口 ===\n');

  try {
    // 测试获取待办提醒（分页）
    console.log('1. 测试分页获取待办提醒...');
    const response = await axios.get(`${BASE_URL}/notifications`, {
      params: {
        status: 'pending',
        page: 1,
        pageSize: 20
      }
    });

    console.log('响应状态:', response.status);
    console.log('响应数据结构:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.data) {
      if (response.data.data.list) {
        console.log(`\n✓ 返回分页数据`);
        console.log(`  - 总数: ${response.data.data.total}`);
        console.log(`  - 当前页: ${response.data.data.page}`);
        console.log(`  - 每页数量: ${response.data.data.pageSize}`);
        console.log(`  - 列表长度: ${response.data.data.list.length}`);
        
        if (response.data.data.list.length > 0) {
          console.log('\n第一条数据示例:');
          const first = response.data.data.list[0];
          console.log(JSON.stringify(first, null, 2));
          
          // 检查必要字段
          const requiredFields = ['id', 'content', 'status', 'scheduledTime', 'taskType'];
          const missingFields = requiredFields.filter(field => !first[field]);
          
          if (missingFields.length > 0) {
            console.log(`\n⚠ 缺少字段: ${missingFields.join(', ')}`);
          } else {
            console.log('\n✓ 所有必要字段都存在');
          }
          
          // 检查案件信息
          if (first.caseId || first.caseNumber) {
            console.log('✓ 包含案件信息');
            console.log(`  - 案件ID: ${first.caseId}`);
            console.log(`  - 案件编号: ${first.caseNumber}`);
            console.log(`  - 案件名称: ${first.caseName || '无'}`);
          } else {
            console.log('⚠ 未包含案件信息');
          }
        } else {
          console.log('\n⚠ 列表为空');
        }
      } else {
        console.log('\n⚠ 返回的不是分页格式');
      }
    } else {
      console.log('\n✗ 请求失败');
    }

    // 测试不带分页参数
    console.log('\n\n2. 测试不带分页参数...');
    const response2 = await axios.get(`${BASE_URL}/notifications`, {
      params: {
        status: 'pending'
      }
    });

    if (response2.data.success && Array.isArray(response2.data.data)) {
      console.log(`✓ 返回数组格式，长度: ${response2.data.data.length}`);
    } else {
      console.log('⚠ 返回格式异常');
    }

  } catch (error) {
    console.error('\n✗ 测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

testDashboardAlerts();
