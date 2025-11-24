const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';
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

async function testTargetAmountAPI() {
  console.log('============================================================');
  console.log('测试标的处理详情API');
  console.log('============================================================\n');

  try {
    // 1. 使用测试案件ID
    const caseId = 36; // 使用存在的案件
    console.log(`1. 使用案件 ID: ${caseId}\n`);

    // 2. 获取标的处理详情
    console.log('2. 获取标的处理详情...');
    const detailResponse = await authAxios.get(`/cases/${caseId}/target-amount`);
    console.log('✓ 获取成功');
    console.log('详情数据:', JSON.stringify(detailResponse.data, null, 2));
    console.log();

    // 3. 更新标的处理详情
    console.log('3. 更新标的处理详情...');
    const updateData = {
      total_amount: 150000,
      penalty_amount: 10000,
      litigation_cost: 5000,
      cost_bearer: '被告方',
      notes: '这是测试备注'
    };
    
    const updateResponse = await authAxios.put(`/cases/${caseId}/target-amount`, updateData);
    console.log('✓ 更新成功');
    console.log('更新后数据:', JSON.stringify(updateResponse.data?.data?.detail || updateResponse.data, null, 2));
    console.log();

    // 4. 创建汇款记录
    console.log('4. 创建汇款记录...');
    const paymentData = {
      payment_date: '2024-11-21',
      amount: 50000,
      payer: '被告公司',
      payee: '原告公司',
      payment_method: '银行转账',
      status: '已确认',
      notes: '第一笔回款'
    };
    
    const createPaymentResponse = await authAxios.post(`/cases/${caseId}/payments`, paymentData);
    console.log('✓ 创建成功');
    const payment = createPaymentResponse.data?.data?.payment || createPaymentResponse.data?.payment;
    const paymentId = payment?.id;
    console.log('汇款记录ID:', paymentId);
    console.log('汇款记录:', JSON.stringify(payment, null, 2));
    console.log();

    // 5. 再次获取详情，查看汇款记录
    console.log('5. 获取更新后的详情（包含汇款记录）...');
    const detailResponse2 = await authAxios.get(`/cases/${caseId}/target-amount`);
    console.log('✓ 获取成功');
    const data2 = detailResponse2.data?.data || detailResponse2.data;
    console.log('汇款记录数量:', data2.payments?.length || 0);
    console.log('汇总信息:');
    console.log(`  标的总额: ¥${data2.summary.totalAmount.toLocaleString()}`);
    console.log(`  已回收: ¥${data2.summary.recoveredAmount.toLocaleString()}`);
    console.log(`  剩余: ¥${data2.summary.remainingAmount.toLocaleString()}`);
    console.log();

    // 6. 更新汇款记录
    console.log('6. 更新汇款记录...');
    const updatePaymentData = {
      amount: 60000,
      notes: '第一笔回款（已更新）'
    };
    
    await authAxios.put(`/payments/${paymentId}`, updatePaymentData);
    console.log('✓ 更新成功\n');

    // 7. 创建第二笔汇款记录
    console.log('7. 创建第二笔汇款记录...');
    const payment2Data = {
      payment_date: '2024-11-22',
      amount: 40000,
      payer: '被告公司',
      payee: '原告公司',
      payment_method: '银行转账',
      status: '待汇款',
      notes: '第二笔回款'
    };
    
    const createPayment2Response = await authAxios.post(`/cases/${caseId}/payments`, payment2Data);
    const payment2 = createPayment2Response.data?.data?.payment || createPayment2Response.data?.payment;
    const payment2Id = payment2?.id;
    console.log('✓ 创建成功，ID:', payment2Id);
    console.log();

    // 8. 获取最终详情
    console.log('8. 获取最终详情...');
    const finalResponse = await authAxios.get(`/cases/${caseId}/target-amount`);
    console.log('✓ 获取成功');
    const finalData = finalResponse.data?.data || finalResponse.data;
    console.log('\n最终汇总:');
    console.log(`  标的总额: ¥${finalData.summary.totalAmount.toLocaleString()}`);
    console.log(`  已回收: ¥${finalData.summary.recoveredAmount.toLocaleString()}`);
    console.log(`  剩余: ¥${finalData.summary.remainingAmount.toLocaleString()}`);
    console.log(`  回收率: ${(finalData.summary.recoveredAmount / finalData.summary.totalAmount * 100).toFixed(2)}%`);
    console.log('\n汇款记录:');
    finalData.payments.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.payment_date} - ¥${p.amount.toLocaleString()} - ${p.status} - ${p.notes}`);
    });
    console.log();

    // 9. 删除第二笔汇款记录
    console.log('9. 删除第二笔汇款记录...');
    await authAxios.delete(`/payments/${payment2Id}`);
    console.log('✓ 删除成功\n');

    console.log('============================================================');
    console.log('✓ 所有测试完成！');
    console.log('============================================================');
    console.log('\n前端测试步骤:');
    console.log('1. 硬刷新浏览器（Ctrl+Shift+R 或 Cmd+Shift+R）');
    console.log('2. 进入案件编辑页面');
    console.log('3. 查看"标的处理详情"卡片');
    console.log('4. 点击"查看详情"按钮');
    console.log('5. 在"基本信息"标签页修改数据并保存');
    console.log('6. 在"汇款记录"标签页添加、编辑、删除记录');

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

(async () => {
  const loggedIn = await login();
  if (loggedIn) {
    await testTargetAmountAPI();
  }
})();
