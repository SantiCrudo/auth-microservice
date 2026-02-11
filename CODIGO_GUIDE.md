# 🔧 **Guía de Funciones Principales**

## 📋 **Arquitectura General**

```
src/
├── server.js              ← Punto de entrada principal
├── config/                ← Configuraciones (DB, Redis, Google)
├── controllers/           ← Lógica de negocio
├── services/              ← Servicios principales
├── routes/                ← Definición de endpoints
├── models/                ← Modelos de base de datos
├── middleware/            ← Middlewares (auth, rate limiting)
└── utils/                 ← Utilidades varias
```

---

## 🚀 **server.js - Punto de Entrada**

### **Funciones principales:**
- **Inicializa Express** y configura middlewares
- **Conecta a PostgreSQL y Redis**
- **Registra todas las rutas** (`/api/auth`, `/api/admin`, `/api/oauth`, `/api/2fa`)
- **Inicia servidor** en puerto 3000
- **Maneja graceful shutdown**

### **Middlewares configurados:**
- `helmet()` - Seguridad HTTP
- `cors()` - Cross-origin requests
- `express.json()` - Parse JSON
- `rateLimiter` - Rate limiting global

---

## 🔐 **Autenticación Principal**

### **authController.js**
```javascript
// Funciones clave:
register()     - Registro de nuevo usuario
login()        - Login con email/password
logout()       - Cierre de sesión
refreshToken() - Refrescar access token
verifyEmail()  - Verificación de email
resetPassword() - Reset de contraseña
```

### **authService.js**
```javascript
// Lógica central:
generateTokens() - Crea access + refresh tokens
register()       - Proceso completo de registro
login()          - Validación y generación de tokens
```

### **JWT Structure:**
```javascript
// Access Token (15 min)
{
  id: user.id,
  email: user.email,
  role: user.role_name
}

// Refresh Token (7 días)
{
  id: user.id,
  tokenVersion: uuidv4()
}
```

---

## 👥 **Sistema RBAC (Roles y Permisos)**

### **adminController.js**
```javascript
// Gestión de usuarios:
getAllUsers()     - Listar usuarios con paginación
getUserById()     - Ver detalles de usuario
updateUser()      - Actualizar usuario
deleteUser()      - Eliminar usuario

// Gestión de roles:
getAllRoles()     - Listar roles
createRole()      - Crear nuevo rol
updateRole()      - Actualizar rol
deleteRole()      - Eliminar rol

// Dashboard:
getDashboard()    - Estadísticas del sistema
```

### **Middleware de Autorización:**
```javascript
// rbac.js
requirePermission(permissionName) - Verifica permiso específico
requireRole(roleName)            - Verifica rol específico
```

### **Permisos disponibles:**
- `users.create`, `users.read`, `users.update`, `users.delete`
- `roles.create`, `roles.read`, `roles.update`, `roles.delete`

---

## 🔗 **OAuth 2.0 (Google Login)**

### **oauthController.js**
```javascript
googleLogin()     - Login con Google
getAuthUrl()      - Obtener URL de auth
linkAccount()     - Vincular cuenta Google
unlinkAccount()   - Desvincular cuenta Google
```

### **oauthService.js**
```javascript
getGoogleUserInfo() - Obtiene datos de Google API
authenticateWithGoogle() - Proceso de auth OAuth
```

### **Flujo OAuth:**
1. Usuario obtiene URL de auth
2. Redirección a Google
3. Google devuelve `code`
4. Intercambio `code` por `access_token`
5. Obtener datos del usuario
6. Crear/actualizar usuario local

---

## 🔐 **2FA (Autenticación de Dos Factores)**

### **twoFactorController.js**
```javascript
setup2FA()           - Iniciar configuración 2FA
verifyEnable2FA()    - Activar 2FA
verify2FA()          - Verificar código 2FA
disable2FA()         - Desactivar 2FA
get2FAStatus()       - Ver estado 2FA
sendEmailCode()      - Enviar código por email
regenerateBackupCodes() - Regenerar códigos backup
```

### **twoFactorService.js**
```javascript
generateSecret()     - Generar secreto TOTP
generateQRCode()     - Crear QR code
verifyToken()        - Verificar código TOTP
generateBackupCodes() - Crear 10 códigos backup
verifyBackupCode()   - Verificar código backup
```

### **Librerías utilizadas:**
- `speakeasy` - Generación TOTP
- `qrcode` - Generación QR codes

---

## 📧 **Sistema de Email**

### **emailService.js**
```javascript
sendVerificationEmail() - Email de verificación
sendPasswordResetEmail() - Email de reset password
send2FAEmail()          - Email con código 2FA
```

### **Configuración SMTP:**
```javascript
// Gmail SMTP
host: 'smtp.gmail.com'
port: 587
secure: false
auth: { user, pass } // App Password
```

### **Templates HTML:**
- `verification.html` - Template de verificación
- `reset-password.html` - Template de reset
- `2fa-email.html` - Template de 2FA

---

## 🗄️ **Base de Datos (PostgreSQL + Knex.js)**

### **Migraciones (database/migrations/):**
1. `001_create_roles_table.js` - Roles del sistema
2. `002_create_permissions_table.js` - Permisos granulares
3. `003_create_role_permissions_table.js` - Relación muchos-a-muchos
4. `004_create_users_table.js` - Usuarios principales
5. `005_create_refresh_tokens_table.js` - Tokens de refresh
6. `006_create_login_attempts_table.js` - Intentos de login

### **Seeds (database/seeds/):**
- `001_roles.js` - Crea roles (admin, user, moderator)
- `002_permissions.js` - Crea 16 permisos base
- `003_role_permissions.js` - Asigna permisos a roles

### **Modelos Principales:**
```javascript
// User.js
static findByEmail() - Buscar usuario por email
static create()      - Crear nuevo usuario
static hasPermission() - Verificar permiso específico

// Role.js
static getPermissions() - Obtener permisos del rol
static addPermission()  - Agregar permiso al rol

// RefreshToken.js
static create()      - Crear refresh token
static revoke()      - Revocar token
static findByToken() - Buscar token activo
```

---

## 🔄 **Redis (Caché y Rate Limiting)**

### **redis.js - Configuración:**
```javascript
// Cliente Redis con retry strategy
const redis = createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  retry_strategy: (options) => { /* lógica de retry */ }
});
```

### **Usos de Redis:**
1. **Rate Limiting** - Límite de requests por IP
2. **Token Blacklist** - Tokens revocados
3. **Session Storage** - Sesiones activas
4. **Cache** - Datos frecuentes

### **rateLimiter.js:**
```javascript
const limiter = rateLimit({
  store: new RedisStore({ client: redisClient }),
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100 // 100 requests por ventana
});
```

---

## 🛡️ **Middleware de Seguridad**

### **auth.js - Autenticación:**
```javascript
verifyToken() - Verificar JWT en headers
extractUser()  - Extraer datos del token
```

### **rbac.js - Autorización:**
```javascript
requirePermission() - Verificar permiso específico
requireRole()       - Verificar rol específico
```

### **rateLimiter.js - Rate Limiting:**
```javascript
// Límites por endpoint:
authLimiter    - 5 requests/min (login, register)
generalLimiter - 100 requests/min (endpoints normales)
adminLimiter   - 200 requests/min (admin endpoints)
```

---

## 📊 **Endpoints Principales**

### **Autenticación:**
```
POST /api/auth/register           - Registro
POST /api/auth/login              - Login
POST /api/auth/logout             - Logout
POST /api/auth/refresh            - Refrescar token
GET  /api/auth/profile            - Ver perfil
PUT  /api/auth/profile            - Actualizar perfil
```

### **Administración:**
```
GET  /api/admin/dashboard         - Dashboard admin
GET  /api/admin/users             - Listar usuarios
PUT  /api/admin/users/:id         - Actualizar usuario
GET  /api/admin/roles             - Listar roles
POST /api/admin/roles             - Crear rol
```

### **OAuth:**
```
POST /api/oauth/google            - Login Google
GET  /api/oauth/google/auth-url   - URL auth Google
POST /api/oauth/google/link       - Vincular cuenta
```

### **2FA:**
```
POST /api/2fa/setup               - Configurar 2FA
POST /api/2fa/verify-enable       - Activar 2FA
POST /api/2fa/verify              - Verificar código
GET  /api/2fa/status              - Ver estado
```

---

## 🎯 **Flujo Completo de Autenticación**

### **1. Registro:**
```
POST /api/auth/register
→ validateInput()
→ hashPassword()
→ createUser()
→ generateTokens()
→ sendVerificationEmail()
→ return { user, tokens }
```

### **2. Login:**
```
POST /api/auth/login
→ checkRateLimit()
→ validateCredentials()
→ check2FA()
→ generateTokens()
→ createRefreshToken()
→ return { user, tokens }
```

### **3. Request Protegida:**
```
GET /api/admin/users
→ verifyToken() (middleware)
→ requirePermission('users.read') (middleware)
→ getAllUsers() (controller)
→ return users
```

---

## 🔧 **Configuración y Variables de Entorno**

### **.env - Variables principales:**
```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=auth_microservice
DB_USER=postgres
DB_PASSWORD=password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

---

## 🚀 **Cómo Iniciar el Proyecto**

### **1. Instalación:**
```bash
npm install
cp .env.example .env
# Configurar variables en .env
```

### **2. Base de datos:**
```bash
npm run migrate    # Crear tablas
npm run seed       # Insertar datos iniciales
```

### **3. Iniciar servidor:**
```bash
npm run dev        # Desarrollo
npm start          # Producción
```

### **4. Test email:**
```bash
npm run test-email  # Probar configuración SMTP
```

---

## 🎯 **Características Implementadas**

✅ **JWT Authentication** (access + refresh tokens)  
✅ **RBAC System** (roles y permisos granulares)  
✅ **OAuth 2.0** (login con Google)  
✅ **2FA/TOTP** (Google Authenticator + backup codes)  
✅ **Email Verification** (SMTP con Gmail)  
✅ **Rate Limiting** (Redis-based)  
✅ **Password Security** (bcrypt, 12 rounds)  
✅ **Token Management** (revocación y blacklist)  
✅ **Admin Dashboard** (gestión completa)  
✅ **API Documentation** (endpoints completos)  
✅ **Docker Support** (contenerización)  
✅ **Error Handling** (centralizado)  
✅ **Security Headers** (Helmet.js)  

---

## 📋 **Resumen de Arquitectura**

**Backend:** Node.js + Express.js  
**Base de Datos:** PostgreSQL + Knex.js  
**Caché:** Redis  
**Autenticación:** JWT + 2FA + OAuth  
**Email:** Nodemailer + Gmail SMTP  
**Security:** bcrypt + Helmet + CORS  
**Rate Limiting:** Redis-based  
**Documentation:** API completa  
**Deployment:** Docker + Docker Compose  

**Es un microservicio de autenticación enterprise-ready, seguro y escalable.** 🚀
