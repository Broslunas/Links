# Pasos para Probar la Nueva Configuración de Autenticación

## ✅ Cambios Realizados

1. **Cambiado a JWT Strategy**: Eliminé el MongoDBAdapter que estaba causando problemas
2. **Manejo Manual de Usuarios**: Ahora manejamos la creación/actualización de usuarios manualmente
3. **Página de Prueba**: Creada `/test-auth` para verificar la autenticación

## 🧪 Pasos de Prueba

### 1. Limpiar Datos Existentes
Abre `clear-auth.html` en tu navegador y haz clic en "Limpiar Cookies y LocalStorage"

### 2. Reiniciar el Servidor
```bash
npm run dev
```

### 3. Probar la Página de Prueba
1. Ve a `http://localhost:3000/test-auth`
2. Haz clic en "Iniciar sesión con GitHub"
3. Completa la autenticación en GitHub
4. Deberías ver la página de éxito con tu información

### 4. Probar el Dashboard
1. Desde la página de prueba, haz clic en "Ir al Dashboard"
2. O ve directamente a `http://localhost:3000/dashboard`
3. Debería cargar correctamente sin quedarse en la página de signin

## 📋 Lo que Deberías Ver en los Logs

```
✅ Created new user: tu-email@ejemplo.com
```
o
```
✅ Updated existing user: tu-email@ejemplo.com
```

## 🔍 Si Aún Hay Problemas

### Verificar Variables de Entorno
```bash
node test-auth.js
```

### Verificar Base de Datos
Conecta a tu MongoDB y verifica que se está creando la colección `users` con tu información.

### Logs de Debug
Los logs de NextAuth deberían mostrar el flujo completo sin detenerse en `adapter_getUserByEmail`.

## 🎯 Diferencias Clave

**Antes (con MongoDBAdapter):**
- NextAuth manejaba todo automáticamente
- Se quedaba atascado en las consultas del adapter

**Ahora (con JWT):**
- Usamos JWT para las sesiones (más rápido)
- Manejamos usuarios manualmente en nuestro modelo
- Control total sobre el proceso de autenticación

## 🚀 Próximos Pasos

Si funciona correctamente:
1. Eliminar archivos de prueba (`test-auth.html`, `clear-auth.html`, `/test-auth`)
2. Confirmar que el dashboard funciona completamente
3. Probar la creación y gestión de links

## 📁 Archivos Modificados

- `src/lib/auth-simple.ts` - Nueva configuración con JWT
- `src/types/index.ts` - Tipos actualizados para JWT
- `src/app/test-auth/page.tsx` - Página de prueba
- `clear-auth.html` - Utilidad para limpiar datos
- `TEST-STEPS.md` - Este archivo