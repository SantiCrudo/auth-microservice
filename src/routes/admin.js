const express = require('express');
const { body, param, query } = require('express-validator');
const AdminController = require('../controllers/adminController');
const { authenticate, authorize, requireAdmin } = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

// Validation middleware
const createUserValidation = [
  body('email').isEmail().normalizeEmail(),
  body('first_name').trim().isLength({ min: 1 }),
  body('last_name').trim().isLength({ min: 1 }),
  body('role_id').optional().isInt(),
  body('is_active').optional().isBoolean(),
];

const updateUserValidation = [
  param('id').isInt(),
  body('email').optional().isEmail().normalizeEmail(),
  body('first_name').optional().trim().isLength({ min: 1 }),
  body('last_name').optional().trim().isLength({ min: 1 }),
  body('role_id').optional().isInt(),
  body('is_active').optional().isBoolean(),
];

const createRoleValidation = [
  body('name').trim().isLength({ min: 1 }).matches(/^[a-zA-Z0-9_]+$/),
  body('description').optional().trim(),
  body('permissions').optional().isArray(),
];

const updateRoleValidation = [
  param('id').isInt(),
  body('name').optional().trim().isLength({ min: 1 }).matches(/^[a-zA-Z0-9_]+$/),
  body('description').optional().trim(),
];

const createPermissionValidation = [
  body('name').trim().isLength({ min: 1 }).matches(/^[a-zA-Z0-9_]+$/),
  body('description').optional().trim(),
  body('resource').trim().isLength({ min: 1 }),
  body('action').isIn(['create', 'read', 'update', 'delete']),
];

const paginationValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim(),
  query('role').optional().trim(),
];

// Apply authentication to all admin routes
router.use(authenticate);

// Dashboard
router.get('/dashboard', requireAdmin, AdminController.getDashboard);

// User Management
router.get('/users', 
  requireAdmin,
  paginationValidation,
  AdminController.getAllUsers
);

router.get('/users/:id', 
  requireAdmin,
  authorize('read_user'),
  AdminController.getUserById
);

router.put('/users/:id',
  requireAdmin,
  authorize('update_user'),
  updateUserValidation,
  AdminController.updateUser
);

router.delete('/users/:id',
  requireAdmin,
  authorize('delete_user'),
  AdminController.deleteUser
);

// Role Management
router.get('/roles',
  requireAdmin,
  authorize('read_role'),
  AdminController.getAllRoles
);

router.post('/roles',
  requireAdmin,
  authorize('create_role'),
  createRoleValidation,
  AdminController.createRole
);

router.put('/roles/:id',
  requireAdmin,
  authorize('update_role'),
  updateRoleValidation,
  AdminController.updateRole
);

router.delete('/roles/:id',
  requireAdmin,
  authorize('delete_role'),
  AdminController.deleteRole
);

// Permission Management
router.get('/permissions',
  requireAdmin,
  authorize('read_permission'),
  AdminController.getAllPermissions
);

router.post('/permissions',
  requireAdmin,
  authorize('create_permission'),
  createPermissionValidation,
  AdminController.createPermission
);

// Role-Permission Assignment
router.post('/roles/:roleId/permissions',
  requireAdmin,
  authorize('update_role'),
  AdminController.assignPermissionToRole
);

router.delete('/roles/:roleId/permissions/:permissionId',
  requireAdmin,
  authorize('update_role'),
  AdminController.removePermissionFromRole
);

// System Logs (placeholder for future implementation)
router.get('/logs', 
  requireAdmin,
  authorize('view_system_logs'),
  async (req, res) => {
    try {
      const { page = 1, limit = 50, level = 'all' } = req.query;
      const offset = (page - 1) * limit;

      // This would require a logs table - for now return empty
      res.json({
        logs: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          totalPages: 0,
        },
        message: 'Logging system not implemented yet'
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch logs' });
    }
  }
);

// System Stats
router.get('/stats',
  requireAdmin,
  authorize('access_admin_panel'),
  async (req, res) => {
    try {
      const stats = {
        users: {
          total: await db('users').count('* as count'),
          active: await db('users').where('is_active', true).count('* as count'),
          verified: await db('users').where('is_verified', true).count('* as count'),
          with2FA: await db('users').where('two_factor_enabled', true).count('* as count'),
          googleAuth: await db('users').whereNotNull('google_id').count('* as count'),
        },
        roles: {
          total: await db('roles').count('* as count'),
        },
        permissions: {
          total: await db('permissions').count('* as count'),
        },
        logins: {
          today: await db('login_attempts')
            .where('attempted_at', '>=', new Date(new Date().setHours(0,0,0,0)))
            .where('successful', true)
            .count('* as count'),
          failed: await db('login_attempts')
            .where('attempted_at', '>=', new Date(new Date().setHours(0,0,0,0)))
            .where('successful', false)
            .count('* as count'),
        },
      };

      res.json({
        stats,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch system stats' });
    }
  }
);

module.exports = router;
