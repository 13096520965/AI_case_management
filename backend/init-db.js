const { initializeDatabase } = require('./src/config/initDatabase');

initializeDatabase()
  .then(() => {
    console.log('数据库初始化成功');
    process.exit(0);
  })
  .catch((error) => {
    console.error('数据库初始化失败:', error);
    process.exit(1);
  });
