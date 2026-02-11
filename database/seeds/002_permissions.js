exports.seed = function(knex) {
  return knex('permissions')
    .del()
    .then(function () {
      return knex('permissions').insert([
        // User management permissions
        { id: 1, name: 'create_user', description: 'Create new users', resource: 'users', action: 'create' },
        { id: 2, name: 'read_user', description: 'Read user information', resource: 'users', action: 'read' },
        { id: 3, name: 'update_user', description: 'Update user information', resource: 'users', action: 'update' },
        { id: 4, name: 'delete_user', description: 'Delete users', resource: 'users', action: 'delete' },
        
        // Role management permissions
        { id: 5, name: 'create_role', description: 'Create new roles', resource: 'roles', action: 'create' },
        { id: 6, name: 'read_role', description: 'Read role information', resource: 'roles', action: 'read' },
        { id: 7, name: 'update_role', description: 'Update role information', resource: 'roles', action: 'update' },
        { id: 8, name: 'delete_role', description: 'Delete roles', resource: 'roles', action: 'delete' },
        
        // Permission management permissions
        { id: 9, name: 'create_permission', description: 'Create new permissions', resource: 'permissions', action: 'create' },
        { id: 10, name: 'read_permission', description: 'Read permission information', resource: 'permissions', action: 'read' },
        { id: 11, name: 'update_permission', description: 'Update permission information', resource: 'permissions', action: 'update' },
        { id: 12, name: 'delete_permission', description: 'Delete permissions', resource: 'permissions', action: 'delete' },
        
        // Admin panel permissions
        { id: 13, name: 'access_admin_panel', description: 'Access admin panel', resource: 'admin', action: 'read' },
        { id: 14, name: 'view_system_logs', description: 'View system logs', resource: 'admin', action: 'read' },
        
        // Profile permissions (for regular users)
        { id: 15, name: 'update_own_profile', description: 'Update own profile', resource: 'profile', action: 'update' },
        { id: 16, name: 'read_own_profile', description: 'Read own profile', resource: 'profile', action: 'read' },
      ]);
    });
};
