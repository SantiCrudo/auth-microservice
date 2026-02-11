const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const AuthService = require('./authService');
require('dotenv').config();

class OAuthService {
  static async getGoogleUserInfo(accessToken) {
    try {
      const response = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return {
        id: response.data.id,
        email: response.data.email,
        name: response.data.name,
        first_name: response.data.given_name,
        last_name: response.data.family_name,
        picture: response.data.picture,
        verified_email: response.data.verified_email,
      };
    } catch (error) {
      throw new Error('Failed to fetch user info from Google');
    }
  }

  static async authenticateWithGoogle(accessToken, ipAddress, userAgent) {
    try {
      const googleUserInfo = await this.getGoogleUserInfo(accessToken);

      if (!googleUserInfo.verified_email) {
        throw new Error('Email not verified by Google');
      }

      let user = await User.findByGoogleId(googleUserInfo.id);

      if (!user) {
        user = await User.findByEmail(googleUserInfo.email);
        
        if (user) {
          user = await User.update(user.id, {
            google_id: googleUserInfo.id,
            is_verified: true,
          });
        } else {
          user = await User.create({
            email: googleUserInfo.email,
            first_name: googleUserInfo.first_name,
            last_name: googleUserInfo.last_name,
            google_id: googleUserInfo.id,
            is_active: true,
            is_verified: true,
          });
        }
      }

      if (!user.is_active) {
        throw new Error('Account is inactive');
      }

      await User.updateLastLogin(user.id);

      const { accessToken: jwtToken, refreshToken } = AuthService.generateTokens(user);

      const RefreshToken = require('../models/RefreshToken');
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
          picture: googleUserInfo.picture,
        },
        accessToken: jwtToken,
        refreshToken,
      };
    } catch (error) {
      throw new Error(`Google authentication failed: ${error.message}`);
    }
  }

  static async linkGoogleAccount(userId, accessToken) {
    try {
      const googleUserInfo = await this.getGoogleUserInfo(accessToken);

      const existingUser = await User.findByGoogleId(googleUserInfo.id);
      if (existingUser) {
        throw new Error('Google account is already linked to another user');
      }

      const user = await User.update(userId, {
        google_id: googleUserInfo.id,
      });

      return {
        message: 'Google account linked successfully',
        user: {
          id: user.id,
          email: user.email,
          google_id: user.google_id,
        },
      };
    } catch (error) {
      throw new Error(`Failed to link Google account: ${error.message}`);
    }
  }

  static async unlinkGoogleAccount(userId) {
    try {
      const user = await User.findById(userId);
      
      if (!user.google_id) {
        throw new Error('No Google account linked');
      }

      if (!user.password_hash) {
        throw new Error('Cannot unlink Google account without a password. Please set a password first.');
      }

      const updatedUser = await User.update(userId, {
        google_id: null,
      });

      return {
        message: 'Google account unlinked successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          google_id: updatedUser.google_id,
        },
      };
    } catch (error) {
      throw new Error(`Failed to unlink Google account: ${error.message}`);
    }
  }

  static async exchangeCodeForTokens(code) {
    try {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.GOOGLE_CALLBACK_URL,
      });

      return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_in: response.data.expires_in,
        token_type: response.data.token_type,
      };
    } catch (error) {
      throw new Error('Failed to exchange authorization code for tokens');
    }
  }
}

module.exports = OAuthService;
