/**
 * 创建测试用户用于流程模板测试
 */
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'database', 'legal_case.db');

async function createTestUser() {
  const db = new sqlite3.Database(DB_PATH);

  // 检查用户是否已存在
  db.get('SELECT * FROM users WHERE username = ?', ['testuser'], async (err, row) => {
    if (err) {
      console.error('查询用户失败:', err);
      db.close();
      return;
    }

    if (row) {
      console.log('测试用户 testuser 已存在');
      db.close();
      return;
    }

    // 创建测试用户
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    db.run(
      'INSERT INTO users (username, password, real_name, email, role) VALUES (?, ?, ?, ?, ?)',
      ['testuser', hashedPassword, '测试用户', 'testuser@example.com', 'user'],
      function(err) {
        if (err) {
          console.error('创建用户失败:', err);
        } else {
          console.log('测试用户创建成功');
          console.log('用户名: testuser');
          console.log('密码: password123');
        }
        db.close();
      }
    );
  });
}

createTestUser();
