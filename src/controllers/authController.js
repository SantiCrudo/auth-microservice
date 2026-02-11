/**
 * Authentication Controller
 * 
 * Handles HTTP requests for user authentication operations including:
 * - User registration and login
 * - Email verification
 * - Password reset
 * - Profile management
 * - Token refresh and logout
 */

const AuthService = require('../services/authService');
const User = require('../models/User');
const EmailService = require('../services/emailService');
const { v4: uuidv4 } = require('uuid');

class AuthController {
  static async register(req, res) {
    try {
      const { email, password, first_name, last_name } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      const result = await AuthService.register(
        { email, password, first_name, last_name },
        ipAddress,
        userAgent
      );

      const verificationToken = uuidv4();
      const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      await User.setVerificationToken(result.user.id, verificationToken, tokenExpires);
      
      try {
        await EmailService.sendVerificationEmail(email, verificationToken);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
      }

      res.status(201).json({
        message: 'User registered successfully. Please check your email to verify your account.',
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      const result = await AuthService.login(email, password, ipAddress, userAgent);

      res.json({
        message: 'Login successful',
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  }

  static async refresh(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token required' });
      }

      const result = await AuthService.refreshTokens(refreshToken);

      res.json({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  }

  static async logout(req, res) {
    try {
      const { refreshToken } = req.body;
      const token = req.headers.authorization?.substring(7);

      if (refreshToken) {
        await AuthService.logout(refreshToken);
      }

      if (token) {
        const redisClient = require('../config/redis');
        await redisClient.setex(`blacklist:${token}`, 900, 'true'); // 15 minutes
      }

      res.json({ message: 'Logout successful' });
    } catch (error) {
      res.status(500).json({ error: 'Logout failed' });
    }
  }

  static async logoutAll(req, res) {
    try {
      const token = req.headers.authorization?.substring(7);

      await AuthService.logoutAll(req.user.id);

      if (token) {
        const redisClient = require('../config/redis');
        await redisClient.setex(`blacklist:${token}`, 900, 'true'); // 15 minutes
      }

      res.json({ message: 'Logged out from all devices' });
    } catch (error) {
      res.status(500).json({ error: 'Logout from all devices failed' });
    }
  }

  static async verifyEmail(req, res) {
    try {
      const { token } = req.query;

      if (!token) {
        return res.status(400).json({ error: 'Verification token required' });
      }

      const user = await User.findByVerificationToken(token);
      if (!user) {
        return res.status(400).json({ error: 'Invalid or expired verification token' });
      }

      await User.verifyEmail(user.id);

      res.json({ message: 'Email verified successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Email verification failed' });
    }
  }

  static async resendVerification(req, res) {
    try {
      const user = await User.findById(req.user.id);
      
      if (user.is_verified) {
        return res.status(400).json({ error: 'Email already verified' });
      }

      const verificationToken = uuidv4();
      const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      await User.setVerificationToken(user.id, verificationToken, tokenExpires);
      
      await EmailService.sendVerificationEmail(user.email, verificationToken);

      res.json({ message: 'Verification email sent successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to resend verification email' });
    }
  }

  static async requestPasswordReset(req, res) {
    try {
      const { email } = req.body;

      const user = await User.findByEmail(email);
      if (!user) {
        return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
      }

      const resetToken = uuidv4();
      const tokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      
      await User.setPasswordResetToken(user.id, resetToken, tokenExpires);
      
      await EmailService.sendPasswordResetEmail(email, resetToken);

      res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to process password reset request' });
    }
  }

  static async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ error: 'Reset token and new password required' });
      }

      const user = await User.findByPasswordResetToken(token);
      if (!user) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }

      await User.updatePassword(user.id, newPassword);

      const redisClient = require('../config/redis');
      await AuthService.logoutAll(user.id);

      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Password reset failed' });
    }
  }

  static async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id);
      
      res.json({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role_name,
        is_verified: user.is_verified,
        is_active: user.is_active,
        two_factor_enabled: user.two_factor_enabled,
        last_login: user.last_login,
        created_at: user.created_at,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  }

  static async updateProfile(req, res) {
    try {
      const { first_name, last_name } = req.body;
      
      const user = await User.update(req.user.id, {
        first_name,
        last_name,
      });

      res.json({
        message: 'Profile updated successfully',
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role_name,
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }

  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password required' });
      }

      const user = await User.findById(req.user.id);
      
      const isValidPassword = await User.verifyPassword(currentPassword, user.password_hash);
      if (!isValidPassword) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      await User.updatePassword(req.user.id, newPassword);

      await AuthService.logoutAll(req.user.id);

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to change password' });
    }
  }
}

module.exports = AuthController;
