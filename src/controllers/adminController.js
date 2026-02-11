const User = require('../models/User');
const Role = require('../models/Role');
const Permission = require('../models/Permission');
const db = require('../config/database');

class AdminController {
  static async getDashboard(req, res) {
    try {
      // Estadísticas básicas
      const totalUsers = await db('users').count('* as count');
      const activeUsers = await db('users').where('is_active', true).count('* as count');
      const verifiedUsers = await db('users').where('is_verified', true).count('* as count');
      const usersWith2FA = await db('users').where('two_factor_enabled', true).count('* as count');
      const newUsersToday = await db('users')
        .where('created_at', '>=', new Date(new Date().setHours(0,0,0,0)))
        .count('* as count');

      const stats = {
        totalUsers: parseInt(totalUsers[0].count),
        activeUsers: parseInt(activeUsers[0].count),
        verifiedUsers: parseInt(verifiedUsers[0].count),
        usersWith2FA: parseInt(usersWith2FA[0].count),
        newUsersToday: parseInt(newUsersToday[0].count),
        inactiveUsers: parseInt(totalUsers[0].count) - parseInt(activeUsers[0].count),
        unverifiedUsers: parseInt(totalUsers[0].count) - parseInt(verifiedUsers[0].count),
      };

      res.json({
        message: 'Admin dashboard data',
        stats,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
  }

  static async getAllUsers(req, res) {
    try {
      const { page = 1, limit = 10, search = '', role = '' } = req.query;
      const offset = (page - 1) * limit;

      let query = db('users')
        .select('users.*', 'roles.name as role_name')
        .leftJoin('roles', 'users.role_id', 'roles.id')
        .orderBy('users.created_at', 'desc')
        .limit(limit)
        .offset(offset);

      // Aplicar filtros
      if (search) {
        query = query.where(function() {
          this.where('users.email', 'ilike', `%${search}%`)
            .orWhere('users.first_name', 'ilike', `%${search}%`)
            .orWhere('users.last_name', 'ilike', `%${search}%`);
        });
      }

      if (role) {
        query = query.where('roles.name', role);
      }

      const users = await query;
      
      // Obtener total para paginación
      const totalQuery = db('users').count('* as count');
      if (search) {
        totalQuery = totalQuery.where(function() {
          this.where('users.email', 'ilike', `%${search}%`)
            .orWhere('users.first_name', 'ilike', `%${search}%`)
            .orWhere('users.last_name', 'ilike', `%${search}%`);
        });
      }
      if (role) {
        totalQuery = totalQuery.where('roles.name', role);
      }
      const totalResult = await totalQuery;
      const total = parseInt(totalResult[0].count);

      res.json({
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }

  static async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await db('users')
        .select('users.*', 'roles.name as role_name')
        .leftJoin('roles', 'users.role_id', 'roles.id')
        .where('users.id', id)
        .first();

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Obtener permisos del usuario
      const permissions = await User.getPermissions(id);

      res.json({
        user: {
          ...user,
          permissions: permissions.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            resource: p.resource,
            action: p.action,
          })),
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  }

  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { email, first_name, last_name, role_id, is_active } = req.body;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Validar que el rol exista
      if (role_id) {
        const role = await Role.findById(role_id);
        if (!role) {
          return res.status(400).json({ error: 'Role not found' });
        }
      }

      // Verificar email único (si se cambia)
      if (email && email !== user.email) {
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
          return res.status(400).json({ error: 'Email already exists' });
        }
      }

      const updatedUser = await User.update(id, {
        email,
        first_name,
        last_name,
        role_id,
        is_active,
      });

      res.json({
        message: 'User updated successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          first_name: updatedUser.first_name,
          last_name: updatedUser.last_name,
          role_id: updatedUser.role_id,
          is_active: updatedUser.is_active,
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update user' });
    }
  }

  static async deleteUser(req, res) {
    try {
      const { id } = req.params;
      
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // No permitir eliminar al propio admin
      if (id == req.user.id && req.user.role === 'admin') {
        return res.status(400).json({ error: 'Cannot delete your own admin account' });
      }

      await db('users').where('id', id).del();

      res.json({
        message: 'User deleted successfully',
        deletedUser: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }

  static async getAllRoles(req, res) {
    try {
      const roles = await Role.findAll();
      
      // Obtener permisos para cada rol
      const rolesWithPermissions = await Promise.all(
        roles.map(async (role) => {
          const permissions = await Role.getPermissions(role.id);
          return {
            ...role,
            permissions,
            permissionCount: permissions.length,
          };
        })
      );

      res.json({
        roles: rolesWithPermissions,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch roles' });
    }
  }

  static async createRole(req, res) {
    try {
      const { name, description, permissions } = req.body;

      // Verificar que el rol no exista
      const existingRole = await Role.findByName(name);
      if (existingRole) {
        return res.status(400).json({ error: 'Role already exists' });
      }

      const role = await Role.create({ name, description });

      // Asignar permisos si se proporcionan
      if (permissions && permissions.length > 0) {
        for (const permissionId of permissions) {
          await Role.addPermission(role.id, permissionId);
        }
      }

      res.status(201).json({
        message: 'Role created successfully',
        role: {
          ...role,
          permissions: permissions || [],
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create role' });
    }
  }

  static async updateRole(req, res) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      const role = await Role.findById(id);
      if (!role) {
        return res.status(404).json({ error: 'Role not found' });
      }

      // Verificar que el nombre no exista en otro rol
      if (name && name !== role.name) {
        const existingRole = await Role.findByName(name);
        if (existingRole) {
          return res.status(400).json({ error: 'Role name already exists' });
        }
      }

      const updatedRole = await Role.update(id, { name, description });

      res.json({
        message: 'Role updated successfully',
        role: updatedRole,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update role' });
    }
  }

  static async deleteRole(req, res) {
    try {
      const { id } = req.params;
      
      const role = await Role.findById(id);
      if (!role) {
        return res.status(404).json({ error: 'Role not found' });
      }

      // No permitir eliminar roles básicos
      if (['admin', 'user', 'moderator'].includes(role.name)) {
        return res.status(400).json({ error: 'Cannot delete basic roles' });
      }

      await Role.delete(id);

      res.json({
        message: 'Role deleted successfully',
        deletedRole: {
          id: role.id,
          name: role.name,
          description: role.description,
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete role' });
    }
  }

  static async getAllPermissions(req, res) {
    try {
      const { resource } = req.query;
      let permissions = await Permission.findAll();

      if (resource) {
        permissions = await Permission.findByResource(resource);
      }

      res.json({
        permissions,
        count: permissions.length,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch permissions' });
    }
  }

  static async createPermission(req, res) {
    try {
      const { name, description, resource, action } = req.body;

      // Verificar que el permiso no exista
      const existingPermission = await Permission.findByName(name);
      if (existingPermission) {
        return res.status(400).json({ error: 'Permission already exists' });
      }

      const permission = await Permission.create({
        name,
        description,
        resource,
        action,
      });

      res.status(201).json({
        message: 'Permission created successfully',
        permission,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create permission' });
    }
  }

  static async assignPermissionToRole(req, res) {
    try {
      const { roleId } = req.params;
      const { permissionId } = req.body;

      const role = await Role.findById(roleId);
      if (!role) {
        return res.status(404).json({ error: 'Role not found' });
      }

      const permission = await Permission.findById(permissionId);
      if (!permission) {
        return res.status(404).json({ error: 'Permission not found' });
      }

      // Verificar que ya no esté asignado
      const rolePermissions = await Role.getPermissions(roleId);
      const alreadyAssigned = rolePermissions.some(p => p.id === permissionId);
      if (alreadyAssigned) {
        return res.status(400).json({ error: 'Permission already assigned to role' });
      }

      await Role.addPermission(roleId, permissionId);

      res.json({
        message: 'Permission assigned to role successfully',
        roleId,
        permissionId,
        permission: {
          id: permission.id,
          name: permission.name,
          description: permission.description,
        },
        role: {
          id: role.id,
          name: role.name,
          description: role.description,
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to assign permission to role' });
    }
  }

  static async removePermissionFromRole(req, res) {
    try {
      const { roleId, permissionId } = req.params;

      const role = await Role.findById(roleId);
      if (!role) {
        return res.status(404).json({ error: 'Role not found' });
      }

      const permission = await Permission.findById(permissionId);
      if (!permission) {
        return res.status(404).json({ error: 'Permission not found' });
      }

      const removed = await Role.removePermission(roleId, permissionId);
      if (!removed) {
        return res.status(400).json({ error: 'Permission not assigned to role' });
      }

      res.json({
        message: 'Permission removed from role successfully',
        roleId,
        permissionId,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to remove permission from role' });
    }
  }
}

module.exports = AdminController;
