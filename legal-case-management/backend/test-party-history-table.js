/**
 * Test script for party_history table functionality
 * 测试 party_history 表功能
 */

const { getDatabase } = require('./src/config/database');

async function testPartyHistoryTable() {
  console.log('========================================');
  console.log('测试 party_history 表功能');
  console.log('========================================\n');
  
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Test 1: Verify table exists
      console.log('测试 1: 验证表存在...');
      db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='party_history'", (err, tables) => {
        if (err) {
          console.error('✗ 查询失败:', err.message);
          db.close();
          return reject(err);
        }
        
        if (tables.length === 0) {
          console.error('✗ party_history 表不存在');
          db.close();
          return reject(new Error('party_history table does not exist'));
        }
        
        console.log('✓ party_history 表存在\n');
        
        // Test 2: Verify table structure
        console.log('测试 2: 验证表结构...');
        db.all('PRAGMA table_info(party_history)', (err, columns) => {
          if (err) {
            console.error('✗ 获取表结构失败:', err.message);
            db.close();
            return reject(err);
          }
          
          const requiredColumns = ['id', 'party_id', 'case_id', 'action', 'changed_fields', 'changed_by', 'changed_at'];
          const actualColumns = columns.map(col => col.name);
          
          const missingColumns = requiredColumns.filter(col => !actualColumns.includes(col));
          
          if (missingColumns.length > 0) {
            console.error('✗ 缺少必需字段:', missingColumns.join(', '));
            db.close();
            return reject(new Error(`Missing columns: ${missingColumns.join(', ')}`));
          }
          
          console.log('✓ 所有必需字段都存在:');
          columns.forEach(col => {
            console.log(`  - ${col.name} (${col.type})`);
          });
          console.log();
          
          // Test 3: Verify index exists
          console.log('测试 3: 验证索引存在...');
          db.all("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='party_history' AND name='idx_party_history_party_id'", (err, indexes) => {
            if (err) {
              console.error('✗ 查询索引失败:', err.message);
              db.close();
              return reject(err);
            }
            
            if (indexes.length === 0) {
              console.error('✗ idx_party_history_party_id 索引不存在');
              db.close();
              return reject(new Error('idx_party_history_party_id index does not exist'));
            }
            
            console.log('✓ idx_party_history_party_id 索引存在\n');
            
            // Test 4: Test insert operation
            console.log('测试 4: 测试插入操作...');
            db.run(`
              INSERT INTO party_history (party_id, case_id, action, changed_fields, changed_by)
              VALUES (?, ?, ?, ?, ?)
            `, [999, 999, 'TEST', '{"test": "data"}', 'test_user'], function(err) {
              if (err) {
                console.error('✗ 插入测试数据失败:', err.message);
                db.close();
                return reject(err);
              }
              
              const insertedId = this.lastID;
              console.log(`✓ 成功插入测试记录 (ID: ${insertedId})\n`);
              
              // Test 5: Test query operation
              console.log('测试 5: 测试查询操作...');
              db.get('SELECT * FROM party_history WHERE id = ?', [insertedId], (err, row) => {
                if (err) {
                  console.error('✗ 查询测试数据失败:', err.message);
                  db.close();
                  return reject(err);
                }
                
                if (!row) {
                  console.error('✗ 未找到测试记录');
                  db.close();
                  return reject(new Error('Test record not found'));
                }
                
                console.log('✓ 成功查询测试记录:');
                console.log(`  - party_id: ${row.party_id}`);
                console.log(`  - case_id: ${row.case_id}`);
                console.log(`  - action: ${row.action}`);
                console.log(`  - changed_fields: ${row.changed_fields}`);
                console.log(`  - changed_by: ${row.changed_by}`);
                console.log(`  - changed_at: ${row.changed_at}\n`);
                
                // Test 6: Clean up test data
                console.log('测试 6: 清理测试数据...');
                db.run('DELETE FROM party_history WHERE id = ?', [insertedId], (err) => {
                  if (err) {
                    console.error('✗ 删除测试数据失败:', err.message);
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
                    console.log('✓✓✓ 所有测试通过！');
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
}

// Run tests
testPartyHistoryTable()
  .then(() => {
    console.log('测试成功完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n测试失败:', error.message);
    process.exit(1);
  });
