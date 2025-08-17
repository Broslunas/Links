# Integración con Discord

Este documento describe cómo se maneja la autenticación con Discord y qué información se guarda en la base de datos.

## Configuración

### Variables de Entorno

Para habilitar la autenticación con Discord, necesitas configurar las siguientes variables de entorno:

```bash
DISCORD_CLIENT_ID=tu-discord-client-id
DISCORD_CLIENT_SECRET=tu-discord-client-secret
```

### Configuración de Discord OAuth App

1. Ve al [Discord Developer Portal](https://discord.com/developers/applications)
2. Crea una nueva aplicación
3. Ve a la sección OAuth2
4. Agrega redirect URI: `http://localhost:3000/api/auth/callback/discord` (para desarrollo)
5. Para producción: `https://tu-dominio.com/api/auth/callback/discord`
6. Copia el Client ID y Client Secret

## Información Guardada

Cuando un usuario se autentica con Discord, se guarda la siguiente información en la base de datos:

### Campos Básicos (comunes a todos los proveedores)
- `email`: Email del usuario
- `name`: Nombre del usuario (puede ser el global_name o username)
- `image`: URL del avatar del usuario
- `provider`: "discord"
- `providerId`: ID único de Discord del usuario

### Campos Específicos de Discord
- `discordUsername`: Nombre de usuario de Discord (ej: "usuario123")
- `discordDiscriminator`: Discriminador de Discord (ej: "1234") - Nota: Discord está eliminando gradualmente los discriminadores
- `discordGlobalName`: Nombre global de Discord (nombre de visualización)
- `discordVerified`: Si el email del usuario está verificado en Discord
- `discordLocale`: Idioma preferido del usuario (ej: "es-ES", "en-US")

### Datos Completos del Proveedor
- `providerData`: Objeto que contiene toda la información del perfil de Discord:
  ```json
  {
    "username": "usuario123",
    "discriminator": "1234",
    "global_name": "Nombre de Usuario",
    "verified": true,
    "locale": "es-ES",
    "avatar": "hash_del_avatar",
    "banner": "hash_del_banner",
    "accent_color": 5793266,
    "premium_type": 2,
    "public_flags": 64
  }
  ```

## Ejemplo de Documento en MongoDB

```json
{
  "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
  "email": "usuario@discord.com",
  "name": "Nombre de Usuario",
  "image": "https://cdn.discordapp.com/avatars/123456789/hash_avatar.png",
  "provider": "discord",
  "providerId": "123456789012345678",
  "discordUsername": "usuario123",
  "discordDiscriminator": "1234",
  "discordGlobalName": "Nombre de Usuario",
  "discordVerified": true,
  "discordLocale": "es-ES",
  "providerData": {
    "username": "usuario123",
    "discriminator": "1234",
    "global_name": "Nombre de Usuario",
    "verified": true,
    "locale": "es-ES",
    "avatar": "hash_del_avatar",
    "banner": "hash_del_banner",
    "accent_color": 5793266,
    "premium_type": 2,
    "public_flags": 64
  },
  "createdAt": "2023-09-06T10:30:00.000Z",
  "updatedAt": "2023-09-06T10:30:00.000Z"
}
```

## Comportamiento de Actualización

### Nuevo Usuario de Discord
- Se crea un nuevo documento con toda la información de Discord
- Se registra en los logs: `✅ Created new discord user: email@example.com`

### Usuario Existente de Discord
- Se actualiza la información básica (name, image)
- Se actualiza toda la información específica de Discord
- Se actualiza el objeto `providerData` con los datos más recientes
- Se registra en los logs: `✅ Updated existing discord user: email@example.com`

### Usuario Existente con Otro Proveedor
- Se actualiza solo la información básica (name, image)
- Se preserva toda la información específica de Discord existente
- No se modifica el objeto `providerData` de Discord

## Permisos de Discord

La aplicación solicita los siguientes permisos (scopes) a Discord:
- `identify`: Para obtener información básica del usuario
- `email`: Para obtener el email del usuario

## Consideraciones de Privacidad

- Solo se guarda la información que Discord proporciona públicamente
- El email solo se guarda si el usuario ha verificado su email en Discord
- La información se actualiza cada vez que el usuario inicia sesión
- Los datos sensibles como tokens de acceso no se almacenan en la base de datos

## Migración de Discriminadores

Discord está eliminando gradualmente el sistema de discriminadores (#1234). La aplicación maneja ambos casos:
- Si existe `discriminator`, se guarda
- Si no existe, el campo queda vacío
- Se prioriza `global_name` sobre `username` para el nombre de visualización

## Debugging

En modo desarrollo, puedes ver información detallada en los logs:

```bash
✅ Created new discord user: usuario@discord.com {
  provider: 'discord',
  discordData: {
    username: 'usuario123',
    discriminator: '1234',
    global_name: 'Nombre de Usuario',
    verified: true,
    locale: 'es-ES',
    avatar: 'hash_avatar',
    banner: 'hash_banner',
    accent_color: 5793266,
    premium_type: 2,
    public_flags: 64
  }
}
```

## Tests

La integración con Discord está completamente probada:
- Configuración del proveedor
- Creación de nuevos usuarios
- Actualización de usuarios existentes
- Preservación de datos cuando se usa otro proveedor

Ejecuta los tests con:
```bash
npm test -- --testPathPatterns="discord-integration.test.ts"
```