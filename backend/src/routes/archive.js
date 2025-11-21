const express = require('express');
const router = express.Router();
const archiveController = require('../controllers/archiveController');
const { authenticate } = require('../middleware/auth');

// 结案报告管理路由
router.post('/closure-report', authenticate, archiveController.createClosureReport);
router.get('/closure-report/:caseId', authenticate, archiveController.getClosureReportByCaseId);
router.put('/closure-report/:id', authenticate, archiveController.updateClosureReport);

// 归档包管理路由
router.post('/package', authenticate, archiveController.createArchivePackage);
router.get('/search', authenticate, archiveController.searchArchivePackages);
router.get('/package/:id', authenticate, archiveController.getArchivePackageById);

// 案例知识库路由
router.post('/knowledge', authenticate, archiveController.createCaseKnowledge);
router.get('/knowledge', authenticate, archiveController.searchCaseKnowledge);
router.get('/knowledge/statistics', authenticate, archiveController.getCaseKnowledgeStatistics);
router.get('/knowledge/:id', authenticate, archiveController.getCaseKnowledgeById);
router.put('/knowledge/:id', authenticate, archiveController.updateCaseKnowledge);
router.delete('/knowledge/:id', authenticate, archiveController.deleteCaseKnowledge);

module.exports = router;
