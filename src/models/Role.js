const db = require('../config/database');

class Role {
  static async create(roleData) {
    const [role] = await db('roles')
      .insert(roleData)
      .returning('*');
    
    return role;
  }

  static async findById(id) {
    const role = await db('roles')
      .where('id', id)
      .first();
    
    return role;
  }

  static async findByName(name) {
    const role = await db('roles')
      .where('name', name)
      .first();
    
    return role;
  }

  static async findAll() {
    const roles = await db('roles')
      .select('*');
    
    return roles;
  }

  static async update(id, roleData) {
    const [role] = await db('roles')
      .where('id', id)
      .update(roleData)
      .returning('*');
    
    return role;
  }

  static async delete(id) {
    const deletedCount = await db('roles')
      .where('id', id)
      .del();
    
    return deletedCount > 0;
  }

  static async getPermissions(roleId) {
    const permissions = await db('permissions')
      .select('permissions.*')
      .join('role_permissions', 'permissions.id', 'role_permissions.permission_id')
      .where('role_permissions.role_id', roleId);
    
    return permissions;
  }

  static async addPermission(roleId, permissionId) {
    const [rolePermission] = await db('role_permissions')
      .insert({
        role_id: roleId,
        permission_id: permissionId,
      })
      .returning('*');
    
    return rolePermission;
  }

  static async removePermission(roleId, permissionId) {
    const deletedCount = await db('role_permissions')
      .where('role_id', roleId)
      .andWhere('permission_id', permissionId)
      .del();
    
    return deletedCount > 0;
  }

  static async hasPermission(roleId, permissionName) {
    const permission = await db('permissions')
      .select('permissions.*')
      .join('role_permissions', 'permissions.id', 'role_permissions.permission_id')
      .where('role_permissions.role_id', roleId)
      .andWhere('permissions.name', permissionName)
      .first();
    
    return !!permission;
  }
}

module.exports = Role;
