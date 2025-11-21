const EvidenceOperationLog = require('../models/EvidenceOperationLog');

/**
 * 记录证据操作日志的中间件工厂函数
 * @param {string} operationType - 操作类型 (view, download, upload, update, delete)
 * @returns {Function} Express 中间件函数
 */
const logEvidenceOperation = (operationType) => {
  return async (req, res, next) => {
    // 保存原始的 res.json 和 res.send 方法
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    // 重写 res.json 方法以在响应成功后记录日志
    res.json = function(data) {
      // 只在成功响应时记录日志 (2xx 状态码)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        logOperation(req, operationType).catch(err => {
          console.error('记录操作日志失败:', err);
        });
      }
      return originalJson(data);
    };

    // 重写 res.send 方法以处理文件下载
    res.send = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        logOperation(req, operationType).catch(err => {
          console.error('记录操作日志失败:', err);
        });
      }
      return originalSend(data);
    };

    next();
  };
};

/**
 * 执行日志记录
 * @param {Object} req - Express 请求对象
 * @param {string} operationType - 操作类型
 */
async function logOperation(req, operationType) {
  try {
    const evidenceId = req.params.id;
    if (!evidenceId) return;

    const operator = req.user?.username || 'unknown';
    const ipAddress = req.ip || req.connection.remoteAddress;

    // 构建详细信息
    let details = {};
    if (operationType === 'update') {
      details = { updated_fields: Object.keys(req.body) };
    } else if (operationType === 'upload') {
      details = { file_name: req.file?.originalname };
    }

    await EvidenceOperationLog.create({
      evidence_id: parseInt(evidenceId),
      operation_type: operationType,
      operator: operator,
      ip_address: ipAddress,
      details: JSON.stringify(details)
    });
  } catch (error) {
    console.error('记录操作日志时出错:', error);
  }
}

module.exports = {
  logEvidenceOperation
};
