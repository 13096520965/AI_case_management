const { CollaborationMember, CollaborationTask, User } = require('../models');

/**
 * 协作管理控制器
 */

/**
 * 添加协作成员
 */
exports.addMember = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { user_id, role, permissions } = req.body;

    // 验证必填字段
    if (!user_id || !role) {
      return res.status(400).json({
        error: 'user_id 和 role 是必填字段'
      });
    }

    // 验证用户是否存在
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({
        error: '用户不存在'
      });
    }

    // 检查是否已经是成员
    const existingMember = await CollaborationMember.checkMembership(caseId, user_id);
    if (existingMember) {
      return res.status(400).json({
        error: '该用户已经是案件的协作成员'
      });
    }

    // 创建协作成员
    const memberData = {
      case_id: parseInt(caseId),
      user_id,
      role,
      permissions: permissions || null
    };

    const member = await CollaborationMember.create(memberData);

    res.status(201).json({
      message: '协作成员添加成功',
      data: member
    });
  } catch (error) {
    console.error('添加协作成员失败:', error);
    res.status(500).json({
      error: '添加协作成员失败',
      details: error.message
    });
  }
};

/**
 * 获取案件的协作成员列表
 */
exports.getMembersByCaseId = async (req, res) => {
  try {
    const { caseId } = req.params;

    const members = await CollaborationMember.findByCaseId(caseId);

    res.json({
      message: '获取协作成员列表成功',
      data: members,
      total: members.length
    });
  } catch (error) {
    console.error('获取协作成员列表失败:', error);
    res.status(500).json({
      error: '获取协作成员列表失败',
      details: error.message
    });
  }
};

/**
 * 更新协作成员
 */
exports.updateMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, permissions } = req.body;

    // 检查成员是否存在
    const member = await CollaborationMember.findById(id);
    if (!member) {
      return res.status(404).json({
        error: '协作成员不存在'
      });
    }

    // 更新成员信息
    const updateData = {};
    if (role !== undefined) updateData.role = role;
    if (permissions !== undefined) updateData.permissions = permissions;

    await CollaborationMember.update(id, updateData);

    // 获取更新后的成员信息
    const updatedMember = await CollaborationMember.findById(id);

    res.json({
      message: '协作成员更新成功',
      data: updatedMember
    });
  } catch (error) {
    console.error('更新协作成员失败:', error);
    res.status(500).json({
      error: '更新协作成员失败',
      details: error.message
    });
  }
};

/**
 * 移除协作成员
 */
exports.removeMember = async (req, res) => {
  try {
    const { id } = req.params;

    // 检查成员是否存在
    const member = await CollaborationMember.findById(id);
    if (!member) {
      return res.status(404).json({
        error: '协作成员不存在'
      });
    }

    await CollaborationMember.delete(id);

    res.json({
      message: '协作成员移除成功'
    });
  } catch (error) {
    console.error('移除协作成员失败:', error);
    res.status(500).json({
      error: '移除协作成员失败',
      details: error.message
    });
  }
};

/**
 * 创建协作任务
 */
exports.createTask = async (req, res) => {
  try {
    const {
      case_id,
      task_title,
      task_description,
      assigned_to,
      priority,
      due_date
    } = req.body;

    // 验证必填字段
    if (!case_id || !task_title) {
      return res.status(400).json({
        error: 'case_id 和 task_title 是必填字段'
      });
    }

    // 如果指定了 assigned_to，验证用户是否存在
    if (assigned_to) {
      const user = await User.findById(assigned_to);
      if (!user) {
        return res.status(404).json({
          error: '指定的用户不存在'
        });
      }
    }

    // 创建任务
    const taskData = {
      case_id,
      task_title,
      task_description: task_description || null,
      assigned_to: assigned_to || null,
      assigned_by: req.userId, // 从认证中间件获取当前用户 ID
      priority: priority || 'medium',
      status: 'pending',
      due_date: due_date || null
    };

    const task = await CollaborationTask.create(taskData);

    res.status(201).json({
      message: '协作任务创建成功',
      data: task
    });
  } catch (error) {
    console.error('创建协作任务失败:', error);
    res.status(500).json({
      error: '创建协作任务失败',
      details: error.message
    });
  }
};

/**
 * 获取案件的协作任务列表
 */
exports.getTasksByCaseId = async (req, res) => {
  try {
    const { caseId } = req.params;

    const tasks = await CollaborationTask.findByCaseId(caseId);

    res.json({
      message: '获取协作任务列表成功',
      data: tasks,
      total: tasks.length
    });
  } catch (error) {
    console.error('获取协作任务列表失败:', error);
    res.status(500).json({
      error: '获取协作任务列表失败',
      details: error.message
    });
  }
};

/**
 * 更新协作任务
 */
exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      task_title,
      task_description,
      assigned_to,
      priority,
      status,
      due_date
    } = req.body;

    // 检查任务是否存在
    const task = await CollaborationTask.findById(id);
    if (!task) {
      return res.status(404).json({
        error: '协作任务不存在'
      });
    }

    // 如果更新 assigned_to，验证用户是否存在
    if (assigned_to !== undefined && assigned_to !== null) {
      const user = await User.findById(assigned_to);
      if (!user) {
        return res.status(404).json({
          error: '指定的用户不存在'
        });
      }
    }

    // 更新任务
    const updateData = {};
    if (task_title !== undefined) updateData.task_title = task_title;
    if (task_description !== undefined) updateData.task_description = task_description;
    if (assigned_to !== undefined) updateData.assigned_to = assigned_to;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) updateData.status = status;
    if (due_date !== undefined) updateData.due_date = due_date;

    await CollaborationTask.update(id, updateData);

    // 获取更新后的任务信息
    const updatedTask = await CollaborationTask.findById(id);

    res.json({
      message: '协作任务更新成功',
      data: updatedTask
    });
  } catch (error) {
    console.error('更新协作任务失败:', error);
    res.status(500).json({
      error: '更新协作任务失败',
      details: error.message
    });
  }
};

/**
 * 删除协作任务
 */
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    // 检查任务是否存在
    const task = await CollaborationTask.findById(id);
    if (!task) {
      return res.status(404).json({
        error: '协作任务不存在'
      });
    }

    await CollaborationTask.delete(id);

    res.json({
      message: '协作任务删除成功'
    });
  } catch (error) {
    console.error('删除协作任务失败:', error);
    res.status(500).json({
      error: '删除协作任务失败',
      details: error.message
    });
  }
};

/**
 * 获取用户的所有任务
 */
exports.getTasksByUserId = async (req, res) => {
  try {
    const userId = req.userId; // 从认证中间件获取当前用户 ID

    const tasks = await CollaborationTask.findByUserId(userId);

    res.json({
      message: '获取用户任务列表成功',
      data: tasks,
      total: tasks.length
    });
  } catch (error) {
    console.error('获取用户任务列表失败:', error);
    res.status(500).json({
      error: '获取用户任务列表失败',
      details: error.message
    });
  }
};
