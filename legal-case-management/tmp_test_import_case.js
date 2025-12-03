(async ()=>{
  try{
    const Case = require('./backend/src/models/Case');
    const caseData = {
      internal_number: null,
      case_number: 'TEST-IMPORT-001',
      case_type: '民事',
      case_cause: '合同纠纷',
      court: '北京市朝阳区人民法院',
      target_amount: 10000,
      filing_date: '2025-12-03',
      status: '立案',
      industry_segment: '新智认知',
      handler: '王五',
      is_external_agent: 0,
      law_firm_name: null,
      agent_lawyer: null,
      agent_contact: null,
      case_background: '测试导入'
    };
    const id = await Case.create(caseData);
    console.log('inserted case id', id);
  } catch (e) {
    console.error('err', e);
  }
})();
