(async ()=>{
  try{
    const { run, query } = require('./backend/src/config/database');
    const { beijingNow } = require('./backend/src/utils/time');
    const sql = `INSERT INTO litigation_parties (case_id, party_type, entity_type, name, unified_credit_code, legal_representative, id_number, birth_date, contact_phone, contact_email, address, region_code, detail_address, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [66, '原告', '个人', '测试', null, null, '999999999999999999', '2000-01-01', '13000000000', '', '地址', null, '', beijingNow()];
    const r = await run(sql, params);
    console.log('inserted id', r.lastID);
    const rows = await query('SELECT id,name,birth_date,id_number FROM litigation_parties WHERE id=?', [r.lastID]);
    console.log(rows);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
