const ProcessNode = require('../models/ProcessNode');

/**
 * 流程节点服务
 */
class ProcessNodeService {
  /**
   * 计算节点状态
   * @param {Object} node - 节点对象
   * @returns {string} 节点状态
   */
  static calculateNodeStatus(node) {
    // 如果已完成，状态为 completed
    if (node.completion_time) {
      return 'completed';
    }

    // 如果没有截止日期，根据是否有开始时间判断
    if (!node.deadline) {
      return node.start_time ? 'in_progress' : 'pending';
    }

    const now = new Date();
    const deadline = new Date(node.deadline);

    // 如果已超期，状态为 overdue
    if (now > deadline) {
      return 'overdue';
    }

    // 如果有开始时间，状态为 in_progress
    if (node.start_time) {
      return 'in_progress';
    }

    // 否则状态为 pending
    return 'pending';
  }

  /**
   * 更新单个节点状态
   * @param {number} nodeId - 节点 ID
   * @returns {Promise<Object>} 更新后的节点
   */
  static async updateNodeStatus(nodeId) {
    try {
      const node = await ProcessNode.findById(nodeId);
      if (!node) {
        throw new Error('节点不存在');
      }

      const newStatus = this.calculateNodeStatus(node);

      // 如果状态有变化，更新数据库
      if (node.status !== newStatus) {
        await ProcessNode.update(nodeId, { status: newStatus });
        node.status = newStatus;
      }

      return node;
    } catch (error) {
      console.error('更新节点状态错误:', error);
      throw error;
    }
  }

  /**
   * 批量更新案件的所有节点状态
   * @param {number} caseId - 案件 ID
   * @returns {Promise<Array>} 更新后的节点列表
   */
  static async updateCaseNodesStatus(caseId) {
    try {
      const nodes = await ProcessNode.findByCaseId(caseId);
      const updatedNodes = [];

      for (const node of nodes) {
        const newStatus = this.calculateNodeStatus(node);

        // 如果状态有变化，更新数据库
        if (node.status !== newStatus) {
          await ProcessNode.update(node.id, { status: newStatus });
          node.status = newStatus;
        }

        updatedNodes.push(node);
      }

      return updatedNodes;
    } catch (error) {
      console.error('批量更新节点状态错误:', error);
      throw error;
    }
  }

  /**
   * 更新所有节点状态（定时任务使用）
   * @returns {Promise<Object>} 更新统计信息
   */
  static async updateAllNodesStatus() {
    try {
      const sql = `
        UPDATE process_nodes
        SET status = CASE
          WHEN completion_time IS NOT NULL THEN 'completed'
          WHEN deadline IS NULL AND start_time IS NOT NULL THEN 'in_progress'
          WHEN deadline IS NULL THEN 'pending'
          WHEN datetime(deadline) < datetime('now') THEN 'overdue'
          WHEN start_time IS NOT NULL THEN 'in_progress'
          ELSE 'pending'
        END,
        updated_at = CURRENT_TIMESTAMP
        WHERE status != CASE
          WHEN completion_time IS NOT NULL THEN 'completed'
          WHEN deadline IS NULL AND start_time IS NOT NULL THEN 'in_progress'
          WHEN deadline IS NULL THEN 'pending'
          WHEN datetime(deadline) < datetime('now') THEN 'overdue'
          WHEN start_time IS NOT NULL THEN 'in_progress'
          ELSE 'pending'
        END
      `;

      const { run } = require('../config/database');
      const result = await run(sql);

      return {
        updated: result.changes,
        message: `成功更新 ${result.changes} 个节点的状态`
      };
    } catch (error) {
      console.error('更新所有节点状态错误:', error);
      throw error;
    }
  }

  /**
   * 获取超期节点统计
   * @returns {Promise<Object>} 超期节点统计
   */
  static async getOverdueStatistics() {
    try {
      const overdueNodes = await ProcessNode.findOverdueNodes();
      
      // 按案件分组统计
      const byCaseMap = new Map();
      overdueNodes.forEach(node => {
        if (!byCaseMap.has(node.case_id)) {
          byCaseMap.set(node.case_id, []);
        }
        byCaseMap.get(node.case_id).push(node);
      });

      return {
        total: overdueNodes.length,
        affectedCases: byCaseMap.size,
        nodes: overdueNodes,
        byCaseId: Object.fromEntries(byCaseMap)
      };
    } catch (error) {
      console.error('获取超期节点统计错误:', error);
      throw error;
    }
  }

  /**
   * 获取即将到期的节点
   * @param {number} days - 天数阈值
   * @returns {Promise<Array>} 即将到期的节点列表
   */
  static async getUpcomingNodes(days = 3) {
    try {
      return await ProcessNode.findUpcomingNodes(days);
    } catch (error) {
      console.error('获取即将到期节点错误:', error);
      throw error;
    }
  }

  /**
   * 检查节点是否超期
   * @param {Object} node - 节点对象
   * @returns {Object} 超期信息
   */
  static checkNodeOverdue(node) {
    if (!node.deadline || node.completion_time) {
      return {
        isOverdue: false,
        overdueDays: 0
      };
    }

    const now = new Date();
    const deadline = new Date(node.deadline);
    const isOverdue = now > deadline;

    let overdueDays = 0;
    if (isOverdue) {
      const diffTime = Math.abs(now - deadline);
      overdueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return {
      isOverdue,
      overdueDays,
      deadline: node.deadline
    };
  }

  /**
   * 获取节点详情（包含超期信息）
   * @param {number} nodeId - 节点 ID
   * @returns {Promise<Object>} 节点详情
   */
  static async getNodeWithOverdueInfo(nodeId) {
    try {
      const node = await ProcessNode.findById(nodeId);
      if (!node) {
        return null;
      }

      const overdueInfo = this.checkNodeOverdue(node);
      const currentStatus = this.calculateNodeStatus(node);

      return {
        ...node,
        calculatedStatus: currentStatus,
        overdueInfo
      };
    } catch (error) {
      console.error('获取节点详情错误:', error);
      throw error;
    }
  }
}

module.exports = ProcessNodeService;
