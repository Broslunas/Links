import { NextRequest } from 'next/server';
import { rateLimiter } from './rate-limiter';

interface RateLimitResult {
    success: boolean;
    remaining?: number;
    resetTime?: number;
}

/**
 * Apply rate limiting to API requests
 * @param request - The Next.js request object
 * @param action - The action being rate limited (e.g., 'api-create-link')
 * @param limit - Number of requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns Promise<RateLimitResult>
 */
export async function applyRateLimit(
    request: NextRequest,
    action: string,
    limit: number,
    windowMs: number
): Promise<RateLimitResult> {
    // Get identifier for rate limiting
    const identifier = getRateLimitIdentifier(request, action);

    const result = await rateLimiter.checkRateLimit(identifier, limit, windowMs);

    return {
        success: result.allowed,
        remaining: result.remaining,
        resetTime: result.resetTime,
    };
}

/**
 * Get rate limit identifier based on request and action
 * For API requests, we use the API token if available, otherwise fall back to IP
 */
function getRateLimitIdentifier(request: NextRequest, action: string): string {
    // Try to get API token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        if (token.startsWith('uls_')) {
            return `${action}:token:${token}`;
        }
    }

    // Fall back to IP address
    const ip = getClientIP(request);
    return `${action}:ip:${ip}`;
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

    // Fallback to a default value
    return 'unknown';
}

/**
 * Rate limit configurations for different API endpoints
 */
export const RATE_LIMITS = {
    // API endpoints
    'api-create-link': { limit: 50, windowMs: 60 * 60 * 1000 }, // 50 per hour
    'api-get-links': { limit: 100, windowMs: 60 * 60 * 1000 }, // 100 per hour
    'api-get-stats': { limit: 200, windowMs: 60 * 60 * 1000 }, // 200 per hour

    // Token generation (more restrictive)
    'generate-token': { limit: 5, windowMs: 60 * 60 * 1000 }, // 5 per hour
    'revoke-token': { limit: 10, windowMs: 60 * 60 * 1000 }, // 10 per hour

    // Temporary links
    'temp-links': { limit: 5, windowMs: 60 * 60 * 1000 }, // 5 per hour
} as const;

/**
 * Apply rate limit with predefined configuration
 */
export async function applyConfiguredRateLimit(
    request: NextRequest,
    action: keyof typeof RATE_LIMITS
): Promise<RateLimitResult> {
    const config = RATE_LIMITS[action];
    return applyRateLimit(request, action, config.limit, config.windowMs);
}