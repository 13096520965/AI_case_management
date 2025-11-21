const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../legal_case_management.db');
const db = new sqlite3.Database(dbPath);

// 生成测试案件数据
const generateCases = () => {
  const cases = [];
  const now = new Date();
  
  const caseTemplates = [
    { id: 1, case_number: '2024-001', case_cause: '张三诉李四合同纠纷案', case_type: '民事', status: 'active' },
    { id: 2, case_number: '2024-002', case_cause: '王五劳动争议案', case_type: '劳动', status: 'active' },
    { id: 3, case_number: '2024-003', case_cause: '赵六知识产权案', case_type: '知识产权', status: 'active' },
    { id: 4, case_number: '2024-004', case_cause: '孙七房产纠纷案', case_type: '民事', status: 'active' },
    { id: 5, case_number: '2024-005', case_cause: '周八交通事故案', case_type: '侵权', status: 'active' },
    { id: 6, case_number: '2024-006', case_cause: '吴九借款纠纷案', case_type: '民事', status: 'active' },
    { id: 7, case_number: '2024-007', case_cause: '郑十离婚案', case_type: '婚姻家庭', status: 'active' },
    { id: 8, case_number: '2024-008', case_cause: '冯十一商标侵权案', case_type: '知识产权', status: 'active' },
    { id: 9, case_number: '2024-009', case_cause: '陈十二劳动合同案', case_type: '劳动', status: 'active' },
    { id: 10, case_number: '2024-010', case_cause: '褚十三股权纠纷案', case_type: '公司', status: 'active' }
  ];

  return caseTemplates.map(c => ({
    ...c,
    filing_date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    target_amount: Math.floor(Math.random() * 1000000) + 50000,
    court: '某某市中级人民法院',
    handler: '张律师'
  }));
};

// 生成测试流程节点数据
const generateProcessNodes = () => {
  const nodes = [];
  const now = new Date();
  
  // 节点模板
  const nodeTemplates = [
    // 超期节点（已过期）
    {
      case_id: 1,
      node_type: 'evidence',
      node_name: '证据收集',
      handler: '张三',
      start_time: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      deadline: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'in_progress',
      progress: '已收集部分证据',
      node_order: 1
    },
    {
      case_id: 2,
      node_type: 'document',
      node_name: '提交答辩状',
      handler: '李四',
      start_time: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      deadline: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'in_progress',
      progress: '正在准备材料',
      node_order: 2
    },
    {
      case_id: 3,
      node_type: 'hearing',
      node_name: '开庭准备',
      handler: '王五',
      start_time: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      deadline: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'in_progress',
      progress: '准备中',
      node_order: 3
    },
    {
      case_id: 4,
      node_type: 'evidence',
      node_name: '证据交换',
      handler: '赵六',
      start_time: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      deadline: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'in_progress',
      progress: '等待对方提交',
      node_order: 2
    },
    {
      case_id: 5,
      node_type: 'document',
      node_name: '提交证据',
      handler: '孙七',
      start_time: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      deadline: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'in_progress',
      progress: '整理中',
      node_order: 3
    },
    
    // 即将到期节点（未来1-3天）
    {
      case_id: 6,
      node_type: 'hearing',
      node_name: '庭前会议',
      handler: '周八',
      start_time: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      deadline: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'in_progress',
      progress: '准备中',
      node_order: 4
    },
    {
      case_id: 7,
      node_type: 'document',
      node_name: '提交代理词',
      handler: '吴九',
      start_time: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      deadline: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'in_progress',
      progress: '起草中',
      node_order: 5
    },
    {
      case_id: 8,
      node_type: 'evidence',
      node_name: '质证环节',
      handler: '郑十',
      start_time: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      deadline: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'in_progress',
      progress: '准备质证意见',
      node_order: 4
    },
    
    // 今天到期
    {
      case_id: 9,
      node_type: 'document',
      node_name: '提交补充材料',
      handler: '冯十一',
      start_time: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      deadline: new Date(now.getTime()).toISOString(),
      status: 'in_progress',
      progress: '最后确认中',
      node_order: 3
    },
    
    // 已完成节点（不应出现在预警中）
    {
      case_id: 10,
      node_type: 'evidence',
      node_name: '证据收集',
      handler: '陈十二',
      start_time: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      deadline: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      completion_time: new Date(now.getTime() - 16 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'completed',
      progress: '已完成',
      node_order: 1
    }
  ];

  return nodeTemplates;
};

// 插入测试数据
const seedProcessNodes = () => {
  return new Promise((resolve, reject) => {
    const cases = generateCases();
    const nodes = generateProcessNodes();
    
    db.serialize(() => {
      // 先插入案件数据
      console.log('Inserting case data...');
      const caseStmt = db.prepare(`
        INSERT OR REPLACE INTO cases (
          id, case_number, case_cause, case_type, status,
          filing_date, target_amount, court, handler
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      cases.forEach((c) => {
        caseStmt.run(
          c.id, c.case_number, c.case_cause, c.case_type, c.status,
          c.filing_date, c.target_amount, c.court, c.handler
        );
      });

      caseStmt.finalize((err) => {
        if (err) {
          console.error('Error inserting cases:', err);
        } else {
          console.log(`Inserted ${cases.length} case records`);
        }
      });

      // 清空现有节点数据
      db.run('DELETE FROM process_nodes', (err) => {
        if (err) {
          console.error('Error clearing process_nodes:', err);
        } else {
          console.log('Cleared existing process node data');
        }
      });

      // 插入新数据
      const stmt = db.prepare(`
        INSERT INTO process_nodes (
          case_id, node_type, node_name, handler, start_time,
          deadline, completion_time, status, progress, node_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      let insertCount = 0;
      nodes.forEach((node) => {
        stmt.run(
          node.case_id,
          node.node_type,
          node.node_name,
          node.handler,
          node.start_time,
          node.deadline,
          node.completion_time || null,
          node.status,
          node.progress,
          node.node_order,
          (err) => {
            if (err) {
              console.error('Error inserting node:', err);
            } else {
              insertCount++;
            }
          }
        );
      });

      stmt.finalize((err) => {
        if (err) {
          reject(err);
        } else {
          console.log(`Successfully inserted ${insertCount} process node records`);
          
          // 统计数据
          db.get(`
            SELECT 
              COUNT(*) as total,
              SUM(CASE WHEN status != 'completed' AND deadline < datetime('now') THEN 1 ELSE 0 END) as overdue,
              SUM(CASE WHEN status != 'completed' AND deadline BETWEEN datetime('now') AND datetime('now', '+3 days') THEN 1 ELSE 0 END) as upcoming
            FROM process_nodes
          `, (err, stats) => {
            if (!err && stats) {
              console.log('\n统计信息:');
              console.log(`- 总节点数: ${stats.total}`);
              console.log(`- 超期节点: ${stats.overdue}`);
              console.log(`- 即将到期: ${stats.upcoming}`);
            }
            resolve(insertCount);
          });
        }
      });
    });
  });
};

// 执行数据填充
seedProcessNodes()
  .then((count) => {
    console.log(`\n✅ Process node test data seeded successfully!`);
    console.log(`Total records: ${count}`);
    db.close();
  })
  .catch((error) => {
    console.error('❌ Error seeding process node data:', error);
    db.close();
  });
