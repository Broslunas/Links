// API Error handling utilities

export enum ErrorCode {
  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  SESSION_EXPIRED = 'SESSION_EXPIRED',

  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_URL = 'INVALID_URL',
  INVALID_SLUG = 'INVALID_SLUG',
  SLUG_TAKEN = 'SLUG_TAKEN',
  INVALID_USER_ID = 'INVALID_USER_ID',
  INVALID_PARAMETER = 'INVALID_PARAMETER',

  // Resource errors
  NOT_FOUND = 'NOT_FOUND',
  LINK_NOT_FOUND = 'LINK_NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  RESOURCE_EXISTS = 'RESOURCE_EXISTS',

  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',

  // Server errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',

  // Business logic errors
  LINK_INACTIVE = 'LINK_INACTIVE',
  LINK_EXPIRED = 'LINK_EXPIRED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',

  // Development/Debug errors
  NOT_ALLOWED = 'NOT_ALLOWED',
  FEATURE_DISABLED = 'FEATURE_DISABLED'
}

export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: any;
  statusCode: number;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: any;
  public readonly isOperational: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    details?: any,
    isOperational: boolean = true
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, AppError);
  }
}

// Predefined error creators
export const createError = {
  unauthorized: (message: string = 'Authentication required', details?: any) =>
    new AppError(ErrorCode.UNAUTHORIZED, message, 401, details),

  forbidden: (message: string = 'Access denied', details?: any) =>
    new AppError(ErrorCode.FORBIDDEN, message, 403, details),

  notFound: (resource: string = 'Resource', details?: any) =>
    new AppError(ErrorCode.NOT_FOUND, `${resource} not found`, 404, details),

  linkNotFound: (slug?: string) =>
    new AppError(
      ErrorCode.LINK_NOT_FOUND,
      slug ? `Link with slug '${slug}' not found` : 'Link not found',
      404,
      { slug }
    ),

  validation: (message: string, details?: any) =>
    new AppError(ErrorCode.VALIDATION_ERROR, message, 400, details),

  invalidUrl: (url?: string) =>
    new AppError(
      ErrorCode.INVALID_URL,
      'Invalid URL format',
      400,
      { url }
    ),

  invalidSlug: (slug?: string) =>
    new AppError(
      ErrorCode.INVALID_SLUG,
      'Invalid slug format. Only lowercase letters, numbers, hyphens, and underscores are allowed',
      400,
      { slug }
    ),

  slugTaken: (slug: string) =>
    new AppError(
      ErrorCode.SLUG_TAKEN,
      `Slug '${slug}' is already taken`,
      409,
      { slug }
    ),

  rateLimitExceeded: (limit?: number, window?: string) =>
    new AppError(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      `Rate limit exceeded${limit ? `. Maximum ${limit} requests${window ? ` per ${window}` : ''}` : ''}`,
      429,
      { limit, window }
    ),

  internal: (message: string = 'Internal server error', details?: any) =>
    new AppError(ErrorCode.INTERNAL_ERROR, message, 500, details),

  database: (operation?: string, details?: any) =>
    new AppError(
      ErrorCode.DATABASE_ERROR,
      `Database error${operation ? ` during ${operation}` : ''}`,
      500,
      details
    ),

  linkInactive: (slug: string) =>
    new AppError(
      ErrorCode.LINK_INACTIVE,
      `Link '${slug}' is inactive`,
      410,
      { slug }
    ),

  quotaExceeded: (quota?: number) =>
    new AppError(
      ErrorCode.QUOTA_EXCEEDED,
      `Quota exceeded${quota ? `. Maximum ${quota} links allowed` : ''}`,
      429,
      { quota }
    )
};

// Error message mapping for user-friendly messages
export const getErrorMessage = (code: ErrorCode, defaultMessage?: string): string => {
  const messages: Record<ErrorCode, string> = {
    [ErrorCode.UNAUTHORIZED]: 'Debes iniciar sesión para acceder a este recurso',
    [ErrorCode.FORBIDDEN]: 'No tienes permisos para realizar esta acción',
    [ErrorCode.INVALID_TOKEN]: 'Token de autenticación inválido',
    [ErrorCode.SESSION_EXPIRED]: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente',

    [ErrorCode.VALIDATION_ERROR]: 'Los datos proporcionados no son válidos',
    [ErrorCode.INVALID_URL]: 'La URL proporcionada no es válida',
    [ErrorCode.INVALID_SLUG]: 'El slug debe contener solo letras minúsculas, números, guiones y guiones bajos',
    [ErrorCode.SLUG_TAKEN]: 'Este slug ya está en uso. Por favor, elige otro',
    [ErrorCode.INVALID_USER_ID]: 'ID de usuario inválido',
    [ErrorCode.INVALID_PARAMETER]: 'El parámetro proporcionado no es válido',

    [ErrorCode.NOT_FOUND]: 'El recurso solicitado no fue encontrado',
    [ErrorCode.LINK_NOT_FOUND]: 'El enlace solicitado no existe o ha sido eliminado',
    [ErrorCode.USER_NOT_FOUND]: 'Usuario no encontrado',
    [ErrorCode.RESOURCE_EXISTS]: 'El recurso ya existe',

    [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Has excedido el límite de solicitudes. Inténtalo más tarde',
    [ErrorCode.TOO_MANY_REQUESTS]: 'Demasiadas solicitudes. Por favor, espera un momento',

    [ErrorCode.INTERNAL_ERROR]: 'Error interno del servidor. Inténtalo más tarde',
    [ErrorCode.DATABASE_ERROR]: 'Error de base de datos. Inténtalo más tarde',
    [ErrorCode.EXTERNAL_SERVICE_ERROR]: 'Error en servicio externo. Inténtalo más tarde',
    [ErrorCode.CONFIGURATION_ERROR]: 'Error de configuración del servidor',

    [ErrorCode.LINK_INACTIVE]: 'Este enlace está inactivo',
    [ErrorCode.LINK_EXPIRED]: 'Este enlace ha expirado',
    [ErrorCode.QUOTA_EXCEEDED]: 'Has alcanzado el límite máximo de enlaces',

    [ErrorCode.NOT_ALLOWED]: 'Operación no permitida',
    [ErrorCode.FEATURE_DISABLED]: 'Esta funcionalidad está deshabilitada'
  };

  return messages[code] || defaultMessage || 'Ha ocurrido un error inesperado';
};

// Helper to determine if error should be logged
export const shouldLogError = (error: AppError | Error): boolean => {
  if (error instanceof AppError) {
    // Don't log client errors (4xx) except for authentication issues
    if (error.statusCode >= 400 && error.statusCode < 500) {
      return error.code === ErrorCode.UNAUTHORIZED || error.code === ErrorCode.FORBIDDEN;
    }
    return true;
  }
  return true;
};

// Helper to determine error severity
export const getErrorSeverity = (error: AppError | Error): 'low' | 'medium' | 'high' | 'critical' => {
  if (error instanceof AppError) {
    if (error.statusCode >= 500) return 'critical';
    if (error.statusCode === 429) return 'medium';
    if (error.statusCode >= 400) return 'low';
  }
  return 'high';
};

// Helper to sanitize error details for client response
export const sanitizeErrorDetails = (details: any, isDevelopment: boolean = false): any => {
  if (!details) return undefined;

  if (isDevelopment) {
    return details;
  }

  // In production, only return safe details
  const safeFields = ['slug', 'url', 'limit', 'window', 'quota', 'field'];
  const sanitized: any = {};

  for (const field of safeFields) {
    if (details[field] !== undefined) {
      sanitized[field] = details[field];
    }
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
};