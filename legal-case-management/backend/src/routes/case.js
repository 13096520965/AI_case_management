const express = require('express');
const router = express.Router();
const caseController = require('../controllers/caseController');
const partyController = require('../controllers/partyController');
const processNodeController = require('../controllers/processNodeController');
const { getEvidenceByCaseId, getCaseEvidenceLogs } = require('../controllers/evidenceController');
const { getDocumentsByCaseId, getDocumentStatistics } = require('../controllers/documentController');
const costController = require('../controllers/costController');
const { authenticate } = require('../middleware/auth');
const { logCaseAction } = require('../middleware/caseLogger');

// 案件基础 CRUD 接口

/**
 * @route   POST /api/cases
 * @desc    创建案件
 * @access  Private
 */
router.post('/', authenticate, logCaseAction('CREATE_CASE', '创建案件'), caseController.createCase);

/**
 * @route   GET /api/cases
 * @desc    获取案件列表（支持分页、筛选、搜索）
 * @access  Private
 */
router.get('/', authenticate, caseController.getCases);

/**
 * @route   GET /api/cases/:id
 * @desc    获取案件详情
 * @access  Private
 */
router.get('/:id', authenticate, logCaseAction('VIEW_CASE', '查看案件详情'), caseController.getCaseById);

/**
 * @route   PUT /api/cases/:id
 * @desc    更新案件信息
 * @access  Private
 */
router.put('/:id', authenticate, logCaseAction('UPDATE_CASE', '更新案件信息'), caseController.updateCase);

/**
 * @route   DELETE /api/cases/:id
 * @desc    删除案件
 * @access  Private
 */
router.delete('/:id', authenticate, logCaseAction('DELETE_CASE', '删除案件'), caseController.deleteCase);

// 诉讼主体管理接口

/**
 * @route   POST /api/cases/:caseId/parties
 * @desc    添加诉讼主体
 * @access  Private
 */
router.post('/:caseId/parties', authenticate, partyController.createParty);

/**
 * @route   GET /api/cases/:caseId/parties
 * @desc    获取诉讼主体列表
 * @access  Private
 */
router.get('/:caseId/parties', authenticate, partyController.getPartiesByCaseId);

// 流程节点管理接口

/**
 * @route   POST /api/cases/:caseId/nodes
 * @desc    创建流程节点
 * @access  Private
 */
router.post('/:caseId/nodes', authenticate, processNodeController.createNode);

/**
 * @route   GET /api/cases/:caseId/nodes
 * @desc    获取流程节点列表
 * @access  Private
 */
router.get('/:caseId/nodes', authenticate, processNodeController.getNodesByCaseId);

// 证据管理接口

/**
 * @route   GET /api/cases/:caseId/evidence
 * @desc    获取证据列表
 * @access  Private
 */
router.get('/:caseId/evidence', authenticate, getEvidenceByCaseId);

/**
 * @route   GET /api/cases/:caseId/evidence/logs
 * @desc    获取案件所有证据的操作日志
 * @access  Private
 */
router.get('/:caseId/evidence/logs', authenticate, getCaseEvidenceLogs);

// 文书管理接口

/**
 * @route   GET /api/cases/:caseId/documents/statistics
 * @desc    获取文书分类统计
 * @access  Private
 */
router.get('/:caseId/documents/statistics', authenticate, getDocumentStatistics);

/**
 * @route   GET /api/cases/:caseId/documents
 * @desc    获取文书列表
 * @access  Private
 */
router.get('/:caseId/documents', authenticate, getDocumentsByCaseId);

// 成本管理接口

/**
 * @route   GET /api/cases/:caseId/costs
 * @desc    获取案件成本列表
 * @access  Private
 */
router.get('/:caseId/costs', authenticate, costController.getCostsByCaseId);

/**
 * @route   GET /api/cases/:id/logs
 * @desc    获取案件操作日志
 * @access  Private
 */
router.get('/:id/logs', authenticate, caseController.getCaseLogs);

module.exports = router;

