const express = require('express');
const { body } = require('express-validator');
const TwoFactorController = require('../controllers/twoFactorController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const setupTwoFactorValidation = [];
const verifyTwoFactorValidation = [
  body('token').notEmpty().withMessage('Verification token is required'),
  body('method').optional().isIn(['totp', 'email', 'backup']).withMessage('Invalid verification method'),
];
const disableTwoFactorValidation = [
  body('password').notEmpty().withMessage('Password is required to disable 2FA'),
];

// All routes require authentication
router.use(authenticate);

// Two-factor setup and management
router.post('/setup', setupTwoFactorValidation, TwoFactorController.setupTwoFactor);
router.post('/verify-enable', verifyTwoFactorValidation, TwoFactorController.verifyAndEnableTwoFactor);
router.post('/disable', disableTwoFactorValidation, TwoFactorController.disableTwoFactor);
router.get('/status', TwoFactorController.getTwoFactorStatus);

// Two-factor verification
router.post('/verify', verifyTwoFactorValidation, TwoFactorController.verifyTwoFactor);
router.post('/send-email-code', TwoFactorController.sendEmailCode);
router.post('/regenerate-backup-codes', TwoFactorController.regenerateBackupCodes);

module.exports = router;
