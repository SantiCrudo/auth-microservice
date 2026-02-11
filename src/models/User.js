const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    const { email, password, first_name, last_name, role_id = 2 } = userData;
    
    const hashedPassword = password ? await bcrypt.hash(password, 12) : null;
    
    const [user] = await db('users')
      .insert({
        email,
        password_hash: hashedPassword,
        first_name,
        last_name,
        role_id,
        is_active: true,
        is_verified: false,
      })
      .returning('*');
    
    return user;
  }

  static async findById(id) {
    const user = await db('users')
      .select('users.*', 'roles.name as role_name')
      .leftJoin('roles', 'users.role_id', 'roles.id')
      .where('users.id', id)
      .first();
    
    return user;
  }

  static async findByEmail(email) {
    const user = await db('users')
      .select('users.*', 'roles.name as role_name')
      .leftJoin('roles', 'users.role_id', 'roles.id')
      .where('users.email', email)
      .first();
    
    return user;
  }

  static async findByGoogleId(googleId) {
    const user = await db('users')
      .select('users.*', 'roles.name as role_name')
      .leftJoin('roles', 'users.role_id', 'roles.id')
      .where('users.google_id', googleId)
      .first();
    
    return user;
  }

  static async update(id, userData) {
    const [user] = await db('users')
      .where('id', id)
      .update(userData)
      .returning('*');
    
    return user;
  }

  static async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    const [user] = await db('users')
      .where('id', id)
      .update({
        password_hash: hashedPassword,
        password_reset_token: null,
        password_reset_token_expires: null,
      })
      .returning('*');
    
    return user;
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async setVerificationToken(id, token, expires) {
    const [user] = await db('users')
      .where('id', id)
      .update({
        verification_token: token,
        verification_token_expires: expires,
      })
      .returning('*');
    
    return user;
  }

  static async setPasswordResetToken(id, token, expires) {
    const [user] = await db('users')
      .where('id', id)
      .update({
        password_reset_token: token,
        password_reset_token_expires: expires,
      })
      .returning('*');
    
    return user;
  }

  static async findByVerificationToken(token) {
    const user = await db('users')
      .where('verification_token', token)
      .andWhere('verification_token_expires', '>', new Date())
      .first();
    
    return user;
  }

  static async findByPasswordResetToken(token) {
    const user = await db('users')
      .where('password_reset_token', token)
      .andWhere('password_reset_token_expires', '>', new Date())
      .first();
    
    return user;
  }

  static async verifyEmail(id) {
    const [user] = await db('users')
      .where('id', id)
      .update({
        is_verified: true,
        verification_token: null,
        verification_token_expires: null,
      })
      .returning('*');
    
    return user;
  }

  static async updateLastLogin(id) {
    await db('users')
      .where('id', id)
      .update({
        last_login: new Date(),
      });
  }

  static async enableTwoFactor(id, secret) {
    const [user] = await db('users')
      .where('id', id)
      .update({
        two_factor_enabled: true,
        two_factor_secret: secret,
      })
      .returning('*');
    
    return user;
  }

  static async disableTwoFactor(id) {
    const [user] = await db('users')
      .where('id', id)
      .update({
        two_factor_enabled: false,
        two_factor_secret: null,
      })
      .returning('*');
    
    return user;
  }

  static async getPermissions(userId) {
    const permissions = await db('permissions')
      .select('permissions.*')
      .join('role_permissions', 'permissions.id', 'role_permissions.permission_id')
      .join('roles', 'role_permissions.role_id', 'roles.id')
      .join('users', 'roles.id', 'users.role_id')
      .where('users.id', userId);
    
    return permissions;
  }

  static async hasPermission(userId, permissionName) {
    const permission = await db('permissions')
      .select('permissions.*')
      .join('role_permissions', 'permissions.id', 'role_permissions.permission_id')
      .join('roles', 'role_permissions.role_id', 'roles.id')
      .join('users', 'roles.id', 'users.role_id')
      .where('users.id', userId)
      .andWhere('permissions.name', permissionName)
      .first();
    
    return !!permission;
  }
}

module.exports = User;
