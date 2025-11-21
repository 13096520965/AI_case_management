const NotificationRule = require('../models/NotificationRule');

/**
 * 获取提醒规则列表
 */
exports.getRules = async (req, res) => {
  try {
    const { rule_type, is_enabled } = req.query;
    
    const filters = {};
    if (rule_type) filters.rule_type = rule_type;
    if (is_enabled !== undefined) filters.is_enabled = is_enabled === 'true';

    const rules = await NotificationRule.findAll(filters);
    
    res.json({
      success: true,
      data: rules
    });
  } catch (error) {
    console.error('Error fetching notification rules:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * 获取单个规则详情
 */
exports.getRuleById = async (req, res) => {
  try {
    const { id } = req.params;
    const rule = await NotificationRule.findById(parseInt(id));
    
    if (!rule) {
      return res.status(404).json({
        success: false,
        error: 'Notification rule not found'
      });
    }

    res.json({
      success: true,
      data: rule
    });
  } catch (error) {
    console.error('Error fetching notification rule:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * 创建提醒规则
 */
exports.createRule = async (req, res) => {
  try {
    const {
      rule_name,
      rule_type,
      trigger_condition,
      threshold_value,
      threshold_unit,
      frequency,
      recipients,
      is_enabled,
      description
    } = req.body;

    // 验证必填字段
    if (!rule_name || !rule_type || !trigger_condition) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: rule_name, rule_type, trigger_condition'
      });
    }

    const ruleId = await NotificationRule.create({
      rule_name,
      rule_type,
      trigger_condition,
      threshold_value,
      threshold_unit,
      frequency,
      recipients: recipients || [],
      is_enabled: is_enabled !== undefined ? is_enabled : true,
      description
    });

    const rule = await NotificationRule.findById(ruleId);

    res.status(201).json({
      success: true,
      data: rule,
      message: 'Notification rule created successfully'
    });
  } catch (error) {
    console.error('Error creating notification rule:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * 更新提醒规则
 */
exports.updateRule = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const changes = await NotificationRule.update(parseInt(id), updateData);

    if (changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Notification rule not found'
      });
    }

    const rule = await NotificationRule.findById(parseInt(id));

    res.json({
      success: true,
      data: rule,
      message: 'Notification rule updated successfully'
    });
  } catch (error) {
    console.error('Error updating notification rule:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * 删除提醒规则
 */
exports.deleteRule = async (req, res) => {
  try {
    const { id } = req.params;

    const changes = await NotificationRule.delete(parseInt(id));

    if (changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Notification rule not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification rule deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification rule:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * 启用/禁用规则
 */
exports.toggleRule = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_enabled } = req.body;

    if (is_enabled === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: is_enabled'
      });
    }

    const changes = await NotificationRule.toggleEnabled(parseInt(id), is_enabled);

    if (changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Notification rule not found'
      });
    }

    const rule = await NotificationRule.findById(parseInt(id));

    res.json({
      success: true,
      data: rule,
      message: `Notification rule ${is_enabled ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    console.error('Error toggling notification rule:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * 获取启用的规则
 */
exports.getEnabledRules = async (req, res) => {
  try {
    const { rule_type } = req.query;
    const rules = await NotificationRule.findEnabledRules(rule_type || null);
    
    res.json({
      success: true,
      data: rules
    });
  } catch (error) {
    console.error('Error fetching enabled rules:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * 根据类型获取规则
 */
exports.getRulesByType = async (req, res) => {
  try {
    const { type } = req.params;
    const rules = await NotificationRule.findByType(type);
    
    res.json({
      success: true,
      data: rules
    });
  } catch (error) {
    console.error('Error fetching rules by type:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
