import { NextRequest } from 'next/server';
import { POST } from '../route';
import { connectDB } from '../../../../lib/db-utils';
import TempLink from '../../../../models/TempLink';
import Link from '../../../../models/Link';

// Mock dependencies
jest.mock('../../../../lib/db-utils');
jest.mock('../../../../models/TempLink');
jest.mock('../../../../models/Link');
jest.mock('../../../../lib/rate-limiter');

const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockTempLink = TempLink as jest.MockedClass<typeof TempLink>;
const mockLink = Link as jest.MockedClass<typeof Link>;

// Mock rate limiter
jest.mock('../../../../lib/rate-limiter', () => ({
    checkTempLinkRateLimit: jest.fn(),
}));

import { checkTempLinkRateLimit } from '../../../../lib/rate-limiter';
const mockCheckTempLinkRateLimit = checkTempLinkRateLimit as jest.MockedFunction<typeof checkTempLinkRateLimit>;

describe('/api/temp-links', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockConnectDB.mockResolvedValue({} as any);
        mockCheckTempLinkRateLimit.mockResolvedValue({
            allowed: true,
            remaining: 4,
            resetTime: Date.now() + 3600000,
        });
    });

    describe('POST', () => {
        it('should create a temporary link successfully', async () => {
            // Mock database queries
            mockLink.findOne = jest.fn().mockResolvedValue(null);
            mockTempLink.findOne = jest.fn().mockResolvedValue(null);

            const mockSave = jest.fn().mockResolvedValue({
                _id: 'temp-link-id',
                originalUrl: 'https://example.com',
                slug: 'test-slug',
                token: 'test-token-123',
                title: undefined,
                description: undefined,
                clickCount: 0,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            mockTempLink.mockImplementation(() => ({
                save: mockSave,
                _id: 'temp-link-id',
                originalUrl: 'https://example.com',
                slug: 'test-slug',
                token: 'test-token-123',
                title: undefined,
                description: undefined,
                clickCount: 0,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                createdAt: new Date(),
                updatedAt: new Date(),
            }) as any);

            const request = new NextRequest('http://localhost:3000/api/temp-links', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    originalUrl: 'https://example.com',
                    slug: 'test-slug',
                }),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.success).toBe(true);
            expect(data.data.slug).toBe('test-slug');
            expect(data.data.originalUrl).toBe('https://example.com');
            expect(data.data.shortUrl).toContain('test-slug');
            expect(mockSave).toHaveBeenCalled();
        });

        it('should reject when rate limit is exceeded', async () => {
            mockCheckTempLinkRateLimit.mockResolvedValue({
                allowed: false,
                remaining: 0,
                resetTime: Date.now() + 3600000,
            });

            const request = new NextRequest('http://localhost:3000/api/temp-links', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    originalUrl: 'https://example.com',
                }),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(429);
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('RATE_LIMIT_EXCEEDED');
        });

        it('should reject invalid URLs', async () => {
            const request = new NextRequest('http://localhost:3000/api/temp-links', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    originalUrl: 'not-a-valid-url',
                }),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('INVALID_URL');
        });

        it('should reject when slug is already taken', async () => {
            // Mock existing link with same slug
            mockLink.findOne = jest.fn().mockResolvedValue({ slug: 'taken-slug' });
            mockTempLink.findOne = jest.fn().mockResolvedValue(null);

            const request = new NextRequest('http://localhost:3000/api/temp-links', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    originalUrl: 'https://example.com',
                    slug: 'taken-slug',
                }),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(409);
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('SLUG_TAKEN');
        });

        it('should auto-generate slug when not provided', async () => {
            mockLink.findOne = jest.fn().mockResolvedValue(null);
            mockTempLink.findOne = jest.fn().mockResolvedValue(null);

            const mockSave = jest.fn().mockResolvedValue({
                _id: 'temp-link-id',
                originalUrl: 'https://example.com',
                slug: 'auto-generated',
                token: 'test-token-123',
                clickCount: 0,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            mockTempLink.mockImplementation(() => ({
                save: mockSave,
                _id: 'temp-link-id',
                originalUrl: 'https://example.com',
                slug: 'auto-generated',
                token: 'test-token-123',
                clickCount: 0,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                createdAt: new Date(),
                updatedAt: new Date(),
            }) as any);

            const request = new NextRequest('http://localhost:3000/api/temp-links', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    originalUrl: 'https://example.com',
                }),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.success).toBe(true);
            expect(data.data.slug).toBeDefined();
            expect(mockSave).toHaveBeenCalled();
        });
    });
});