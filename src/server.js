/**
 * Authentication Microservice
 * 
 * A production-ready authentication and authorization microservice featuring:
 * - JWT authentication with access/refresh tokens
 * - Google OAuth integration
 * - Two-factor authentication (2FA)
 * - Role-based access control (RBAC)
 * - Rate limiting and security best practices
 * - Email services for verification and password reset
 */

require('dotenv').config();
const express = require('express');
const {
  securityMiddleware,
  cors,
  requestLogger,
  errorHandler,
  notFoundHandler,
  sanitizeInput,
  validateContentType,
} = require('./middleware/security');
const {
  generalLimiter,
  authLimiter,
  passwordResetLimiter,
  emailVerificationLimiter,
  registrationLimiter,
  profileUpdateLimiter,
  passwordChangeLimiter,
  tokenRefreshLimiter,
} = require('./middleware/rateLimiter');

const authRoutes = require('./routes/auth');
const oauthRoutes = require('./routes/oauth');
const twoFactorRoutes = require('./routes/twoFactor');
const adminRoutes = require('./routes/admin');
const tokenRoutes = require('./routes/tokens');

const app = express();
const PORT = process.env.PORT || 4000;

// Security middleware
app.use(securityMiddleware);
app.use(cors);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Custom middleware
app.use(sanitizeInput);
app.use(validateContentType);
app.use(requestLogger);

// Rate limiting
app.use(generalLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/2fa', twoFactorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tokens', tokenRoutes);

// Apply specific rate limiters to sensitive endpoints
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', registrationLimiter);
app.use('/api/auth/request-password-reset', passwordResetLimiter);
app.use('/api/auth/resend-verification', emailVerificationLimiter);
app.use('/api/auth/refresh', tokenRefreshLimiter);
app.use('/api/auth/profile', profileUpdateLimiter);
app.use('/api/auth/change-password', passwordChangeLimiter);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Auth Microservice running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 API endpoints: http://localhost:${PORT}/api/auth`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
