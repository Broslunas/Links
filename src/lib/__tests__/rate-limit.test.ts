/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import {
    applyRateLimit,
    applyConfiguredRateLimit,
    applyApiV1RateLimit,
    applyApiV1RateLimitByPath,
    getApiV1RateLimitIdentifier,
    RATE_LIMITS
} from '../rate-limit';
import { rateLimiter } from '../rate-limiter';

// Mock the rate limiter
jest.mock('../rate-limiter', () => ({
    rateLimiter: {
        checkRateLimit: jest.fn(),
    },
}));

const mockRateLimiter = rateLimiter as jest.Mocked<typeof rateLimiter>;

// Helper function to create mock NextRequest
function createMockRequest(url: string, options: { method?: string; headers?: Record<string, string> } = {}) {
    const { method = 'GET', headers = {} } = options;
    return new NextRequest(url, {
        method,
        headers: new Headers(headers),
    });
}

describe('Rate Limiting', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('applyRateLimit', () => {
        it('should apply rate limit with custom parameters', async () => {
            const mockRequest = createMockRequest('http://localhost/api/test', {
                headers: { 'x-forwarded-for': '192.168.1.1' },
            });

            mockRateLimiter.checkRateLimit.mockResolvedValue({
                allowed: true,
                remaining: 9,
                resetTime: Date.now() + 3600000,
            });

            const result = await applyRateLimit(mockRequest, 'test-action', 10, 3600000);

            expect(result.success).toBe(true);
            expect(result.remaining).toBe(9);
            expect(mockRateLimiter.checkRateLimit).toHaveBeenCalledWith(
                'test-action:ip:192.168.1.1',
                10,
                3600000
            );
        });

        it('should use API token for identification when available', async () => {
            const mockRequest = createMockRequest('http://localhost/api/test', {
                headers: {
                    'authorization': 'Bearer uls_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
                    'x-forwarded-for': '192.168.1.1'
                },
            });

            mockRateLimiter.checkRateLimit.mockResolvedValue({
                allowed: true,
                remaining: 9,
                resetTime: Date.now() + 3600000,
            });

            await applyRateLimit(mockRequest, 'test-action', 10, 3600000);

            expect(mockRateLimiter.checkRateLimit).toHaveBeenCalledWith(
                'test-action:token:uls_1234567890abcdef',
                10,
                3600000
            );
        });
    });

    describe('applyConfiguredRateLimit', () => {
        it('should apply predefined rate limits', async () => {
            const mockRequest = createMockRequest('http://localhost/api/test', {
                headers: { 'x-forwarded-for': '192.168.1.1' },
            });

            mockRateLimiter.checkRateLimit.mockResolvedValue({
                allowed: true,
                remaining: 49,
                resetTime: Date.now() + 3600000,
            });

            const result = await applyConfiguredRateLimit(mockRequest, 'api-v1-create-link');

            expect(result.success).toBe(true);
            expect(result.remaining).toBe(49);
            expect(mockRateLimiter.checkRateLimit).toHaveBeenCalledWith(
                'api-v1-create-link:ip:192.168.1.1',
                50,
                3600000
            );
        });
    });

    describe('getApiV1RateLimitIdentifier', () => {
        it('should use token hash for API token identification', () => {
            const mockRequest = createMockRequest('http://localhost/api/v1/links', {
                headers: {
                    'authorization': 'Bearer uls_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
                },
            });

            const identifier = getApiV1RateLimitIdentifier(mockRequest, 'test-action');
            expect(identifier).toBe('test-action:token:uls_1234567890abcdef');
        });

        it('should fall back to IP when no valid token', () => {
            const mockRequest = createMockRequest('http://localhost/api/v1/links', {
                headers: {
                    'x-forwarded-for': '192.168.1.1',
                },
            });

            const identifier = getApiV1RateLimitIdentifier(mockRequest, 'test-action');
            expect(identifier).toBe('test-action:ip:192.168.1.1');
        });

        it('should fall back to IP when token is malformed', () => {
            const mockRequest = createMockRequest('http://localhost/api/v1/links', {
                headers: {
                    'authorization': 'Bearer invalid-token',
                    'x-forwarded-for': '192.168.1.1',
                },
            });

            const identifier = getApiV1RateLimitIdentifier(mockRequest, 'test-action');
            expect(identifier).toBe('test-action:ip:192.168.1.1');
        });
    });

    describe('applyApiV1RateLimit', () => {
        it('should apply specific endpoint rate limits', async () => {
            const mockRequest = createMockRequest('http://localhost/api/v1/links', {
                headers: { 'x-forwarded-for': '192.168.1.1' },
            });

            mockRateLimiter.checkRateLimit.mockResolvedValue({
                allowed: true,
                remaining: 99,
                resetTime: Date.now() + 3600000,
            });

            const result = await applyApiV1RateLimit(mockRequest, 'links', 'GET');

            expect(result.success).toBe(true);
            expect(result.remaining).toBe(99);
        });

        it('should fall back to general rate limit for unknown endpoints', async () => {
            const mockRequest = createMockRequest('http://localhost/api/v1/unknown', {
                headers: { 'x-forwarded-for': '192.168.1.1' },
            });

            mockRateLimiter.checkRateLimit.mockResolvedValue({
                allowed: true,
                remaining: 299,
                resetTime: Date.now() + 3600000,
            });

            const result = await applyApiV1RateLimit(mockRequest, 'unknown', 'GET');

            expect(result.success).toBe(true);
            expect(result.remaining).toBe(299);
        });

        it('should handle rate limit exceeded', async () => {
            const mockRequest = createMockRequest('http://localhost/api/v1/links', {
                headers: { 'x-forwarded-for': '192.168.1.1' },
            });

            mockRateLimiter.checkRateLimit.mockResolvedValue({
                allowed: false,
                remaining: 0,
                resetTime: Date.now() + 3600000,
            });

            const result = await applyApiV1RateLimit(mockRequest, 'links', 'POST');

            expect(result.success).toBe(false);
            expect(result.remaining).toBe(0);
        });
    });

    describe('applyApiV1RateLimitByPath', () => {
        it('should correctly map links GET endpoint', async () => {
            const mockRequest = createMockRequest('http://localhost/api/v1/links', {
                method: 'GET',
                headers: { 'x-forwarded-for': '192.168.1.1' },
            });

            mockRateLimiter.checkRateLimit.mockResolvedValue({
                allowed: true,
                remaining: 99,
                resetTime: Date.now() + 3600000,
            });

            const result = await applyApiV1RateLimitByPath(mockRequest, '/api/v1/links');

            expect(result.success).toBe(true);
            expect(mockRateLimiter.checkRateLimit).toHaveBeenCalledWith(
                expect.stringContaining('api-v1-get-links'),
                100,
                3600000
            );
        });

        it('should correctly map links POST endpoint', async () => {
            const mockRequest = createMockRequest('http://localhost/api/v1/links', {
                method: 'POST',
                headers: { 'x-forwarded-for': '192.168.1.1' },
            });

            mockRateLimiter.checkRateLimit.mockResolvedValue({
                allowed: true,
                remaining: 49,
                resetTime: Date.now() + 3600000,
            });

            const result = await applyApiV1RateLimitByPath(mockRequest, '/api/v1/links');

            expect(result.success).toBe(true);
            expect(mockRateLimiter.checkRateLimit).toHaveBeenCalledWith(
                expect.stringContaining('api-v1-create-link'),
                50,
                3600000
            );
        });

        it('should correctly map analytics summary endpoint', async () => {
            const mockRequest = createMockRequest('http://localhost/api/v1/analytics/summary', {
                method: 'GET',
                headers: { 'x-forwarded-for': '192.168.1.1' },
            });

            mockRateLimiter.checkRateLimit.mockResolvedValue({
                allowed: true,
                remaining: 199,
                resetTime: Date.now() + 3600000,
            });

            const result = await applyApiV1RateLimitByPath(mockRequest, '/api/v1/analytics/summary');

            expect(result.success).toBe(true);
            expect(mockRateLimiter.checkRateLimit).toHaveBeenCalledWith(
                expect.stringContaining('api-v1-get-analytics-summary'),
                200,
                3600000
            );
        });

        it('should correctly map analytics links endpoint', async () => {
            const mockRequest = createMockRequest('http://localhost/api/v1/analytics/links/123', {
                method: 'GET',
                headers: { 'x-forwarded-for': '192.168.1.1' },
            });

            mockRateLimiter.checkRateLimit.mockResolvedValue({
                allowed: true,
                remaining: 199,
                resetTime: Date.now() + 3600000,
            });

            const result = await applyApiV1RateLimitByPath(mockRequest, '/api/v1/analytics/links/123');

            expect(result.success).toBe(true);
            expect(mockRateLimiter.checkRateLimit).toHaveBeenCalledWith(
                expect.stringContaining('api-v1-get-link-analytics'),
                200,
                3600000
            );
        });

        it('should use general rate limit for unknown paths', async () => {
            const mockRequest = createMockRequest('http://localhost/api/v1/unknown', {
                method: 'GET',
                headers: { 'x-forwarded-for': '192.168.1.1' },
            });

            mockRateLimiter.checkRateLimit.mockResolvedValue({
                allowed: true,
                remaining: 299,
                resetTime: Date.now() + 3600000,
            });

            const result = await applyApiV1RateLimitByPath(mockRequest, '/api/v1/unknown');

            expect(result.success).toBe(true);
            expect(mockRateLimiter.checkRateLimit).toHaveBeenCalledWith(
                expect.stringContaining('api-v1-general'),
                300,
                3600000
            );
        });
    });

    describe('Rate limit configurations', () => {
        it('should have all required API v1 rate limits defined', () => {
            const requiredLimits = [
                'api-v1-get-links',
                'api-v1-create-link',
                'api-v1-update-link',
                'api-v1-delete-link',
                'api-v1-get-link-analytics',
                'api-v1-get-analytics-summary',
                'api-v1-general',
                'api-token-generate',
                'api-token-revoke',
                'api-token-info',
            ];

            requiredLimits.forEach(limit => {
                expect(RATE_LIMITS[limit as keyof typeof RATE_LIMITS]).toBeDefined();
                expect(RATE_LIMITS[limit as keyof typeof RATE_LIMITS].limit).toBeGreaterThan(0);
                expect(RATE_LIMITS[limit as keyof typeof RATE_LIMITS].windowMs).toBeGreaterThan(0);
            });
        });

        it('should have appropriate limits for different operation types', () => {
            // Read operations should have higher limits than write operations
            expect(RATE_LIMITS['api-v1-get-links'].limit).toBeGreaterThan(RATE_LIMITS['api-v1-create-link'].limit);
            expect(RATE_LIMITS['api-v1-get-link-analytics'].limit).toBeGreaterThan(RATE_LIMITS['api-v1-create-link'].limit);

            // Token operations should be more restrictive
            expect(RATE_LIMITS['api-token-generate'].limit).toBeLessThan(RATE_LIMITS['api-v1-create-link'].limit);
        });
    });

    describe('IP extraction', () => {
        it('should extract IP from x-forwarded-for header', async () => {
            const mockRequest = createMockRequest('http://localhost/api/test', {
                headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
            });

            mockRateLimiter.checkRateLimit.mockResolvedValue({
                allowed: true,
                remaining: 9,
                resetTime: Date.now() + 3600000,
            });

            await applyRateLimit(mockRequest, 'test-action', 10, 3600000);

            expect(mockRateLimiter.checkRateLimit).toHaveBeenCalledWith(
                'test-action:ip:192.168.1.1',
                10,
                3600000
            );
        });

        it('should extract IP from x-real-ip header when x-forwarded-for is not available', async () => {
            const mockRequest = createMockRequest('http://localhost/api/test', {
                headers: { 'x-real-ip': '192.168.1.2' },
            });

            mockRateLimiter.checkRateLimit.mockResolvedValue({
                allowed: true,
                remaining: 9,
                resetTime: Date.now() + 3600000,
            });

            await applyRateLimit(mockRequest, 'test-action', 10, 3600000);

            expect(mockRateLimiter.checkRateLimit).toHaveBeenCalledWith(
                'test-action:ip:192.168.1.2',
                10,
                3600000
            );
        });

        it('should extract IP from cf-connecting-ip header when others are not available', async () => {
            const mockRequest = createMockRequest('http://localhost/api/test', {
                headers: { 'cf-connecting-ip': '192.168.1.3' },
            });

            mockRateLimiter.checkRateLimit.mockResolvedValue({
                allowed: true,
                remaining: 9,
                resetTime: Date.now() + 3600000,
            });

            await applyRateLimit(mockRequest, 'test-action', 10, 3600000);

            expect(mockRateLimiter.checkRateLimit).toHaveBeenCalledWith(
                'test-action:ip:192.168.1.3',
                10,
                3600000
            );
        });

        it('should use unknown as fallback when no IP headers are available', async () => {
            const mockRequest = createMockRequest('http://localhost/api/test');

            mockRateLimiter.checkRateLimit.mockResolvedValue({
                allowed: true,
                remaining: 9,
                resetTime: Date.now() + 3600000,
            });

            await applyRateLimit(mockRequest, 'test-action', 10, 3600000);

            expect(mockRateLimiter.checkRateLimit).toHaveBeenCalledWith(
                'test-action:ip:unknown',
                10,
                3600000
            );
        });
    });
});