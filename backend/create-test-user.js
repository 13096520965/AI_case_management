/**
 * 创建测试用户
 */
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'database', 'legal_case.db');

async function createTestUser() {
  const db = new sqlite3.Database(DB_PATH);

  // 检查用户是否已存在
  db.get('SELECT * FROM users WHERE username = ?', ['admin'], async (err, row) => {
    if (err) {
      console.error('查询用户失败:', err);
      db.close();
      return;
    }

    if (row) {
      console.log('测试用户已存在');
      db.close();
      return;
    }

    // 创建测试用户
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    db.run(
      'INSERT INTO users (username, password, real_name, email, role) VALUES (?, ?, ?, ?, ?)',
      ['admin', hashedPassword, '管理员', 'admin@example.com', 'admin'],
      function(err) {
        if (err) {
          console.error('创建用户失败:', err);
        } else {
          console.log('测试用户创建成功');
          console.log('用户名: admin');
          console.log('密码: admin123');
        }
        db.close();
      }
    );
  });
}

createTestUser();

