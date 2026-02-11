const TwoFactorService = require('../services/twoFactorService');
const User = require('../models/User');

class TwoFactorController {
  static async setupTwoFactor(req, res) {
    try {
      const result = await TwoFactorService.enableTwoFactor(req.user.id);

      res.json({
        message: 'Two-factor authentication setup initiated',
        secret: result.secret,
        qrCode: result.qrCode,
        backupCodes: result.backupCodes,
        instructions: {
          step1: 'Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)',
          step2: 'Enter the 6-digit code from your app to verify and enable 2FA',
          step3: 'Save the backup codes in a secure location',
        },
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async verifyAndEnableTwoFactor(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ error: 'Verification token is required' });
      }

      const result = await TwoFactorService.verifyAndEnableTwoFactor(req.user.id, token);

      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async disableTwoFactor(req, res) {
    try {
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({ error: 'Password is required to disable 2FA' });
      }

      const result = await TwoFactorService.disableTwoFactor(req.user.id, password);

      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async verifyTwoFactor(req, res) {
    try {
      const { token, method = 'totp' } = req.body;

      if (!token) {
        return res.status(400).json({ error: 'Verification token is required' });
      }

      let isValid = false;

      switch (method) {
        case 'totp':
          isValid = await TwoFactorService.verifyTwoFactorToken(req.user.id, token);
          break;
        case 'email':
          isValid = await TwoFactorService.verifyEmailCode(req.user.id, token);
          break;
        case 'backup':
          isValid = await TwoFactorService.verifyBackupCode(req.user.id, token);
          break;
        default:
          return res.status(400).json({ error: 'Invalid verification method' });
      }

      if (isValid) {
        res.json({ message: 'Two-factor verification successful' });
      } else {
        res.status(400).json({ error: 'Invalid verification code' });
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async sendEmailCode(req, res) {
    try {
      const result = await TwoFactorService.generateEmailCode(req.user.id);

      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getTwoFactorStatus(req, res) {
    try {
      const user = await User.findById(req.user.id);

      res.json({
        twoFactorEnabled: user.two_factor_enabled,
        hasPassword: !!user.password_hash,
        hasGoogleAuth: !!user.google_id,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch 2FA status' });
    }
  }

  static async regenerateBackupCodes(req, res) {
    try {
      const user = await User.findById(req.user.id);

      if (!user.two_factor_enabled) {
        return res.status(400).json({ error: 'Two-factor authentication is not enabled' });
      }

      const backupCodes = TwoFactorService.generateBackupCodes();

      res.json({
        message: 'New backup codes generated',
        backupCodes,
        warning: 'Save these codes in a secure location. Old backup codes are now invalid.',
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to regenerate backup codes' });
    }
  }
}

module.exports = TwoFactorController;
