const User = require('../models/User');
const jwt = require('jsonwebtoken');

/**
 * 用户注册控制器
 */
exports.register = async (req, res) => {
  try {
    const { username, password, real_name, email, role } = req.body;

    // 验证必填字段
    if (!username || !password) {
      return res.status(400).json({
        error: {
          message: '用户名和密码为必填项',
          status: 400
        }
      });
    }

    // 验证用户名长度
    if (username.length < 3 || username.length > 50) {
      return res.status(400).json({
        error: {
          message: '用户名长度必须在3-50个字符之间',
          status: 400
        }
      });
    }

    // 验证密码长度
    if (password.length < 6) {
      return res.status(400).json({
        error: {
          message: '密码长度至少为6个字符',
          status: 400
        }
      });
    }

    // 检查用户名是否已存在
    const usernameExists = await User.usernameExists(username);
    if (usernameExists) {
      return res.status(409).json({
        error: {
          message: '用户名已存在',
          status: 409
        }
      });
    }

    // 检查邮箱是否已存在（如果提供了邮箱）
    if (email) {
      const emailExists = await User.emailExists(email);
      if (emailExists) {
        return res.status(409).json({
          error: {
            message: '邮箱已被使用',
            status: 409
          }
        });
      }
    }

    // 创建用户
    const userId = await User.create({
      username,
      password,
      real_name,
      email,
      role: role || 'user'
    });

    // 获取创建的用户信息（不包含密码）
    const user = await User.findById(userId);

    res.status(201).json({
      message: '注册成功',
      data: {
        user
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      error: {
        message: '注册失败，请稍后重试',
        status: 500
      }
    });
  }
};

/**
 * 用户登录控制器
 */
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 验证必填字段
    if (!username || !password) {
      return res.status(400).json({
        error: {
          message: '用户名和密码为必填项',
          status: 400
        }
      });
    }

    // 验证用户名和密码
    const user = await User.authenticate(username, password);

    if (!user) {
      return res.status(401).json({
        error: {
          message: '用户名或密码错误',
          status: 401
        }
      });
    }

    // 生成 JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      message: '登录成功',
      data: {
        token,
        user
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      error: {
        message: '登录失败，请稍后重试',
        status: 500
      }
    });
  }
};

/**
 * 获取当前用户信息
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        error: {
          message: '用户不存在',
          status: 404
        }
      });
    }

    res.json({
      data: {
        user
      }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      error: {
        message: '获取用户信息失败',
        status: 500
      }
    });
  }
};

/**
 * 刷新 token
 */
exports.refreshToken = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        error: {
          message: '用户不存在',
          status: 404
        }
      });
    }

    // 生成新的 JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      message: 'Token 刷新成功',
      data: {
        token
      }
    });
  } catch (error) {
    console.error('刷新 token 错误:', error);
    res.status(500).json({
      error: {
        message: '刷新 token 失败',
        status: 500
      }
    });
  }
};

/**
 * 获取所有用户列表
 */
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 100, role } = req.query;

    const users = await User.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      role
    });

    const total = await User.count({ role });

    res.json({
      message: '获取用户列表成功',
      data: users,
      total
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({
      error: {
        message: '获取用户列表失败',
        status: 500
      }
    });
  }
};
