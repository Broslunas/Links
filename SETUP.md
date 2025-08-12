# Configuración del Proyecto URL Shortener

## Problema de Autenticación Resuelto

Si experimentas problemas donde te quedas atascado en la página de autenticación después de iniciar sesión, sigue estos pasos:

### 1. Verificar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/url-shortener

# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu-clave-secreta-aqui

# OAuth Providers (al menos uno es requerido)
GITHUB_CLIENT_ID=tu-github-client-id
GITHUB_CLIENT_SECRET=tu-github-client-secret

GOOGLE_CLIENT_ID=tu-google-client-id
GOOGLE_CLIENT_SECRET=tu-google-client-secret

# App Configuration
APP_URL=http://localhost:3000

# Security
IP_HASH_SECRET=tu-clave-secreta-para-hash-ip
```

### 2. Configurar OAuth Providers

#### GitHub OAuth App:
1. Ve a GitHub Settings > Developer settings > OAuth Apps
2. Crea una nueva OAuth App
3. Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

#### Google OAuth App:
1. Ve a Google Cloud Console
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita Google+ API
4. Crea credenciales OAuth 2.0
5. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`

### 3. Configurar MongoDB

1. Crea una cuenta en MongoDB Atlas
2. Crea un cluster
3. Configura un usuario de base de datos
4. Obtén la cadena de conexión
5. Reemplaza `<password>` con tu contraseña real

### 4. Generar NEXTAUTH_SECRET

Ejecuta este comando para generar una clave secreta:

```bash
openssl rand -base64 32
```

O usa este comando de Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 5. Verificar Configuración

El proyecto incluye utilidades de debug que mostrarán información de configuración en la consola durante el desarrollo.

### 6. Reiniciar el Servidor

Después de configurar las variables de entorno:

```bash
npm run dev
```

### Soluciones Implementadas

1. **Configuración de NextAuth mejorada**: Uso del MongoDBAdapter con manejo adecuado de sesiones
2. **Manejo de errores mejorado**: Mejor feedback visual para errores de autenticación
3. **Validación de configuración**: Verificación automática de variables de entorno requeridas
4. **Debug utilities**: Herramientas para diagnosticar problemas de configuración
5. **Middleware de autenticación**: Protección automática de rutas y redirecciones

### Problemas Comunes

1. **Variables de entorno faltantes**: Verifica que todas las variables requeridas estén configuradas
2. **URLs de callback incorrectas**: Asegúrate de que las URLs de callback en los proveedores OAuth coincidan
3. **Problemas de MongoDB**: Verifica que la cadena de conexión sea correcta y que el usuario tenga permisos
4. **NEXTAUTH_SECRET faltante**: Esta variable es requerida para la seguridad de las sesiones

### Logs de Debug

En modo desarrollo, verás logs útiles en la consola que te ayudarán a identificar problemas:

- ✅ Configuración correcta
- ❌ Configuración faltante o incorrecta
- 🔍 Información de debug de sesiones y autenticación