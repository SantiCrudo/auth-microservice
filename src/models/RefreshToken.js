const db = require('../config/database');

class RefreshToken {
  static async create(tokenData) {
    const [token] = await db('refresh_tokens')
      .insert(tokenData)
      .returning('*');
    
    return token;
  }

  static async findByToken(token) {
    const refreshToken = await db('refresh_tokens')
      .where('token', token)
      .andWhere('is_revoked', false)
      .andWhere('expires_at', '>', new Date())
      .first();
    
    return refreshToken;
  }

  static async findByUserId(userId) {
    const tokens = await db('refresh_tokens')
      .where('user_id', userId)
      .andWhere('is_revoked', false)
      .andWhere('expires_at', '>', new Date())
      .select('*');
    
    return tokens;
  }

  static async revokeToken(token) {
    const [refreshToken] = await db('refresh_tokens')
      .where('token', token)
      .update({
        is_revoked: true,
      })
      .returning('*');
    
    return refreshToken;
  }

  static async revokeAllUserTokens(userId) {
    const revokedCount = await db('refresh_tokens')
      .where('user_id', userId)
      .andWhere('is_revoked', false)
      .update({
        is_revoked: true,
      });
    
    return revokedCount;
  }

  static async revokeExpiredTokens() {
    const revokedCount = await db('refresh_tokens')
      .where('expires_at', '<', new Date())
      .andWhere('is_revoked', false)
      .update({
        is_revoked: true,
      });
    
    return revokedCount;
  }

  static async delete(id) {
    const deletedCount = await db('refresh_tokens')
      .where('id', id)
      .del();
    
    return deletedCount > 0;
  }

  static async deleteRevokedTokens() {
    const deletedCount = await db('refresh_tokens')
      .where('is_revoked', true)
      .del();
    
    return deletedCount;
  }
}

module.exports = RefreshToken;
