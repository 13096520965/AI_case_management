const CaseLog = require('../models/CaseLog');

/**
 * 案件操作日志中间件
 * 自动记录案件相关的操作
 */
const caseLogger = (actionType, getDescription) => {
  return async (req, res, next) => {
    // 保存原始的 res.json 方法
    const originalJson = res.json.bind(res);
    
    // 重写 res.json 方法
    res.json = function(data) {
      // 只在成功响应时记录日志（状态码 2xx）
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // 异步记录日志，不阻塞响应
        setImmediate(async () => {
          try {
            const caseId = req.params.id || req.params.caseId || req.body.case_id;
            
            if (caseId) {
              const logData = {
                case_id: parseInt(caseId),
                action_type: actionType,
                action_description: typeof getDescription === 'function' 
                  ? getDescription(req, data) 
                  : getDescription,
                operator_id: req.user?.id,
                operator_name: req.user?.username || req.user?.name,
                ip_address: req.ip || req.connection.remoteAddress,
                user_agent: req.get('user-agent'),
                related_data: {
                  method: req.method,
                  path: req.path,
                  body: req.body,
                  params: req.params,
                  query: req.query
                }
              };
              
              await CaseLog.create(logData);
            }
          } catch (error) {
            console.error('记录案件日志失败:', error);
          }
        });
      }
      
      // 调用原始的 json 方法
      return originalJson(data);
    };
    
    next();
  };
};

/**
 * 手动记录案件日志
 */
const logCaseAction = async (caseId, actionType, description, operator, additionalData = {}) => {
  try {
    const logData = {
      case_id: caseId,
      action_type: actionType,
      action_description: description,
      operator_id: operator?.id,
      operator_name: operator?.username || operator?.name,
      ip_address: additionalData.ip_address,
      user_agent: additionalData.user_agent,
      related_data: additionalData.data
    };
    
    await CaseLog.create(logData);
  } catch (error) {
    console.error('记录案件日志失败:', error);
  }
};

module.exports = {
  caseLogger,
  logCaseAction
};
