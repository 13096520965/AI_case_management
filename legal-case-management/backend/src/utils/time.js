/**
 * 后端统一的北京时间工具
 * 提供 YYYY-MM-DD HH:mm:ss 格式的时间字符串，用于写入数据库
 */
function pad(num) {
  return String(num).padStart(2, '0');
}

/**
 * 将 Date 或时间毫秒数格式化为北京时间字符串: YYYY-MM-DD HH:mm:ss
 * 注意：不会依赖系统时区，而是通过将 UTC 时间加 8 小时来得到北京时间
 */
function formatToBeijing(dateInput) {
  const d = (dateInput instanceof Date) ? dateInput : new Date(dateInput);
  // 统一以 UTC 毫秒为基准（Date#getTime 已经返回 UTC 毫秒），直接使用 getTime()
  const utcMs = d.getTime();
  // 加 8 小时得到北京时间的毫秒数
  const beijingMs = utcMs + 8 * 60 * 60 * 1000;
  const beijing = new Date(beijingMs);
  // 使用 UTC getter 安全地读取各字段，构造北京时间字符串
  const Y = beijing.getUTCFullYear();
  const M = pad(beijing.getUTCMonth() + 1);
  const D = pad(beijing.getUTCDate());
  const h = pad(beijing.getUTCHours());
  const m = pad(beijing.getUTCMinutes());
  const s = pad(beijing.getUTCSeconds());
  return `${Y}-${M}-${D} ${h}:${m}:${s}`;
}

/** 返回当前时间的北京时间字符串（YYYY-MM-DD HH:mm:ss） */
function beijingNow() {
  return formatToBeijing(new Date());
}


/**
 * 将毫秒时间戳格式化为北京时间字符串
 * @param {number} ms
 */
function beijingFromMs(ms) {
  return formatToBeijing(new Date(ms));
}

module.exports = {
  formatToBeijing,
  beijingNow,
  beijingFromMs
};
