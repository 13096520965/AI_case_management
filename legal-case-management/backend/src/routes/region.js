const express = require('express');
const router = express.Router();
const regionController = require('../controllers/regionController');

/**
 * @route   GET /api/regions
 * @desc    获取全国省市区数据
 * @access  Public
 */
router.get('/', regionController.getRegions);

/**
 * @route   GET /api/regions/:parentCode
 * @desc    根据父级编码获取下级地区
 * @access  Public
 */
router.get('/:parentCode', regionController.getRegionsByParent);

module.exports = router;
