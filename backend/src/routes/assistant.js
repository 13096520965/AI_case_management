const express = require('express');
const router = express.Router();
const assistantController = require('../controllers/assistantController');

/**
 * 法盾助手路由
 */

// 对话接口
router.post('/chat', assistantController.chat);

// 法律问答接口
router.post('/ask', assistantController.ask);

module.exports = router;
