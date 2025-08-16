/**
 * @jest-environment node
 */
import { NextRequest, NextResponse } from 'next/server';
import { withApiV1Middleware, createApiSuccessResponse, createApiErrorResponse } from '../api-v1-middleware';
import { applyApiV1RateLimitByPath } from '../rate-limit';

// Mock the rate limiting function
jest.mock('../rate-limit', () => ({
    applyApiV1RateLimitByPath: jest.fn(),
}));

const mockApplyRateLimit = applyApiV1RateLimitByPath as jest.MockedFunction<typeof applyApiV1RateLimitByPath>;

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
});

afterEach(() => {
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
});

// Helper function to create mock NextRequest
function createMockRequest(url: string, options: { method?: string; headers?: Record<string, string> } = {}) {
    const { method = 'GET', headers = {} } = options;
    return new NextRequest(url, {
        method,
        headers: new Headers(headers),
    });
}

describe('API v1 Integration Tests', () => {
    describe('Example API Route Handler', () => {
        // Simulate a typical API route handler
        const exampleLinksHandler = async (request: NextRequest, context: any) => {
            const method = request.method;

            switch (method) {
                case 'GET':
                    // Simulate getting links
                    const links = [
                        { id: '1', slug: 'test1', originalUrl: 'https://example.com/1' },
                        { id: '2', slug: 'test2', originalUrl: 'https://example.com/2' },
                    ];
                    return createApiSuccessResponse(links, 200, { page: 1, total: 2 }, context.requestId);

                case 'POST':
                    // Simulate creating a link
                    const newLink = { id: '3', slug: 'test3', originalUrl: 'https://example.com/3' };
                    return createApiSuccessResponse(newLink, 201, undefined, context.requestId);

                default:
                    return createApiErrorResponse(
                        'METHOD_NOT_ALLOWED',
                        `Method ${method} not allowed`,
                        405,
                        undefined,
                        context.requestId
                    );
            }
        };

        it('should handle GET request with rate limiting', async () => {
            const mockRequest = createMockRequest('http://localhost/api/v1/links', {
                method: 'GET',
                headers: {
                    'authorization': 'Bearer uls_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
                    'x-forwarded-for': '192.168.1.1',
                },
            });

            mockApplyRateLimit.mockResolvedValue({
                success: true,
                remaining: 99,
                resetTime: Date.now() + 3600000,
            });

            const response = await withApiV1Middleware(mockRequest, exampleLinksHandler);

            expect(response.status).toBe(200);
            expect(response.headers.get('Content-Type')).toBe('application/json');
            expect(response.headers.get('X-RateLimit-Remaining')).toBe('99');
            expect(response.headers.get('X-Request-ID')).toMatch(/^req_\d+_[a-z0-9]+$/);

            const responseBody = await response.json();
            expect(responseBody.success).toBe(true);
            expect(responseBody.data).toHaveLength(2);
            expect(responseBody.pagination).toEqual({ page: 1, total: 2 });
        });

        it('should handle POST request with rate limiting', async () => {
            const mockRequest = createMockRequest('http://localhost/api/v1/links', {
                method: 'POST',
                headers: {
                    'authorization': 'Bearer uls_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
                    'x-forwarded-for': '192.168.1.1',
                },
            });

            mockApplyRateLimit.mockResolvedValue({
                success: true,
                remaining: 49,
                resetTime: Date.now() + 3600000,
            });

            const response = await withApiV1Middleware(mockRequest, exampleLinksHandler);

            expect(response.status).toBe(201);
            expect(response.headers.get('X-RateLimit-Remaining')).toBe('49');

            const responseBody = await response.json();
            expect(responseBody.success).toBe(true);
            expect(responseBody.data.id).toBe('3');
        });

        it('should handle unsupported HTTP method', async () => {
            const mockRequest = createMockRequest('http://localhost/api/v1/links', {
                method: 'PATCH',
                headers: {
                    'authorization': 'Bearer uls_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
                },
            });

            mockApplyRateLimit.mockResolvedValue({
                success: true,
                remaining: 99,
                resetTime: Date.now() + 3600000,
            });

            const response = await withApiV1Middleware(mockRequest, exampleLinksHandler);

            expect(response.status).toBe(405);

            const responseBody = await response.json();
            expect(responseBody.success).toBe(false);
            expect(responseBody.error.code).toBe('METHOD_NOT_ALLOWED');
        });

        it('should block request when rate limit is exceeded', async () => {
            const mockRequest = createMockRequest('http://localhost/api/v1/links', {
                method: 'POST',
                headers: {
                    'x-forwarded-for': '192.168.1.1',
                },
            });

            const resetTime = Date.now() + 3600000;
            mockApplyRateLimit.mockResolvedValue({
                success: false,
                remaining: 0,
                resetTime,
            });

            const response = await withApiV1Middleware(mockRequest, exampleLinksHandler);

            expect(response.status).toBe(429);
            expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
            expect(response.headers.get('X-RateLimit-Reset')).toBe(resetTime.toString());
            expect(response.headers.get('Retry-After')).toBeTruthy();

            const responseBody = await response.json();
            expect(responseBody.success).toBe(false);
            expect(responseBody.error.code).toBe('RATE_LIMIT_EXCEEDED');
            expect(responseBody.error.details.retryAfter).toBeGreaterThan(0);
        });

        it('should log all requests and responses', async () => {
            const mockRequest = createMockRequest('http://localhost/api/v1/links', {
                method: 'GET',
                headers: {
                    'authorization': 'Bearer uls_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
                    'x-forwarded-for': '192.168.1.1',
                    'user-agent': 'test-client/1.0',
                },
            });

            mockApplyRateLimit.mockResolvedValue({
                success: true,
                remaining: 99,
                resetTime: Date.now() + 3600000,
            });

            await withApiV1Middleware(mockRequest, exampleLinksHandler);

            // Should log the incoming request
            expect(console.log).toHaveBeenCalledWith(
                expect.stringMatching(/\[API-V1\] req_\d+_[a-z0-9]+ GET \/api\/v1\/links - IP: 192\.168\.1\.1 - Auth: token - UA: test-client\/1\.0/)
            );

            // Should log the response
            expect(console.log).toHaveBeenCalledWith(
                expect.stringMatching(/\[API-V1\] req_\d+_[a-z0-9]+ GET \/api\/v1\/links - 200 - \d+ms/)
            );
        });
    });

    describe('Error Handling Integration', () => {
        const errorHandler = async () => {
            throw new Error('Database connection failed');
        };

        it('should handle and log handler errors', async () => {
            const mockRequest = createMockRequest('http://localhost/api/v1/links');

            mockApplyRateLimit.mockResolvedValue({
                success: true,
                remaining: 99,
                resetTime: Date.now() + 3600000,
            });

            const response = await withApiV1Middleware(mockRequest, errorHandler);

            expect(response.status).toBe(500);
            expect(response.headers.get('X-Request-ID')).toMatch(/^req_\d+_[a-z0-9]+$/);

            const responseBody = await response.json();
            expect(responseBody.success).toBe(false);
            expect(responseBody.error.code).toBe('INTERNAL_SERVER_ERROR');

            // Should log the error
            expect(console.error).toHaveBeenCalledWith(
                expect.stringMatching(/\[API-V1\] req_\d+_[a-z0-9]+ GET \/api\/v1\/links - ERROR - \d+ms:/),
                'Database connection failed'
            );
        });
    });

    describe('Rate Limiting Integration', () => {
        const simpleHandler = async (request: NextRequest, context: any) => {
            return createApiSuccessResponse({ message: 'success' }, 200, undefined, context.requestId);
        };

        it('should apply different rate limits based on endpoint', async () => {
            // Test links endpoint
            const linksRequest = createMockRequest('http://localhost/api/v1/links');
            mockApplyRateLimit.mockResolvedValue({
                success: true,
                remaining: 99,
                resetTime: Date.now() + 3600000,
            });

            await withApiV1Middleware(linksRequest, simpleHandler);
            expect(mockApplyRateLimit).toHaveBeenCalledWith(linksRequest, '/api/v1/links');

            // Test analytics endpoint
            const analyticsRequest = createMockRequest('http://localhost/api/v1/analytics/summary');
            mockApplyRateLimit.mockResolvedValue({
                success: true,
                remaining: 199,
                resetTime: Date.now() + 3600000,
            });

            await withApiV1Middleware(analyticsRequest, simpleHandler);
            expect(mockApplyRateLimit).toHaveBeenCalledWith(analyticsRequest, '/api/v1/analytics/summary');
        });

        it('should include rate limit headers in successful responses', async () => {
            const mockRequest = createMockRequest('http://localhost/api/v1/links');

            mockApplyRateLimit.mockResolvedValue({
                success: true,
                remaining: 50,
                resetTime: Date.now() + 1800000,
            });

            const response = await withApiV1Middleware(mockRequest, simpleHandler);

            expect(response.headers.get('X-RateLimit-Remaining')).toBe('50');
            expect(response.headers.get('X-RateLimit-Reset')).toBeTruthy();
        });
    });

    describe('Authentication Integration', () => {
        const authHandler = async (request: NextRequest, context: any) => {
            const authHeader = request.headers.get('authorization');
            const hasValidToken = authHeader && authHeader.startsWith('Bearer uls_') && authHeader.length === 75;

            if (!hasValidToken) {
                return createApiErrorResponse(
                    'UNAUTHORIZED',
                    'Valid API token required',
                    401,
                    undefined,
                    context.requestId
                );
            }

            return createApiSuccessResponse({ authenticated: true }, 200, undefined, context.requestId);
        };

        it('should handle authenticated requests', async () => {
            const mockRequest = createMockRequest('http://localhost/api/v1/links', {
                headers: {
                    'authorization': 'Bearer uls_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
                },
            });

            mockApplyRateLimit.mockResolvedValue({
                success: true,
                remaining: 99,
                resetTime: Date.now() + 3600000,
            });

            const response = await withApiV1Middleware(mockRequest, authHandler);

            expect(response.status).toBe(200);
            const responseBody = await response.json();
            expect(responseBody.data.authenticated).toBe(true);
        });

        it('should handle unauthenticated requests', async () => {
            const mockRequest = createMockRequest('http://localhost/api/v1/links');

            mockApplyRateLimit.mockResolvedValue({
                success: true,
                remaining: 99,
                resetTime: Date.now() + 3600000,
            });

            const response = await withApiV1Middleware(mockRequest, authHandler);

            expect(response.status).toBe(401);
            const responseBody = await response.json();
            expect(responseBody.error.code).toBe('UNAUTHORIZED');
        });
    });
});