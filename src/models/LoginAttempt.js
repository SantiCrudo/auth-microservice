const db = require('../config/database');

class LoginAttempt {
  static async create(attemptData) {
    const [attempt] = await db('login_attempts')
      .insert({
        email: attemptData.email,
        ip_address: attemptData.ip_address,
        user_agent: attemptData.user_agent,
        successful: attemptData.successful || false,
        attempted_at: attemptData.attempted_at || new Date(),
      })
      .returning('*');
    
    return attempt;
  }

  static async getFailedAttempts(email, timeWindow = 15) {
    const timeAgo = new Date(Date.now() - timeWindow * 60 * 1000);
    
    const attempts = await db('login_attempts')
      .where('email', email)
      .andWhere('successful', false)
      .andWhere('attempted_at', '>', timeAgo)
      .count('* as count')
      .first();
    
    return parseInt(attempts.count);
  }

  static async getFailedAttemptsByIP(ipAddress, timeWindow = 60) {
    const timeAgo = new Date(Date.now() - timeWindow * 60 * 1000);
    
    const attempts = await db('login_attempts')
      .where('ip_address', ipAddress)
      .andWhere('successful', false)
      .andWhere('attempted_at', '>', timeAgo)
      .count('* as count')
      .first();
    
    return parseInt(attempts.count);
  }

  static async isBlocked(email, maxAttempts = 5, timeWindow = 15) {
    const failedAttempts = await this.getFailedAttempts(email, timeWindow);
    return failedAttempts >= maxAttempts;
  }

  static async isBlockedByIP(ipAddress, maxAttempts = 20, timeWindow = 60) {
    const failedAttempts = await this.getFailedAttemptsByIP(ipAddress, timeWindow);
    return failedAttempts >= maxAttempts;
  }

  static async cleanupOldAttempts(daysOld = 30) {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    
    const deletedCount = await db('login_attempts')
      .where('attempted_at', '<', cutoffDate)
      .del();
    
    return deletedCount;
  }

  static async getRecentAttempts(email, limit = 10) {
    const attempts = await db('login_attempts')
      .where('email', email)
      .orderBy('attempted_at', 'desc')
      .limit(limit)
      .select('*');
    
    return attempts;
  }
}

module.exports = LoginAttempt;
