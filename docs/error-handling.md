# Sistema de Manejo de Errores

Este documento describe el sistema completo de manejo de errores implementado en la aplicación Broslunas Links.

## Arquitectura del Sistema

El sistema de manejo de errores está compuesto por varios niveles:

1. **Páginas de Error Personalizadas** - Para errores 404 y 500
2. **Error Boundaries** - Para errores en componentes React
3. **API Error Handling** - Sistema estandarizado para errores de API
4. **Client Error Handling** - Manejo de errores del lado del cliente con notificaciones

## Páginas de Error

### Página 404 (Not Found)

- **Ubicación**: `src/app/not-found.tsx`
- **Características**:
  - Mensaje amigable "Link Not Found"
  - Navegación a página de inicio y dashboard
  - Sugerencias para el usuario
  - Diseño consistente con la aplicación

### Página 500 (Server Error)

- **Ubicación**: `src/app/error.tsx` y `src/app/global-error.tsx`
- **Características**:
  - Manejo de errores del servidor
  - Opción para reiniciar la aplicación
  - Detalles de depuración en modo desarrollo
  - Registro automático de errores

## Error Boundaries

### Componente ErrorBoundary

- **Ubicación**: `src/components/ui/ErrorBoundary.tsx`
- **Uso**: Ya implementado a nivel de aplicación en `layout.tsx`
- **Características**:
  - Captura errores en componentes React
  - Interfaz de recuperación con botón "Reintentar"
  - Fallback personalizable
  - Logging automático de errores

### Implementación en Componentes Críticos

- **LinkCreator**: Envuelto con ErrorBoundary específico
- **Analytics Dashboard**: Protegido con ErrorBoundary para gráficos
- **Layout Principal**: ErrorBoundary global ya implementado

## Sistema de API Errors

### Códigos de Error Estandarizados

#### Errores de Autenticación

- `UNAUTHORIZED` - Autenticación requerida
- `FORBIDDEN` - Acceso denegado
- `INVALID_TOKEN` - Token inválido
- `SESSION_EXPIRED` - Sesión expirada

#### Errores de Validación

- `VALIDATION_ERROR` - Error de validación general
- `INVALID_URL` - URL inválida
- `INVALID_SLUG` - Slug inválido
- `SLUG_TAKEN` - Slug ya en uso
- `INVALID_USER_ID` - ID de usuario inválido

#### Errores de Recursos

- `NOT_FOUND` - Recurso no encontrado
- `LINK_NOT_FOUND` - Enlace no encontrado
- `USER_NOT_FOUND` - Usuario no encontrado
- `RESOURCE_EXISTS` - Recurso ya existe

#### Errores de Rate Limiting

- `RATE_LIMIT_EXCEEDED` - Límite de solicitudes excedido
- `TOO_MANY_REQUESTS` - Demasiadas solicitudes

#### Errores del Servidor

- `INTERNAL_ERROR` - Error interno del servidor
- `DATABASE_ERROR` - Error de base de datos
- `EXTERNAL_SERVICE_ERROR` - Error de servicio externo
- `CONFIGURATION_ERROR` - Error de configuración

#### Errores de Lógica de Negocio

- `LINK_INACTIVE` - Enlace inactivo
- `LINK_EXPIRED` - Enlace expirado
- `QUOTA_EXCEEDED` - Cuota excedida

### Utilidades de API

#### `src/lib/api-errors.ts`

- Definición de códigos de error
- Clase `AppError` para errores estructurados
- Funciones helper para crear errores comunes
- Utilidades para logging y sanitización

#### `src/lib/api-response.ts`

- `createSuccessResponse()` - Respuestas exitosas estandarizadas
- `createErrorResponse()` - Respuestas de error estandarizadas
- `withErrorHandler()` - Wrapper para manejo automático de errores
- Validadores para URL, slug, y request body
- Utilidades para rate limiting y extracción de IP

### Ejemplo de Uso en API Routes

```typescript
import {
  withErrorHandler,
  createSuccessResponse,
  validateRequest,
} from '@/lib/api-response';
import { createError } from '@/lib/api-errors';

export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw createError.unauthorized();
  }

  const body = await parseRequestBody(request);
  validateRequest(body, ['requiredField'], ['optionalField']);

  // Lógica de la API...

  return createSuccessResponse(data, 201);
});
```

## Manejo de Errores del Cliente

### `src/lib/client-error-handler.ts`

#### Funciones Principales

- `handleApiError()` - Maneja errores de API con notificaciones
- `handleFetchError()` - Maneja errores de fetch requests
- `showToast()` - Muestra notificaciones toast
- `withToastHandler()` - Wrapper para operaciones con toast

#### Tipos de Toast

- `success` - Operaciones exitosas
- `error` - Errores críticos
- `warning` - Advertencias y validaciones
- `info` - Información general

#### Ejemplo de Uso en Componentes

```typescript
import { withToastHandler, handleFetchError } from '@/lib/client-error-handler';

const handleSubmit = async () => {
  const operation = async () => {
    const response = await fetch('/api/endpoint', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      await handleFetchError(response, {
        onValidationError: details => {
          // Manejar errores de validación
        },
      });
      throw new Error('Request failed');
    }

    return response.json();
  };

  await withToastHandler(operation, {
    loadingMessage: 'Procesando...',
    successMessage: '¡Operación exitosa!',
    showLoading: true,
    showSuccess: true,
    onSuccess: result => {
      // Manejar éxito
    },
  });
};
```

## Características del Sistema

### Logging Inteligente

- Errores del servidor (5xx) se registran automáticamente
- Errores de cliente (4xx) se registran selectivamente
- Detalles sensibles se sanitizan en producción
- Stack traces disponibles en desarrollo

### Mensajes Localizados

- Todos los mensajes de error en español
- Mensajes técnicos vs. mensajes de usuario
- Contexto específico para cada tipo de error

### Recuperación Automática

- Botones de "Reintentar" en interfaces de error
- Mecanismo de retry para requests fallidos
- Detección de errores de red
- Manejo de sesiones expiradas

### Experiencia de Usuario

- Notificaciones toast no intrusivas
- Feedback visual inmediato
- Acciones contextuales (ej: "Iniciar sesión")
- Preservación del estado cuando es posible

## Mejores Prácticas

### Para Desarrolladores

1. Usar `withErrorHandler()` en todas las rutas de API
2. Implementar ErrorBoundary en componentes críticos
3. Usar `withToastHandler()` para operaciones asíncronas
4. Validar datos tanto en cliente como servidor
5. Proporcionar mensajes de error específicos y accionables

### Para Mantenimiento

1. Monitorear logs de errores regularmente
2. Actualizar mensajes de error basado en feedback de usuarios
3. Revisar y optimizar códigos de error según patrones de uso
4. Mantener documentación actualizada

## Configuración

### Variables de Entorno

- `NODE_ENV` - Controla el nivel de detalle en errores
- Configuración de logging según el entorno

### Dependencias

- `sonner` - Para notificaciones toast
- `next-auth` - Para manejo de sesiones
- `mongoose` - Para errores de base de datos

## Monitoreo y Métricas

### Logging

- Todos los errores del servidor se registran con contexto
- Errores de autenticación se registran para seguridad
- Stack traces disponibles para debugging

### Métricas Recomendadas

- Tasa de errores por endpoint
- Tipos de error más comunes
- Tiempo de recuperación de errores
- Satisfacción del usuario con manejo de errores

## Extensibilidad

El sistema está diseñado para ser fácilmente extensible:

1. **Nuevos Códigos de Error**: Agregar en `ErrorCode` enum
2. **Nuevos Tipos de Toast**: Extender `ToastType`
3. **Validadores Personalizados**: Agregar en `api-response.ts`
4. **Error Boundaries Específicos**: Crear componentes especializados

Este sistema proporciona una base sólida para el manejo de errores en toda la aplicación, mejorando tanto la experiencia del usuario como la capacidad de debugging y mantenimiento.
