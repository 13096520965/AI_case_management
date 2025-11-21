/**
 * 创建测试历史案件数据
 */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'database/legal_case.db');

async function createTestData() {
  console.log('='.repeat(60));
  console.log('创建测试历史案件数据');
  console.log('='.repeat(60));
  
  try {
    const SQL = await initSqlJs();
    const buffer = fs.readFileSync(DB_PATH);
    const db = new SQL.Database(buffer);
    
    const testCompanyName = '测试科技有限公司';
    
    // 1. 创建3个测试案件
    console.log('\n1. 创建测试案件...');
    
    const cases = [
      {
        case_number: '（2024）京0105民初11111号',
        case_type: '民事',
        case_cause: '合同纠纷',
        court: '北京市朝阳区人民法院',
        filing_date: '2024-01-15',
        status: '已结案'
      },
      {
        case_number: '（2024）京0105民初22222号',
        case_type: '民事',
        case_cause: '买卖合同纠纷',
        court: '北京市朝阳区人民法院',
        filing_date: '2024-06-20',
        status: '审理中'
      },
      {
        case_number: '（2024）京0105民初33333号',
        case_type: '民事',
        case_cause: '服务合同纠纷',
        court: '北京市朝阳区人民法院',
        filing_date: '2024-09-10',
        status: '立案'
      }
    ];
    
    const caseIds = [];
    
    cases.forEach((caseData, index) => {
      db.run(`
        INSERT INTO cases (
          case_number, case_type, case_cause, court, 
          filing_date, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `, [
        caseData.case_number,
        caseData.case_type,
        caseData.case_cause,
        caseData.court,
        caseData.filing_date,
        caseData.status
      ]);
      
      const lastIdResult = db.exec("SELECT last_insert_rowid() as id");
      const caseId = lastIdResult[0].values[0][0];
      caseIds.push(caseId);
      
      console.log(`  ✓ 创建案件 ${index + 1}: ${caseData.case_number} (ID: ${caseId})`);
    });
    
    // 2. 为每个案件添加诉讼主体
    console.log(`\n2. 添加诉讼主体 "${testCompanyName}"...`);
    
    caseIds.forEach((caseId, index) => {
      const partyType = index === 0 ? '原告' : (index === 1 ? '被告' : '第三人');
      
      db.run(`
        INSERT INTO litigation_parties (
          case_id, party_type, entity_type, name,
          unified_credit_code, legal_representative,
          contact_phone, contact_email,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `, [
        caseId,
        partyType,
        '企业',
        testCompanyName,
        '91110000XXXXXXXXXX',
        '张三',
        '13800138000',
        'test@example.com'
      ]);
      
      console.log(`  ✓ 案件 ${caseId}: 添加为${partyType}`);
    });
    
    // 3. 保存数据库
    const data = db.export();
    const newBuffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, newBuffer);
    console.log('\n✓ 数据库保存成功');
    
    // 4. 验证数据
    console.log(`\n3. 验证 "${testCompanyName}" 的历史案件...`);
    
    const sql = `
      SELECT DISTINCT 
        c.id,
        c.case_number,
        c.case_type,
        c.case_cause,
        c.court,
        c.filing_date,
        c.status
      FROM cases c
      INNER JOIN litigation_parties lp ON c.id = lp.case_id
      WHERE lp.name = ?
      ORDER BY c.created_at DESC
    `;
    
    const stmt = db.prepare(sql);
    stmt.bind([testCompanyName]);
    
    console.log('\n历史案件列表:');
    console.log('-'.repeat(60));
    
    let count = 0;
    while (stmt.step()) {
      const row = stmt.getAsObject();
      count++;
      console.log(`\n案件 ${count}:`);
      console.log(`  案号: ${row.case_number}`);
      console.log(`  案件类型: ${row.case_type}`);
      console.log(`  案由: ${row.case_cause}`);
      console.log(`  法院: ${row.court}`);
      console.log(`  立案日期: ${row.filing_date} ✅`);
      console.log(`  状态: ${row.status}`);
    }
    
    stmt.free();
    
    console.log('\n' + '-'.repeat(60));
    console.log(`✓ 找到 ${count} 个历史案件`);
    
    console.log('\n' + '='.repeat(60));
    console.log('✓ 测试数据创建成功！');
    console.log('='.repeat(60));
    console.log(`\n提示: 在前端搜索 "${testCompanyName}" 可以看到这些历史案件`);
    
  } catch (error) {
    console.error('测试失败:', error);
  }
}

createTestData();
