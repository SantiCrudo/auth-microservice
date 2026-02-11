const express = require('express');
const { body } = require('express-validator');
const OAuthController = require('../controllers/oauthController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const googleTokenValidation = [
  body('accessToken').notEmpty().withMessage('Google access token is required'),
];

// Public routes
router.post('/google', googleTokenValidation, OAuthController.googleAuth);
router.get('/google/callback', OAuthController.googleCallback);
router.get('/google/auth-url', OAuthController.getGoogleAuthUrl);

// Protected routes
router.post('/google/link', authenticate, googleTokenValidation, OAuthController.linkGoogleAccount);
router.post('/google/unlink', authenticate, OAuthController.unlinkGoogleAccount);

module.exports = router;
