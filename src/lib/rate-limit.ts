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
            // Use a hash of the token for security (first 16 chars should be enough for identification)
            const tokenHash = token.substring(0, 20); // uls_ + first 16 chars
            return `${action}:token:${tokenHash}`;
        }
    }

    // Fall back to IP address
    const ip = getClientIP(request);
    return `${action}:ip:${ip}`;
}

/**
 * Get API v1 specific rate limit identifier with enhanced token handling
 */
export function getApiV1RateLimitIdentifier(request: NextRequest, action: string): string {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        if (token.startsWith('uls_') && token.length === 68) { // uls_ + 64 hex chars
            // Use a consistent hash of the token for rate limiting
            const tokenHash = token.substring(0, 20); // uls_ + first 16 chars
            return `${action}:token:${tokenHash}`;
        }
    }

    // Fall back to IP address with API v1 prefix
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
    // API v1 endpoints - Links management
    'api-v1-get-links': { limit: 100, windowMs: 60 * 60 * 1000 }, // 100 per hour
    'api-v1-create-link': { limit: 50, windowMs: 60 * 60 * 1000 }, // 50 per hour
    'api-v1-update-link': { limit: 100, windowMs: 60 * 60 * 1000 }, // 100 per hour
    'api-v1-delete-link': { limit: 50, windowMs: 60 * 60 * 1000 }, // 50 per hour

    // API v1 endpoints - Analytics (higher limits for read operations)
    'api-v1-get-link-analytics': { limit: 200, windowMs: 60 * 60 * 1000 }, // 200 per hour
    'api-v1-get-analytics-summary': { limit: 200, windowMs: 60 * 60 * 1000 }, // 200 per hour

    // API v1 general rate limit (fallback for any v1 endpoint)
    'api-v1-general': { limit: 300, windowMs: 60 * 60 * 1000 }, // 300 per hour total

    // Token management (more restrictive)
    'api-token-generate': { limit: 5, windowMs: 60 * 60 * 1000 }, // 5 per hour
    'api-token-revoke': { limit: 10, windowMs: 60 * 60 * 1000 }, // 10 per hour
    'api-token-info': { limit: 20, windowMs: 60 * 60 * 1000 }, // 20 per hour

    // Legacy API endpoints (maintain backward compatibility)
    'api-create-link': { limit: 50, windowMs: 60 * 60 * 1000 }, // 50 per hour
    'api-get-links': { limit: 100, windowMs: 60 * 60 * 1000 }, // 100 per hour
    'api-get-stats': { limit: 200, windowMs: 60 * 60 * 1000 }, // 200 per hour

    // Token generation (legacy)
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

/**
 * Apply API v1 specific rate limiting with enhanced identifier handling
 */
export async function applyApiV1RateLimit(
    request: NextRequest,
    endpoint: string,
    method: string
): Promise<RateLimitResult> {
    // Create specific action for the endpoint and method
    const action = `api-v1-${endpoint}-${method.toLowerCase()}` as keyof typeof RATE_LIMITS;

    // Check if we have a specific rate limit for this action
    let config = RATE_LIMITS[action];

    // If no specific config, try endpoint-specific config
    if (!config) {
        const endpointAction = `api-v1-${endpoint}` as keyof typeof RATE_LIMITS;
        config = RATE_LIMITS[endpointAction];
    }

    // If still no config, use general API v1 rate limit
    if (!config) {
        config = RATE_LIMITS['api-v1-general'];
    }

    // Use the enhanced identifier function for API v1
    const identifier = getApiV1RateLimitIdentifier(request, action);

    const result = await rateLimiter.checkRateLimit(identifier, config.limit, config.windowMs);

    return {
        success: result.allowed,
        remaining: result.remaining,
        resetTime: result.resetTime,
    };
}

/**
 * Apply rate limiting based on HTTP method and endpoint path
 */
export async function applyApiV1RateLimitByPath(
    request: NextRequest,
    pathname: string
): Promise<RateLimitResult> {
    const method = request.method;

    // Extract endpoint from pathname (e.g., /api/v1/links -> links)
    const pathParts = pathname.split('/');
    const endpoint = pathParts[3] || 'unknown'; // /api/v1/[endpoint]

    // Map common endpoint patterns to rate limit actions
    const endpointMappings: Record<string, string> = {
        'links': method === 'GET' ? 'get-links' :
            method === 'POST' ? 'create-link' :
                method === 'PUT' ? 'update-link' :
                    method === 'DELETE' ? 'delete-link' : 'general',
        'analytics': method === 'GET' ?
            (pathParts[4] === 'summary' ? 'get-analytics-summary' : 'get-link-analytics') :
            'general',
    };

    const mappedEndpoint = endpointMappings[endpoint] || 'general';
    const action = `api-v1-${mappedEndpoint}` as keyof typeof RATE_LIMITS;

    // Get the appropriate rate limit config
    const config = RATE_LIMITS[action] || RATE_LIMITS['api-v1-general'];

    // Use the enhanced identifier function
    const identifier = getApiV1RateLimitIdentifier(request, action);

    const result = await rateLimiter.checkRateLimit(identifier, config.limit, config.windowMs);

    return {
        success: result.allowed,
        remaining: result.remaining,
        resetTime: result.resetTime,
    };
}