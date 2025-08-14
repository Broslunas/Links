/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '../route';

// Mock dependencies
jest.mock('../../../../../lib/db-utils', () => ({
    connectDB: jest.fn(),
    generateSlug: jest.fn(() => 'abc123'),
}));

jest.mock('../../../../../models/Link', () => {
    const mockConstructor = jest.fn();
    mockConstructor.find = jest.fn();
    mockConstructor.countDocuments = jest.fn();
    mockConstructor.findOne = jest.fn();
    return mockConstructor;
});

jest.mock('../../../../../lib/api-token', () => ({
    validateApiToken: jest.fn(),
}));

jest.mock('../../../../../lib/rate-limit', () => ({
    applyRateLimit: jest.fn(),
}));

describe('/api/v1/links', () => {
    const mockValidateApiToken = require('../../../../../lib/api-token').validateApiToken;
    const mockApplyRateLimit = require('../../../../../lib/rate-limit').applyRateLimit;
    const mockLink = require('../../../../../models/Link');

    beforeEach(() => {
        jest.clearAllMocks();
        // Default successful rate limit
        mockApplyRateLimit.mockResolvedValue({ success: true });
    });

    describe('GET', () => {
        it('should return 401 for missing authorization header', async () => {
            const request = new NextRequest('http://localhost/api/v1/links');

            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('UNAUTHORIZED');
        });

        it('should return 401 for invalid token format', async () => {
            const request = new NextRequest('http://localhost/api/v1/links', {
                headers: {
                    'Authorization': 'Bearer invalid-token',
                },
            });

            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.success).toBe(false);
        });

        it('should return 401 for invalid API token', async () => {
            mockValidateApiToken.mockResolvedValue(null);

            const request = new NextRequest('http://localhost/api/v1/links', {
                headers: {
                    'Authorization': 'Bearer uls_invalidtoken',
                },
            });

            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.success).toBe(false);
            expect(mockValidateApiToken).toHaveBeenCalledWith('uls_invalidtoken');
        });

        it('should return links for valid token', async () => {
            const mockUser = { _id: 'user123' };
            const mockLinks = [
                {
                    _id: 'link1',
                    originalUrl: 'https://example.com',
                    slug: 'abc123',
                    title: 'Test Link',
                    clickCount: 5,
                    createdAt: new Date(),
                },
            ];

            mockValidateApiToken.mockResolvedValue(mockUser);
            mockLink.countDocuments.mockResolvedValue(1);
            mockLink.find.mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    skip: jest.fn().mockReturnValue({
                        limit: jest.fn().mockReturnValue({
                            lean: jest.fn().mockResolvedValue(mockLinks),
                        }),
                    }),
                }),
            });

            const request = new NextRequest('http://localhost/api/v1/links', {
                headers: {
                    'Authorization': 'Bearer uls_validtoken',
                },
            });

            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.data.links).toHaveLength(1);
            expect(data.data.links[0].slug).toBe('abc123');
            expect(data.data.pagination.total).toBe(1);
        });
    });

    describe('POST', () => {
        it('should return 401 for missing authorization header', async () => {
            const request = new NextRequest('http://localhost/api/v1/links', {
                method: 'POST',
                body: JSON.stringify({ originalUrl: 'https://example.com' }),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.success).toBe(false);
        });

        it('should create link for valid token and data', async () => {
            const mockUser = { _id: 'user123' };
            const mockSavedLink = {
                _id: 'link1',
                userId: 'user123',
                originalUrl: 'https://example.com',
                slug: 'abc123',
                title: 'Test Link',
                isPublicStats: false,
                isActive: true,
                clickCount: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                save: jest.fn().mockResolvedValue(true),
            };

            mockValidateApiToken.mockResolvedValue(mockUser);
            mockLink.findOne.mockResolvedValue(null); // No existing slug

            // Mock the Link constructor
            mockLink.mockImplementation(function () {
                return mockSavedLink;
            });

            const request = new NextRequest('http://localhost/api/v1/links', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer uls_validtoken',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    originalUrl: 'https://example.com',
                    title: 'Test Link',
                }),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.success).toBe(true);
            expect(data.data.slug).toBe('abc123');
            expect(data.data.originalUrl).toBe('https://example.com');
        });
    });
});