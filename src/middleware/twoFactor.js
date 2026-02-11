const TwoFactorService = require('../services/twoFactorService');
const User = require('../models/User');

const requireTwoFactor = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await User.findById(req.user.id);
    
    if (!user.two_factor_enabled) {
      return next();
    }

    const twoFactorToken = req.headers['x-2fa-token'];
    const twoFactorMethod = req.headers['x-2fa-method'] || 'totp';

    if (!twoFactorToken) {
      return res.status(401).json({ 
        error: 'Two-factor authentication required',
        code: '2FA_REQUIRED',
        methods: ['totp', 'email', 'backup'],
      });
    }

    let isValid = false;

    switch (twoFactorMethod) {
      case 'totp':
        isValid = await TwoFactorService.verifyTwoFactorToken(user.id, twoFactorToken);
        break;
      case 'email':
        isValid = await TwoFactorService.verifyEmailCode(user.id, twoFactorToken);
        break;
      case 'backup':
        isValid = await TwoFactorService.verifyBackupCode(user.id, twoFactorToken);
        break;
      default:
        return res.status(400).json({ error: 'Invalid two-factor method' });
    }

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid two-factor authentication code' });
    }

    req.twoFactorVerified = true;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Two-factor verification failed' });
  }
};

const optionalTwoFactor = async (req, res, next) => {
  try {
    if (!req.user) {
      return next();
    }

    const user = await User.findById(req.user.id);
    
    if (!user.two_factor_enabled) {
      return next();
    }

    const twoFactorToken = req.headers['x-2fa-token'];
    const twoFactorMethod = req.headers['x-2fa-method'] || 'totp';

    if (!twoFactorToken) {
      return next();
    }

    let isValid = false;

    switch (twoFactorMethod) {
      case 'totp':
        isValid = await TwoFactorService.verifyTwoFactorToken(user.id, twoFactorToken);
        break;
      case 'email':
        isValid = await TwoFactorService.verifyEmailCode(user.id, twoFactorToken);
        break;
      case 'backup':
        isValid = await TwoFactorService.verifyBackupCode(user.id, twoFactorToken);
        break;
    }

    req.twoFactorVerified = isValid;
    next();
  } catch (error) {
    next();
  }
};

const requireTwoFactorForSensitive = (action) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const user = await User.findById(req.user.id);
      
      if (!user.two_factor_enabled) {
        return next();
      }

      const twoFactorToken = req.headers['x-2fa-token'];
      const twoFactorMethod = req.headers['x-2fa-method'] || 'totp';

      if (!twoFactorToken) {
        return res.status(401).json({ 
          error: `Two-factor authentication required for ${action}`,
          code: '2FA_REQUIRED',
          action,
        });
      }

      let isValid = false;

      switch (twoFactorMethod) {
        case 'totp':
          isValid = await TwoFactorService.verifyTwoFactorToken(user.id, twoFactorToken);
          break;
        case 'email':
          isValid = await TwoFactorService.verifyEmailCode(user.id, twoFactorToken);
          break;
        case 'backup':
          isValid = await TwoFactorService.verifyBackupCode(user.id, twoFactorToken);
          break;
        default:
          return res.status(400).json({ error: 'Invalid two-factor method' });
      }

      if (!isValid) {
        return res.status(401).json({ error: 'Invalid two-factor authentication code' });
      }

      req.twoFactorVerified = true;
      next();
    } catch (error) {
      res.status(500).json({ error: 'Two-factor verification failed' });
    }
  };
};

module.exports = {
  requireTwoFactor,
  optionalTwoFactor,
  requireTwoFactorForSensitive,
};
