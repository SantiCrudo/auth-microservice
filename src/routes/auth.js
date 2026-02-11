const express = require('express');
const { body } = require('express-validator');
const AuthController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  body('first_name').trim().isLength({ min: 1 }).withMessage('First name is required'),
  body('last_name').trim().isLength({ min: 1 }).withMessage('Last name is required'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const refreshTokenValidation = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
];

const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters long'),
];

const updateProfileValidation = [
  body('first_name').optional().trim().isLength({ min: 1 }).withMessage('First name cannot be empty'),
  body('last_name').optional().trim().isLength({ min: 1 }).withMessage('Last name cannot be empty'),
];

// Public routes
router.post('/register', registerValidation, AuthController.register);
router.post('/login', loginValidation, AuthController.login);
router.post('/refresh', refreshTokenValidation, AuthController.refresh);
router.post('/request-password-reset', [
  body('email').isEmail().normalizeEmail()
], AuthController.requestPasswordReset);
router.post('/reset-password', resetPasswordValidation, AuthController.resetPassword);
router.get('/verify-email', AuthController.verifyEmail);

// Protected routes
router.post('/logout', authenticate, AuthController.logout);
router.post('/logout-all', authenticate, AuthController.logoutAll);
router.post('/resend-verification', authenticate, AuthController.resendVerification);
router.get('/profile', authenticate, AuthController.getProfile);
router.put('/profile', authenticate, updateProfileValidation, AuthController.updateProfile);
router.post('/change-password', authenticate, changePasswordValidation, AuthController.changePassword);

module.exports = router;
