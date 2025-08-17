/**
 * @jest-environment node
 */
import { NextRequest, NextResponse } from 'next/server';
import {
    withApiV1Middleware,
    createApiErrorResponse,
    createApiSuccessResponse,
    ApiV1Context
} from '../api-v1-middleware';
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

// Helper function to create mock handler
function createMockHandler(response?: NextResponse) {
    return jest.fn().mockResolvedValue(
        response || new NextResponse(JSON.stringify({ success: true, data: 'test' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        })
    );
}

describe('API v1 Middleware', () => {
    describe('withApiV1Middleware', () => {
        it('should apply rate limiting and call handler when rate limit is not exceeded', async () => {
            const mockRequest = createMockRequest('http://localhost/api/v1/links', {
                headers: { 'x-forwarded-for': '192.168.1.1' },
            });

            mockApplyRateLimit.mockResolvedValue({
                success: true,
                remaining: 99,
                resetTime: Date.now() + 3600000,
            });

            const mockHandler = createMockHandler();
            const response = await withApiV1Middleware(mockRequest, mockHandler);

            expect(mockApplyRateLimit).toHaveBeenCalledWith(mockRequest, '/api/v1/links');
            expect(mockHandler).toHaveBeenCalledWith(mockRequest, expect.objectContaining({
                requestId: expect.stringMatching(/^req_\d+_[a-z0-9]+$/),
                startTime: expect.any(Number),
                rateLimitResult: {
                    success: true,
                    remaining: 99,
                    resetTime: expect.any(Number),
                },
            }));
            expect(response.status).toBe(200);
            expect(response.headers.get('X-RateLimit-Remaining')).toBe('99');
            expect(response.headers.get('X-Request-ID')).toMatch(/^req_\d+_[a-z0-9]+$/);
        });

        it('should return 429 when rate limit is exceeded', async () => {
            const mockRequest = createMockRequest('http://localhost/api/v1/links', {
                headers: { 'x-forwarded-for': '192.168.1.1' },
            });

            const resetTime = Date.now() + 3600000;
            mockApplyRateLimit.mockResolvedValue({
                success: false,
                remaining: 0,
                resetTime,
            });

            const mockHandler = createMockHandler();
            const response = await withApiV1Middleware(mockRequest, mockHandler);

            expect(mockHandler).not.toHaveBeenCalled();
            expect(response.status).toBe(429);
            expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
            expect(response.headers.get('X-RateLimit-Reset')).toBe(resetTime.toString());
            expect(response.headers.get('Retry-After')).toBeTruthy();

            const responseBody = await response.json();
            expect(responseBody.success).toBe(false);
            expect(responseBody.error.code).toBe('RATE_LIMIT_EXCEEDED');
        });

        it('should work without rate limiting when disabled', async () => {
            const mockRequest = createMockRequest('http://localhost/api/v1/links');
            const mockHandler = createMockHandler();

            const response = await withApiV1Middleware(mockRequest, mockHandler, {
                enableRateLimit: false,
            });

            expect(mockApplyRateLimit).not.toHaveBeenCalled();
            expect(mockHandler).toHaveBeenCalledWith(mockRequest, expect.objectContaining({
                requestId: expect.stringMatching(/^req_\d+_[a-z0-9]+$/),
                startTime: expect.any(Number),
            }));
            expect(response.status).toBe(200);
        });

        it('should handle handler errors and return 500', async () => {
            const mockRequest = createMockRequest('http://localhost/api/v1/links');
            const mockHandler = jest.fn().mockRejectedValue(new Error('Handler error'));

            mockApplyRateLimit.mockResolvedValue({
                success: true,
                remaining: 99,
                resetTime: Date.now() + 3600000,
            });

            const response = await withApiV1Middleware(mockRequest, mockHandler);

            expect(response.status).toBe(500);
            expect(response.headers.get('X-Request-ID')).toMatch(/^req_\d+_[a-z0-9]+$/);

            const responseBody = await response.json();
            expect(responseBody.success).toBe(false);
            expect(responseBody.error.code).toBe('INTERNAL_SERVER_ERROR');
        });

        it('should log requests when logging is enabled', async () => {
            const mockRequest = createMockRequest('http://localhost/api/v1/links', {
                method: 'POST',
                headers: {
                    'x-forwarded-for': '192.168.1.1',
                    'user-agent': 'test-agent',
                    'authorization': 'Bearer uls_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
                },
            });

            mockApplyRateLimit.mockResolvedValue({
                success: true,
                remaining: 49,
                resetTime: Date.now() + 3600000,
            });

            const mockHandler = createMockHandler();
            await withApiV1Middleware(mockRequest, mockHandler);

            expect(console.log).toHaveBeenCalledWith(
                expect.stringMatching(/\[API-V1\] req_\d+_[a-z0-9]+ POST \/api\/v1\/links - IP: 192\.168\.1\.1 - Auth: token - UA: test-agent/)
            );
        });

        it('should log rate limit violations', async () => {
            const mockRequest = createMockRequest('http://localhost/api/v1/links', {
                headers: { 'x-forwarded-for': '192.168.1.1' },
            });

            const resetTime = Date.now() + 3600000;
            mockApplyRateLimit.mockResolvedValue({
                success: false,
                remaining: 0,
                resetTime,
            });

            const mockHandler = createMockHandler();
            await withApiV1Middleware(mockRequest, mockHandler);

            expect(console.warn).toHaveBeenCalledWith(
                expect.stringMatching(/\[API-V1\] req_\d+_[a-z0-9]+ RATE_LIMIT_EXCEEDED GET \/api\/v1\/links - Identifier: 192\.168\.1\.1 - Remaining: 0 - Reset: \d+/)
            );
        });

        it('should not log when logging is disabled', async () => {
            const mockRequest = createMockRequest('http://localhost/api/v1/links');
            const mockHandler = createMockHandler();

            mockApplyRateLimit.mockResolvedValue({
                success: true,
                remaining: 99,
                resetTime: Date.now() + 3600000,
            });

            await withApiV1Middleware(mockRequest, mockHandler, {
                enableLogging: false,
            });

            expect(console.log).not.toHaveBeenCalled();
        });

        it('should log errors when handler throws', async () => {
            const mockRequest = createMockRequest('http://localhost/api/v1/links');
            const error = new Error('Test error');
            const mockHandler = jest.fn().mockRejectedValue(error);

            mockApplyRateLimit.mockResolvedValue({
                success: true,
                remaining: 99,
                resetTime: Date.now() + 3600000,
            });

            await withApiV1Middleware(mockRequest, mockHandler);

            expect(console.error).toHaveBeenCalledWith(
                expect.stringMatching(/\[API-V1\] req_\d+_[a-z0-9]+ GET \/api\/v1\/links - ERROR - \d+ms:/),
                'Test error'
            );
        });
    });

    describe('createApiErrorResponse', () => {
        it('should create standardized error response', () => {
            const response = createApiErrorResponse(
                'TEST_ERROR',
                'Test error message',
                400,
                { field: 'test' },
                'req_123'
            );

            expect(response.status).toBe(400);
            expect(response.headers.get('Content-Type')).toBe('application/json');
            expect(response.headers.get('X-Request-ID')).toBe('req_123');
        });

        it('should create error response without optional parameters', () => {
            const response = createApiErrorResponse(
                'TEST_ERROR',
                'Test error message',
                400
            );

            expect(response.status).toBe(400);
            expect(response.headers.get('Content-Type')).toBe('application/json');
            expect(response.headers.get('X-Request-ID')).toBeNull();
        });
    });

    describe('createApiSuccessResponse', () => {
        it('should create standardized success response', () => {
            const data = { id: 1, name: 'test' };
            const pagination = { page: 1, total: 10 };

            const response = createApiSuccessResponse(
                data,
                201,
                pagination,
                'req_123'
            );

            expect(response.status).toBe(201);
            expect(response.headers.get('Content-Type')).toBe('application/json');
            expect(response.headers.get('X-Request-ID')).toBe('req_123');
        });

        it('should create success response with defaults', () => {
            const data = { id: 1, name: 'test' };

            const response = createApiSuccessResponse(data);

            expect(response.status).toBe(200);
            expect(response.headers.get('Content-Type')).toBe('application/json');
            expect(response.headers.get('X-Request-ID')).toBeNull();
        });
    });

    describe('IP extraction', () => {
        it('should extract IP from x-forwarded-for header', async () => {
            const mockRequest = createMockRequest('http://localhost/api/v1/links', {
                headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
            });

            mockApplyRateLimit.mockResolvedValue({
                success: true,
                remaining: 99,
                resetTime: Date.now() + 3600000,
            });

            const mockHandler = createMockHandler();
            await withApiV1Middleware(mockRequest, mockHandler);

            expect(console.log).toHaveBeenCalledWith(
                expect.stringMatching(/IP: 192\.168\.1\.1/)
            );
        });

        it('should extract IP from x-real-ip header when x-forwarded-for is not available', async () => {
            const mockRequest = createMockRequest('http://localhost/api/v1/links', {
                headers: { 'x-real-ip': '192.168.1.2' },
            });

            mockApplyRateLimit.mockResolvedValue({
                success: true,
                remaining: 99,
                resetTime: Date.now() + 3600000,
            });

            const mockHandler = createMockHandler();
            await withApiV1Middleware(mockRequest, mockHandler);

            expect(console.log).toHaveBeenCalledWith(
                expect.stringMatching(/IP: 192\.168\.1\.2/)
            );
        });

        it('should use unknown as fallback when no IP headers are available', async () => {
            const mockRequest = createMockRequest('http://localhost/api/v1/links');

            mockApplyRateLimit.mockResolvedValue({
                success: true,
                remaining: 99,
                resetTime: Date.now() + 3600000,
            });

            const mockHandler = createMockHandler();
            await withApiV1Middleware(mockRequest, mockHandler);

            expect(console.log).toHaveBeenCalledWith(
                expect.stringMatching(/IP: unknown/)
            );
        });
    });

    describe('Authentication detection', () => {
        it('should detect API token authentication', async () => {
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

            const mockHandler = createMockHandler();
            await withApiV1Middleware(mockRequest, mockHandler);

            expect(console.log).toHaveBeenCalledWith(
                expect.stringMatching(/Auth: token/)
            );
        });

        it('should detect no authentication', async () => {
            const mockRequest = createMockRequest('http://localhost/api/v1/links');

            mockApplyRateLimit.mockResolvedValue({
                success: true,
                remaining: 99,
                resetTime: Date.now() + 3600000,
            });

            const mockHandler = createMockHandler();
            await withApiV1Middleware(mockRequest, mockHandler);

            expect(console.log).toHaveBeenCalledWith(
                expect.stringMatching(/Auth: none/)
            );
        });

        it('should detect invalid token format', async () => {
            const mockRequest = createMockRequest('http://localhost/api/v1/links', {
                headers: {
                    'authorization': 'Bearer invalid-token',
                },
            });

            mockApplyRateLimit.mockResolvedValue({
                success: true,
                remaining: 99,
                resetTime: Date.now() + 3600000,
            });

            const mockHandler = createMockHandler();
            await withApiV1Middleware(mockRequest, mockHandler);

            expect(console.log).toHaveBeenCalledWith(
                expect.stringMatching(/Auth: none/)
            );
        });
    });
});