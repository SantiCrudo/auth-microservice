const db = require('../config/database');

class Permission {
  static async create(permissionData) {
    const [permission] = await db('permissions')
      .insert(permissionData)
      .returning('*');
    
    return permission;
  }

  static async findById(id) {
    const permission = await db('permissions')
      .where('id', id)
      .first();
    
    return permission;
  }

  static async findByName(name) {
    const permission = await db('permissions')
      .where('name', name)
      .first();
    
    return permission;
  }

  static async findAll() {
    const permissions = await db('permissions')
      .select('*');
    
    return permissions;
  }

  static async findByResource(resource) {
    const permissions = await db('permissions')
      .where('resource', resource)
      .select('*');
    
    return permissions;
  }

  static async update(id, permissionData) {
    const [permission] = await db('permissions')
      .where('id', id)
      .update(permissionData)
      .returning('*');
    
    return permission;
  }

  static async delete(id) {
    const deletedCount = await db('permissions')
      .where('id', id)
      .del();
    
    return deletedCount > 0;
  }

  static async getRoles(permissionId) {
    const roles = await db('roles')
      .select('roles.*')
      .join('role_permissions', 'roles.id', 'role_permissions.role_id')
      .where('role_permissions.permission_id', permissionId);
    
    return roles;
  }
}

module.exports = Permission;
