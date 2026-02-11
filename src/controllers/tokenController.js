const RefreshToken = require('../models/RefreshToken');
const db = require('../config/database');

class TokenController {
  static async getMyTokens(req, res) {
    try {
      const userId = req.user.id;
      
      // Verificar que la conexión a la base de datos esté activa
      if (!db.client) {
        return res.status(500).json({ error: 'Database connection not available' });
      }
      
      // Obtener refresh tokens activos del usuario
      const refreshTokens = await RefreshToken.findByUserId(userId);
      
      // Información del access token actual
      const currentAccessToken = req.headers.authorization?.replace('Bearer ', '');
      
      // Decodificar access token para obtener información (sin verificar firma)
      let tokenInfo = null;
      if (currentAccessToken) {
        try {
          const decoded = JSON.parse(Buffer.from(currentAccessToken.split('.')[1], 'base64'));
          tokenInfo = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role,
            iat: decoded.iat,
            exp: decoded.exp,
            expiresIn: decoded.exp - Math.floor(Date.now() / 1000)
          };
        } catch (error) {
          // Si hay error al decodificar, el token es inválido
          tokenInfo = { error: 'Invalid token format' };
        }
      }

      res.json({
        message: 'Your current tokens',
        currentAccessToken: {
          token: currentAccessToken ? `${currentAccessToken.substring(0, 50)}...` : 'No token provided',
          fullToken: currentAccessToken || null,
          info: tokenInfo
        },
        refreshTokens: refreshTokens.map(token => ({
          id: token.id,
          token: `${token.token.substring(0, 50)}...`,
          fullToken: token.token,
          createdAt: token.created_at,
          expiresAt: token.expires_at,
          isRevoked: token.is_revoked,
          expiresIn: Math.floor((new Date(token.expires_at) - new Date()) / 1000)
        })),
        instructions: {
          howToUse: "Copy 'fullToken' value and use it in Authorization header as 'Bearer <token>'",
          security: "Never share your tokens with others. These are like passwords.",
          refresh: "Use refresh token to get new access tokens without logging in again."
        }
      });
    } catch (error) {
      console.error('Error in getMyTokens:', error);
      res.status(500).json({ 
        error: 'Failed to fetch tokens',
        details: error.message 
      });
    }
  }

  static async revokeToken(req, res) {
    try {
      const { tokenId } = req.params;
      const userId = req.user.id;

      // Verificar que el token pertenezca al usuario
      const token = await RefreshToken.findById(tokenId);
      if (!token || token.user_id !== userId) {
        return res.status(404).json({ error: 'Token not found' });
      }

      // Revocar el token
      await RefreshToken.revoke(tokenId);

      res.json({
        message: 'Token revoked successfully',
        revokedToken: {
          id: token.id,
          createdAt: token.created_at
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to revoke token' });
    }
  }

  static async revokeAllTokens(req, res) {
    try {
      const userId = req.user.id;

      // Revocar todos los refresh tokens del usuario
      const revokedCount = await RefreshToken.revokeAllByUserId(userId);

      res.json({
        message: 'All tokens revoked successfully',
        revokedCount,
        instructions: 'You will need to login again to get new tokens'
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to revoke all tokens' });
    }
  }

  static async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;
      const userId = req.user.id;

      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token is required' });
      }

      // Verificar que el refresh token pertenezca al usuario
      const token = await RefreshToken.findByToken(refreshToken);
      if (!token || token.user_id !== userId) {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }

      if (token.is_revoked) {
        return res.status(401).json({ error: 'Refresh token has been revoked' });
      }

      if (new Date(token.expires_at) < new Date()) {
        return res.status(401).json({ error: 'Refresh token expired' });
      }

      // Aquí iría la lógica para generar nuevos tokens
      // Por ahora, solo mostramos información
      res.json({
        message: 'Refresh token is valid',
        refreshTokenInfo: {
          id: token.id,
          createdAt: token.created_at,
          expiresAt: token.expires_at,
          expiresIn: Math.floor((new Date(token.expires_at) - new Date()) / 1000)
        },
        note: 'Use POST /api/auth/refresh to get new access token'
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to validate refresh token' });
    }
  }
}

module.exports = TokenController;
