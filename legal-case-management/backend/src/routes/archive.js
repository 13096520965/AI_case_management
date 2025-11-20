const express = require('express');
const router = express.Router();
const archiveController = require('../controllers/archiveController');
const knowledgeController = require('../controllers/knowledgeController');
const { authenticate } = require('../middleware/auth');

// 结案报告管理路由
router.post('/closure-report', authenticate, archiveController.createClosureReport);
router.get('/closure-report/:caseId', authenticate, archiveController.getClosureReportByCaseId);
router.put('/closure-report/:id', authenticate, archiveController.updateClosureReport);

// 归档包管理路由
router.post('/package', authenticate, archiveController.createArchivePackage);
router.get('/search', authenticate, archiveController.searchArchivePackages);
router.get('/package/:id', authenticate, archiveController.getArchivePackageById);

/**
 * 案例知识库路由 - 向后兼容
 * 这些路由保留用于向后兼容，将请求代理到新的知识库控制器
 * 旧的 API 路径 /api/archive/knowledge 仍然可用
 * 新的 API 路径为 /api/knowledge
 */
// 搜索路由必须在 /:id 之前定义，避免 'search' 被当作 id
router.get('/knowledge/search', authenticate, knowledgeController.search);
router.get('/knowledge/statistics', authenticate, knowledgeController.search); // 统计功能使用搜索接口

// 知识库 CRUD 路由
router.post('/knowledge', authenticate, knowledgeController.create);
router.get('/knowledge', authenticate, knowledgeController.getList);
router.get('/knowledge/:id', authenticate, knowledgeController.getById);
router.put('/knowledge/:id', authenticate, knowledgeController.update);
router.delete('/knowledge/:id', authenticate, knowledgeController.delete);

module.exports = router;
