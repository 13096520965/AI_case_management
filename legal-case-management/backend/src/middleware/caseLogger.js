/**
 * 案件操作日志中间件
 * 用于记录案件相关的操作日志
 */

const { run } = require('../config/database');

/**
 * 记录案件操作日志的中间件工厂函数
 * @param {string} actionType - 操作类型 (VIEW_CASE, UPDATE_CASE, DELETE_CASE, etc.)
 * @param {string} actionDescription - 操作描述
 * @returns {Function} Express 中间件函数
 */
const logCaseAction = (actionType, actionDescription) => {
  return async (req, res, next) => {
    // 保存原始的 res.json 方法
    const originalJson = res.json.bind(res);

    // 重写 res.json 方法以在响应成功后记录日志
    res.json = function(data) {
      // 只在成功响应时记录日志 (2xx 状态码)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // 使用 setImmediate 异步记录日志，不阻塞响应
        setImmediate(() => {
          logOperation(req, actionType, actionDescription).catch(err => {
            console.error('记录案件日志失败:', err);
          });
        });
      }
      return originalJson(data);
    };

    next();
  };
};

/**
 * 执行日志记录
 * @param {Object} req - Express 请求对象
 * @param {string} actionType - 操作类型
 * @param {string} actionDescription - 操作描述
 */
async function logOperation(req, actionType, actionDescription) {
  try {
    const caseId = req.params.id || req.params.caseId;
    if (!caseId) return;

    const operatorId = req.user?.id || null;
    const operatorName = req.user?.username || req.user?.real_name || null;
    const ipAddress = req.ip || req.connection?.remoteAddress || null;
    const userAgent = req.get('user-agent') || null;

    // 构建相关数据
    const relatedData = {
      method: req.method,
      path: req.path,
      params: req.params,
      query: req.query
    };

    // 如果是更新操作，记录更新的字段
    if (actionType === 'UPDATE_CASE' && req.body) {
      relatedData.updated_fields = Object.keys(req.body);
    }

    const sql = `
      INSERT INTO case_logs (
        case_id, action_type, action_description, operator_id, 
        operator_name, ip_address, user_agent, related_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await run(sql, [
      parseInt(caseId),
      actionType,
      actionDescription,
      operatorId,
      operatorName,
      ipAddress,
      userAgent,
      JSON.stringify(relatedData)
    ]);
  } catch (error) {
    console.error('记录案件操作日志时出错:', error);
    throw error;
  }
}

module.exports = {
  logCaseAction
};
