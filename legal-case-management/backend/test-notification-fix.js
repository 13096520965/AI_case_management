const enhancedScheduler = require('./src/services/notificationSchedulerEnhanced');

async function test() {
  try {
    console.log('=== 手动触发提醒检查 ===\n');
    await enhancedScheduler.manualCheck();
    console.log('\n=== 检查完成 ===');
  } catch (error) {
    console.error('测试失败:', error);
  }
}

test();
