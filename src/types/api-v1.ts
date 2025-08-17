// TypeScript types for API v1 responses and requests

/**
 * Standard API v1 response structure
 */
export interface ApiV1Response<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    timestamp: string;
}

/**
 * Link response format for API v1
 */
export interface LinkV1Response {
    id: string;
    originalUrl: string;
    slug: string;
    title?: string;
    description?: string;
    shortUrl: string;
    isPublicStats: boolean;
    isActive: boolean;
    clickCount: number;
    createdAt: string;
    updatedAt: string;
}

/**
 * Request types for link operations
 */
export interface CreateLinkV1Request {
    originalUrl: string;
    slug?: string;
    title?: string;
    description?: string;
    isPublicStats?: boolean;
}

export interface UpdateLinkV1Request {
    originalUrl?: string;
    title?: string;
    description?: string;
    isPublicStats?: boolean;
    isActive?: boolean;
}

/**
 * Analytics response types
 */
export interface LinkAnalyticsV1Response {
    linkId: string;
    totalClicks: number;
    uniqueClicks: number;
    clicksByDate: Array<{
        date: string;
        clicks: number;
        uniqueClicks: number;
    }>;
    topCountries: Array<{
        country: string;
        clicks: number;
    }>;
    topReferrers: Array<{
        referrer: string;
        clicks: number;
    }>;
    deviceTypes: Array<{
        type: string;
        clicks: number;
    }>;
}

export interface AnalyticsSummaryV1Response {
    totalLinks: number;
    totalClicks: number;
    totalUniqueClicks: number;
    clicksThisMonth: number;
    clicksLastMonth: number;
    topPerformingLinks: Array<{
        id: string;
        slug: string;
        title?: string;
        clicks: number;
    }>;
}

/**
 * Query parameters for links endpoint
 */
export interface GetLinksV1Params {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: 'createdAt' | 'clickCount' | 'title';
    sortOrder?: 'asc' | 'desc';
}

/**
 * Query parameters for analytics endpoints
 */
export interface LinkAnalyticsV1Params {
    startDate?: string;
    endDate?: string;
    groupBy?: 'day' | 'week' | 'month';
}

/**
 * API Token management types
 */
export interface ApiTokenV1Response {
    token?: string; // Only returned when generating new token
    tokenPreview?: string; // Partial token for display (e.g., "uls_abc...xyz")
    createdAt: string;
    lastUsedAt?: string;
    isActive: boolean;
}

/**
 * Error codes specific to API v1
 */
export enum ApiV1ErrorCode {
    // Authentication
    INVALID_TOKEN = 'INVALID_TOKEN',
    TOKEN_EXPIRED = 'TOKEN_EXPIRED',
    TOKEN_MALFORMED = 'TOKEN_MALFORMED',

    // Rate Limiting
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
    DAILY_QUOTA_EXCEEDED = 'DAILY_QUOTA_EXCEEDED',

    // Resources
    LINK_NOT_FOUND = 'LINK_NOT_FOUND',
    LINK_ACCESS_DENIED = 'LINK_ACCESS_DENIED',
    SLUG_ALREADY_EXISTS = 'SLUG_ALREADY_EXISTS',

    // Validation
    INVALID_URL_FORMAT = 'INVALID_URL_FORMAT',
    INVALID_SLUG_FORMAT = 'INVALID_SLUG_FORMAT',
    MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
    INVALID_PARAMETER = 'INVALID_PARAMETER',
}

/**
 * Rate limiting configuration for API v1
 */
export interface ApiV1RateLimit {
    limit: number;
    window: string; // e.g., '1h', '1m'
    identifier: 'token' | 'ip';
}

/**
 * API v1 endpoint configurations
 */
export const API_V1_RATE_LIMITS: Record<string, ApiV1RateLimit> = {
    'GET /api/v1/links': { limit: 100, window: '1h', identifier: 'token' },
    'POST /api/v1/links': { limit: 50, window: '1h', identifier: 'token' },
    'PUT /api/v1/links/*': { limit: 100, window: '1h', identifier: 'token' },
    'DELETE /api/v1/links/*': { limit: 50, window: '1h', identifier: 'token' },
    'GET /api/v1/analytics/*': { limit: 200, window: '1h', identifier: 'token' },
    'token-generation': { limit: 5, window: '1h', identifier: 'token' },
};

/**
 * Utility type for paginated responses
 */
export type PaginatedV1Response<T> = ApiV1Response<T[]> & {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

/**
 * Common query parameters for all API v1 endpoints
 */
export interface BaseV1QueryParams {
    page?: string;
    limit?: string;
}

/**
 * API v1 metadata for responses
 */
export interface ApiV1Metadata {
    version: 'v1';
    endpoint: string;
    method: string;
    timestamp: string;
    requestId?: string;
}