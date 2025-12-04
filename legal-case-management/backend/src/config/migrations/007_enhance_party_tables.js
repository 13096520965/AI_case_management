/**
 * Migration: Enhance party tables for case-party-enhancement feature
 * 增强主体表结构以支持案件主体信息展示与搜索功能
 * 
 * Changes:
 * 1. Add is_primary field to litigation_parties table
 * 2. Add indexes to litigation_parties table (name, case_id, party_type)
 * 3. Create party_history table for tracking changes
 * 4. Create party_templates table for quick input
 */

const { getDatabase } = require('../database');

async function up() {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    
    console.log('开始迁移: 增强主体表结构...');
    
    db.serialize(() => {
      try {
        // ===== 子任务 1.1: 为 litigation_parties 表添加 is_primary 字段 =====
        console.log('子任务 1.1: 添加 is_primary 字段...');
        
        // 检查字段是否已存在
        db.all("PRAGMA table_info(litigation_parties)", (err, columns) => {
          if (err) {
            console.error('检查表结构失败:', err);
            db.close();
            return reject(err);
          }
          
          const hasIsPrimary = columns.some(col => col.name === 'is_primary');
          
          if (!hasIsPrimary) {
            // 添加 is_primary 字段
            db.run(`ALTER TABLE litigation_parties ADD COLUMN is_primary BOOLEAN DEFAULT 0`, (err) => {
              if (err) {
                console.error('添加 is_primary 字段失败:', err);
                db.close();
                return reject(err);
              }
              console.log('✓ is_primary 字段添加成功');
              
              // 为现有数据设置主要当事人（每个案件每个类型的第一个主体）
              db.run(`
                UPDATE litigation_parties
                SET is_primary = 1
                WHERE id IN (
                  SELECT MIN(id)
                  FROM litigation_parties
                  GROUP BY case_id, party_type
                )
              `, (err) => {
                if (err) {
                  console.error('设置主要当事人失败:', err);
                  db.close();
                  return reject(err);
                }
                console.log('✓ 现有数据的主要当事人设置完成');
                continueWithIndexes();
              });
            });
          } else {
            console.log('✓ is_primary 字段已存在，跳过');
            continueWithIndexes();
          }
        });
        
        function continueWithIndexes() {
          // ===== 子任务 1.2: 为 litigation_parties 表添加索引 =====
          console.log('子任务 1.2: 添加索引...');
          
          db.run(`CREATE INDEX IF NOT EXISTS idx_party_name ON litigation_parties(name)`, (err) => {
            if (err) {
              console.error('创建 idx_party_name 索引失败:', err);
              db.close();
              return reject(err);
            }
            console.log('✓ idx_party_name 索引创建成功');
          });
          
          db.run(`CREATE INDEX IF NOT EXISTS idx_party_case_id ON litigation_parties(case_id)`, (err) => {
            if (err) {
              console.error('创建 idx_party_case_id 索引失败:', err);
              db.close();
              return reject(err);
            }
            console.log('✓ idx_party_case_id 索引创建成功');
          });
          
          db.run(`CREATE INDEX IF NOT EXISTS idx_party_type ON litigation_parties(party_type)`, (err) => {
            if (err) {
              console.error('创建 idx_party_type 索引失败:', err);
              db.close();
              return reject(err);
            }
            console.log('✓ idx_party_type 索引创建成功');
            continueWithPartyHistory();
          });
        }
        
        function continueWithPartyHistory() {
          // ===== 子任务 1.3: 创建 party_history 表 =====
          console.log('子任务 1.3: 创建 party_history 表...');
          
          db.run(`
            CREATE TABLE IF NOT EXISTS party_history (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              party_id INTEGER NOT NULL,
              case_id INTEGER NOT NULL,
              action VARCHAR(50) NOT NULL,
              changed_fields TEXT,
              changed_by VARCHAR(100),
              changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (party_id) REFERENCES litigation_parties(id) ON DELETE CASCADE,
              FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
            )
          `, (err) => {
            if (err) {
              console.error('创建 party_history 表失败:', err);
              db.close();
              return reject(err);
            }
            console.log('✓ party_history 表创建成功');
            
            // 创建 party_history 索引
            db.run(`CREATE INDEX IF NOT EXISTS idx_party_history_party_id ON party_history(party_id)`, (err) => {
              if (err) {
                console.error('创建 idx_party_history_party_id 索引失败:', err);
                db.close();
                return reject(err);
              }
              console.log('✓ idx_party_history_party_id 索引创建成功');
              continueWithPartyTemplates();
            });
          });
        }
        
        function continueWithPartyTemplates() {
          // ===== 子任务 1.4: 创建 party_templates 表 =====
          console.log('子任务 1.4: 创建 party_templates 表...');
          
          db.run(`
            CREATE TABLE IF NOT EXISTS party_templates (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name VARCHAR(200) NOT NULL,
              entity_type VARCHAR(50),
              contact_phone VARCHAR(50),
              address TEXT,
              usage_count INTEGER DEFAULT 0,
              last_used_at DATETIME,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              UNIQUE(name, entity_type)
            )
          `, (err) => {
            if (err) {
              console.error('创建 party_templates 表失败:', err);
              db.close();
              return reject(err);
            }
            console.log('✓ party_templates 表创建成功');
            
            // 创建 party_templates 索引
            db.run(`CREATE INDEX IF NOT EXISTS idx_party_template_name ON party_templates(name)`, (err) => {
              if (err) {
                console.error('创建 idx_party_template_name 索引失败:', err);
                db.close();
                return reject(err);
              }
              console.log('✓ idx_party_template_name 索引创建成功');
              
              db.close((err) => {
                if (err) {
                  console.error('关闭数据库连接失败:', err);
                  return reject(err);
                }
                console.log('\n✓✓✓ 所有数据库表结构增强完成 ✓✓✓\n');
                resolve();
              });
            });
          });
        }
        
      } catch (error) {
        console.error('迁移失败:', error);
        db.close();
        reject(error);
      }
    });
  });
}

async function down() {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    
    console.log('开始回滚: 移除主体表增强...');
    
    db.serialize(() => {
      try {
        // 删除 party_templates 表
        db.run('DROP TABLE IF EXISTS party_templates', (err) => {
          if (err) {
            console.error('删除 party_templates 表失败:', err);
            db.close();
            return reject(err);
          }
          console.log('✓ party_templates 表删除成功');
        });
        
        // 删除 party_history 表
        db.run('DROP TABLE IF EXISTS party_history', (err) => {
          if (err) {
            console.error('删除 party_history 表失败:', err);
            db.close();
            return reject(err);
          }
          console.log('✓ party_history 表删除成功');
        });
        
        // 删除索引
        db.run('DROP INDEX IF EXISTS idx_party_name', (err) => {
          if (err) console.error('删除 idx_party_name 索引失败:', err);
        });
        
        db.run('DROP INDEX IF EXISTS idx_party_type', (err) => {
          if (err) console.error('删除 idx_party_type 索引失败:', err);
        });
        
        // 注意: is_primary 字段和 idx_party_case_id 索引保留，因为可能已有数据依赖
        console.log('注意: is_primary 字段保留以避免数据丢失');
        
        db.close((err) => {
          if (err) {
            console.error('关闭数据库连接失败:', err);
            return reject(err);
          }
          console.log('✓ 回滚完成');
          resolve();
        });
        
      } catch (error) {
        console.error('回滚失败:', error);
        db.close();
        reject(error);
      }
    });
  });
}

module.exports = { up, down };
