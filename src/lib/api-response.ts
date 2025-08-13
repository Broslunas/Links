// API Response utilities for standardized responses

import { NextResponse } from 'next/server';
import { ApiResponse } from '@/types';
import { AppError, ErrorCode, getErrorMessage, shouldLogError, sanitizeErrorDetails } from './api-errors';

// Success response helper
export const createSuccessResponse = <T>(
  data: T,
  status: number = 200
): NextResponse<ApiResponse<T>> => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString()
  };

  return NextResponse.json(response, { status });
};

// Error response helper
export const createErrorResponse = (
  error: AppError | Error | string,
  status?: number
): NextResponse<ApiResponse> => {
  let appError: AppError;
  
  if (typeof error === 'string') {
    appError = new AppError(ErrorCode.INTERNAL_ERROR, error, status || 500);
  } else if (error instanceof AppError) {
    appError = error;
  } else {
    // Convert generic Error to AppError
    appError = new AppError(
      ErrorCode.INTERNAL_ERROR,
      error.message || 'Internal server error',
      status || 500,
      { originalError: error.name }
    );
  }

  // Log error if necessary
  if (shouldLogError(appError)) {
    console.error(`[API Error] ${appError.code}: ${appError.message}`, {
      statusCode: appError.statusCode,
      details: appError.details,
      stack: appError.stack
    });
  }

  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const response: ApiResponse = {
    success: false,
    error: {
      code: appError.code,
      message: getErrorMessage(appError.code, appError.message),
      details: sanitizeErrorDetails(appError.details, isDevelopment)
    },
    timestamp: new Date().toISOString()
  };

  return NextResponse.json(response, { status: appError.statusCode });
};

// Async error handler wrapper for API routes
export const withErrorHandler = <T extends any[], R>(
  handler: (...args: T) => Promise<R>
) => {
  return async (...args: T): Promise<R | NextResponse<ApiResponse>> => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error('[API Handler Error]:', error);
      
      if (error instanceof AppError) {
        return createErrorResponse(error);
      }
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
          return createErrorResponse(
            new AppError(
              ErrorCode.EXTERNAL_SERVICE_ERROR,
              'External service unavailable',
              503,
              { originalError: error.message }
            )
          );
        }
        
        if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
          return createErrorResponse(
            new AppError(
              ErrorCode.RESOURCE_EXISTS,
              'Resource already exists',
              409,
              { originalError: error.message }
            )
          );
        }
      }
      
      // Generic error fallback
      return createErrorResponse(
        new AppError(
          ErrorCode.INTERNAL_ERROR,
          'An unexpected error occurred',
          500,
          { originalError: error instanceof Error ? error.message : String(error) }
        )
      );
    }
  };
};

// Validation helper
export const validateRequest = (
  data: any,
  requiredFields: string[],
  optionalFields: string[] = []
): void => {
  const errors: string[] = [];
  
  // Check required fields
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      errors.push(`Field '${field}' is required`);
    }
  }
  
  // Check for unexpected fields
  const allowedFields = [...requiredFields, ...optionalFields];
  const providedFields = Object.keys(data);
  const unexpectedFields = providedFields.filter(field => !allowedFields.includes(field));
  
  if (unexpectedFields.length > 0) {
    errors.push(`Unexpected fields: ${unexpectedFields.join(', ')}`);
  }
  
  if (errors.length > 0) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      'Validation failed',
      400,
      { errors }
    );
  }
};

// URL validation helper
export const validateUrl = (url: string): void => {
  try {
    const urlObj = new URL(url);
    
    // Check protocol
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('Invalid protocol');
    }
    
    // Check for localhost in production
    if (process.env.NODE_ENV === 'production' && 
        (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1')) {
      throw new Error('Localhost URLs not allowed in production');
    }
    
  } catch (error) {
    throw new AppError(
      ErrorCode.INVALID_URL,
      'Invalid URL format',
      400,
      { url, error: error instanceof Error ? error.message : String(error) }
    );
  }
};

// Slug validation helper
export const validateSlug = (slug: string): void => {
  const slugRegex = /^[a-z0-9_-]+$/;
  
  if (!slug || slug.length === 0) {
    throw new AppError(
      ErrorCode.INVALID_SLUG,
      'Slug cannot be empty',
      400,
      { slug }
    );
  }
  
  if (slug.length > 50) {
    throw new AppError(
      ErrorCode.INVALID_SLUG,
      'Slug cannot be longer than 50 characters',
      400,
      { slug, maxLength: 50 }
    );
  }
  
  if (!slugRegex.test(slug)) {
    throw new AppError(
      ErrorCode.INVALID_SLUG,
      'Slug can only contain lowercase letters, numbers, hyphens, and underscores',
      400,
      { slug }
    );
  }
  
  // Reserved slugs
  const reservedSlugs = [
    'api', 'admin', 'dashboard', 'auth', 'login', 'logout', 'register',
    'settings', 'profile', 'help', 'about', 'terms', 'privacy',
    'www', 'mail', 'ftp', 'localhost', 'root', 'null', 'undefined'
  ];
  
  if (reservedSlugs.includes(slug.toLowerCase())) {
    throw new AppError(
      ErrorCode.INVALID_SLUG,
      `'${slug}' is a reserved slug and cannot be used`,
      400,
      { slug, reservedSlugs }
    );
  }
};

// Rate limiting helper
export const checkRateLimit = async (
  identifier: string,
  limit: number,
  windowMs: number
): Promise<void> => {
  // This is a simple in-memory rate limiter
  // In production, you'd want to use Redis or a proper rate limiting service
  
  const key = `rate_limit:${identifier}`;
  const now = Date.now();
  
  // For now, we'll just implement a basic check
  // In a real implementation, you'd store this in Redis with expiration
  
  // Placeholder implementation - in production use proper rate limiting
  const requests = 1; // This would come from your rate limiting store
  
  if (requests > limit) {
    throw new AppError(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      `Rate limit exceeded. Maximum ${limit} requests per ${windowMs / 1000} seconds`,
      429,
      { limit, window: `${windowMs / 1000}s`, identifier }
    );
  }
};

// Helper to extract client IP
export const getClientIP = (request: Request): string => {
  // Check various headers for the real IP
  const headers = {
    'x-forwarded-for': request.headers.get('x-forwarded-for'),
    'x-real-ip': request.headers.get('x-real-ip'),
    'cf-connecting-ip': request.headers.get('cf-connecting-ip'), // Cloudflare
    'x-client-ip': request.headers.get('x-client-ip'),
  };
  
  for (const [name, value] of Object.entries(headers)) {
    if (value) {
      // x-forwarded-for can contain multiple IPs, take the first one
      const ip = value.split(',')[0].trim();
      if (ip && ip !== 'unknown') {
        return ip;
      }
    }
  }
  
  return 'unknown';
};

// Helper to parse request body safely
export const parseRequestBody = async <T = any>(request: Request): Promise<T> => {
  try {
    const body = await request.json();
    return body as T;
  } catch (error) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      'Invalid JSON in request body',
      400,
      { error: error instanceof Error ? error.message : String(error) }
    );
  }
};