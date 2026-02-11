const AuthService = require('../services/authService');
const User = require('../models/User');
const redisClient = require('../config/redis');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const token = authHeader.substring(7);
    
    const isBlacklisted = await redisClient.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({ error: 'Token has been revoked' });
    }

    const user = await AuthService.getUserFromToken(token);
    req.user = user;
    
    next();
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }
};

const authorize = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const hasPermission = await User.hasPermission(req.user.id, permission);
      if (!hasPermission) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    } catch (error) {
      return res.status(500).json({ error: 'Authorization check failed' });
    }
  };
};

const requireRole = (roleName) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== roleName) {
      return res.status(403).json({ error: `${roleName} role required` });
    }

    next();
  };
};

const requireAdmin = requireRole('admin');
const requireModerator = requireRole('moderator');

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      const isBlacklisted = await redisClient.get(`blacklist:${token}`);
      if (!isBlacklisted) {
        try {
          const user = await AuthService.getUserFromToken(token);
          req.user = user;
        } catch (error) {
          // Token is invalid, but we continue without user
        }
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};

const checkOwnership = (resourceUserIdField = 'user_id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const resourceUserId = req.params.userId || req.body[resourceUserIdField] || req.query[resourceUserIdField];
    
    if (req.user.id !== parseInt(resourceUserId) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
  requireRole,
  requireAdmin,
  requireModerator,
  optionalAuth,
  checkOwnership,
};
