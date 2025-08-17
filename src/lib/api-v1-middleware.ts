import { NextRequest, NextResponse } from 'next/server';
import { applyApiV1RateLimitByPath } from './rate-limit';

export interface ApiV1MiddlewareOptions {
    enableRateLimit?: boolean;
    enableLogging?: boolean;
}

export interface ApiV1Context {
    rateLimitResult?: {
        success: boolean;
        remaining?: number;
        resetTime?: number;
    };
    requestId: string;
    startTime: number;
}

/**
 * Rate limiting and logging middleware for API v1 endpoints
 */
export async function withApiV1Middleware(
    request: NextRequest,
    handler: (request: NextRequest, context: ApiV1Context) => Promise<NextResponse>,
    options: ApiV1MiddlewareOptions = {}
): Promise<NextResponse> {
    const { enableRateLimit = true, enableLogging = true } = options;

    const startTime = Date.now();
    const requestId = generateRequestId();
    const pathname = new URL(request.url).pathname;

    // Create context
    const context: ApiV1Context = {
        requestId,
        startTime,
    };

    try {
        // Apply rate limiting if enabled
        if (enableRateLimit) {
            const rateLimitResult = await applyApiV1RateLimitByPath(request, pathname);
            context.rateLimitResult = rateLimitResult;

            if (!rateLimitResult.success) {
                // Log rate limit violation
                if (enableLogging) {
                    logRateLimitViolation(request, pathname, requestId, rateLimitResult);
                }

                // Return 429 Too Many Requests with informative headers
                return new NextResponse(
                    JSON.stringify({
                        success: false,
                        error: {
                            code: 'RATE_LIMIT_EXCEEDED',
                            message: 'Rate limit exceeded. Please try again later.',
                            details: {
                                remaining: rateLimitResult.remaining,
                                resetTime: rateLimitResult.resetTime,
                                retryAfter: Math.ceil((rateLimitResult.resetTime! - Date.now()) / 1000),
                            },
                        },
                        timestamp: new Date().toISOString(),
                    }),
                    {
                        status: 429,
                        headers: {
                            'Content-Type': 'application/json',
                            'X-RateLimit-Remaining': rateLimitResult.remaining?.toString() || '0',
                            'X-RateLimit-Reset': rateLimitResult.resetTime?.toString() || '',
                            'Retry-After': Math.ceil((rateLimitResult.resetTime! - Date.now()) / 1000).toString(),
                            'X-Request-ID': requestId,
                        },
                    }
                );
            }
        }

        // Log incoming request
        if (enableLogging) {
            logApiRequest(request, pathname, requestId);
        }

        // Execute the handler
        const response = await handler(request, context);

        // Add rate limit headers to successful responses
        if (enableRateLimit && context.rateLimitResult) {
            response.headers.set('X-RateLimit-Remaining', context.rateLimitResult.remaining?.toString() || '0');
            response.headers.set('X-RateLimit-Reset', context.rateLimitResult.resetTime?.toString() || '');
        }

        // Add request ID header
        response.headers.set('X-Request-ID', requestId);

        // Log successful response
        if (enableLogging) {
            logApiResponse(request, pathname, requestId, response.status, Date.now() - startTime);
        }

        return response;

    } catch (error) {
        // Log error
        if (enableLogging) {
            logApiError(request, pathname, requestId, error as Error, Date.now() - startTime);
        }

        // Return 500 Internal Server Error
        return new NextResponse(
            JSON.stringify({
                success: false,
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'An internal server error occurred.',
                },
                timestamp: new Date().toISOString(),
            }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Request-ID': requestId,
                },
            }
        );
    }
}

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Log API request
 */
function logApiRequest(request: NextRequest, pathname: string, requestId: string): void {
    const method = request.method;
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const ip = getClientIP(request);
    const authHeader = request.headers.get('authorization');
    const hasToken = authHeader && authHeader.startsWith('Bearer uls_');

    console.log(`[API-V1] ${requestId} ${method} ${pathname} - IP: ${ip} - Auth: ${hasToken ? 'token' : 'none'} - UA: ${userAgent}`);
}

/**
 * Log API response
 */
function logApiResponse(
    request: NextRequest,
    pathname: string,
    requestId: string,
    status: number,
    duration: number
): void {
    const method = request.method;
    console.log(`[API-V1] ${requestId} ${method} ${pathname} - ${status} - ${duration}ms`);
}

/**
 * Log API error
 */
function logApiError(
    request: NextRequest,
    pathname: string,
    requestId: string,
    error: Error,
    duration: number
): void {
    const method = request.method;
    console.error(`[API-V1] ${requestId} ${method} ${pathname} - ERROR - ${duration}ms:`, error.message);
    console.error(`[API-V1] ${requestId} Stack:`, error.stack);
}

/**
 * Log rate limit violation
 */
function logRateLimitViolation(
    request: NextRequest,
    pathname: string,
    requestId: string,
    rateLimitResult: { remaining?: number; resetTime?: number }
): void {
    const method = request.method;
    const ip = getClientIP(request);
    const authHeader = request.headers.get('authorization');
    const identifier = authHeader && authHeader.startsWith('Bearer uls_') ? 'token' : ip;

    console.warn(`[API-V1] ${requestId} RATE_LIMIT_EXCEEDED ${method} ${pathname} - Identifier: ${identifier} - Remaining: ${rateLimitResult.remaining} - Reset: ${rateLimitResult.resetTime}`);
}

/**
 * Extract client IP address from request
 */
function getClientIP(request: NextRequest): string {
    // Check various headers for the real IP
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
        return realIP;
    }

    const cfConnectingIP = request.headers.get('cf-connecting-ip');
    if (cfConnectingIP) {
        return cfConnectingIP;
    }

    return 'unknown';
}

/**
 * Helper function to create standardized API error responses
 */
export function createApiErrorResponse(
    code: string,
    message: string,
    status: number,
    details?: any,
    requestId?: string
): NextResponse {
    return new NextResponse(
        JSON.stringify({
            success: false,
            error: {
                code,
                message,
                ...(details && { details }),
            },
            timestamp: new Date().toISOString(),
        }),
        {
            status,
            headers: {
                'Content-Type': 'application/json',
                ...(requestId && { 'X-Request-ID': requestId }),
            },
        }
    );
}

/**
 * Helper function to create standardized API success responses
 */
export function createApiSuccessResponse(
    data: any,
    status: number = 200,
    pagination?: any,
    requestId?: string
): NextResponse {
    return new NextResponse(
        JSON.stringify({
            success: true,
            data,
            ...(pagination && { pagination }),
            timestamp: new Date().toISOString(),
        }),
        {
            status,
            headers: {
                'Content-Type': 'application/json',
                ...(requestId && { 'X-Request-ID': requestId }),
            },
        }
    );
}