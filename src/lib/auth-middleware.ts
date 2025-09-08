import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth-simple';
import { validateUserSession } from './user-utils';
import { validateApiToken, updateTokenLastUsed } from './api-token';
import { createErrorResponse } from './api-response';
import { AppError, ErrorCode } from './api-errors';
import Link from '../models/Link';
import User, { IUser } from '../models/User';
import SharedLink from '../models/SharedLink';

export interface AuthContext {
  userId: string;
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
    provider?: 'github' | 'google' | 'discord' | 'twitch';
    role?: 'user' | 'admin';
  };
  authMethod: 'session' | 'api_token';
}

/**
 * Middleware para autenticar requests usando sesión o API token
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<AuthContext> {
  console.log('[Auth Debug] Starting authentication request');
  
  // Intentar autenticación por API token primero
  const authHeader = request.headers.get('authorization');
  const apiToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;
  
  console.log('[Auth Debug] API token present:', !!apiToken);

  if (apiToken) {
    const user = await validateApiToken(apiToken);
    if (!user) {
      throw new AppError(ErrorCode.INVALID_TOKEN, 'Invalid API token', 401);
    }

    // Update lastUsedAt timestamp for the API token
    await updateTokenLastUsed(user._id.toString());

    return {
      userId: user._id.toString(),
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        provider: user.provider,
        role: user.role || 'user',
      },
      authMethod: 'api_token',
    };
  }

  // Intentar autenticación por sesión
  console.log('[Auth Debug] Attempting session authentication');
  const session = await getServerSession(authOptions);
  console.log('[Auth Debug] Session obtained:', {
    hasSession: !!session,
    hasUser: !!session?.user,
    userId: session?.user?.id
  });
  const userValidation = validateUserSession(session);
  console.log('[Auth Debug] User validation result:', userValidation);

  if (!userValidation.isValid || !userValidation.userId) {
    console.error('[Auth Debug] Session validation failed:', {
      hasSession: !!session,
      hasUserId: !!session?.user?.id,
      userId: session?.user?.id,
      validationError: userValidation.error
    });
    throw new AppError(ErrorCode.UNAUTHORIZED, userValidation.error || 'Authentication required', 401);
  }

  // Obtener el usuario completo de la base de datos para incluir el rol
  const dbUser = (await User.findById(
    userValidation.userId
  ).lean()) as IUser | null;
  if (!dbUser) {
    throw new AppError(ErrorCode.UNAUTHORIZED, 'User not found', 401);
  }

  return {
    userId: userValidation.userId.toString(),
    user: {
      id: session!.user.id,
      email: session!.user.email,
      name: session!.user.name,
      provider: session!.user.provider || 'github',
      role: dbUser.role || 'user',
    },
    authMethod: 'session',
  };
}

/**
 * Wrapper para endpoints que requieren autenticación
 */
export function withAuth<T extends any[]>(
  handler: (
    request: NextRequest,
    auth: AuthContext,
    ...args: T
  ) => Promise<Response>
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
        new AppError(ErrorCode.INTERNAL_ERROR, 'Authentication failed', 500)
      );
    }
  };
}

/**
 * Verificar si el usuario autenticado es propietario del recurso
 */
export function verifyResourceOwnership(
  authUserId: string,
  resourceUserId: string
): void {
  if (authUserId !== resourceUserId) {
    throw new AppError(
      ErrorCode.FORBIDDEN,
      'Access denied: You can only access your own resources',
      403
    );
  }
}

/**
 * Verificar si el usuario autenticado puede acceder al recurso a través de la API
 * Específicamente diseñado para endpoints de API pública
 */
export function verifyApiResourceOwnership(
  authUserId: string,
  resourceUserId: string
): void {
  if (authUserId !== resourceUserId) {
    throw new AppError(
      ErrorCode.FORBIDDEN,
      'Access denied: You can only access your own resources through the API',
      403
    );
  }
}

/**
 * Verificar si el usuario autenticado es propietario de un enlace específico
 * Busca el enlace en la base de datos y verifica la propiedad
 */
export async function verifyLinkOwnership(
  authUserId: string,
  linkId: string
): Promise<void> {
  try {
    const link = await Link.findById(linkId);

    if (!link) {
      throw new AppError(ErrorCode.LINK_NOT_FOUND, 'Link not found', 404);
    }

    if (link.userId.toString() !== authUserId) {
      throw new AppError(
        ErrorCode.FORBIDDEN,
        'Access denied: You can only access your own links',
        403
      );
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    // Handle invalid ObjectId format
    if (error instanceof Error && error.name === 'CastError') {
      throw new AppError(
        ErrorCode.LINK_NOT_FOUND,
        'Invalid link ID format',
        404
      );
    }

    throw new AppError(
      ErrorCode.DATABASE_ERROR,
      'Error verifying link ownership',
      500
    );
  }
}

/**
 * Verificar si el usuario autenticado es propietario de un enlace por slug
 * Busca el enlace por slug y verifica la propiedad
 */
export async function verifyLinkOwnershipBySlug(
  authUserId: string,
  slug: string
): Promise<void> {
  try {
    const link = await Link.findOne({ slug });

    if (!link) {
      throw new AppError(
        ErrorCode.LINK_NOT_FOUND,
        `Link with slug '${slug}' not found`,
        404
      );
    }

    if (link.userId.toString() !== authUserId) {
      throw new AppError(
        ErrorCode.FORBIDDEN,
        'Access denied: You can only access your own links',
        403
      );
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      ErrorCode.DATABASE_ERROR,
      'Error verifying link ownership',
      500
    );
  }
}

/**
 * Verificar si el usuario autenticado es administrador
 */
export async function verifyAdminRole(authUserId: string): Promise<void> {
  try {
    const user = await User.findById(authUserId);

    if (!user) {
      throw new AppError(ErrorCode.NOT_FOUND, 'User not found', 404);
    }

    if (user.role !== 'admin') {
      throw new AppError(
        ErrorCode.FORBIDDEN,
        'Access denied: Administrator privileges required',
        403
      );
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      ErrorCode.DATABASE_ERROR,
      'Error verifying admin role',
      500
    );
  }
}

/**
 * Wrapper para endpoints que requieren rol de administrador
 */
export function withAdminAuth<T extends any[]>(
  handler: (
    request: NextRequest,
    auth: AuthContext,
    ...args: T
  ) => Promise<Response>
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    try {
      const auth = await authenticateRequest(request);
      await verifyAdminRole(auth.userId);

      // Agregar información de rol al contexto de autenticación
      auth.user.role = 'admin';

      return await handler(request, auth, ...args);
    } catch (error) {
      if (error instanceof AppError) {
        return createErrorResponse(error);
      }

      console.error('[Admin Auth Middleware Error]:', error);
      return createErrorResponse(
        new AppError(
          ErrorCode.INTERNAL_ERROR,
          'Admin authentication failed',
          500
        )
      );
    }
  };
}

/**
 * Middleware para endpoints que solo permiten desarrollo
 */
export function requireDevelopment<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<Response>
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    try {
      if (process.env.NODE_ENV !== 'development') {
        return createErrorResponse(
          new AppError(
            ErrorCode.NOT_ALLOWED,
            'This endpoint is only available in development mode',
            403
          )
        );
      }

      return await handler(request, ...args);
    } catch (error) {
      console.error('[Development Middleware Error]:', error);
      return createErrorResponse(
        new AppError(ErrorCode.INTERNAL_ERROR, 'Request failed', 500)
      );
    }
  };
}

/**
 * Middleware para endpoints públicos con rate limiting opcional
 */
export function withPublicAccess<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<Response>,
  options?: {
    requireAuth?: boolean;
    allowAnonymous?: boolean;
  }
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    try {
      // Si se requiere autenticación, crear un handler compatible con withAuth
      if (options?.requireAuth) {
        const authHandler = async (
          request: NextRequest,
          auth: AuthContext,
          ...handlerArgs: T
        ) => {
          return await handler(request, ...handlerArgs);
        };
        return withAuth(authHandler)(request, ...args);
      }

      // Para endpoints públicos, continuar sin autenticación
      return await handler(request, ...args);
    } catch (error) {
      console.error('[Public Access Error]:', error);
      return createErrorResponse(
        new AppError(ErrorCode.INTERNAL_ERROR, 'Request failed', 500)
      );
    }
  };
}

/**
 * Verificar si el usuario tiene permisos para acceder a un enlace
 * Verifica tanto ownership como permisos compartidos
 */
export async function verifyLinkAccess(
  authUserId: string,
  linkId: string,
  requiredPermission?: 'canView' | 'canEdit' | 'canDelete' | 'canViewStats' | 'canShare'
): Promise<{ isOwner: boolean; sharedLink?: any; link: any }> {
  try {
    const link = await Link.findById(linkId);

    if (!link) {
      throw new AppError(ErrorCode.LINK_NOT_FOUND, 'Link not found', 404);
    }

    // Si es el propietario, tiene todos los permisos
    if (link.userId.toString() === authUserId) {
      return { isOwner: true, link };
    }

    // Verificar si tiene permisos compartidos
    const sharedLink = await SharedLink.findOne({
      linkId: linkId,
      sharedWithUserId: authUserId,
      isActive: true,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    });

    if (!sharedLink) {
      throw new AppError(
        ErrorCode.FORBIDDEN,
        'Access denied: You do not have permission to access this link',
        403
      );
    }

    // Verificar permiso específico si se requiere
    if (requiredPermission && !sharedLink.permissions[requiredPermission]) {
      throw new AppError(
        ErrorCode.FORBIDDEN,
        `Access denied: You do not have ${requiredPermission} permission for this link`,
        403
      );
    }

    return { isOwner: false, sharedLink, link };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    // Handle invalid ObjectId format
    if (error instanceof Error && error.name === 'CastError') {
      throw new AppError(
        ErrorCode.LINK_NOT_FOUND,
        'Invalid link ID format',
        404
      );
    }

    throw new AppError(
      ErrorCode.DATABASE_ERROR,
      'Error verifying link access',
      500
    );
  }
}

/**
 * Verificar si el usuario tiene permisos para acceder a un enlace por slug
 */
export async function verifyLinkAccessBySlug(
  authUserId: string,
  slug: string,
  requiredPermission?: 'canView' | 'canEdit' | 'canDelete' | 'canViewStats' | 'canShare'
): Promise<{ isOwner: boolean; sharedLink?: any; link: any }> {
  try {
    const link = await Link.findOne({ slug });

    if (!link) {
      throw new AppError(
        ErrorCode.LINK_NOT_FOUND,
        `Link with slug '${slug}' not found`,
        404
      );
    }

    // Si es el propietario, tiene todos los permisos
    if (link.userId.toString() === authUserId) {
      return { isOwner: true, link };
    }

    // Verificar si tiene permisos compartidos
    const sharedLink = await SharedLink.findOne({
      linkId: link._id,
      sharedWithUserId: authUserId,
      isActive: true,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    });

    if (!sharedLink) {
      throw new AppError(
        ErrorCode.FORBIDDEN,
        'Access denied: You do not have permission to access this link',
        403
      );
    }

    // Verificar permiso específico si se requiere
    if (requiredPermission && !sharedLink.permissions[requiredPermission]) {
      throw new AppError(
        ErrorCode.FORBIDDEN,
        `Access denied: You do not have ${requiredPermission} permission for this link`,
        403
      );
    }

    return { isOwner: false, sharedLink, link };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      ErrorCode.DATABASE_ERROR,
      'Error verifying link access',
      500
    );
  }
}
