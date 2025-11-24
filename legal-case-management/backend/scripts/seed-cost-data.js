const { query, run } = require('../src/config/database');

/**
 * 生成成本测试数据
 */
async function seedCostData() {
  try {
    console.log('开始生成成本测试数据...\n');

    // 获取现有案件
    const cases = await query('SELECT id FROM cases ORDER BY id');
    
    if (cases.length === 0) {
      console.log('错误：没有找到案件数据');
      process.exit(1);
    }
    
    console.log(`找到 ${cases.length} 个案件\n`);

    // 清空现有成本数据（保留ID > 10的旧数据，只清理测试数据）
    await run('DELETE FROM cost_records WHERE id <= 10 OR case_id IN (SELECT id FROM cases WHERE id <= 40)');
    console.log('已清空现有成本数据\n');

    // 生成成本数据
    const costData = [];
    
    // 为每个案件生成多条成本记录
    for (let i = 0; i < cases.length && i < 10; i++) {
      const caseId = cases[i].id;
      
      // 诉讼费（70%已支付，30%待支付）
      costData.push({
        case_id: caseId,
        cost_type: 'court_fee',
        amount: Math.floor(Math.random() * 10000) + 1000,
        status: Math.random() > 0.3 ? 'paid' : 'unpaid',
        payment_date: Math.random() > 0.3 ? '2024-01-15' : null,
        due_date: Math.random() > 0.3 ? null : '2024-12-31',
        payer: '原告',
        payee: '法院'
      });
      
      // 律师费（每个案件都有，50%已支付，50%待支付）
      costData.push({
        case_id: caseId,
        cost_type: 'attorney_fee',
        amount: Math.floor(Math.random() * 50000) + 10000,
        status: Math.random() > 0.5 ? 'paid' : 'unpaid',
        payment_date: Math.random() > 0.5 ? '2024-02-01' : null,
        due_date: Math.random() > 0.5 ? null : '2024-12-31',
        payer: '原告',
        payee: '律师事务所'
      });
      
      // 部分案件有第二笔律师费（分期支付）
      if (Math.random() > 0.5) {
        costData.push({
          case_id: caseId,
          cost_type: 'attorney_fee',
          amount: Math.floor(Math.random() * 30000) + 5000,
          status: Math.random() > 0.6 ? 'paid' : 'unpaid',
          payment_date: Math.random() > 0.6 ? '2024-05-01' : null,
          due_date: Math.random() > 0.6 ? null : '2024-12-31',
          payer: '原告',
          payee: '律师事务所'
        });
      }
      
      // 鉴定费（部分案件有，60%已支付）
      if (Math.random() > 0.5) {
        costData.push({
          case_id: caseId,
          cost_type: 'appraisal_fee',
          amount: Math.floor(Math.random() * 15000) + 3000,
          status: Math.random() > 0.4 ? 'paid' : 'unpaid',
          payment_date: Math.random() > 0.4 ? '2024-03-10' : null,
          due_date: Math.random() > 0.4 ? null : '2024-12-31',
          payer: '原告',
          payee: '鉴定机构'
        });
      }
      
      // 公证费（少数案件有）
      if (Math.random() > 0.7) {
        costData.push({
          case_id: caseId,
          cost_type: 'notary_fee',
          amount: Math.floor(Math.random() * 5000) + 500,
          status: Math.random() > 0.5 ? 'paid' : 'unpaid',
          payment_date: Math.random() > 0.5 ? '2024-02-20' : null,
          due_date: Math.random() > 0.5 ? null : '2024-12-31',
          payer: '原告',
          payee: '公证处'
        });
      }
      
      // 其他费用
      if (Math.random() > 0.5) {
        costData.push({
          case_id: caseId,
          cost_type: 'other',
          amount: Math.floor(Math.random() * 3000) + 200,
          status: Math.random() > 0.6 ? 'paid' : 'unpaid',
          payment_date: Math.random() > 0.6 ? '2024-04-01' : null,
          due_date: Math.random() > 0.6 ? null : '2024-12-31',
          payer: '原告',
          payee: '其他'
        });
      }
    }

    // 插入数据
    for (const cost of costData) {
      await run(
        `INSERT INTO cost_records (case_id, cost_type, amount, status, payment_date, due_date, payer, payee)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [cost.case_id, cost.cost_type, cost.amount, cost.status, 
         cost.payment_date || null, cost.due_date || null, cost.payer, cost.payee]
      );
    }

    console.log(`✓ 成功生成 ${costData.length} 条成本记录\n`);

    // 统计数据
    const totalResult = await query('SELECT SUM(amount) as total FROM cost_records');
    const paidResult = await query('SELECT SUM(amount) as total FROM cost_records WHERE status = "paid"');
    const unpaidResult = await query('SELECT SUM(amount) as total FROM cost_records WHERE status = "unpaid"');
    const typeStats = await query('SELECT cost_type, COUNT(*) as count, SUM(amount) as total FROM cost_records GROUP BY cost_type');

    console.log('========================================');
    console.log('成本数据统计：');
    console.log(`总成本: ¥${totalResult[0].total?.toLocaleString() || 0}`);
    console.log(`已支付: ¥${paidResult[0].total?.toLocaleString() || 0}`);
    console.log(`待支付: ¥${unpaidResult[0].total?.toLocaleString() || 0}`);
    console.log('\n按类型统计：');
    typeStats.forEach(stat => {
      const typeName = {
        'court_fee': '诉讼费',
        'attorney_fee': '律师费',
        'appraisal_fee': '鉴定费',
        'notary_fee': '公证费',
        'other': '其他费用'
      }[stat.cost_type] || stat.cost_type;
      console.log(`  ${typeName}: ${stat.count}项, ¥${stat.total?.toLocaleString()}`);
    });
    console.log('========================================\n');

  } catch (error) {
    console.error('生成成本数据失败:', error);
    throw error;
  }
}

// 执行数据生成
seedCostData()
  .then(() => {
    console.log('✓ 成本测试数据生成完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('✗ 生成成本数据时出错:', error);
    process.exit(1);
  });
