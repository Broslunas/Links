# Sistema de Bloqueo de Usuarios

## Descripción

Se ha implementado un sistema completo de verificación de usuarios bloqueados que garantiza que cuando un usuario está inactivo (`isActive: false`), todos sus enlaces dejan de funcionar y no puede acceder al dashboard.

## Funcionalidades Implementadas

### 1. Verificación en Middleware (`src/middleware.ts`)

- **Ruta protegida**: `/dashboard/*`
- **Comportamiento**: Si un usuario autenticado tiene `isActive: false`, es redirigido automáticamente a `/account-inactive`
- **Manejo de errores**: En caso de error en la verificación, permite continuar para no bloquear el acceso

### 2. Verificación en Enlaces (`src/lib/redirect-handler.ts`)

#### Función `handleRedirect()`
- Verifica el estado del usuario propietario del enlace
- Si `isActive: false`, retorna error: "Este enlace no está disponible porque la cuenta del usuario está inactiva"
- Aplica tanto para enlaces regulares como temporales

#### Función `shouldRedirectToMainDomain()`
- Verifica el estado del usuario en dominios personalizados
- Si el usuario está bloqueado, redirige al dominio principal

### 3. Utilidades de Usuario (`src/lib/user-status.ts`)

```typescript
// Verificar si un usuario está activo por ID
isUserActive(userId: string): Promise<boolean>

// Verificar si un usuario está activo por email
isUserActiveByEmail(email: string): Promise<boolean>

// Cambiar estado de usuario (función admin)
setUserActiveStatus(userId: string, isActive: boolean): Promise<boolean>

// Obtener información completa del estado
getUserStatus(userId: string): Promise<{isActive: boolean, user: any} | null>
```

### 4. API de Administración (`src/app/api/admin/users/[userId]/status/route.ts`)

#### GET `/api/admin/users/[userId]/status`
- Obtiene el estado actual del usuario
- Requiere permisos de administrador

#### PATCH `/api/admin/users/[userId]/status`
- Actualiza el estado del usuario
- Requiere permisos de administrador
- Previene que un admin se bloquee a sí mismo
- Registra la acción en logs

```json
// Ejemplo de request
{
  "isActive": false,
  "reason": "Violación de términos de servicio"
}
```

### 5. Interfaz de Usuario

#### Página de Cuenta Inactiva (`src/app/account-inactive/page.tsx`)
- Página informativa para usuarios bloqueados
- Explica las posibles razones del bloqueo
- Proporciona opciones de contacto y soporte

#### Panel de Administración (`src/components/dashboard/UserManagement.tsx`)
- Interfaz existente ya soporta cambio de estado `isActive`
- Los administradores pueden bloquear/desbloquear usuarios
- Muestra badges de estado visual

## Puntos de Verificación

### 1. Acceso al Dashboard
```
Usuario bloqueado → Middleware → Redirección a /account-inactive
```

### 2. Acceso a Enlaces
```
Enlace solicitado → handleRedirect() → Verificación de usuario → Error si bloqueado
```

### 3. Dominios Personalizados
```
Dominio personalizado → shouldRedirectToMainDomain() → Verificación → Redirección si bloqueado
```

### 4. Gestión Administrativa
```
Admin → Panel de usuarios → Cambiar estado → API → Base de datos → Logs
```

## Casos de Uso

### Bloquear Usuario
1. Admin accede al panel de gestión de usuarios
2. Selecciona usuario a bloquear
3. Cambia `isActive` a `false`
4. El sistema automáticamente:
   - Impide acceso al dashboard
   - Desactiva todos los enlaces del usuario
   - Registra la acción

### Usuario Bloqueado Intenta Acceder
1. Usuario bloqueado intenta acceder a `/dashboard`
2. Middleware verifica estado
3. Redirige a `/account-inactive`
4. Muestra página informativa

### Acceso a Enlace de Usuario Bloqueado
1. Alguien intenta acceder a enlace de usuario bloqueado
2. `handleRedirect()` verifica estado del propietario
3. Retorna error específico
4. El enlace no funciona

## Seguridad

- **Fail-safe**: En caso de error, el sistema permite continuar (no bloquea por error técnico)
- **Prevención de auto-bloqueo**: Los admins no pueden bloquearse a sí mismos
- **Logs de auditoría**: Todas las acciones de bloqueo/desbloqueo se registran
- **Verificación en múltiples puntos**: Middleware, enlaces, y APIs

## Configuración

No se requiere configuración adicional. El sistema utiliza el campo `isActive` existente en el modelo `User`:

```typescript
isActive: {
  type: Boolean,
  default: true,
}
```

## Testing

Ejecutar el script de prueba:
```bash
node test-user-blocking.js
```

Este script verifica todos los casos de uso y confirma que la implementación funciona correctamente.

## Notas Técnicas

- Compatible con enlaces temporales y permanentes
- Funciona con dominios personalizados
- No afecta el rendimiento (verificaciones optimizadas)
- Integrado con el sistema de autenticación existente
- Utiliza populate() para optimizar consultas de base de datos