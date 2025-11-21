const ProcessNode = require('../models/ProcessNode');
const Case = require('../models/Case');
const ProcessNodeService = require('../services/processNodeService');

/**
 * 创建流程节点
 */
exports.createNode = async (req, res) => {
  try {
    const { caseId } = req.params;
    const nodeData = { ...req.body, case_id: caseId };

    // 验证案件是否存在
    const caseExists = await Case.findById(caseId);
    if (!caseExists) {
      return res.status(404).json({
        error: {
          message: '案件不存在',
          status: 404
        }
      });
    }

    // 验证必填字段
    if (!nodeData.node_type || !nodeData.node_name) {
      return res.status(400).json({
        error: {
          message: '节点类型和节点名称为必填项',
          status: 400
        }
      });
    }

    const nodeId = await ProcessNode.create(nodeData);
    const newNode = await ProcessNode.findById(nodeId);

    res.status(201).json({
      message: '流程节点创建成功',
      data: {
        node: newNode
      }
    });
  } catch (error) {
    console.error('创建流程节点错误:', error);
    res.status(500).json({
      error: {
        message: '创建流程节点失败，请稍后重试',
        status: 500
      }
    });
  }
};

/**
 * 获取流程节点列表
 */
exports.getNodesByCaseId = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { updateStatus } = req.query;

    // 验证案件是否存在
    const caseExists = await Case.findById(caseId);
    if (!caseExists) {
      return res.status(404).json({
        error: {
          message: '案件不存在',
          status: 404
        }
      });
    }

    let nodes;
    // 如果请求更新状态，先更新再返回
    if (updateStatus === 'true') {
      nodes = await ProcessNodeService.updateCaseNodesStatus(caseId);
    } else {
      nodes = await ProcessNode.findByCaseId(caseId);
    }

    res.json({
      data: {
        nodes
      }
    });
  } catch (error) {
    console.error('获取流程节点列表错误:', error);
    res.status(500).json({
      error: {
        message: '获取流程节点列表失败',
        status: 500
      }
    });
  }
};

/**
 * 更新节点状态
 */
exports.updateNode = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // 检查节点是否存在
    const existingNode = await ProcessNode.findById(id);
    if (!existingNode) {
      return res.status(404).json({
        error: {
          message: '流程节点不存在',
          status: 404
        }
      });
    }

    // 检测进度变更
    const progressChanged = updateData.progress !== undefined && updateData.progress !== existingNode.progress;
    const oldProgress = existingNode.progress;
    const newProgress = updateData.progress;

    // 检测状态变更
    const statusChanged = updateData.status && updateData.status !== existingNode.status;
    const oldStatus = existingNode.status;
    const newStatus = updateData.status;

    // 自动化逻辑1：进度达到100%时自动标记为已完成
    if (updateData.progress === 100 && existingNode.status !== '已完成') {
      updateData.status = '已完成';
      console.log(`节点"${existingNode.node_name}"进度达到100%，自动标记为已完成`);
    }

    const changes = await ProcessNode.update(id, updateData);

    if (changes === 0) {
      return res.status(400).json({
        error: {
          message: '没有数据被更新',
          status: 400
        }
      });
    }

    const updatedNode = await ProcessNode.findById(id);

    // 自动化逻辑2：检查案件的所有节点是否都已完成，如果是则标记案件为已结案
    const allNodes = await ProcessNode.findByCaseId(existingNode.case_id);
    const allCompleted = allNodes.every(node => node.status === '已完成');
    
    if (allCompleted && allNodes.length > 0) {
      const caseData = await Case.findById(existingNode.case_id);
      if (caseData && caseData.status !== '已结案') {
        await Case.update(existingNode.case_id, { status: '已结案' });
        console.log(`案件 ${existingNode.case_id} 的所有节点已完成，自动标记为已结案`);
        
        // 记录案件状态变更日志
        const { logCaseAction } = require('../middleware/caseLogger');
        await logCaseAction(
          existingNode.case_id,
          'CASE_STATUS_CHANGE',
          `所有流程节点已完成，案件自动标记为已结案`,
          req.user,
          {
            ip_address: req.ip || req.connection.remoteAddress,
            user_agent: req.get('user-agent'),
            data: {
              old_status: caseData.status,
              new_status: '已结案',
              auto_closed: true
            }
          }
        );
      }
    }

    // 记录节点变更日志
    const { logCaseAction } = require('../middleware/caseLogger');
    
    if (progressChanged) {
      await logCaseAction(
        existingNode.case_id,
        'NODE_PROGRESS_CHANGE',
        `节点"${existingNode.node_name}"进度从 ${oldProgress}% 更新为 ${newProgress}%`,
        req.user,
        {
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('user-agent'),
          data: {
            node_id: id,
            node_name: existingNode.node_name,
            old_progress: oldProgress,
            new_progress: newProgress
          }
        }
      );
    }

    // 检查状态是否真的变更了（包括自动变更）
    const finalStatusChanged = updatedNode.status !== existingNode.status;
    if (finalStatusChanged) {
      const autoChanged = updateData.progress === 100 && !statusChanged;
      await logCaseAction(
        existingNode.case_id,
        'NODE_STATUS_CHANGE',
        autoChanged 
          ? `节点"${existingNode.node_name}"进度达到100%，自动标记为已完成`
          : `节点"${existingNode.node_name}"状态从"${existingNode.status}"变更为"${updatedNode.status}"`,
        req.user,
        {
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('user-agent'),
          data: {
            node_id: id,
            node_name: existingNode.node_name,
            old_status: existingNode.status,
            new_status: updatedNode.status,
            auto_changed: autoChanged
          }
        }
      );
    }

    res.json({
      message: '流程节点更新成功',
      data: {
        node: updatedNode
      }
    });
  } catch (error) {
    console.error('更新流程节点错误:', error);
    res.status(500).json({
      error: {
        message: '更新流程节点失败',
        status: 500
      }
    });
  }
};

/**
 * 删除节点
 */
exports.deleteNode = async (req, res) => {
  try {
    const { id } = req.params;

    // 检查节点是否存在
    const existingNode = await ProcessNode.findById(id);
    if (!existingNode) {
      return res.status(404).json({
        error: {
          message: '流程节点不存在',
          status: 404
        }
      });
    }

    const changes = await ProcessNode.delete(id);

    if (changes === 0) {
      return res.status(400).json({
        error: {
          message: '删除失败',
          status: 400
        }
      });
    }

    // 记录日志
    const { logCaseAction } = require('../middleware/caseLogger');
    await logCaseAction(
      existingNode.case_id,
      'DELETE_NODE',
      `删除流程节点: ${existingNode.node_name}`,
      req.user,
      {
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get('user-agent'),
        data: {
          node_id: id,
          node_name: existingNode.node_name
        }
      }
    );

    res.json({
      message: '流程节点删除成功'
    });
  } catch (error) {
    console.error('删除流程节点错误:', error);
    res.status(500).json({
      error: {
        message: '删除流程节点失败',
        status: 500
      }
    });
  }
};


/**
 * 更新所有节点状态
 */
exports.updateAllNodesStatus = async (req, res) => {
  try {
    const result = await ProcessNodeService.updateAllNodesStatus();

    res.json({
      message: result.message,
      data: {
        updated: result.updated
      }
    });
  } catch (error) {
    console.error('更新所有节点状态错误:', error);
    res.status(500).json({
      error: {
        message: '更新所有节点状态失败',
        status: 500
      }
    });
  }
};

/**
 * 获取超期节点统计
 */
exports.getOverdueStatistics = async (req, res) => {
  try {
    const statistics = await ProcessNodeService.getOverdueStatistics();

    res.json({
      data: statistics
    });
  } catch (error) {
    console.error('获取超期节点统计错误:', error);
    res.status(500).json({
      error: {
        message: '获取超期节点统计失败',
        status: 500
      }
    });
  }
};

/**
 * 获取超期节点列表
 */
exports.getOverdueNodes = async (req, res) => {
  try {
    const ProcessNode = require('../models/ProcessNode');
    const nodes = await ProcessNode.findOverdueNodes();

    res.json({
      success: true,
      data: nodes
    });
  } catch (error) {
    console.error('获取超期节点错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '获取超期节点失败',
        status: 500
      }
    });
  }
};

/**
 * 获取即将到期的节点
 */
exports.getUpcomingNodes = async (req, res) => {
  try {
    const { days } = req.query;
    const daysThreshold = days ? parseInt(days) : 3;

    const nodes = await ProcessNodeService.getUpcomingNodes(daysThreshold);

    res.json({
      success: true,
      data: {
        nodes,
        threshold: daysThreshold
      }
    });
  } catch (error) {
    console.error('获取即将到期节点错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '获取即将到期节点失败',
        status: 500
      }
    });
  }
};

/**
 * 获取节点详情（包含超期信息）
 */
exports.getNodeWithOverdueInfo = async (req, res) => {
  try {
    const { id } = req.params;

    const node = await ProcessNodeService.getNodeWithOverdueInfo(id);

    if (!node) {
      return res.status(404).json({
        error: {
          message: '流程节点不存在',
          status: 404
        }
      });
    }

    res.json({
      data: {
        node
      }
    });
  } catch (error) {
    console.error('获取节点详情错误:', error);
    res.status(500).json({
      error: {
        message: '获取节点详情失败',
        status: 500
      }
    });
  }
};
