const express = require('express');
const { body, param } = require('express-validator');
const TokenController = require('../controllers/tokenController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all token routes
router.use(authenticate);

// Get current user's tokens
router.get('/my-tokens', TokenController.getMyTokens);

// Revoke specific token
router.delete('/revoke/:tokenId', 
  param('tokenId').isInt(),
  TokenController.revokeToken
);

// Revoke all tokens
router.delete('/revoke-all', TokenController.revokeAllTokens);

// Validate refresh token
router.post('/validate-refresh', 
  body('refreshToken').notEmpty(),
  TokenController.refreshToken
);

module.exports = router;
