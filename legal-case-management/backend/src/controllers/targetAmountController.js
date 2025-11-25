const TargetAmountDetail = require('../models/TargetAmountDetail');
const PaymentRecord = require('../models/PaymentRecord');
const Case = require('../models/Case');

/**
 * 获取标的处理详情（包含汇款记录）
 */
exports.getTargetAmountDetail = async (req, res) => {
  try {
    const { caseId } = req.params;

    // 验证案件是否存在
    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({
        error: {
          message: '案件不存在',
          status: 404
        }
      });
    }

    // 获取标的处理详情
    let detail = await TargetAmountDetail.findByCaseId(caseId);
    
    // 如果不存在，创建默认记录
    if (!detail) {
      const detailId = await TargetAmountDetail.create({
        case_id: caseId,
        total_amount: caseData.target_amount || 0,
        penalty_amount: 0,
        litigation_cost: 0,
        cost_bearer: '',
        notes: ''
      });
      detail = await TargetAmountDetail.findByCaseId(caseId);
    }

    // 获取汇款记录
    const payments = await PaymentRecord.findByCaseId(caseId);

    // 计算已确认的回收金额
    const recoveredAmount = await PaymentRecord.sumByCaseId(caseId, '已确认');

    res.json({
      data: {
        detail,
        payments,
        summary: {
          totalAmount: detail.total_amount,
          recoveredAmount,
          remainingAmount: detail.total_amount - recoveredAmount
        }
      }
    });
  } catch (error) {
    console.error('获取标的处理详情错误:', error);
    res.status(500).json({
      error: {
        message: '获取标的处理详情失败',
        status: 500
      }
    });
  }
};

/**
 * 更新标的处理详情
 */
exports.updateTargetAmountDetail = async (req, res) => {
  try {
    const { caseId } = req.params;
    const updateData = req.body;

    // 验证案件是否存在
    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({
        error: {
          message: '案件不存在',
          status: 404
        }
      });
    }

    // 检查是否存在标的处理详情
    let detail = await TargetAmountDetail.findByCaseId(caseId);
    
    if (!detail) {
      // 创建新记录
      await TargetAmountDetail.create({
        case_id: caseId,
        ...updateData
      });
    } else {
      // 更新现有记录
      await TargetAmountDetail.update(caseId, updateData);
    }

    // 获取更新后的数据
    detail = await TargetAmountDetail.findByCaseId(caseId);

    res.json({
      message: '标的处理详情更新成功',
      data: {
        detail
      }
    });
  } catch (error) {
    console.error('更新标的处理详情错误:', error);
    res.status(500).json({
      error: {
        message: '更新标的处理详情失败',
        status: 500
      }
    });
  }
};

/**
 * 创建汇款记录
 */
exports.createPaymentRecord = async (req, res) => {
  try {
    const { caseId } = req.params;
    const paymentData = req.body;

    // 验证必填字段
    if (!paymentData.payment_date || !paymentData.amount || !paymentData.payer || !paymentData.payee) {
      return res.status(400).json({
        error: {
          message: '汇款日期、金额、付款方和收款方为必填项',
          status: 400
        }
      });
    }

    // 验证案件是否存在
    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({
        error: {
          message: '案件不存在',
          status: 404
        }
      });
    }

    const paymentId = await PaymentRecord.create({
      case_id: caseId,
      ...paymentData
    });

    const newPayment = await PaymentRecord.findById(paymentId);

    res.status(201).json({
      message: '汇款记录创建成功',
      data: {
        payment: newPayment
      }
    });
  } catch (error) {
    console.error('创建汇款记录错误:', error);
    res.status(500).json({
      error: {
        message: '创建汇款记录失败',
        status: 500
      }
    });
  }
};

/**
 * 更新汇款记录
 */
exports.updatePaymentRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // 检查记录是否存在
    const existingPayment = await PaymentRecord.findById(id);
    if (!existingPayment) {
      return res.status(404).json({
        error: {
          message: '汇款记录不存在',
          status: 404
        }
      });
    }

    const changes = await PaymentRecord.update(id, updateData);

    if (changes === 0) {
      return res.status(400).json({
        error: {
          message: '没有数据被更新',
          status: 400
        }
      });
    }

    const updatedPayment = await PaymentRecord.findById(id);

    res.json({
      message: '汇款记录更新成功',
      data: {
        payment: updatedPayment
      }
    });
  } catch (error) {
    console.error('更新汇款记录错误:', error);
    res.status(500).json({
      error: {
        message: '更新汇款记录失败',
        status: 500
      }
    });
  }
};

/**
 * 删除汇款记录
 */
exports.deletePaymentRecord = async (req, res) => {
  try {
    const { id } = req.params;

    // 检查记录是否存在
    const existingPayment = await PaymentRecord.findById(id);
    if (!existingPayment) {
      return res.status(404).json({
        error: {
          message: '汇款记录不存在',
          status: 404
        }
      });
    }

    await PaymentRecord.delete(id);

    res.json({
      message: '汇款记录删除成功'
    });
  } catch (error) {
    console.error('删除汇款记录错误:', error);
    res.status(500).json({
      error: {
        message: '删除汇款记录失败',
        status: 500
      }
    });
  }
};
