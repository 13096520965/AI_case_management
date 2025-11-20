const CostRecord = require('../models/CostRecord');

/**
 * 创建成本记录
 */
exports.createCost = async (req, res) => {
  try {
    const costData = req.body;

    // 验证必填字段
    if (!costData.case_id || !costData.cost_type || !costData.amount) {
      return res.status(400).json({
        error: {
          message: '案件ID、成本类型和金额为必填项',
          status: 400
        }
      });
    }

    // 验证金额为正数
    if (costData.amount <= 0) {
      return res.status(400).json({
        error: {
          message: '金额必须大于0',
          status: 400
        }
      });
    }

    const costId = await CostRecord.create(costData);
    const newCost = await CostRecord.findById(costId);

    res.status(201).json({
      message: '成本记录创建成功',
      data: {
        cost: newCost
      }
    });
  } catch (error) {
    console.error('创建成本记录错误:', error);
    res.status(500).json({
      error: {
        message: '创建成本记录失败，请稍后重试',
        status: 500
      }
    });
  }
};

/**
 * 获取案件的成本列表
 */
exports.getCostsByCaseId = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { cost_type, status } = req.query;

    const filters = {};
    if (cost_type) filters.cost_type = cost_type;
    if (status) filters.status = status;

    const costs = await CostRecord.findByCaseId(caseId, filters);

    res.json({
      data: {
        costs,
        total: costs.length
      }
    });
  } catch (error) {
    console.error('获取成本列表错误:', error);
    res.status(500).json({
      error: {
        message: '获取成本列表失败',
        status: 500
      }
    });
  }
};

/**
 * 更新成本记录
 */
exports.updateCost = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // 检查成本记录是否存在
    const existingCost = await CostRecord.findById(id);
    if (!existingCost) {
      return res.status(404).json({
        error: {
          message: '成本记录不存在',
          status: 404
        }
      });
    }

    // 验证金额为正数（如果更新金额）
    if (updateData.amount !== undefined && updateData.amount <= 0) {
      return res.status(400).json({
        error: {
          message: '金额必须大于0',
          status: 400
        }
      });
    }

    const changes = await CostRecord.update(id, updateData);

    if (changes === 0) {
      return res.status(400).json({
        error: {
          message: '没有数据被更新',
          status: 400
        }
      });
    }

    const updatedCost = await CostRecord.findById(id);

    res.json({
      message: '成本记录更新成功',
      data: {
        cost: updatedCost
      }
    });
  } catch (error) {
    console.error('更新成本记录错误:', error);
    res.status(500).json({
      error: {
        message: '更新成本记录失败',
        status: 500
      }
    });
  }
};

/**
 * 删除成本记录
 */
exports.deleteCost = async (req, res) => {
  try {
    const { id } = req.params;

    // 检查成本记录是否存在
    const existingCost = await CostRecord.findById(id);
    if (!existingCost) {
      return res.status(404).json({
        error: {
          message: '成本记录不存在',
          status: 404
        }
      });
    }

    const changes = await CostRecord.delete(id);

    if (changes === 0) {
      return res.status(400).json({
        error: {
          message: '删除失败',
          status: 400
        }
      });
    }

    res.json({
      message: '成本记录删除成功'
    });
  } catch (error) {
    console.error('删除成本记录错误:', error);
    res.status(500).json({
      error: {
        message: '删除成本记录失败',
        status: 500
      }
    });
  }
};

/**
 * 费用计算器
 */
exports.calculateCost = async (req, res) => {
  try {
    const { calculationType, params } = req.body;

    if (!calculationType || !params) {
      return res.status(400).json({
        error: {
          message: '计算类型和参数为必填项',
          status: 400
        }
      });
    }

    let result = {};

    switch (calculationType) {
      case 'litigation_fee':
        result = calculateLitigationFee(params);
        break;
      case 'lawyer_fee':
        result = calculateLawyerFee(params);
        break;
      case 'preservation_fee':
        result = calculatePreservationFee(params);
        break;
      case 'penalty':
        result = calculatePenalty(params);
        break;
      default:
        return res.status(400).json({
          error: {
            message: '不支持的计算类型',
            status: 400
          }
        });
    }

    res.json({
      data: {
        calculationType,
        result
      }
    });
  } catch (error) {
    console.error('费用计算错误:', error);
    res.status(500).json({
      error: {
        message: error.message || '费用计算失败',
        status: 500
      }
    });
  }
};

/**
 * 成本统计分析
 */
exports.getCostAnalytics = async (req, res) => {
  try {
    const { caseId } = req.params;

    // 获取案件总成本
    const totalCost = await CostRecord.getTotalCost(caseId);

    // 获取按类型统计的成本
    const costByType = await CostRecord.getCostByType(caseId);

    // 计算各类成本占比
    const costDistribution = costByType.map(item => ({
      cost_type: item.cost_type,
      total: item.total,
      count: item.count,
      percentage: totalCost > 0 ? ((item.total / totalCost) * 100).toFixed(2) : 0
    }));

    // 获取所有成本记录用于趋势分析
    const allCosts = await CostRecord.findByCaseId(caseId);

    // 按月份统计成本趋势
    const costTrend = generateCostTrend(allCosts);

    res.json({
      data: {
        totalCost,
        costDistribution,
        costTrend,
        summary: {
          totalRecords: allCosts.length,
          paidAmount: allCosts
            .filter(c => c.status === 'paid')
            .reduce((sum, c) => sum + c.amount, 0),
          unpaidAmount: allCosts
            .filter(c => c.status === 'unpaid')
            .reduce((sum, c) => sum + c.amount, 0)
        }
      }
    });
  } catch (error) {
    console.error('获取成本分析错误:', error);
    res.status(500).json({
      error: {
        message: '获取成本分析失败',
        status: 500
      }
    });
  }
};

/**
 * 诉讼费计算（按标的额分段计算）
 * 参考《诉讼费用交纳办法》
 */
function calculateLitigationFee(params) {
  const { targetAmount, caseType = '财产案件' } = params;

  if (!targetAmount || targetAmount < 0) {
    throw new Error('标的额必须为非负数');
  }

  let fee = 0;

  if (caseType === '财产案件') {
    if (targetAmount <= 10000) {
      fee = 50;
    } else if (targetAmount <= 100000) {
      fee = (targetAmount - 10000) * 0.025 + 50;
    } else if (targetAmount <= 200000) {
      fee = (targetAmount - 100000) * 0.02 + 2300;
    } else if (targetAmount <= 500000) {
      fee = (targetAmount - 200000) * 0.015 + 4300;
    } else if (targetAmount <= 1000000) {
      fee = (targetAmount - 500000) * 0.01 + 8800;
    } else if (targetAmount <= 2000000) {
      fee = (targetAmount - 1000000) * 0.009 + 13800;
    } else if (targetAmount <= 5000000) {
      fee = (targetAmount - 2000000) * 0.008 + 22800;
    } else if (targetAmount <= 10000000) {
      fee = (targetAmount - 5000000) * 0.007 + 46800;
    } else if (targetAmount <= 20000000) {
      fee = (targetAmount - 10000000) * 0.006 + 81800;
    } else {
      fee = (targetAmount - 20000000) * 0.005 + 141800;
    }
  } else if (caseType === '非财产案件') {
    // 非财产案件固定收费
    fee = params.fixedFee || 300;
  }

  return {
    targetAmount,
    caseType,
    litigationFee: Math.round(fee * 100) / 100,
    breakdown: `标的额: ${targetAmount}元, 诉讼费: ${Math.round(fee * 100) / 100}元`
  };
}

/**
 * 律师费计算
 * 支持三种计费方式：标的额比例、固定收费、按时计费
 */
function calculateLawyerFee(params) {
  const { feeType, targetAmount, fixedAmount, hourlyRate, hours, percentage } = params;

  let fee = 0;
  let breakdown = '';

  switch (feeType) {
    case 'percentage':
      if (!targetAmount || !percentage) {
        throw new Error('标的额和比例为必填项');
      }
      fee = targetAmount * (percentage / 100);
      breakdown = `标的额: ${targetAmount}元 × ${percentage}% = ${fee}元`;
      break;

    case 'fixed':
      if (!fixedAmount) {
        throw new Error('固定金额为必填项');
      }
      fee = fixedAmount;
      breakdown = `固定收费: ${fee}元`;
      break;

    case 'hourly':
      if (!hourlyRate || !hours) {
        throw new Error('时薪和工时为必填项');
      }
      fee = hourlyRate * hours;
      breakdown = `时薪: ${hourlyRate}元 × ${hours}小时 = ${fee}元`;
      break;

    default:
      throw new Error('不支持的计费方式');
  }

  return {
    feeType,
    lawyerFee: Math.round(fee * 100) / 100,
    breakdown
  };
}

/**
 * 保全费计算
 */
function calculatePreservationFee(params) {
  const { preservationAmount } = params;

  if (!preservationAmount || preservationAmount < 0) {
    throw new Error('保全金额必须为非负数');
  }

  let fee = 0;

  if (preservationAmount <= 1000) {
    fee = 30;
  } else if (preservationAmount <= 100000) {
    fee = preservationAmount * 0.01 + 20;
  } else {
    fee = (preservationAmount - 100000) * 0.005 + 1020;
    if (fee > 5000) {
      fee = 5000; // 保全费最高5000元
    }
  }

  return {
    preservationAmount,
    preservationFee: Math.round(fee * 100) / 100,
    breakdown: `保全金额: ${preservationAmount}元, 保全费: ${Math.round(fee * 100) / 100}元`
  };
}

/**
 * 违约金计算（支持复利）
 */
function calculatePenalty(params) {
  const {
    principal,
    rate,
    startDate,
    endDate,
    compoundInterest = false,
    compoundFrequency = 'monthly'
  } = params;

  if (!principal || !rate || !startDate || !endDate) {
    throw new Error('本金、利率、起始日期和结束日期为必填项');
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

  if (days < 0) {
    throw new Error('结束日期必须晚于起始日期');
  }

  let penalty = 0;

  if (!compoundInterest) {
    // 简单利息
    penalty = principal * (rate / 100) * (days / 365);
  } else {
    // 复利计算
    let periods = 0;
    switch (compoundFrequency) {
      case 'daily':
        periods = days;
        penalty = principal * Math.pow(1 + rate / 100 / 365, periods) - principal;
        break;
      case 'monthly':
        periods = days / 30;
        penalty = principal * Math.pow(1 + rate / 100 / 12, periods) - principal;
        break;
      case 'yearly':
        periods = days / 365;
        penalty = principal * Math.pow(1 + rate / 100, periods) - principal;
        break;
      default:
        throw new Error('不支持的复利频率');
    }
  }

  return {
    principal,
    rate,
    days,
    compoundInterest,
    compoundFrequency,
    penalty: Math.round(penalty * 100) / 100,
    total: Math.round((principal + penalty) * 100) / 100,
    breakdown: `本金: ${principal}元, 利率: ${rate}%, 天数: ${days}天, ${
      compoundInterest ? '复利' : '单利'
    }, 违约金: ${Math.round(penalty * 100) / 100}元`
  };
}

/**
 * 生成成本趋势数据（按月统计）
 */
function generateCostTrend(costs) {
  const trendMap = {};

  costs.forEach(cost => {
    const date = new Date(cost.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!trendMap[monthKey]) {
      trendMap[monthKey] = {
        month: monthKey,
        total: 0,
        count: 0
      };
    }

    trendMap[monthKey].total += cost.amount;
    trendMap[monthKey].count += 1;
  });

  return Object.values(trendMap).sort((a, b) => a.month.localeCompare(b.month));
}

module.exports = exports;
