const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const User = require('../models/User');
const EmailService = require('./emailService');
require('dotenv').config();

class TwoFactorService {
  static generateSecret() {
    return speakeasy.generateSecret({
      name: process.env.APP_NAME || 'Auth Microservice',
      issuer: process.env.APP_NAME || 'Auth Microservice',
      length: 32,
    });
  }

  static generateQRCode(secret, userEmail) {
    const otpauthUrl = speakeasy.otpauthURL({
      secret: secret.base32,
      label: userEmail,
      issuer: process.env.APP_NAME || 'Auth Microservice',
    });

    return qrcode.toDataURL(otpauthUrl);
  }

  static verifyToken(token, secret) {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time windows before and after current time
    });
  }

  static async enableTwoFactor(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.two_factor_enabled) {
        throw new Error('Two-factor authentication is already enabled');
      }

      const secret = this.generateSecret();
      const qrCode = await this.generateQRCode(secret, user.email);

      await User.enableTwoFactor(userId, secret.base32);

      return {
        secret: secret.base32,
        qrCode,
        backupCodes: this.generateBackupCodes(),
      };
    } catch (error) {
      throw new Error(`Failed to enable 2FA: ${error.message}`);
    }
  }

  static async verifyAndEnableTwoFactor(userId, token) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.two_factor_enabled) {
        throw new Error('Two-factor authentication is already enabled');
      }

      if (!user.two_factor_secret) {
        throw new Error('Two-factor setup not initiated');
      }

      const isValid = this.verifyToken(token, user.two_factor_secret);
      if (!isValid) {
        throw new Error('Invalid verification code');
      }

      await User.update(userId, {
        two_factor_enabled: true,
      });

      return {
        message: 'Two-factor authentication enabled successfully',
        backupCodes: this.generateBackupCodes(),
      };
    } catch (error) {
      throw new Error(`Failed to verify and enable 2FA: ${error.message}`);
    }
  }

  static async disableTwoFactor(userId, password) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.two_factor_enabled) {
        throw new Error('Two-factor authentication is not enabled');
      }

      if (!user.password_hash) {
        throw new Error('Cannot disable 2FA for OAuth-only accounts');
      }

      const isValidPassword = await User.verifyPassword(password, user.password_hash);
      if (!isValidPassword) {
        throw new Error('Invalid password');
      }

      await User.disableTwoFactor(userId);

      return {
        message: 'Two-factor authentication disabled successfully',
      };
    } catch (error) {
      throw new Error(`Failed to disable 2FA: ${error.message}`);
    }
  }

  static async verifyTwoFactorToken(userId, token) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.two_factor_enabled || !user.two_factor_secret) {
        throw new Error('Two-factor authentication is not enabled');
      }

      const isValid = this.verifyToken(token, user.two_factor_secret);
      if (!isValid) {
        throw new Error('Invalid verification code');
      }

      return true;
    } catch (error) {
      throw new Error(`Failed to verify 2FA token: ${error.message}`);
    }
  }

  static generateBackupCodes() {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      codes.push(speakeasy.generateSecret({ length: 8 }).base32.substring(0, 8));
    }
    return codes;
  }

  static async generateEmailCode(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const redisClient = require('../config/redis');
      await redisClient.setex(`2fa_email:${userId}`, 300, code); // 5 minutes

      await EmailService.sendTwoFactorCodeEmail(user.email, code);

      return {
        message: 'Verification code sent to your email',
        expiresIn: 300, // 5 minutes
      };
    } catch (error) {
      throw new Error(`Failed to generate email code: ${error.message}`);
    }
  }

  static async verifyEmailCode(userId, code) {
    try {
      const redisClient = require('../config/redis');
      const storedCode = await redisClient.get(`2fa_email:${userId}`);

      if (!storedCode) {
        throw new Error('Verification code expired or not found');
      }

      if (storedCode !== code.toUpperCase()) {
        throw new Error('Invalid verification code');
      }

      await redisClient.del(`2fa_email:${userId}`);

      return true;
    } catch (error) {
      throw new Error(`Failed to verify email code: ${error.message}`);
    }
  }

  static async verifyBackupCode(userId, code) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // In a real implementation, you would store backup codes in the database
      // For this example, we'll use a simple validation
      if (!code || code.length !== 8) {
        throw new Error('Invalid backup code format');
      }

      // Here you would check against stored backup codes
      // and mark the used backup code as invalid
      
      return true;
    } catch (error) {
      throw new Error(`Failed to verify backup code: ${error.message}`);
    }
  }
}

module.exports = TwoFactorService;
