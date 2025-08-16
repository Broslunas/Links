import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth-simple';
import { validateUserSession } from './user-utils';
import { validateApiToken } from './api-token';
import { createErrorResponse } from './api-response';
import { AppError, ErrorCode } from './api-errors';

export interface AuthContext {
  userId: string;
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
    provider?: 'github' | 'google' | 'discord';
  };
  authMethod: 'session' | 'api_token';
}

/**
 * Middleware para autenticar requests usando sesión o API token
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthContext> {
  // Intentar autenticación por API token primero
  const authHeader = request.headers.get('authorization');
  const apiToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  
  if (apiToken) {
    const user = await validateApiToken(apiToken);
    if (!user) {
      throw new AppError(
        ErrorCode.INVALID_TOKEN,
        'Invalid API token',
        401
      );
    }
    
    return {
      userId: user._id.toString(),
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        provider: user.provider
      },
      authMethod: 'api_token'
    };
  }
  
  // Intentar autenticación por sesión
  const session = await getServerSession(authOptions);
  const userValidation = validateUserSession(session);
  
  if (!userValidation.isValid || !userValidation.userId) {
    throw new AppError(
      ErrorCode.UNAUTHORIZED,
      'Authentication required',
      401
    );
  }
  
  return {
    userId: userValidation.userId.toString(),
    user: {
      id: session!.user.id,
      email: session!.user.email,
      name: session!.user.name,
      provider: session!.user.provider || 'github'
    },
    authMethod: 'session'
  };
}

/**
 * Wrapper para endpoints que requieren autenticación
 */
export function withAuth<T extends any[]>(
  handler: (request: NextRequest, auth: AuthContext, ...args: T) => Promise<Response>
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    try {
      const auth = await authenticateRequest(request);
      return await handler(request, auth, ...args);
    } catch (error) {
      if (error instanceof AppError) {
        return createErrorResponse(error);
      }
      
      console.error('[Auth Middleware Error]:', error);
      return createErrorResponse(
        new AppError(
          ErrorCode.INTERNAL_ERROR,
          'Authentication failed',
          500
        )
      );
    }
  };
}

/**
 * Verificar si el usuario autenticado es propietario del recurso
 */
export function verifyResourceOwnership(authUserId: string, resourceUserId: string): void {
  if (authUserId !== resourceUserId) {
    throw new AppError(
      ErrorCode.FORBIDDEN,
      'Access denied: You can only access your own resources',
      403
    );
  }
}

/**
 * Middleware para endpoints que solo permiten desarrollo
 */
export function requireDevelopment(): void {
  if (process.env.NODE_ENV !== 'development') {
    throw new AppError(
      ErrorCode.NOT_ALLOWED,
      'This endpoint is only available in development mode',
      403
    );
  }
}

/**
 * Middleware para endpoints públicos con rate limiting opcional
 */
export async function withPublicAccess<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<Response>,
  options?: {
    requireAuth?: boolean;
    allowAnonymous?: boolean;
  }
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    try {
      // Si se requiere autenticación, usar withAuth
      if (options?.requireAuth) {
        return withAuth(handler)(request, ...args);
      }
      
      // Para endpoints públicos, continuar sin autenticación
      return await handler(request, ...args);
    } catch (error) {
      console.error('[Public Access Error]:', error);
      return createErrorResponse(
        new AppError(
          ErrorCode.INTERNAL_ERROR,
          'Request failed',
          500
        )
      );
    }
  };
}