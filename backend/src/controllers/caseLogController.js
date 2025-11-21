const CaseLog = require('../models/CaseLog');

/**
 * 获取案件日志列表
 */
exports.getCaseLogs = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { page = 1, limit = 50, action_type } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      action_type
    };

    const logs = await CaseLog.findByCaseId(caseId, options);
    const total = await CaseLog.countByCaseId(caseId, action_type);

    res.json({
      data: {
        logs,
        pagination: {
          page: options.page,
          limit: options.limit,
          total,
          totalPages: Math.ceil(total / options.limit)
        }
      }
    });
  } catch (error) {
    console.error('获取案件日志错误:', error);
    res.status(500).json({
      error: {
        message: '获取案件日志失败',
        status: 500
      }
    });
  }
};

/**
 * 获取案件操作统计
 */
exports.getCaseLogStatistics = async (req, res) => {
  try {
    const { caseId } = req.params;

    const statistics = await CaseLog.getActionStatistics(caseId);

    res.json({
      data: {
        statistics
      }
    });
  } catch (error) {
    console.error('获取案件日志统计错误:', error);
    res.status(500).json({
      error: {
        message: '获取案件日志统计失败',
        status: 500
      }
    });
  }
};

/**
 * 获取操作人的日志
 */
exports.getOperatorLogs = async (req, res) => {
  try {
    const { operatorId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const logs = await CaseLog.findByOperator(operatorId, options);

    res.json({
      data: {
        logs
      }
    });
  } catch (error) {
    console.error('获取操作人日志错误:', error);
    res.status(500).json({
      error: {
        message: '获取操作人日志失败',
        status: 500
      }
    });
  }
};

module.exports = exports;
