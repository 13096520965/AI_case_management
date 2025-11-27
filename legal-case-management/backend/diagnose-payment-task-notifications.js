const { query } = require('./src/config/database');

async function diagnose() {
  try {
    console.log('=== 诊断费用支付和协作任务提醒 ===\n');

    // 查询所有费用支付提醒
    const paymentNotifications = await query(
      'SELECT * FROM notification_tasks WHERE task_type = "payment" ORDER BY created_at DESC'
    );
    console.log(`=== 费用支付提醒 (payment): ${paymentNotifications.length} 条 ===`);
    
    for (const notif of paymentNotifications) {
      console.log(`\nID: ${notif.id}`);
      console.log(`  关联类型: ${notif.related_type}`);
      console.log(`  关联ID: ${notif.related_id}`);
      console.log(`  内容: ${notif.content.substring(0, 80)}...`);
      
      if (notif.related_type === 'cost_record') {
        const costs = await query(
          'SELECT cr.*, c.id as caseId, c.case_number FROM cost_records cr LEFT JOIN cases c ON cr.case_id = c.id WHERE cr.id = ?',
          [notif.related_id]
        );
        
        if (costs.length === 0) {
          console.log(`  ❌ 费用记录不存在`);
        } else if (!costs[0].caseId) {
          console.log(`  ❌ 费用记录没有关联案件`);
          console.log(`     费用类型: ${costs[0].cost_type}`);
          console.log(`     金额: ${costs[0].amount}`);
        } else {
          console.log(`  ✓ 有效 - 案件: ${costs[0].case_number}`);
        }
      }
    }

    // 查询所有协作任务提醒
    const taskNotifications = await query(
      'SELECT * FROM notification_tasks WHERE task_type = "task" ORDER BY created_at DESC'
    );
    console.log(`\n\n=== 协作任务提醒 (task): ${taskNotifications.length} 条 ===`);
    
    for (const notif of taskNotifications) {
      console.log(`\nID: ${notif.id}`);
      console.log(`  关联类型: ${notif.related_type}`);
      console.log(`  关联ID: ${notif.related_id}`);
      console.log(`  内容: ${notif.content.substring(0, 80)}...`);
      
      if (notif.related_type === 'process_node') {
        const nodes = await query(
          'SELECT pn.*, c.id as caseId, c.case_number FROM process_nodes pn LEFT JOIN cases c ON pn.case_id = c.id WHERE pn.id = ?',
          [notif.related_id]
        );
        
        if (nodes.length === 0) {
          console.log(`  ❌ 节点不存在`);
        } else if (!nodes[0].caseId) {
          console.log(`  ❌ 节点没有关联案件`);
          console.log(`     节点名称: ${nodes[0].node_name}`);
        } else {
          console.log(`  ✓ 有效 - 案件: ${nodes[0].case_number}`);
        }
      }
    }

    // 统计无效提醒
    console.log('\n\n=== 统计无效提醒 ===');
    
    let invalidPaymentCount = 0;
    for (const notif of paymentNotifications) {
      if (notif.related_type === 'cost_record') {
        const costs = await query(
          'SELECT cr.*, c.id as caseId FROM cost_records cr LEFT JOIN cases c ON cr.case_id = c.id WHERE cr.id = ?',
          [notif.related_id]
        );
        if (costs.length === 0 || !costs[0].caseId) {
          invalidPaymentCount++;
        }
      }
    }

    let invalidTaskCount = 0;
    for (const notif of taskNotifications) {
      if (notif.related_type === 'process_node') {
        const nodes = await query(
          'SELECT pn.*, c.id as caseId FROM process_nodes pn LEFT JOIN cases c ON pn.case_id = c.id WHERE pn.id = ?',
          [notif.related_id]
        );
        if (nodes.length === 0 || !nodes[0].caseId) {
          invalidTaskCount++;
        }
      }
    }

    console.log(`无效费用支付提醒: ${invalidPaymentCount} 条`);
    console.log(`无效协作任务提醒: ${invalidTaskCount} 条`);
    console.log(`总计无效提醒: ${invalidPaymentCount + invalidTaskCount} 条`);

  } catch (error) {
    console.error('诊断失败:', error);
  }
}

diagnose();
