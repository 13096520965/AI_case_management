const express = require('express');
const router = express.Router();
const partyController = require('../controllers/partyController');
const { authenticate } = require('../middleware/auth');

/**
 * @route   PUT /api/parties/:id
 * @desc    更新诉讼主体
 * @access  Private
 */
router.put('/:id', authenticate, partyController.updateParty);

/**
 * @route   DELETE /api/parties/:id
 * @desc    删除诉讼主体
 * @access  Private
 */
router.delete('/:id', authenticate, partyController.deleteParty);

/**
 * @route   GET /api/parties/history
 * @desc    查询主体历史案件
 * @access  Private
 * @query   name - 主体名称
 */
router.get('/history', authenticate, partyController.getPartyHistory);

module.exports = router;

