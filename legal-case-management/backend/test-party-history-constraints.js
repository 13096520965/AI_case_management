/**
 * Test script for party_history table foreign key constraints
 * 测试 party_history 表外键约束
 */

const { getDatabase } = require('./src/config/database');

async function testForeignKeyConstraints() {
  console.log('========================================');
  console.log('测试 party_history 表外键约束');
  console.log('========================================\n');
  
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Enable foreign keys
      db.run('PRAGMA foreign_keys = ON', (err) => {
        if (err) {
          console.error('✗ 启用外键约束失败:', err.message);
          db.close();
          return reject(err);
        }
        
        console.log('✓ 外键约束已启用\n');
        
        // Test 1: Create a test case
        console.log('测试 1: 创建测试案件...');
        db.run(`
          INSERT INTO cases (case_number, internal_number, case_type, case_cause, court, status)
          VALUES (?, ?, ?, ?, ?, ?)
        `, ['TEST-2025-001', 'INT-TEST-001', '民事', '测试案由', '测试法院', 'active'], function(err) {
          if (err) {
            console.error('✗ 创建测试案件失败:', err.message);
            db.close();
            return reject(err);
          }
          
          const caseId = this.lastID;
          console.log(`✓ 测试案件创建成功 (ID: ${caseId})\n`);
          
          // Test 2: Create a test party
          console.log('测试 2: 创建测试主体...');
          db.run(`
            INSERT INTO litigation_parties (case_id, party_type, entity_type, name, contact_phone)
            VALUES (?, ?, ?, ?, ?)
          `, [caseId, '原告', '个人', '测试主体', '13800138000'], function(err) {
            if (err) {
              console.error('✗ 创建测试主体失败:', err.message);
              db.close();
              return reject(err);
            }
            
            const partyId = this.lastID;
            console.log(`✓ 测试主体创建成功 (ID: ${partyId})\n`);
            
            // Test 3: Create party history record
            console.log('测试 3: 创建主体历史记录...');
            db.run(`
              INSERT INTO party_history (party_id, case_id, action, changed_fields, changed_by)
              VALUES (?, ?, ?, ?, ?)
            `, [partyId, caseId, 'CREATE', '{"name": "测试主体"}', 'test_user'], function(err) {
              if (err) {
                console.error('✗ 创建历史记录失败:', err.message);
                db.close();
                return reject(err);
              }
              
              const historyId = this.lastID;
              console.log(`✓ 历史记录创建成功 (ID: ${historyId})\n`);
              
              // Test 4: Verify cascade delete on party deletion
              console.log('测试 4: 验证删除主体时级联删除历史记录...');
              db.run('DELETE FROM litigation_parties WHERE id = ?', [partyId], (err) => {
                if (err) {
                  console.error('✗ 删除主体失败:', err.message);
                  db.close();
                  return reject(err);
                }
                
                console.log('✓ 主体删除成功\n');
                
                // Check if history record was also deleted
                db.get('SELECT * FROM party_history WHERE id = ?', [historyId], (err, row) => {
                  if (err) {
                    console.error('✗ 查询历史记录失败:', err.message);
                    db.close();
                    return reject(err);
                  }
                  
                  if (row) {
                    console.error('✗ 历史记录未被级联删除');
                    db.close();
                    return reject(new Error('History record was not cascade deleted'));
                  }
                  
                  console.log('✓ 历史记录已被级联删除\n');
                  
                  // Clean up test case
                  console.log('测试 5: 清理测试数据...');
                  db.run('DELETE FROM cases WHERE id = ?', [caseId], (err) => {
                    if (err) {
                      console.error('✗ 清理测试案件失败:', err.message);
                      db.close();
                      return reject(err);
                    }
                    
                    console.log('✓ 测试数据清理完成\n');
                    
                    db.close((err) => {
                      if (err) {
                        console.error('✗ 关闭数据库连接失败:', err.message);
                        return reject(err);
                      }
                      
                      console.log('========================================');
                      console.log('✓✓✓ 所有外键约束测试通过！');
                      console.log('========================================\n');
                      resolve();
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
}

// Run tests
testForeignKeyConstraints()
  .then(() => {
    console.log('测试成功完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n测试失败:', error.message);
    process.exit(1);
  });
