# Authentication Middleware Documentation

This document describes the centralized authentication middleware system implemented for the BRL Links API.

## Overview

The authentication middleware provides a unified approach to handle authentication, authorization, and access control across all API endpoints. It supports both session-based authentication (for web users) and API token authentication (for programmatic access).

## Middleware Functions

### `authenticateRequest(request, allowFailure?)`

Core authentication function that handles both session and API token authentication.

**Parameters:**
- `request`: NextRequest object
- `allowFailure`: Optional boolean, if true, returns null instead of throwing on auth failure

**Returns:** `AuthContext | null`

**Usage:**
```typescript
const auth = await authenticateRequest(request);
// auth.userId, auth.user available
```

### `withAuth(handler)`

Wrapper for endpoints that require authentication. Automatically handles authentication and passes the auth context to your handler.

**Usage:**
```typescript
export const GET = withAuth(async (request: NextRequest, auth: AuthContext) => {
  // auth.userId and auth.user are guaranteed to be available
  const userLinks = await Link.find({ userId: auth.userId });
  return createSuccessResponse(userLinks);
});
```

### `verifyResourceOwnership(resource, auth)`

Verifies that the authenticated user owns the specified resource.

**Parameters:**
- `resource`: Object with userId property
- `auth`: AuthContext from authentication

**Throws:** `AppError` with `FORBIDDEN` code if user doesn't own the resource

**Usage:**
```typescript
const link = await Link.findOne({ slug: id });
if (!link) throw new AppError(ErrorCode.NOT_FOUND, 'Link not found');

verifyResourceOwnership(link, auth);
// Proceed with operations on the link
```

### `requireDevelopment(handler)`

Wrapper for development-only endpoints. Only allows access when `NODE_ENV === 'development'`.

**Usage:**
```typescript
export const GET = requireDevelopment(async (request: NextRequest) => {
  // This endpoint only works in development
  const debugInfo = await getDebugInfo();
  return NextResponse.json(debugInfo);
});
```

### `withPublicAccess(handler)`

Wrapper for public endpoints that optionally support authentication. Useful for endpoints that behave differently for authenticated vs anonymous users.

**Usage:**
```typescript
export const GET = withPublicAccess(async (request: NextRequest, auth?: AuthContext) => {
  if (auth) {
    // User is authenticated, show private data
    return getPrivateStats(auth.userId);
  } else {
    // Anonymous user, show public data only
    return getPublicStats();
  }
});
```

## Authentication Types

### Session Authentication
- Uses NextAuth.js sessions
- Automatically handled for web requests with session cookies
- Validates session and extracts user information

### API Token Authentication
- Uses `Authorization: Bearer <token>` header
- Tokens are validated against the database
- Supports programmatic access to the API

## Error Handling

The middleware uses the centralized error handling system:

- `UNAUTHORIZED` (401): No valid authentication provided
- `FORBIDDEN` (403): User doesn't have permission for the resource
- `VALIDATION_ERROR` (400): Invalid request parameters
- `NOT_FOUND` (404): Resource not found

## Implementation Examples

### Protected Resource Endpoint
```typescript
// /api/links/[id]/route.ts
export const GET = withAuth(async (request: NextRequest, auth: AuthContext, { params }) => {
  const { id } = params;
  
  if (!id) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, 'Link ID is required');
  }
  
  const link = await Link.findOne({ slug: id });
  if (!link) {
    throw new AppError(ErrorCode.NOT_FOUND, 'Link not found');
  }
  
  // Verify ownership
  verifyResourceOwnership(link, auth);
  
  return createSuccessResponse(link);
});
```

### Public Endpoint with Optional Auth
```typescript
// /api/analytics/[linkId]/route.ts
export const GET = async (request: NextRequest, { params }) => {
  const { linkId } = params;
  
  const link = await Link.findOne({ slug: linkId });
  if (!link) {
    throw new AppError(ErrorCode.NOT_FOUND, 'Link not found');
  }
  
  // Try to authenticate (but don't fail if no auth)
  const auth = await authenticateRequest(request, true);
  
  // Check if user owns the link OR if public stats are enabled
  const canAccess = (auth && link.userId.toString() === auth.userId) || link.isPublicStats;
  
  if (!canAccess) {
    throw new AppError(ErrorCode.FORBIDDEN, 'Access denied');
  }
  
  const stats = await getAnalytics(linkId);
  return createSuccessResponse(stats);
};
```

### Development-Only Endpoint
```typescript
// /api/debug/database/route.ts
export const GET = requireDevelopment(async (request: NextRequest) => {
  const dbStats = await getDatabaseStats();
  return NextResponse.json(dbStats);
});
```

## Migration Guide

### Before (Old Pattern)
```typescript
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Manual validation and error handling
  const userValidation = await validateUserSession(session);
  if (!userValidation.isValid) {
    return createError.unauthorized(userValidation.error);
  }
  
  // Business logic
}
```

### After (New Pattern)
```typescript
export const GET = withAuth(async (request: NextRequest, auth: AuthContext) => {
  // auth.userId and auth.user are guaranteed to be available
  // Business logic directly
});
```

## Benefits

1. **Consistency**: Unified authentication across all endpoints
2. **Security**: Centralized security logic reduces bugs
3. **Maintainability**: Single place to update authentication logic
4. **Flexibility**: Supports multiple authentication methods
5. **Error Handling**: Consistent error responses
6. **Type Safety**: TypeScript support with proper types

## Best Practices

1. Always use the appropriate wrapper for your endpoint type
2. Use `verifyResourceOwnership` for user-owned resources
3. Handle errors using `AppError` for consistency
4. Use `createSuccessResponse` for consistent response format
5. Keep business logic separate from authentication logic
6. Test both authenticated and unauthenticated scenarios