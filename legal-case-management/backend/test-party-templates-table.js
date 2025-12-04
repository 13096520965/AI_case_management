/**
 * Test script for party_templates table
 * 测试 party_templates 表的功能
 * 
 * This script verifies:
 * 1. Table structure with all required fields
 * 2. idx_party_template_name index
 * 3. UNIQUE constraint on (name, entity_type)
 * 4. Basic CRUD operations
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const DB_PATH = path.join(__dirname, 'database/legal_case.db');

async function testPartyTemplatesTable() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('❌ Database connection failed:', err.message);
        return reject(err);
      }
      
      console.log('========================================');
      console.log('Testing party_templates Table');
      console.log('========================================\n');
      
      let testsPassed = 0;
      let testsFailed = 0;
      
      // Test 1: Verify table exists
      db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='party_templates'", (err, tables) => {
        if (err) {
          console.error('❌ Test 1 Failed: Query error:', err.message);
          testsFailed++;
          db.close();
          return reject(err);
        }
        
        if (tables.length > 0) {
          console.log('✅ Test 1: Table exists');
          testsPassed++;
        } else {
          console.log('❌ Test 1: Table does not exist');
          testsFailed++;
          db.close();
          return reject(new Error('party_templates table not found'));
        }
        
        // Test 2: Verify table structure
        db.all('PRAGMA table_info(party_templates)', (err, columns) => {
          if (err) {
            console.error('❌ Test 2 Failed:', err.message);
            testsFailed++;
            db.close();
            return reject(err);
          }
          
          const requiredFields = [
            { name: 'id', type: 'INTEGER' },
            { name: 'name', type: 'VARCHAR(200)' },
            { name: 'entity_type', type: 'VARCHAR(50)' },
            { name: 'contact_phone', type: 'VARCHAR(50)' },
            { name: 'address', type: 'TEXT' },
            { name: 'usage_count', type: 'INTEGER' },
            { name: 'last_used_at', type: 'DATETIME' },
            { name: 'created_at', type: 'DATETIME' }
          ];
          
          let structureValid = true;
          requiredFields.forEach(field => {
            const col = columns.find(c => c.name === field.name);
            if (!col) {
              console.log(`  ❌ Missing field: ${field.name}`);
              structureValid = false;
            }
          });
          
          if (structureValid) {
            console.log('✅ Test 2: Table structure is correct');
            testsPassed++;
          } else {
            console.log('❌ Test 2: Table structure is incomplete');
            testsFailed++;
          }
          
          // Test 3: Verify idx_party_template_name index
          db.all("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='party_templates' AND name='idx_party_template_name'", (err, indexes) => {
            if (err) {
              console.error('❌ Test 3 Failed:', err.message);
              testsFailed++;
            } else if (indexes.length > 0) {
              console.log('✅ Test 3: idx_party_template_name index exists');
              testsPassed++;
            } else {
              console.log('❌ Test 3: idx_party_template_name index not found');
              testsFailed++;
            }
            
            // Test 4: Verify UNIQUE constraint
            const testName = `测试模板_${Date.now()}`;
            const testEntityType = '企业';
            
            db.run(`INSERT INTO party_templates (name, entity_type, contact_phone, address, usage_count) 
                    VALUES (?, ?, '13800138000', '北京市朝阳区', 0)`, 
                    [testName, testEntityType], function(err) {
              if (err) {
                console.error('❌ Test 4 Failed: First insert error:', err.message);
                testsFailed++;
                finishTests();
                return;
              }
              
              const insertedId = this.lastID;
              
              // Try to insert duplicate
              db.run(`INSERT INTO party_templates (name, entity_type, contact_phone, address, usage_count) 
                      VALUES (?, ?, '13900139000', '上海市浦东区', 0)`, 
                      [testName, testEntityType], function(err) {
                if (err && err.message.includes('UNIQUE')) {
                  console.log('✅ Test 4: UNIQUE constraint working correctly');
                  testsPassed++;
                } else if (err) {
                  console.log('❌ Test 4: Unexpected error:', err.message);
                  testsFailed++;
                } else {
                  console.log('❌ Test 4: UNIQUE constraint not working - duplicate accepted');
                  testsFailed++;
                }
                
                // Test 5: Test basic CRUD operations
                // Read
                db.get('SELECT * FROM party_templates WHERE id = ?', [insertedId], (err, row) => {
                  if (err) {
                    console.error('❌ Test 5a Failed: Read error:', err.message);
                    testsFailed++;
                  } else if (row && row.name === testName) {
                    console.log('✅ Test 5a: Read operation successful');
                    testsPassed++;
                  } else {
                    console.log('❌ Test 5a: Read operation failed');
                    testsFailed++;
                  }
                  
                  // Update
                  db.run('UPDATE party_templates SET usage_count = usage_count + 1, last_used_at = CURRENT_TIMESTAMP WHERE id = ?', 
                         [insertedId], function(err) {
                    if (err) {
                      console.error('❌ Test 5b Failed: Update error:', err.message);
                      testsFailed++;
                    } else if (this.changes > 0) {
                      console.log('✅ Test 5b: Update operation successful');
                      testsPassed++;
                    } else {
                      console.log('❌ Test 5b: Update operation failed');
                      testsFailed++;
                    }
                    
                    // Verify update
                    db.get('SELECT usage_count FROM party_templates WHERE id = ?', [insertedId], (err, row) => {
                      if (err) {
                        console.error('❌ Test 5c Failed:', err.message);
                        testsFailed++;
                      } else if (row && row.usage_count === 1) {
                        console.log('✅ Test 5c: Usage count incremented correctly');
                        testsPassed++;
                      } else {
                        console.log('❌ Test 5c: Usage count not updated correctly');
                        testsFailed++;
                      }
                      
                      // Delete (cleanup)
                      db.run('DELETE FROM party_templates WHERE id = ?', [insertedId], function(err) {
                        if (err) {
                          console.error('❌ Test 5d Failed: Delete error:', err.message);
                          testsFailed++;
                        } else if (this.changes > 0) {
                          console.log('✅ Test 5d: Delete operation successful');
                          testsPassed++;
                        } else {
                          console.log('❌ Test 5d: Delete operation failed');
                          testsFailed++;
                        }
                        
                        finishTests();
                      });
                    });
                  });
                });
              });
            });
            
            function finishTests() {
              console.log('\n========================================');
              console.log('Test Summary');
              console.log('========================================');
              console.log(`✅ Passed: ${testsPassed}`);
              console.log(`❌ Failed: ${testsFailed}`);
              console.log(`📊 Total: ${testsPassed + testsFailed}`);
              console.log('========================================\n');
              
              db.close((err) => {
                if (err) {
                  console.error('Error closing database:', err.message);
                  return reject(err);
                }
                
                if (testsFailed === 0) {
                  console.log('🎉 All tests passed!\n');
                  resolve();
                } else {
                  console.log('⚠️  Some tests failed.\n');
                  reject(new Error(`${testsFailed} test(s) failed`));
                }
              });
            }
          });
        });
      });
    });
  });
}

// Run tests
testPartyTemplatesTable()
  .then(() => {
    console.log('✅ party_templates table is fully functional');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Tests failed:', error.message);
    process.exit(1);
  });
