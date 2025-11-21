const express = require('express');
const router = express.Router();
const collaborationController = require('../controllers/collaborationController');
const { authenticate } = require('../middleware/auth');

/**
 * 协作管理路由
 * 所有路由都需要认证
 */

// 协作成员管理
router.post('/cases/:caseId/members', authenticate, collaborationController.addMember);
router.get('/cases/:caseId/members', authenticate, collaborationController.getMembersByCaseId);
router.put('/members/:id', authenticate, collaborationController.updateMember);
router.delete('/members/:id', authenticate, collaborationController.removeMember);

// 协作任务管理
router.post('/tasks', authenticate, collaborationController.createTask);
router.get('/cases/:caseId/tasks', authenticate, collaborationController.getTasksByCaseId);
router.get('/tasks/my-tasks', authenticate, collaborationController.getTasksByUserId);
router.put('/tasks/:id', authenticate, collaborationController.updateTask);
router.delete('/tasks/:id', authenticate, collaborationController.deleteTask);

module.exports = router;
