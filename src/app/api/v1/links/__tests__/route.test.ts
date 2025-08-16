/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import mongoose from 'mongoose';

// Mock dependencies
jest.mock('../../../../../lib/db-utils', () => ({
    connectDB: jest.fn(),
    generateSlug: jest.fn(() => 'test123'),
    isValidUrl: jest.fn((url: string) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }),
}));

jest.mock('../../../../../models/Link', () => {
    const mockSave = jest.fn();
    const mockToObject = jest.fn();

    const MockLink = jest.fn().mockImplementation(() => ({
        save: mockSave,
        toObject: mockToObject,
    }));

    MockLink.find = jest.fn();
    MockLink.countDocuments = jest.fn();
    MockLink.findOne = jest.fn();

    return MockLink;
});

jest.mock('../../../../../lib/api-token', () => ({
    validateApiToken: jest.fn(),
    updateTokenLastUsed: jest.fn(),
}));

jest.mock('next-auth', () => ({
    getServerSession: jest.fn(),
}));

import { connectDB } from '../../../../../lib/db-utils';
import Link from '../../../../../models/Link';
import { validateApiToken, updateTokenLastUsed } from '../../../../../lib/api-token';

const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockValidateApiToken = validateApiToken as jest.MockedFunction<typeof validateApiToken>;
const mockUpdateTokenLastUsed = updateTokenLastUsed as jest.MockedFunction<typeof updateTokenLastUsed>;

describe('/api/v1/links', () => {
    let mockUser: any;
    let mockLinks: any[];
    let validToken: string;

    beforeEach(() => {
        jest.clearAllMocks();

        mockUser = {
            _id: new mongoose.Types.ObjectId(),
            email: 'test@example.com',
            name: 'Test User',
            provider: 'github',
            apiToken: 'hashed_token',
            apiTokenCreatedAt: new Date(),
        };

        mockLinks = [
            {
                _id: new mongoose.Types.ObjectId(),
                userId: mockUser._id,
                originalUrl: 'https://example.com',
                slug: 'test-link-1',
                title: 'Test Link 1',
                description: 'First test link',
                isPublicStats: false,
                isActive: true,
                clickCount: 10,
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01'),
            },
            {
                _id: new mongoose.Types.ObjectId(),
                userId: mockUser._id,
                originalUrl: 'https://example2.com',
                slug: 'test-link-2',
                title: 'Test Link 2',
                description: 'Second test link',
                isPublicStats: true,
                isActive: true,
                clickCount: 5,
                createdAt: new Date('2024-01-02'),
                updatedAt: new Date('2024-01-02'),
            },
        ];

        validToken = 'uls_' + 'a'.repeat(64);

        mockConnectDB.mockResolvedValue(undefined);
    });

    describe('GET /api/v1/links', () => {
        beforeEach(() => {
            // Mock token validation
            mockValidateApiToken.mockResolvedValue(mockUser);
            mockUpdateTokenLastUsed.mockResolvedValue(undefined);

            // Mock Link.find and Link.countDocuments
            (Link.find as jest.Mock).mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    skip: jest.fn().mockReturnValue({
                        limit: jest.fn().mockReturnValue({
                            lean: jest.fn().mockResolvedValue(mockLinks),
                        }),
                    }),
                }),
            });
            (Link.countDocuments as jest.Mock).mockResolvedValue(mockLinks.length);
        });

        it('should return user links with default pagination', async () => {
            const request = new NextRequest('http://localhost:3000/api/v1/links', {
                headers: {
                    'Authorization': `Bearer ${validToken}`,
                },
            });

            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.data).toHaveLength(2);
            expect(data.pagination).toEqual({
                page: 1,
                limit: 20,
                total: 2,
                totalPages: 1,
            });

            // Verify link transformation
            expect(data.data[0]).toMatchObject({
                id: mockLinks[0]._id.toString(),
                originalUrl: mockLinks[0].originalUrl,
                slug: mockLinks[0].slug,
                title: mockLinks[0].title,
                description: mockLinks[0].description,
                isPublicStats: mockLinks[0].isPublicStats,
                isActive: mockLinks[0].isActive,
                clickCount: mockLinks[0].clickCount,
            });
            expect(data.data[0].shortUrl).toContain(mockLinks[0].slug);
        });

        it('should return 401 without valid token', async () => {
            mockValidateApiToken.mockRejectedValue(new Error('Invalid token'));

            const request = new NextRequest('http://localhost:3000/api/v1/links');

            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.success).toBe(false);
        });

        it('should return 400 for invalid sortBy parameter', async () => {
            const request = new NextRequest('http://localhost:3000/api/v1/links?sortBy=invalid', {
                headers: {
                    'Authorization': `Bearer ${validToken}`,
                },
            });

            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('VALIDATION_ERROR');
            expect(data.error.message).toContain('Invalid sortBy parameter');
        });
    });

    describe('POST /api/v1/links', () => {
        beforeEach(() => {
            // Mock token validation
            mockValidateApiToken.mockResolvedValue(mockUser);
            mockUpdateTokenLastUsed.mockResolvedValue(undefined);

            // Mock Link.findOne for slug checking
            (Link.findOne as jest.Mock).mockResolvedValue(null);

            // Mock Link constructor instance methods
            const mockInstance = {
                save: jest.fn().mockResolvedValue(undefined),
                toObject: jest.fn().mockReturnValue(mockLinks[0]),
                ...mockLinks[0],
            };

            (Link as any).mockImplementation(() => mockInstance);
        });

        it('should create a new link with valid data', async () => {
            const linkData = {
                originalUrl: 'https://example.com',
                title: 'Test Link',
                description: 'A test link',
                isPublicStats: true,
            };

            // Create a mock link that matches the input data
            const mockCreatedLink = {
                _id: new mongoose.Types.ObjectId(),
                userId: mockUser._id,
                originalUrl: linkData.originalUrl,
                slug: 'test123',
                title: linkData.title,
                description: linkData.description,
                isPublicStats: linkData.isPublicStats,
                isActive: true,
                clickCount: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            // Update the mock to return the correct data
            const mockInstance = {
                save: jest.fn().mockResolvedValue(undefined),
                toObject: jest.fn().mockReturnValue(mockCreatedLink),
                ...mockCreatedLink,
            };

            (Link as any).mockImplementation(() => mockInstance);

            const request = new NextRequest('http://localhost:3000/api/v1/links', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${validToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(linkData),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.success).toBe(true);
            expect(data.data).toMatchObject({
                originalUrl: linkData.originalUrl,
                title: linkData.title,
                description: linkData.description,
                isPublicStats: linkData.isPublicStats,
            });
        });

        it('should return 401 without valid token', async () => {
            mockValidateApiToken.mockRejectedValue(new Error('Invalid token'));

            const linkData = {
                originalUrl: 'https://example.com',
            };

            const request = new NextRequest('http://localhost:3000/api/v1/links', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(linkData),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.success).toBe(false);
        });

        it('should return 400 for missing originalUrl', async () => {
            const linkData = {
                title: 'Test Link',
            };

            const request = new NextRequest('http://localhost:3000/api/v1/links', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${validToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(linkData),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('VALIDATION_ERROR');
            expect(data.error.message).toContain('originalUrl is required');
        });
    });
});