# 🚀 Guía Simple - Microservicio de Autenticación

## 🎯 ¿Qué es esto?

Un sistema completo para manejar usuarios, login, registro y seguridad en tus aplicaciones.

---

## 📋 Lo Básico que Necesitas Saber

### 🔑 **Registro y Login**
- **Registro**: Crear cuenta nueva con email y contraseña
- **Login**: Entrar con tus credenciales
- **Tokens**: Recibes dos "llaves" para acceder

### 📧 **Verificación por Email**
- Después de registrarte, revisa tu email
- Haz clic en el enlace para activar tu cuenta
- Sin email verificado = no puedes usar todo el sistema

### 🔐 **Seguridad**
- **Contraseñas**: Se guardan de forma segura (nadie las ve)
- **Tokens**: Expiran rápido por seguridad
- **2FA**: Doble verificación opcional

---

## 🛠️ ¿Cómo Empezar?

### **Paso 1: Inicia el Servidor**
```bash
npm run dev
```
El servidor corre en: `http://localhost:3000`

### **Paso 2: Crea tu Primer Usuario**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tu-email@ejemplo.com",
    "password": "TuPassword123!",
    "first_name": "Tu Nombre",
    "last_name": "Tu Apellido"
  }'
```

### **Paso 3: Revisa tu Email**
- Busca un email de verificación
- Haz clic en el enlace
- ¡Listo! Tu cuenta está activa

### **Paso 4: Inicia Sesión**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tu-email@ejemplo.com",
    "password": "TuPassword123!"
  }'
```

---

## 🎭 Roles (Quién puede hacer qué)

### **Usuario Normal** (la mayoría)
- ✅ Ver y editar su perfil
- ✅ Cambiar su contraseña
- ❌ No puede ver otros usuarios

### **Administrador** (Admin)
- ✅ Puede hacer TODO
- ✅ Ver todos los usuarios
- ✅ Crear, editar, eliminar usuarios
- ✅ Acceso al panel de administración

### **Moderador**
- ✅ Ver usuarios
- ✅ Acceso limitado al panel admin
- ❌ No puede eliminar usuarios

---

## 📱 Funciones Principales

### **👤 Perfil de Usuario**
```bash
# Ver tu perfil
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer TU_TOKEN"

# Actualizar tu perfil
curl -X PUT http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Nuevo Nombre",
    "last_name": "Nuevo Apellido"
  }'
```

### **🔑 Cambiar Contraseña**
```bash
curl -X POST http://localhost:3000/api/auth/change-password \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "PasswordActual",
    "newPassword": "PasswordNuevo123!"
  }'
```

### **📧 Recuperar Contraseña**
```bash
# Paso 1: Pedir reset
curl -X POST http://localhost:3000/api/auth/request-password-reset \
  -H "Content-Type: application/json" \
  -d '{"email": "tu-email@ejemplo.com"}'

# Paso 2: Usar token del email
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "TOKEN_DEL_EMAIL",
    "newPassword": "NuevoPassword123!"
  }'
```

### **🌐 Login con Google**
```bash
curl -X POST http://localhost:3000/api/oauth/google \
  -H "Content-Type: application/json" \
  -d '{"accessToken": "TOKEN_DE_GOOGLE"}'
```

---

## 🔐 Doble Autenticación (2FA)

### **¿Qué es?**
Una capa extra de seguridad además de tu contraseña.

### **¿Cómo activarla?**
1. Ve a tu app de autenticación (Google Authenticator)
2. Escanea el código QR que te da el sistema
3. Ingresa el código de 6 dígitos

### **¿Cómo usarla?**
Cuando haces login, después de tu contraseña:
1. Abre tu app de autenticación
2. Copia el código de 6 dígitos
3. Ingrésalo cuando te lo pida

---

## 🚨 Problemas Comunes y Soluciones

### **❌ "No llegan los emails"**
- **Solución**: Configura Gmail con "App Password"
- **Guía**: Ejecuta `npm run test-email` para probar

### **❌ "Access token required"**
- **Solución**: Debes incluir el token en el header
- **Formato**: `Authorization: Bearer TU_TOKEN`

### **❌ "The client is closed"**
- **Solución**: Reinicia el servidor
- **Comando**: `npm run dev`

### **❌ "Ruta no encontrada"**
- **Solución**: Verifica que el endpoint exista
- **Ejemplo**: `/api/admin/users` (no `/admin/users`)

---

## 📋 Tokens (Tus Llaves de Acceso)

### **¿Cómo ver tus tokens?**
```bash
curl -X GET http://localhost:3000/api/tokens/my-tokens \
  -H "Authorization: Bearer TU_TOKEN"
```

### **¿Para qué sirven?**
- **Access Token**: Para acceder a endpoints (dura 15 min)
- **Refresh Token**: Para obtener nuevos access tokens (dura 7 días)

---

## 🎯 Endpoints Principales

| Acción | Método | URL | ¿Qué necesitas? |
|---------|---------|------|------------------|
| Registro | POST | `/api/auth/register` | email, password, nombre |
| Login | POST | `/api/auth/login` | email, password |
| Ver perfil | GET | `/api/auth/profile` | Token en header |
| Logout | POST | `/api/auth/logout` | Token + refresh token |
| Recuperar pass | POST | `/api/auth/request-password-reset` | email |
| Login Google | POST | `/api/oauth/google` | Token de Google |

---

## 💡 Tips Importantes

### **🔐 Seguridad**
- **Nunca compartas tus tokens**
- **Usa HTTPS en producción**
- **Activa 2FA si puedes**

### **📱 Desarrollo**
- **Usa Postman o Insomnia** para probar
- **Revisa la consola** para ver errores
- **Los tokens expiran rápido** - refresca cuando sea necesario

### **🛠️ Mantenimiento**
- **Reinicia el servidor** si hay errores raros
- **Revisa los logs** para debugging
- **Haz backup** de la base de datos regularmente

---

## 🎯 Resumen Rápido

1. **Registra usuarios** → Reciben email de verificación
2. **Verifican email** → Cuenta activa
3. **Hacen login** → Obtienen tokens
4. **Usan tokens** → Acceden a endpoints protegidos
5. **Admins** → Pueden gestionar todo el sistema
6. **Usuarios normales** → Solo gestionan su perfil

---

## 🆘 ¿Necesitas Ayuda?

- **Revisa esta guía** primero
- **Usa los endpoints de prueba** para debugging
- **Los errores son específicos** - léelos con atención
- **Los tokens son como contraseñas** - ¡protégelos!

¡Listo! Ahora tienes todo lo básico para usar el microservicio de autenticación. 🚀
