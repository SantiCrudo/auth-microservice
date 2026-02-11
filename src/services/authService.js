/**
 * Authentication Service
 * 
 * Core business logic for authentication operations including:
 * - JWT token generation and validation
 * - User registration and login
 * - Password hashing and verification
 * - Token refresh and revocation
 * - Login attempt tracking
 */

const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const LoginAttempt = require('../models/LoginAttempt');
require('dotenv').config();

class AuthService {
  static generateTokens(user) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role_name,
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    });

    const refreshToken = jwt.sign(
      { id: user.id, tokenVersion: uuidv4() },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    return { accessToken, refreshToken };
  }

  static async register(userData, ipAddress, userAgent) {
    const { email, password, first_name, last_name } = userData;

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const user = await User.create({
      email,
      password,
      first_name,
      last_name,
    });

    const { accessToken, refreshToken } = this.generateTokens(user);

    await RefreshToken.create({
      user_id: user.id,
      token: refreshToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    await LoginAttempt.create({
      email,
      ip_address: ipAddress,
      user_agent: userAgent,
      successful: true,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role_name,
        is_verified: user.is_verified,
        is_active: user.is_active,
      },
      accessToken,
      refreshToken,
    };
  }

  static async login(email, password, ipAddress, userAgent) {
    const isBlocked = await LoginAttempt.isBlocked(email);
    if (isBlocked) {
      throw new Error('Account temporarily blocked due to too many failed attempts');
    }

    const isBlockedByIP = await LoginAttempt.isBlockedByIP(ipAddress);
    if (isBlockedByIP) {
      throw new Error('IP address temporarily blocked due to too many failed attempts');
    }

    const user = await User.findByEmail(email);
    if (!user) {
      await LoginAttempt.create({
        email,
        ip_address: ipAddress,
        user_agent: userAgent,
        successful: false,
      });
      throw new Error('Invalid credentials');
    }

    if (!user.is_active) {
      await LoginAttempt.create({
        email,
        ip_address: ipAddress,
        user_agent: userAgent,
        successful: false,
      });
      throw new Error('Account is inactive');
    }

    const isValidPassword = await User.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      await LoginAttempt.create({
        email,
        ip_address: ipAddress,
        user_agent: userAgent,
        successful: false,
      });
      throw new Error('Invalid credentials');
    }

    await LoginAttempt.create({
      email,
      ip_address: ipAddress,
      user_agent: userAgent,
      successful: true,
    });

    await User.updateLastLogin(user.id);

    const { accessToken, refreshToken } = this.generateTokens(user);

    await RefreshToken.create({
      user_id: user.id,
      token: refreshToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role_name,
        is_verified: user.is_verified,
        is_active: user.is_active,
        two_factor_enabled: user.two_factor_enabled,
      },
      accessToken,
      refreshToken,
    };
  }

  static async refreshTokens(refreshToken) {
    const storedToken = await RefreshToken.findByToken(refreshToken);
    if (!storedToken) {
      throw new Error('Invalid refresh token');
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      
      const user = await User.findById(decoded.id);
      if (!user || !user.is_active) {
        throw new Error('User not found or inactive');
      }

      await RefreshToken.revokeToken(refreshToken);

      const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(user);

      await RefreshToken.create({
        user_id: user.id,
        token: newRefreshToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      return { accessToken, refreshToken: newRefreshToken };
    } catch (error) {
      await RefreshToken.revokeToken(refreshToken);
      throw new Error('Invalid refresh token');
    }
  }

  static async logout(refreshToken) {
    await RefreshToken.revokeToken(refreshToken);
  }

  static async logoutAll(userId) {
    await RefreshToken.revokeAllUserTokens(userId);
  }

  static verifyAccessToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  static async getUserFromToken(token) {
    const decoded = this.verifyAccessToken(token);
    const user = await User.findById(decoded.id);
    
    if (!user || !user.is_active) {
      throw new Error('User not found or inactive');
    }

    return {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role_name,
      is_verified: user.is_verified,
      is_active: user.is_active,
      two_factor_enabled: user.two_factor_enabled,
    };
  }
}

module.exports = AuthService;
