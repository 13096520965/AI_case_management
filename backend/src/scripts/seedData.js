/**
 * 数据填充脚本
 * 为系统各个模块生成虚拟测试数据
 */

const db = require('../config/database');

// 生成随机日期
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// 格式化日期为 YYYY-MM-DD
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// 格式化日期时间
function formatDateTime(date) {
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

// 清空所有表数据
async function clearAllData() {
  console.log('清空现有数据...');
  
  const tables = [
    'case_logs',
    'cost_records',
    'documents',
    'evidence',
    'process_nodes',
    'litigation_parties',
    'cases'
  ];
  
  for (const table of tables) {
    await db.query(`DELETE FROM ${table}`);
    console.log(`  ✓ 清空 ${table}`);
  }
}

// 创建案件数据
async function seedCases() {
  console.log('\n创建案件数据...');
  
  const caseTypes = ['民事', '刑事', '行政', '劳动仲裁'];
  const caseCauses = {
    '民事': ['合同纠纷', '房屋买卖合同纠纷', '借款纠纷', '侵权责任纠纷', '物权纠纷'],
    '刑事': ['诈骗罪', '盗窃罪', '故意伤害罪', '交通肇事罪', '职务侵占罪'],
    '行政': ['行政处罚决定', '行政强制措施', '行政许可', '行政复议', '行政赔偿'],
    '劳动仲裁': ['劳动争议', '工伤赔偿', '解除劳动合同', '加班费纠纷', '社保纠纷']
  };
  const courts = [
    '北京市朝阳区人民法院', '北京市西城区人民法院', '北京市海淀区人民法院',
    '上海市静安区人民法院', '上海市浦东新区人民法院', '上海市黄浦区人民法院',
    '广州市天河区人民法院', '广州市越秀区人民法院', '深圳市福田区人民法院',
    '杭州市滨江区人民法院', '杭州市西湖区人民法院', '成都市武侯区人民法院'
  ];
  const statuses = ['立案', '审理中', '已结案'];
  
  const cases = [];
  const caseIds = [];
  
  // 生成最近6个月的案件数据，每月5-10个案件
  for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
    const date = new Date();
    date.setMonth(date.getMonth() - monthOffset);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    
    // 每月生成5-10个案件
    const casesThisMonth = 5 + Math.floor(Math.random() * 6);
    
    for (let i = 0; i < casesThisMonth; i++) {
      const caseType = caseTypes[Math.floor(Math.random() * caseTypes.length)];
      const caseCause = caseCauses[caseType][Math.floor(Math.random() * caseCauses[caseType].length)];
      const court = courts[Math.floor(Math.random() * courts.length)];
      const day = 1 + Math.floor(Math.random() * 28);
      const filingDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      // 根据月份决定状态（越早的案件越可能已结案）
      let status;
      if (monthOffset >= 4) {
        // 4-5个月前的案件，30%已结案，70%审理中
        status = Math.random() < 0.3 ? '已结案' : '审理中';
      } else if (monthOffset >= 2) {
        // 2-3个月前的案件，10%已结案，80%审理中，10%立案
        const rand = Math.random();
        status = rand < 0.1 ? '已结案' : rand < 0.9 ? '审理中' : '立案';
      } else {
        // 最近2个月的案件，90%审理中，10%立案
        status = Math.random() < 0.9 ? '审理中' : '立案';
      }
      
      const caseNumber = cases.length + 1;
      const targetAmount = caseType === '行政' ? 0 : 
        Math.floor(Math.random() * 5000000) + 10000;
      
      const caseData = {
        internal_number: `AN${year}${String(month).padStart(2, '0')}${String(caseNumber).padStart(6, '0')}`,
        case_number: `(${year})${court.substring(0, 2)}${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}${caseType === '民事' ? '民初' : caseType === '刑事' ? '刑初' : '行初'}${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}号`,
        case_type: caseType,
        case_cause: caseCause,
        court: court,
        target_amount: targetAmount,
        filing_date: filingDate,
        status: status,
        created_at: filingDate
      };
      
      cases.push(caseData);
    }
  }
  
  // 插入数据库
  for (const caseData of cases) {
    const result = await db.run(
      `INSERT INTO cases (internal_number, case_number, case_type, case_cause, court, target_amount, filing_date, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [caseData.internal_number, caseData.case_number, caseData.case_type, caseData.case_cause, 
       caseData.court, caseData.target_amount, caseData.filing_date, caseData.status, 
       caseData.created_at, caseData.created_at]
    );
    caseIds.push(result.lastID);
  }
  
  console.log(`  ✓ 创建 ${cases.length} 个案件`);
  return caseIds;
}

// 创建诉讼主体数据
async function seedParties(caseIds) {
  console.log('\n创建诉讼主体数据...');
  
  const surnames = ['张', '王', '李', '赵', '陈', '刘', '杨', '黄', '周', '吴', '徐', '孙', '马', '朱', '胡', '郭', '何', '高', '林', '罗'];
  const names = ['伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '涛', '明', '超', '秀兰'];
  const companies = ['科技有限公司', '贸易有限公司', '网络科技有限公司', '实业有限公司', '投资有限公司', '建设工程有限公司'];
  const cities = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安'];
  
  const parties = [];
  
  for (const caseId of caseIds) {
    // 获取案件类型
    const caseResult = await db.get('SELECT case_type FROM cases WHERE id = ?', [caseId]);
    const caseType = caseResult.case_type;
    
    // 根据案件类型生成主体
    if (caseType === '民事' || caseType === '劳动仲裁') {
      // 原告（自然人或企业）
      const isCompany = Math.random() < 0.3;
      if (isCompany) {
        const city = cities[Math.floor(Math.random() * cities.length)];
        const companyType = companies[Math.floor(Math.random() * companies.length)];
        parties.push({
          case_id: caseId,
          party_type: caseType === '劳动仲裁' ? '申请人' : '原告',
          entity_type: '企业',
          name: `${city}${surnames[Math.floor(Math.random() * surnames.length)]}${surnames[Math.floor(Math.random() * surnames.length)]}${companyType}`,
          unified_credit_code: `9111${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}MA${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`,
          legal_representative: surnames[Math.floor(Math.random() * surnames.length)] + names[Math.floor(Math.random() * names.length)],
          contact_phone: `010-${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
          address: `${city}市xxx区xxx路xxx号`
        });
      } else {
        parties.push({
          case_id: caseId,
          party_type: caseType === '劳动仲裁' ? '申请人' : '原告',
          entity_type: '自然人',
          name: surnames[Math.floor(Math.random() * surnames.length)] + names[Math.floor(Math.random() * names.length)],
          id_number: `110101${String(1950 + Math.floor(Math.random() * 50))}${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
          contact_phone: `138${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
          address: `${cities[Math.floor(Math.random() * cities.length)]}市xxx区xxx街道xxx号`
        });
      }
      
      // 被告（企业或自然人）
      const defendantIsCompany = Math.random() < 0.5;
      if (defendantIsCompany) {
        const city = cities[Math.floor(Math.random() * cities.length)];
        const companyType = companies[Math.floor(Math.random() * companies.length)];
        parties.push({
          case_id: caseId,
          party_type: caseType === '劳动仲裁' ? '被申请人' : '被告',
          entity_type: '企业',
          name: `${city}${surnames[Math.floor(Math.random() * surnames.length)]}${surnames[Math.floor(Math.random() * surnames.length)]}${companyType}`,
          unified_credit_code: `9111${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}MA${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`,
          legal_representative: surnames[Math.floor(Math.random() * surnames.length)] + names[Math.floor(Math.random() * names.length)],
          contact_phone: `010-${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
          address: `${city}市xxx区xxx路xxx号`
        });
      } else {
        parties.push({
          case_id: caseId,
          party_type: caseType === '劳动仲裁' ? '被申请人' : '被告',
          entity_type: '自然人',
          name: surnames[Math.floor(Math.random() * surnames.length)] + names[Math.floor(Math.random() * names.length)],
          id_number: `110101${String(1950 + Math.floor(Math.random() * 50))}${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
          contact_phone: `138${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
          address: `${cities[Math.floor(Math.random() * cities.length)]}市xxx区xxx街道xxx号`
        });
      }
    } else if (caseType === '刑事') {
      // 被告人
      parties.push({
        case_id: caseId,
        party_type: '被告人',
        entity_type: '自然人',
        name: surnames[Math.floor(Math.random() * surnames.length)] + names[Math.floor(Math.random() * names.length)],
        id_number: `110101${String(1950 + Math.floor(Math.random() * 50))}${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
        contact_phone: `138${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
        address: `${cities[Math.floor(Math.random() * cities.length)]}市xxx区xxx街道xxx号`
      });
      
      // 辩护人
      parties.push({
        case_id: caseId,
        party_type: '辩护人',
        entity_type: '自然人',
        name: surnames[Math.floor(Math.random() * surnames.length)] + '律师',
        contact_phone: `138${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
        address: `${cities[Math.floor(Math.random() * cities.length)]}市xxx律师事务所`
      });
    } else if (caseType === '行政') {
      // 原告（企业或自然人）
      const isCompany = Math.random() < 0.5;
      if (isCompany) {
        const city = cities[Math.floor(Math.random() * cities.length)];
        const companyType = companies[Math.floor(Math.random() * companies.length)];
        parties.push({
          case_id: caseId,
          party_type: '原告',
          entity_type: '企业',
          name: `${city}${surnames[Math.floor(Math.random() * surnames.length)]}${surnames[Math.floor(Math.random() * surnames.length)]}${companyType}`,
          unified_credit_code: `9111${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}MA${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`,
          legal_representative: surnames[Math.floor(Math.random() * surnames.length)] + names[Math.floor(Math.random() * names.length)],
          contact_phone: `010-${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
          address: `${city}市xxx区xxx路xxx号`
        });
      } else {
        parties.push({
          case_id: caseId,
          party_type: '原告',
          entity_type: '自然人',
          name: surnames[Math.floor(Math.random() * surnames.length)] + names[Math.floor(Math.random() * names.length)],
          id_number: `110101${String(1950 + Math.floor(Math.random() * 50))}${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
          contact_phone: `138${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
          address: `${cities[Math.floor(Math.random() * cities.length)]}市xxx区xxx街道xxx号`
        });
      }
      
      // 被告（行政机关）
      const city = cities[Math.floor(Math.random() * cities.length)];
      const departments = ['市场监督管理局', '公安局', '税务局', '城管局', '环保局', '规划局'];
      parties.push({
        case_id: caseId,
        party_type: '被告',
        entity_type: '行政机关',
        name: `${city}市${departments[Math.floor(Math.random() * departments.length)]}`,
        contact_phone: `010-${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
        address: `${city}市xxx区xxx路xxx号`
      });
    }
  }
  
  // 插入数据库
  for (const party of parties) {
    await db.run(
      `INSERT INTO litigation_parties (case_id, party_type, entity_type, name, id_number, unified_credit_code, legal_representative, contact_phone, address, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [party.case_id, party.party_type, party.entity_type, party.name, party.id_number || null, 
       party.unified_credit_code || null, party.legal_representative || null, party.contact_phone, party.address]
    );
  }
  
  console.log(`  ✓ 创建 ${parties.length} 个诉讼主体`);
}

// 创建流程节点数据
async function seedProcessNodes(caseIds) {
  console.log('\n创建流程节点数据...');
  
  const nodeTemplates = [
    { name: '立案', type: '立案', daysFromStart: 0, duration: 5 },
    { name: '送达起诉状', type: '送达', daysFromStart: 6, duration: 7 },
    { name: '举证期限', type: '举证', daysFromStart: 14, duration: 30 },
    { name: '证据交换', type: '举证', daysFromStart: 45, duration: 7 },
    { name: '庭前会议', type: '其他', daysFromStart: 53, duration: 1 },
    { name: '开庭审理', type: '开庭', daysFromStart: 60, duration: 1 },
    { name: '补充证据', type: '举证', daysFromStart: 62, duration: 15 },
    { name: '二次开庭', type: '开庭', daysFromStart: 80, duration: 1 },
    { name: '调解', type: '调解', daysFromStart: 82, duration: 10 },
    { name: '判决', type: '判决', daysFromStart: 95, duration: 1 }
  ];
  
  const handlers = ['张律师', '李律师', '王律师', '赵律师', '陈律师', '孙律师', '吴律师', '周律师'];
  
  const nodes = [];
  
  // 为每个案件生成节点
  for (const caseId of caseIds) {
    // 获取案件信息
    const caseResult = await db.get('SELECT filing_date, status FROM cases WHERE id = ?', [caseId]);
    const filingDate = new Date(caseResult.filing_date);
    const caseStatus = caseResult.status;
    const handler = handlers[Math.floor(Math.random() * handlers.length)];
    
    // 根据案件状态决定生成多少节点
    let numNodes;
    if (caseStatus === '已结案') {
      numNodes = nodeTemplates.length; // 所有节点
    } else if (caseStatus === '审理中') {
      numNodes = 3 + Math.floor(Math.random() * 5); // 3-7个节点
    } else {
      numNodes = 1 + Math.floor(Math.random() * 2); // 1-2个节点
    }
    
    // 生成节点
    for (let i = 0; i < numNodes && i < nodeTemplates.length; i++) {
      const template = nodeTemplates[i];
      
      const startDate = new Date(filingDate);
      startDate.setDate(startDate.getDate() + template.daysFromStart);
      
      const deadline = new Date(startDate);
      deadline.setDate(deadline.getDate() + template.duration);
      
      const today = new Date();
      
      // 确定节点状态和进度
      let status, progress;
      if (caseStatus === '已结案') {
        status = '已完成';
        progress = 100;
      } else if (deadline < today) {
        // 已过期的节点
        if (Math.random() < 0.8) {
          status = '已完成';
          progress = 100;
        } else {
          status = '进行中';
          progress = 60 + Math.floor(Math.random() * 30);
        }
      } else if (startDate <= today) {
        // 进行中的节点
        status = '进行中';
        const totalDays = (deadline - startDate) / (1000 * 60 * 60 * 24);
        const passedDays = (today - startDate) / (1000 * 60 * 60 * 24);
        progress = Math.min(95, Math.floor((passedDays / totalDays) * 100));
      } else {
        // 未开始的节点
        status = '待处理';
        progress = 0;
      }
      
      nodes.push({
        case_id: caseId,
        node_name: template.name,
        node_type: template.type,
        handler: handler,
        start_time: startDate.toISOString().split('T')[0],
        deadline: deadline.toISOString().split('T')[0],
        status: status,
        progress: progress,
        created_at: startDate.toISOString().split('T')[0]
      });
    }
  }
  
  // 插入数据库
  for (const node of nodes) {
    await db.run(
      `INSERT INTO process_nodes (case_id, node_name, node_type, handler, start_time, deadline, status, progress, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [node.case_id, node.node_name, node.node_type, node.handler, node.start_time, node.deadline, node.status, node.progress, node.created_at]
    );
  }
  
  console.log(`  ✓ 创建 ${nodes.length} 个流程节点`);
}

// 创建成本记录数据
async function seedCosts(caseIds) {
  console.log('\n创建成本记录数据...');
  
  const costTypes = ['律师费', '诉讼费', '鉴定费', '评估费', '公证费', '差旅费', '其他费用'];
  const payers = ['当事人', '委托人', '公司', '家属'];
  
  const costs = [];
  
  // 为每个案件生成1-4条成本记录
  for (const caseId of caseIds) {
    const numCosts = 1 + Math.floor(Math.random() * 4);
    
    // 获取案件的立案日期
    const caseResult = await db.get('SELECT filing_date FROM cases WHERE id = ?', [caseId]);
    const filingDate = new Date(caseResult.filing_date);
    
    for (let i = 0; i < numCosts; i++) {
      const costType = costTypes[Math.floor(Math.random() * costTypes.length)];
      
      // 律师费通常较高，其他费用较低
      let amount;
      if (costType === '律师费') {
        amount = Math.floor(Math.random() * 150000) + 10000;
      } else if (costType === '诉讼费') {
        amount = Math.floor(Math.random() * 50000) + 500;
      } else {
        amount = Math.floor(Math.random() * 20000) + 500;
      }
      
      // 支付日期在立案日期后0-30天
      const paymentDate = new Date(filingDate);
      paymentDate.setDate(paymentDate.getDate() + Math.floor(Math.random() * 30));
      
      // 90%已支付，10%待支付
      const status = Math.random() < 0.9 ? '已支付' : '待支付';
      const paymentDateStr = status === '已支付' ? 
        paymentDate.toISOString().split('T')[0] : null;
      
      costs.push({
        case_id: caseId,
        cost_type: costType,
        amount: amount,
        payment_date: paymentDateStr,
        status: status,
        payer: payers[Math.floor(Math.random() * payers.length)],
        created_at: paymentDateStr || filingDate.toISOString().split('T')[0]
      });
    }
  }
  
  // 插入数据库
  for (const cost of costs) {
    await db.run(
      `INSERT INTO cost_records (case_id, cost_type, amount, payment_date, status, payer, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [cost.case_id, cost.cost_type, cost.amount, cost.payment_date, cost.status, cost.payer, cost.created_at]
    );
  }
  
  console.log(`  ✓ 创建 ${costs.length} 条成本记录`);
}

// 创建案件日志数据
async function seedCaseLogs(caseIds) {
  console.log('\n创建案件日志数据...');
  
  const operators = ['系统管理员', '张律师', '李律师', '王律师', '赵律师', '陈律师'];
  const logs = [];
  
  for (const caseId of caseIds) {
    const operator = operators[Math.floor(Math.random() * (operators.length - 1)) + 1]; // 排除系统管理员
    
    // 每个案件至少有创建日志
    logs.push({
      case_id: caseId,
      action_type: 'CREATE_CASE',
      action_description: '创建案件',
      operator_name: '系统管理员',
      ip_address: '127.0.0.1'
    });
    
    // 添加2-5条其他日志
    const numLogs = 2 + Math.floor(Math.random() * 4);
    const actionTypes = [
      { type: 'ADD_PARTY', desc: '添加诉讼主体' },
      { type: 'ADD_NODE', desc: '添加流程节点' },
      { type: 'NODE_PROGRESS_CHANGE', desc: '更新节点进度' },
      { type: 'ADD_COST', desc: '添加成本记录' },
      { type: 'ADD_EVIDENCE', desc: '上传证据材料' },
      { type: 'STATUS_CHANGE', desc: '变更案件状态' }
    ];
    
    for (let i = 0; i < numLogs; i++) {
      const action = actionTypes[Math.floor(Math.random() * actionTypes.length)];
      logs.push({
        case_id: caseId,
        action_type: action.type,
        action_description: action.desc,
        operator_name: operator,
        ip_address: `192.168.1.${100 + Math.floor(Math.random() * 50)}`
      });
    }
  }
  
  // 插入数据库
  for (const log of logs) {
    await db.run(
      `INSERT INTO case_logs (case_id, action_type, action_description, operator_name, ip_address, created_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      [log.case_id, log.action_type, log.action_description, log.operator_name, log.ip_address]
    );
  }
  
  console.log(`  ✓ 创建 ${logs.length} 条案件日志`);
}

// 主函数
async function main() {
  try {
    console.log('='.repeat(50));
    console.log('开始填充虚拟数据');
    console.log('='.repeat(50));
    
    // 清空现有数据
    await clearAllData();
    
    // 创建案件
    const caseIds = await seedCases();
    
    // 创建诉讼主体
    await seedParties(caseIds);
    
    // 创建流程节点
    await seedProcessNodes(caseIds);
    
    // 创建成本记录
    await seedCosts(caseIds);
    
    // 创建案件日志
    await seedCaseLogs(caseIds);
    
    // 统计实际创建的数据
    const stats = {
      cases: await db.get('SELECT COUNT(*) as count FROM cases'),
      parties: await db.get('SELECT COUNT(*) as count FROM litigation_parties'),
      nodes: await db.get('SELECT COUNT(*) as count FROM process_nodes'),
      costs: await db.get('SELECT COUNT(*) as count FROM cost_records'),
      logs: await db.get('SELECT COUNT(*) as count FROM case_logs')
    };
    
    console.log('\n' + '='.repeat(50));
    console.log('✓ 数据填充完成！');
    console.log('='.repeat(50));
    console.log(`\n共创建：
  - ${stats.cases.count} 个案件
  - ${stats.parties.count} 个诉讼主体
  - ${stats.nodes.count} 个流程节点
  - ${stats.costs.count} 条成本记录
  - ${stats.logs.count} 条案件日志
    `);
    
    process.exit(0);
  } catch (error) {
    console.error('数据填充失败:', error);
    process.exit(1);
  }
}

// 运行脚本
main();
