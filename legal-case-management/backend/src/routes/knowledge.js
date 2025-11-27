const express = require('express');
const router = express.Router();
const knowledgeController = require('../controllers/knowledgeController');
const { authenticate } = require('../middleware/auth');

/**
 * 案例知识库路由
 * 所有路由都需要身份验证
 */

// 应用身份验证中间件到所有路由
router.use(authenticate);

// 搜索路由必须在 /:id 之前定义，避免 'search' 被当作 id
router.get('/search', knowledgeController.search);

// 解析案例文件路由
router.post('/parse', knowledgeController.parseCase);

// 知识库 CRUD 路由
router.get('/', knowledgeController.getList);
router.post('/', knowledgeController.create);
router.get('/:id', knowledgeController.getById);
router.put('/:id', knowledgeController.update);
router.delete('/:id', knowledgeController.delete);

module.exports = router;
