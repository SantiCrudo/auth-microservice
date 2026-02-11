const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const redis = require('redis');
require('dotenv').config();

const redisClient = redis.createClient({
  url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
  password: process.env.REDIS_PASSWORD || undefined,
});

// Connect to Redis
redisClient.connect().catch(console.error);

// General rate limiter
const generalLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix: 'rl:general:',
  }),
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for auth endpoints
const authLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix: 'rl:auth:',
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Password reset rate limiter
const passwordResetLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix: 'rl:password-reset:',
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 password reset requests per hour
  message: {
    error: 'Too many password reset attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Email verification rate limiter
const emailVerificationLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix: 'rl:email-verification:',
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 email verification requests per hour
  message: {
    error: 'Too many email verification attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Registration rate limiter
const registrationLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix: 'rl:registration:',
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 registrations per hour
  message: {
    error: 'Too many registration attempts from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Profile update rate limiter
const profileUpdateLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix: 'rl:profile-update:',
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each user to 10 profile updates per 15 minutes
  keyGenerator: (req) => req.user?.id || req.ip,
  message: {
    error: 'Too many profile update attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Password change rate limiter
const passwordChangeLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix: 'rl:password-change:',
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each user to 5 password changes per hour
  keyGenerator: (req) => req.user?.id || req.ip,
  message: {
    error: 'Too many password change attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Token refresh rate limiter
const tokenRefreshLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix: 'rl:token-refresh:',
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 token refresh requests per 15 minutes
  message: {
    error: 'Too many token refresh attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  generalLimiter,
  authLimiter,
  passwordResetLimiter,
  emailVerificationLimiter,
  registrationLimiter,
  profileUpdateLimiter,
  passwordChangeLimiter,
  tokenRefreshLimiter,
};
