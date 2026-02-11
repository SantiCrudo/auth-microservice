const OAuthService = require('../services/oauthService');
const { body } = require('express-validator');

class OAuthController {
  static async googleAuth(req, res) {
    try {
      const { accessToken } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      if (!accessToken) {
        return res.status(400).json({ error: 'Google access token is required' });
      }

      const result = await OAuthService.authenticateWithGoogle(accessToken, ipAddress, userAgent);

      res.json({
        message: 'Google authentication successful',
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  }

  static async googleCallback(req, res) {
    try {
      const { code } = req.query;
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      if (!code) {
        return res.status(400).json({ error: 'Authorization code is required' });
      }

      const tokens = await OAuthService.exchangeCodeForTokens(code);
      const result = await OAuthService.authenticateWithGoogle(tokens.access_token, ipAddress, userAgent);

      res.json({
        message: 'Google authentication successful',
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  }

  static async linkGoogleAccount(req, res) {
    try {
      const { accessToken } = req.body;

      if (!accessToken) {
        return res.status(400).json({ error: 'Google access token is required' });
      }

      const result = await OAuthService.linkGoogleAccount(req.user.id, accessToken);

      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async unlinkGoogleAccount(req, res) {
    try {
      const result = await OAuthService.unlinkGoogleAccount(req.user.id);

      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getGoogleAuthUrl(req, res) {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const redirectUri = process.env.GOOGLE_CALLBACK_URL;
      const scope = 'email profile openid';
      const responseType = 'code';
      const state = Math.random().toString(36).substring(2, 15);

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `response_type=${responseType}&` +
        `state=${state}`;

      res.json({
        authUrl,
        state,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate Google auth URL' });
    }
  }
}

module.exports = OAuthController;
