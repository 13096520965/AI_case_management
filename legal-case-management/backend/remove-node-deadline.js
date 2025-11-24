const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'database/legal_case.db');

/**
 * 删除 node_deadline 类型的提醒数据
 */
async function removeNodeDeadlineNotifications() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        reject(err);
        return;
      }
    });

    console.log('开始清除 node_deadline 类型的提醒数据...\n');

    db.serialize(() => {
      // 1. 查看要删除的数据
      db.all(`
        SELECT id, content, status, scheduled_time 
        FROM notification_tasks 
        WHERE task_type = 'node_deadline'
        ORDER BY id
      `, (err, rows) => {
        if (err) {
          console.error('查询失败:', err);
          db.close();
          reject(err);
          return;
        }

        console.log(`找到 ${rows.length} 条 node_deadline 类型的数据:\n`);
        rows.forEach((row, index) => {
          const contentPreview = row.content.length > 60 
            ? row.content.substring(0, 60) + '...' 
            : row.content;
          console.log(`${index + 1}. [ID: ${row.id}] ${contentPreview}`);
        });
        console.log('');

        if (rows.length === 0) {
          console.log('没有需要删除的数据');
          db.close();
          resolve({ deleted: 0 });
          return;
        }

        // 2. 删除数据
        db.run(`
          DELETE FROM notification_tasks 
          WHERE task_type = 'node_deadline'
        `, function(err) {
          if (err) {
            console.error('删除失败:', err);
            db.close();
            reject(err);
            return;
          }

          console.log(`✓ 成功删除 ${this.changes} 条 node_deadline 类型的数据\n`);

          // 3. 查看删除后的统计
          db.all(`
            SELECT task_type, COUNT(*) as count 
            FROM notification_tasks 
            GROUP BY task_type
          `, (err, stats) => {
            if (err) {
              console.error('查询统计失败:', err);
              db.close();
              reject(err);
              return;
            }

            console.log('删除后的数据统计:');
            stats.forEach(stat => {
              console.log(`  ${stat.task_type}: ${stat.count} 条`);
            });

            db.get('SELECT COUNT(*) as total FROM notification_tasks', (err, result) => {
              if (err) {
                console.error('查询总数失败:', err);
                db.close();
                reject(err);
                return;
              }

              console.log(`\n总计: ${result.total} 条提醒数据`);
              console.log('\n✓ 清除完成!');

              db.close();
              resolve({ 
                deleted: this.changes,
                total: result.total,
                stats: stats
              });
            });
          });
        });
      });
    });
  });
}

// 主函数
async function main() {
  try {
    console.log('='.repeat(60));
    console.log('清除 node_deadline 类型提醒数据');
    console.log('='.repeat(60));
    console.log('');

    await removeNodeDeadlineNotifications();

    console.log('\n' + '='.repeat(60));
    console.log('操作完成!');
    console.log('='.repeat(60));
    process.exit(0);
  } catch (error) {
    console.error('\n操作失败:', error);
    process.exit(1);
  }
}

// 运行
main();
