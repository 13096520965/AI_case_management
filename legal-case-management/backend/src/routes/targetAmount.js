const express = require('express');
const router = express.Router();
const targetAmountController = require('../controllers/targetAmountController');
const { authenticate } = require('../middleware/auth');

// 所有路由都需要认证
router.use(authenticate);

// 标的处理详情路由
router.get('/cases/:caseId/target-amount', targetAmountController.getTargetAmountDetail);
router.put('/cases/:caseId/target-amount', targetAmountController.updateTargetAmountDetail);

// 汇款记录路由
router.post('/cases/:caseId/payments', targetAmountController.createPaymentRecord);
router.put('/payments/:id', targetAmountController.updatePaymentRecord);
router.delete('/payments/:id', targetAmountController.deletePaymentRecord);

module.exports = router;
