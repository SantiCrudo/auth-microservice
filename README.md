# Authentication Microservice

A production-ready authentication and authorization microservice built with Node.js and Express, featuring JWT authentication, Google OAuth, two-factor authentication (2FA), and role-based access control (RBAC).

## 🚀 Features

- **User Registration & Login** - Secure user authentication with email verification
- **JWT Authentication** - Access and refresh token system with automatic token rotation
- **Google OAuth** - Social authentication via Google OAuth 2.0
- **Two-Factor Authentication (2FA)** - TOTP-based 2FA with QR code generation
- **Password Reset** - Secure password recovery via email
- **Role-Based Access Control (RBAC)** - Flexible permission system with user roles
- **Rate Limiting** - Redis-based rate limiting to prevent abuse
- **Email Services** - Transactional emails for verification, password reset, and 2FA
- **Security Best Practices** - CORS, helmet security headers, input validation

## 🛠 Tech Stack

- **Runtime**: Node.js (>=18.0.0)
- **Framework**: Express.js
- **Database**: PostgreSQL with Knex.js ORM
- **Cache**: Redis
- **Authentication**: JWT (JSON Web Tokens)
- **OAuth**: Passport.js with Google OAuth 2.0
- **2FA**: Speakeasy (TOTP)
- **Email**: Nodemailer
- **Security**: Helmet, CORS, bcryptjs
- **Validation**: Express-validator
- **Rate Limiting**: Express-rate-limit with Redis

## 🏗 Architecture

This microservice follows a clean, modular architecture:

```
src/
├── config/          # Configuration files (database, redis, passport)
├── controllers/     # Request handlers
├── middleware/      # Custom middleware (auth, rate limiting, security)
├── models/          # Database models
├── routes/          # API routes
├── services/        # Business logic layer
└── utils/           # Utility functions
```

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd auth-microservice
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Set up the database**
```bash
# Using Docker Compose (recommended)
docker-compose -f docker-compose.dev.yml up -d postgres redis

# Or run PostgreSQL and Redis manually
npm run migrate
npm run seed
```

5. **Start the application**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

### Docker Setup

1. **Development environment**
```bash
docker-compose -f docker-compose.dev.yml up -d
```

2. **Production environment**
```bash
docker-compose up -d
```

## API Documentation

### Authentication Endpoints

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <access-token>
```

#### Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Smith"
}
```

#### Change Password
```http
POST /api/auth/change-password
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "currentPassword": "old-password",
  "newPassword": "new-password"
}
```

#### Email Verification
```http
GET /api/auth/verify-email?token=verification-token
```

#### Request Password Reset
```http
POST /api/auth/request-password-reset
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset-token",
  "newPassword": "new-password"
}
```

### OAuth Endpoints

#### Google Authentication
```http
POST /api/oauth/google
Content-Type: application/json

{
  "accessToken": "google-access-token"
}
```

#### Get Google Auth URL
```http
GET /api/oauth/google/auth-url
```

#### Link Google Account
```http
POST /api/oauth/google/link
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "accessToken": "google-access-token"
}
```

#### Unlink Google Account
```http
POST /api/oauth/google/unlink
Authorization: Bearer <access-token>
```

### Two-Factor Authentication Endpoints

#### Setup 2FA
```http
POST /api/2fa/setup
Authorization: Bearer <access-token>
```

#### Verify and Enable 2FA
```http
POST /api/2fa/verify-enable
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "token": "123456"
}
```

#### Disable 2FA
```http
POST /api/2fa/disable
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "password": "user-password"
}
```

#### Verify 2FA Token
```http
POST /api/2fa/verify
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "token": "123456",
  "method": "totp" // totp, email, backup
}
```

#### Send Email Code
```http
POST /api/2fa/send-email-code
Authorization: Bearer <access-token>
```

#### Get 2FA Status
```http
GET /api/2fa/status
Authorization: Bearer <access-token>
```

## Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=auth_microservice
DB_USER=postgres
DB_PASSWORD=password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# OAuth Google
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# 2FA
TWO_FACTOR_SECRET=your-2fa-secret-key

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

## Database Schema

The service uses the following main tables:

- `users` - User accounts and authentication data
- `roles` - User roles (admin, user, moderator)
- `permissions` - System permissions
- `role_permissions` - Role-permission mappings
- `refresh_tokens` - JWT refresh tokens
- `login_attempts` - Login attempt tracking

## Security Features

### Rate Limiting
- General rate limiting (100 requests per 15 minutes)
- Auth endpoints (5 requests per 15 minutes)
- Password reset (3 requests per hour)
- Registration (10 requests per hour)

### Protection Against Attacks
- SQL injection prevention with parameterized queries
- XSS protection with input sanitization
- CSRF protection with security headers
- Brute force protection with account lockout
- Password hashing with bcrypt (12 rounds)

### Token Security
- Short-lived access tokens (15 minutes)
- Refresh tokens with expiration and revocation
- Token blacklisting in Redis
- Secure token storage recommendations

## Development

### Running Tests
```bash
npm test
```

### Database Migrations
```bash
npm run migrate    # Run migrations
npm run rollback   # Rollback last migration
```

### Seeding Data
```bash
npm run seed       # Seed initial data
```

### Code Quality
```bash
npm run lint       # Run ESLint
npm run format     # Format code with Prettier
```

## Deployment

### Production Deployment with Docker
1. Set all required environment variables
2. Build and deploy with Docker Compose
3. Set up reverse proxy (nginx)
4. Configure SSL certificates
5. Set up monitoring and logging

### Environment Considerations
- Use strong, unique secrets for JWT
- Configure proper CORS origins
- Set up email service credentials
- Configure OAuth provider settings
- Enable SSL/TLS in production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please open an issue in the repository or contact the development team.
# auth-microservice
# auth-microservice
