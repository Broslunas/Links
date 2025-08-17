# API v1 Structure

This directory contains the implementation of the public API v1 for the URL shortener service.

## Directory Structure

```
src/app/api/v1/
├── README.md           # This documentation
├── health/             # Health check endpoint
│   └── route.ts
├── links/              # Link management endpoints (to be implemented)
├── analytics/          # Analytics endpoints (to be implemented)
└── __tests__/          # Tests for API v1
    └── health.test.ts
```

## Base Middleware

The API v1 uses a standardized middleware system located in `src/lib/api-v1-middleware.ts` that provides:

- Consistent authentication using API tokens or session
- Standardized response formatting
- Error handling
- Request validation
- Pagination support

## Type Definitions

All API v1 types are defined in `src/types/api-v1.ts` including:

- `ApiV1Response<T>` - Standard response format
- `LinkV1Response` - Link data structure for API responses
- `CreateLinkV1Request` - Request format for creating links
- `UpdateLinkV1Request` - Request format for updating links
- Analytics response types
- Error codes and rate limiting configurations

## Usage

To create a new API v1 endpoint:

1. Create a new directory under `src/app/api/v1/`
2. Add a `route.ts` file with your endpoint handlers
3. Use the `withApiV1` middleware wrapper for authentication and standardization
4. Use the `createApiV1SuccessResponse` and `createApiV1ErrorResponse` helpers

Example:

```typescript
import { NextRequest } from 'next/server';
import { withApiV1, createApiV1SuccessResponse } from '../../../../lib/api-v1-middleware';

export const GET = withApiV1(async (request: NextRequest, auth: AuthContext) => {
  // Your endpoint logic here
  const data = { message: 'Hello API v1' };
  return createApiV1SuccessResponse(data);
});
```

## Authentication

All API v1 endpoints require authentication via:
- Bearer token in Authorization header: `Authorization: Bearer uls_your_token_here`
- Or valid session cookie (for web dashboard integration)

## Rate Limiting

Rate limits are configured per endpoint in `src/types/api-v1.ts` in the `API_V1_RATE_LIMITS` constant.

## Testing

Tests should be placed in the `__tests__` directory and follow the naming convention `*.test.ts`.