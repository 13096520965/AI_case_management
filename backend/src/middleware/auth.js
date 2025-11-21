const jwt = require('jsonwebtoken');

/**
 * JWT 验证中间件
 * 验证请求头中的 JWT token，并将用户信息附加到 req 对象
 */
exports.authenticate = (req, res, next) => {
  try {
    // 从请求头获取 token
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: {
          message: '未提供认证令牌',
          status: 401
        }
      });
    }

    // 检查 token 格式 (Bearer <token>)
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        error: {
          message: '令牌格式错误',
          status: 401
        }
      });
    }

    const token = parts[1];

    // 验证 token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production'
    );

    // 将用户信息附加到请求对象
    req.userId = decoded.userId;
    req.username = decoded.username;
    req.userRole = decoded.role;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: {
          message: '令牌已过期',
          status: 401,
          code: 'TOKEN_EXPIRED'
        }
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: {
          message: '无效的令牌',
          status: 401,
          code: 'INVALID_TOKEN'
        }
      });
    }

    console.error('认证错误:', error);
    return res.status(500).json({
      error: {
        message: '认证失败',
        status: 500
      }
    });
  }
};

/**
 * 权限检查中间件
 * 检查用户是否具有指定的角色权限
 * @param {string|Array<string>} allowedRoles - 允许的角色（单个或数组）
 */
exports.authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(401).json({
        error: {
          message: '未认证',
          status: 401
        }
      });
    }

    // 检查用户角色是否在允许的角色列表中
    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({
        error: {
          message: '权限不足',
          status: 403
        }
      });
    }

    next();
  };
};

/**
 * 可选认证中间件
 * 如果提供了 token 则验证，但不强制要求
 * 用于某些既可以匿名访问也可以认证访问的接口
 */
exports.optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      // 没有提供 token，继续执行但不设置用户信息
      return next();
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      // token 格式错误，继续执行但不设置用户信息
      return next();
    }

    const token = parts[1];

    // 验证 token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production'
    );

    // 将用户信息附加到请求对象
    req.userId = decoded.userId;
    req.username = decoded.username;
    req.userRole = decoded.role;

    next();
  } catch (error) {
    // token 验证失败，继续执行但不设置用户信息
    next();
  }
};

/**
 * 检查是否为资源所有者或管理员
 * 用于需要验证用户是否有权访问特定资源的场景
 * @param {Function} getResourceOwnerId - 获取资源所有者 ID 的函数
 */
exports.checkOwnership = (getResourceOwnerId) => {
  return async (req, res, next) => {
    try {
      const resourceOwnerId = await getResourceOwnerId(req);

      // 管理员可以访问所有资源
      if (req.userRole === 'admin') {
        return next();
      }

      // 检查是否为资源所有者
      if (req.userId !== resourceOwnerId) {
        return res.status(403).json({
          error: {
            message: '无权访问此资源',
            status: 403
          }
        });
      }

      next();
    } catch (error) {
      console.error('权限检查错误:', error);
      return res.status(500).json({
        error: {
          message: '权限检查失败',
          status: 500
        }
      });
    }
  };
};
