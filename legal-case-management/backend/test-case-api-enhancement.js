const Case = require('./src/models/Case');

async function test() {
  try {
    console.log('=== Testing Case API Enhancement ===\n');
    
    console.log('1. Testing Case.findAllWithParties...');
    const cases = await Case.findAllWithParties({ page: 1, limit: 5 });
    console.log(`   Found ${cases.length} cases`);
    
    if (cases.length > 0) {
      console.log('\n   First case structure:');
      console.log(`   - ID: ${cases[0].id}`);
      console.log(`   - Case Number: ${cases[0].case_number || cases[0].internal_number}`);
      console.log(`   - Plaintiffs: ${cases[0].plaintiffs ? cases[0].plaintiffs.length : 0}`);
      console.log(`   - Defendants: ${cases[0].defendants ? cases[0].defendants.length : 0}`);
      console.log(`   - Third Parties: ${cases[0].third_parties ? cases[0].third_parties.length : 0}`);
      
      if (cases[0].plaintiffs && cases[0].plaintiffs.length > 0) {
        console.log(`\n   Sample plaintiff:`, JSON.stringify(cases[0].plaintiffs[0], null, 2));
      }
    }
    
    console.log('\n2. Testing Case.findByIdWithParties...');
    if (cases.length > 0) {
      const caseDetail = await Case.findByIdWithParties(cases[0].id);
      console.log(`   Case ID: ${caseDetail.id}`);
      console.log(`   Plaintiffs: ${caseDetail.plaintiffs ? caseDetail.plaintiffs.length : 0}`);
      console.log(`   Defendants: ${caseDetail.defendants ? caseDetail.defendants.length : 0}`);
      console.log(`   Third Parties: ${caseDetail.third_parties ? caseDetail.third_parties.length : 0}`);
      
      if (caseDetail.plaintiffs && caseDetail.plaintiffs.length > 0) {
        console.log(`\n   Sample plaintiff with case_count:`, JSON.stringify(caseDetail.plaintiffs[0], null, 2));
      }
    }
    
    console.log('\n3. Testing partyName search...');
    const casesWithSearch = await Case.findAllWithParties({ 
      page: 1, 
      limit: 5,
      partyName: '公司' // Search for parties with "公司" in name
    });
    console.log(`   Found ${casesWithSearch.length} cases with party name containing "公司"`);
    
    console.log('\n=== All tests passed! ===');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

test();
