/**
 * 测试驾驶舱数据API
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testDashboardAPI() {
  try {
    console.log('测试驾驶舱数据API...\n');
    
    // 先登录获取token
    console.log('正在登录...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✓ 登录成功\n');
    
    // 测试获取驾驶舱数据
    const response = await axios.get(`${API_BASE_URL}/analytics/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✓ API响应成功\n');
    console.log('='.repeat(60));
    console.log('驾驶舱数据统计:');
    console.log('='.repeat(60));
    
    const { summary, caseTypeDistribution, caseStatusDistribution, caseTrend, alerts } = response.data.data;
    
    console.log('\n【概览统计】');
    console.log(`  案件总量: ${summary.totalCases}`);
    console.log(`  标的额总计: ${(summary.totalTargetAmount / 10000).toFixed(2)} 万元`);
    console.log(`  平均胜诉率: ${summary.averageWinRate}%`);
    console.log(`  平均办案周期: ${summary.avgDuration} 天`);
    console.log(`  活跃案件: ${summary.activeCases}`);
    console.log(`  已胜诉案件: ${summary.wonCases}`);
    console.log(`  已结案案件: ${summary.closedCases}`);
    
    console.log('\n【案件类型分布】');
    caseTypeDistribution.forEach(item => {
      console.log(`  ${item.case_type}: ${item.count} 个`);
    });
    
    console.log('\n【案件状态分布】');
    caseStatusDistribution.forEach(item => {
      console.log(`  ${item.status}: ${item.count} 个`);
    });
    
    console.log('\n【案件趋势（最近12个月）】');
    caseTrend.forEach(item => {
      console.log(`  ${item.month}: ${item.count} 个案件`);
    });
    
    console.log('\n【预警信息】');
    console.log(`  待处理节点: ${alerts.pendingNodes}`);
    console.log(`  超期节点: ${alerts.overdueNodes}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('✓ 测试完成！数据已成功填充到首页各个模块');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('✗ 测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

testDashboardAPI();
