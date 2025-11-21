const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// 测试用户凭证
let authToken = '';

/**
 * 用户登录获取 token
 */
async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    authToken = response.data.data.token;
    console.log('✓ 登录成功，获取到 token');
    return true;
  } catch (error) {
    console.error('✗ 登录失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试获取驾驶舱数据
 */
async function testGetDashboardData() {
  try {
    console.log('\n--- 测试获取驾驶舱数据 ---');
    const response = await axios.get(`${BASE_URL}/analytics/dashboard`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✓ 获取驾驶舱数据成功');
    console.log('案件总量:', response.data.data.summary.totalCases);
    console.log('标的额总计:', response.data.data.summary.totalTargetAmount);
    console.log('平均胜诉率:', response.data.data.summary.averageWinRate + '%');
    console.log('活跃案件:', response.data.data.summary.activeCases);
    console.log('案件类型分布:', response.data.data.caseTypeDistribution);
    console.log('案件趋势数据点数:', response.data.data.caseTrend.length);
    console.log('待处理节点:', response.data.data.alerts.pendingNodes);
    console.log('超期节点:', response.data.data.alerts.overdueNodes);
    return true;
  } catch (error) {
    console.error('✗ 获取驾驶舱数据失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试获取律师评价
 */
async function testGetLawyerEvaluation() {
  try {
    console.log('\n--- 测试获取律师评价 ---');
    const lawyerId = 1; // 测试律师ID
    
    const response = await axios.get(`${BASE_URL}/analytics/lawyers/${lawyerId}/evaluation`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✓ 获取律师评价成功');
    console.log('律师ID:', response.data.data.lawyerId);
    console.log('负责案件总数:', response.data.data.statistics.totalCases);
    console.log('胜诉案件数:', response.data.data.statistics.wonCases);
    console.log('胜诉率:', response.data.data.statistics.winRate + '%');
    console.log('平均办案周期:', response.data.data.statistics.avgCycleDays + '天');
    console.log('标的额总计:', response.data.data.statistics.totalTargetAmount);
    console.log('综合评分:', response.data.data.evaluation.comprehensiveScore);
    console.log('评分明细:', {
      胜诉率得分: response.data.data.evaluation.winRateScore,
      效率得分: response.data.data.evaluation.efficiencyScore,
      案件量得分: response.data.data.evaluation.volumeScore
    });
    return true;
  } catch (error) {
    console.error('✗ 获取律师评价失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试类案检索
 */
async function testSearchSimilarCases() {
  try {
    console.log('\n--- 测试类案检索 ---');
    
    const searchParams = {
      case_type: '民事',
      case_cause: '合同纠纷',
      target_amount_min: 10000,
      target_amount_max: 1000000,
      keywords: '违约'
    };
    
    const response = await axios.post(`${BASE_URL}/analytics/similar-cases`, searchParams, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✓ 类案检索成功');
    console.log('找到相似案例数:', response.data.data.similarCases.length);
    console.log('类案总数:', response.data.data.analysis.totalSimilarCases);
    console.log('类案胜诉数:', response.data.data.analysis.wonCases);
    console.log('类案胜诉率:', response.data.data.analysis.winRate + '%');
    console.log('建议:', response.data.data.analysis.recommendations);
    
    if (response.data.data.similarCases.length > 0) {
      console.log('\n示例案例:');
      const example = response.data.data.similarCases[0];
      console.log('  案号:', example.case_number);
      console.log('  案由:', example.case_cause);
      console.log('  标的额:', example.target_amount);
      console.log('  状态:', example.status);
      console.log('  相似度:', example.similarity_score);
    }
    
    console.log('\n注意:', response.data.data.note);
    return true;
  } catch (error) {
    console.error('✗ 类案检索失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试不同搜索条件的类案检索
 */
async function testSearchSimilarCasesWithDifferentParams() {
  try {
    console.log('\n--- 测试不同搜索条件的类案检索 ---');
    
    // 只按案件类型搜索
    const response1 = await axios.post(`${BASE_URL}/analytics/similar-cases`, {
      case_type: '刑事'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✓ 按案件类型搜索成功，找到', response1.data.data.similarCases.length, '个案例');
    
    // 只按关键词搜索
    const response2 = await axios.post(`${BASE_URL}/analytics/similar-cases`, {
      keywords: '合同'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✓ 按关键词搜索成功，找到', response2.data.data.similarCases.length, '个案例');
    
    return true;
  } catch (error) {
    console.error('✗ 不同搜索条件测试失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('========================================');
  console.log('数据分析 API 测试');
  console.log('========================================');
  
  // 登录
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n测试终止：登录失败');
    return;
  }
  
  // 运行测试
  await testGetDashboardData();
  await testGetLawyerEvaluation();
  await testSearchSimilarCases();
  await testSearchSimilarCasesWithDifferentParams();
  
  console.log('\n========================================');
  console.log('测试完成');
  console.log('========================================');
}

// 运行测试
runAllTests();
