const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'database/legal_case.db');

/**
 * 清理提醒数据
 */
async function cleanNotificationData() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        reject(err);
        return;
      }
    });

    console.log('开始清理提醒数据...\n');

    db.serialize(() => {
      // 1. 查看当前数据统计
      db.all(`
        SELECT task_type, status, COUNT(*) as count 
        FROM notification_tasks 
        GROUP BY task_type, status
      `, (err, stats) => {
        if (err) {
          console.error('查询统计失败:', err);
          db.close();
          reject(err);
          return;
        }

        console.log('=== 清理前数据统计 ===');
        stats.forEach(stat => {
          console.log(`${stat.task_type} (${stat.status}): ${stat.count} 条`);
        });
        console.log('');

        // 2. 删除重复的超期预警（保留最新的）
        console.log('清理重复的超期预警...');
        db.run(`
          DELETE FROM notification_tasks 
          WHERE id NOT IN (
            SELECT MAX(id) 
            FROM notification_tasks 
            WHERE task_type IN ('node_overdue', 'overdue')
            GROUP BY related_id, related_type
          ) AND task_type IN ('node_overdue', 'overdue')
        `, function(err) {
          if (err) {
            console.error('删除重复数据失败:', err);
            db.close();
            reject(err);
            return;
          }
          console.log(`✓ 删除了 ${this.changes} 条重复的超期预警\n`);

          // 3. 删除过期的待处理提醒（超过30天的pending状态）
          console.log('清理过期的待处理提醒...');
          db.run(`
            DELETE FROM notification_tasks 
            WHERE status = 'pending' 
            AND datetime(scheduled_time) < datetime('now', '-30 days')
          `, function(err) {
            if (err) {
              console.error('删除过期数据失败:', err);
              db.close();
              reject(err);
              return;
            }
            console.log(`✓ 删除了 ${this.changes} 条过期的待处理提醒\n`);

            // 4. 保留一些测试数据（最近的10条不同类型的提醒）
            console.log('保留测试数据...');
            db.all(`
              SELECT id, task_type, content, status, scheduled_time 
              FROM notification_tasks 
              ORDER BY id DESC 
              LIMIT 20
            `, (err, testData) => {
              if (err) {
                console.error('查询测试数据失败:', err);
                db.close();
                reject(err);
                return;
              }

              console.log('保留的测试数据:');
              testData.forEach(item => {
                console.log(`  - [${item.id}] ${item.task_type}: ${item.content.substring(0, 50)}...`);
              });
              console.log('');

              // 5. 查看清理后的统计
              db.all(`
                SELECT task_type, status, COUNT(*) as count 
                FROM notification_tasks 
                GROUP BY task_type, status
              `, (err, finalStats) => {
                if (err) {
                  console.error('查询最终统计失败:', err);
                  db.close();
                  reject(err);
                  return;
                }

                console.log('=== 清理后数据统计 ===');
                finalStats.forEach(stat => {
                  console.log(`${stat.task_type} (${stat.status}): ${stat.count} 条`);
                });

                // 6. 总计
                db.get('SELECT COUNT(*) as total FROM notification_tasks', (err, result) => {
                  if (err) {
                    console.error('查询总数失败:', err);
                    db.close();
                    reject(err);
                    return;
                  }

                  console.log(`\n总计: ${result.total} 条提醒数据`);
                  console.log('\n✓ 清理完成!');

                  db.close();
                  resolve({
                    success: true,
                    total: result.total,
                    stats: finalStats
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

/**
 * 创建一些格式正确的测试数据
 */
async function createTestData() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        reject(err);
        return;
      }
    });

    console.log('\n创建测试数据...\n');

    const testNotifications = [
      {
        related_id: 1,
        related_type: 'process_node',
        task_type: 'deadline',
        scheduled_time: new Date().toISOString(),
        content: '节点"立案审查"即将到期，请及时处理',
        status: 'unread'
      },
      {
        related_id: 2,
        related_type: 'process_node',
        task_type: 'overdue',
        scheduled_time: new Date().toISOString(),
        content: '节点"证据收集"已超期，请尽快处理',
        status: 'unread'
      },
      {
        related_id: 3,
        related_type: 'case',
        task_type: 'payment',
        scheduled_time: new Date().toISOString(),
        content: '案件费用待支付，金额：5000元',
        status: 'unread'
      },
      {
        related_id: 4,
        related_type: 'task',
        task_type: 'task',
        scheduled_time: new Date().toISOString(),
        content: '协作任务"准备开庭材料"待完成',
        status: 'unread'
      },
      {
        related_id: 5,
        related_type: 'system',
        task_type: 'system',
        scheduled_time: new Date().toISOString(),
        content: '系统维护通知：将于本周六进行系统升级',
        status: 'unread'
      }
    ];

    let completed = 0;
    testNotifications.forEach((notification, index) => {
      db.run(`
        INSERT INTO notification_tasks 
        (related_id, related_type, task_type, scheduled_time, content, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        notification.related_id,
        notification.related_type,
        notification.task_type,
        notification.scheduled_time,
        notification.content,
        notification.status
      ], function(err) {
        if (err) {
          console.error(`创建测试数据 ${index + 1} 失败:`, err.message);
        } else {
          console.log(`✓ 创建测试数据 ${index + 1}: ${notification.content}`);
        }

        completed++;
        if (completed === testNotifications.length) {
          console.log(`\n✓ 创建了 ${testNotifications.length} 条测试数据`);
          db.close();
          resolve({ success: true, count: testNotifications.length });
        }
      });
    });
  });
}

// 主函数
async function main() {
  try {
    console.log('='.repeat(60));
    console.log('提醒数据清理工具');
    console.log('='.repeat(60));
    console.log('');

    // 1. 清理数据
    await cleanNotificationData();

    // 2. 创建测试数据
    await createTestData();

    console.log('\n' + '='.repeat(60));
    console.log('所有操作完成!');
    console.log('='.repeat(60));
    process.exit(0);
  } catch (error) {
    console.error('\n操作失败:', error);
    process.exit(1);
  }
}

// 运行
main();
