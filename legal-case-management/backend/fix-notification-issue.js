/**
 * 修复提醒问题
 * 1. 检查数据是否存在
 * 2. 检查提醒规则
 * 3. 检查调度器
 * 4. 手动创建提醒（如果需要）
 */

const { query, run } = require('./src/config/database');
const NotificationTask = require('./src/models/NotificationTask');

async function fixNotificationIssue() {
  console.log('=== 提醒问题修复 ===\n');
  console.log('目标: 为案件 AN202511000007 的立案受理节点创建提醒');
  console.log('截止日期: 2025-11-26');
  console.log('当前日期:', new Date().toISOString().split('T')[0]);
  console.log('');

  try {
    // 步骤1: 检查notification_rules表是否存在
    console.log('步骤1: 检查notification_rules表...');
    try {
      const tables = await query(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='notification_rules'
      `);
      
      if (tables.length === 0) {
        console.log('❌ notification_rules表不存在，正在创建...');
        
        await run(`
          CREATE TABLE IF NOT EXISTS notification_rules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            rule_name TEXT NOT NULL,
            rule_type TEXT NOT NULL,
            threshold_value INTEGER,
            threshold_unit TEXT,
            frequency TEXT,
            recipients TEXT,
            is_enabled INTEGER DEFAULT 1,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        console.log('✓ notification_rules表创建成功');
        
        // 创建默认规则
        await run(`
          INSERT INTO notification_rules (
            rule_name, rule_type, threshold_value, threshold_unit, 
            frequency, recipients, is_enabled
          ) VALUES 
          ('节点截止提前3天提醒', 'deadline', 3, 'days', 'daily', 'handler', 1),
          ('节点截止提前1天提醒', 'deadline', 1, 'days', 'daily', 'handler', 1),
          ('节点超期提醒', 'overdue', 0, 'days', 'daily', 'handler', 1)
        `);
        
        console.log('✓ 默认规则创建成功');
      } else {
        console.log('✓ notification_rules表存在');
      }
    } catch (error) {
      console.error('检查表失败:', error.message);
    }
    console.log('');

    // 步骤2: 查找或创建测试案件
    console.log('步骤2: 查找案件 AN202511000007...');
    let caseId = null;
    
    const existingCases = await query(`
      SELECT * FROM cases 
      WHERE internal_number = 'AN202511000007'
    `);
    
    if (existingCases.length === 0) {
      console.log('❌ 案件不存在，正在创建测试案件...');
      
      const result = await run(`
        INSERT INTO cases (
          case_number, internal_number, case_type, handler, status, filing_date
        ) VALUES (
          '测试案件-001', 'AN202511000007', '民事案件', '张三', '进行中', '2025-11-20'
        )
      `);
      
      caseId = result.lastID;
      console.log(`✓ 测试案件创建成功，ID: ${caseId}`);
    } else {
      caseId = existingCases[0].id;
      console.log(`✓ 找到案件，ID: ${caseId}`);
    }
    console.log('');

    // 步骤3: 查找或创建立案受理节点
    console.log('步骤3: 查找立案受理节点...');
    let nodeId = null;
    
    const existingNodes = await query(`
      SELECT * FROM process_nodes 
      WHERE case_id = ? AND node_name = '立案受理'
    `, [caseId]);
    
    if (existingNodes.length === 0) {
      console.log('❌ 立案受理节点不存在，正在创建...');
      
      const result = await run(`
        INSERT INTO process_nodes (
          case_id, node_name, deadline, status, handler
        ) VALUES (
          ?, '立案受理', '2025-11-26', '待处理', '张三'
        )
      `, [caseId]);
      
      nodeId = result.lastID;
      console.log(`✓ 立案受理节点创建成功，ID: ${nodeId}`);
    } else {
      nodeId = existingNodes[0].id;
      console.log(`✓ 找到立案受理节点，ID: ${nodeId}`);
      console.log(`  - 截止日期: ${existingNodes[0].deadline}`);
      console.log(`  - 状态: ${existingNodes[0].status}`);
    }
    console.log('');

    // 步骤4: 检查提醒规则
    console.log('步骤4: 检查提醒规则...');
    const rules = await query(`
      SELECT * FROM notification_rules 
      WHERE rule_type = 'deadline' AND is_enabled = 1
    `);
    
    if (rules.length === 0) {
      console.log('❌ 没有启用的截止日期提醒规则');
    } else {
      console.log(`✓ 找到 ${rules.length} 条规则:`);
      rules.forEach(rule => {
        console.log(`  - ${rule.rule_name}: 提前${rule.threshold_value}${rule.threshold_unit}`);
      });
    }
    console.log('');

    // 步骤5: 检查现有提醒
    console.log('步骤5: 检查现有提醒...');
    const existingNotifications = await query(`
      SELECT * FROM notification_tasks 
      WHERE related_id = ? AND related_type = 'process_node'
      ORDER BY created_at DESC
    `, [nodeId]);
    
    console.log(`找到 ${existingNotifications.length} 条提醒记录`);
    if (existingNotifications.length > 0) {
      existingNotifications.forEach(notif => {
        console.log(`  - [${notif.task_type}] ${notif.content}`);
        console.log(`    状态: ${notif.status}, 创建时间: ${notif.created_at}`);
      });
    }
    console.log('');

    // 步骤6: 手动创建提醒
    console.log('步骤6: 手动创建提醒...');
    
    const now = new Date();
    const deadline = new Date('2025-11-26');
    const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    
    console.log(`距离截止日期: ${daysLeft} 天`);
    
    if (daysLeft <= 3 && daysLeft >= 0) {
      console.log('✓ 符合提醒条件（3天内到期）');
      
      // 检查是否已有最近的提醒
      const recentNotif = await query(`
        SELECT * FROM notification_tasks 
        WHERE related_id = ? 
        AND related_type = 'process_node'
        AND task_type = 'deadline'
        AND created_at > datetime('now', '-1 days')
      `, [nodeId]);
      
      if (recentNotif.length > 0) {
        console.log('⚠️  24小时内已有提醒，跳过创建');
      } else {
        console.log('正在创建提醒...');
        
        await NotificationTask.create({
          related_id: nodeId,
          related_type: 'process_node',
          task_type: 'deadline',
          scheduled_time: new Date().toISOString(),
          content: `节点"立案受理"将在 ${daysLeft} 天后到期（2025-11-26），请及时处理`,
          status: 'unread'
        });
        
        console.log('✓ 提醒创建成功！');
      }
    } else if (daysLeft < 0) {
      console.log(`⚠️  节点已超期 ${Math.abs(daysLeft)} 天`);
      
      // 创建超期提醒
      console.log('正在创建超期提醒...');
      
      await NotificationTask.create({
        related_id: nodeId,
        related_type: 'process_node',
        task_type: 'overdue',
        scheduled_time: new Date().toISOString(),
        content: `【超期警告】节点"立案受理"已超期 ${Math.abs(daysLeft)} 天（截止日期：2025-11-26），请尽快处理`,
        status: 'unread'
      });
      
      console.log('✓ 超期提醒创建成功！');
    } else {
      console.log(`⚠️  还未到提醒时间（距离截止${daysLeft}天 > 3天）`);
    }
    console.log('');

    // 步骤7: 验证提醒
    console.log('步骤7: 验证提醒...');
    const allNotifications = await query(`
      SELECT * FROM notification_tasks 
      WHERE related_id = ? AND related_type = 'process_node'
      ORDER BY created_at DESC
    `, [nodeId]);
    
    console.log(`当前该节点的提醒总数: ${allNotifications.length}`);
    allNotifications.forEach(notif => {
      console.log(`  - [${notif.task_type}] ${notif.content.substring(0, 60)}...`);
      console.log(`    状态: ${notif.status}, 创建时间: ${notif.created_at}`);
    });
    console.log('');

    // 步骤8: 总结
    console.log('=== 修复总结 ===');
    console.log('');
    console.log('✓ 案件ID:', caseId);
    console.log('✓ 节点ID:', nodeId);
    console.log('✓ 提醒数量:', allNotifications.length);
    console.log('');
    console.log('下一步:');
    console.log('1. 刷新前端页面查看提醒');
    console.log('2. 检查 Dashboard 待办事项');
    console.log('3. 检查右上角提醒通知');
    console.log('4. 检查提醒中心 (/notifications)');

  } catch (error) {
    console.error('修复失败:', error);
  }
}

// 运行修复
fixNotificationIssue().then(() => {
  console.log('\n修复完成');
  process.exit(0);
}).catch(error => {
  console.error('修复失败:', error);
  process.exit(1);
});
