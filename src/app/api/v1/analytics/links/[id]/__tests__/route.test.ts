/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET } from '../route';
import mongoose from 'mongoose';

// Mock dependencies
jest.mock('../../../../../../../lib/db-utils', () => ({
    connectDB: jest.fn(),
}));

jest.mock('../../../../../../../models/User');
jest.mock('../../../../../../../models/Link');
jest.mock('../../../../../../../models/AnalyticsEvent');
jest.mock('../../../../../../../lib/api-token');

import { connectDB } from '../../../../../../../lib/db-utils';
import User from '../../../../../../../models/User';
import Link from '../../../../../../../models/Link';
import AnalyticsEvent from '../../../../../../../models/AnalyticsEvent';
import { validateApiToken, updateTokenLastUsed } from '../../../../../../../lib/api-token';

const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockValidateApiToken = validateApiToken as jest.MockedFunction<typeof validateApiToken>;
const mockUpdateTokenLastUsed = updateTokenLastUsed as jest.MockedFunction<typeof updateTokenLastUsed>;

describe('/api/v1/analytics/links/[id] - GET', () => {
    let testUser: any;
    let testLink: any;
    let validToken: string;

    beforeEach(() => {
        jest.clearAllMocks();
        mockConnectDB.mockResolvedValue(undefined);

        // Create test user
        testUser = {
            _id: new mongoose.Types.ObjectId(),
            email: 'test@example.com',
            name: 'Test User',
            provider: 'github',
            providerId: 'github123',
            apiToken: 'hashed_token',
            apiTokenCreatedAt: new Date(),
            apiTokenLastUsedAt: null,
        };

        // Create test link
        testLink = {
            _id: new mongoose.Types.ObjectId(),
            userId: testUser._id,
            originalUrl: 'https://example.com',
            slug: 'test-link',
            title: 'Test Link',
            description: 'A test link',
            isPublicStats: false,
            isActive: true,
            clickCount: 5,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        validToken = 'uls_' + 'a'.repeat(64);

        // Setup default mocks
        mockValidateApiToken.mockResolvedValue(testUser);
        mockUpdateTokenLastUsed.mockResolvedValue(undefined);
        (Link.findById as jest.Mock).mockResolvedValue(testLink);
    });

    describe('Authentication', () => {
        it('should return 401 when no token provided', async () => {
            mockValidateApiToken.mockResolvedValue(null);

            const request = new NextRequest('http://localhost:3000/api/v1/analytics/links/123');
            const response = await GET(request, { params: { id: '123' } });

            expect(response.status).toBe(401);
            const data = await response.json();
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('UNAUTHORIZED');
        });

        it('should return 401 when invalid token provided', async () => {
            mockValidateApiToken.mockResolvedValue(null);

            const request = new NextRequest('http://localhost:3000/api/v1/analytics/links/123', {
                headers: { Authorization: 'Bearer invalid-token' }
            });
            const response = await GET(request, { params: { id: '123' } });

            expect(response.status).toBe(401);
            const data = await response.json();
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('INVALID_TOKEN');
        });
    });

    describe('Link Validation', () => {
        it('should return 404 for invalid link ID format', async () => {
            const request = new NextRequest('http://localhost:3000/api/v1/analytics/links/invalid-id', {
                headers: { Authorization: `Bearer ${validToken}` }
            });
            const response = await GET(request, { params: { id: 'invalid-id' } });

            expect(response.status).toBe(404);
            const data = await response.json();
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('LINK_NOT_FOUND');
        });

        it('should return 404 when link does not exist', async () => {
            (Link.findById as jest.Mock).mockResolvedValue(null);

            const linkId = new mongoose.Types.ObjectId().toString();
            const request = new NextRequest(`http://localhost:3000/api/v1/analytics/links/${linkId}`, {
                headers: { Authorization: `Bearer ${validToken}` }
            });
            const response = await GET(request, { params: { id: linkId } });

            expect(response.status).toBe(404);
            const data = await response.json();
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('LINK_NOT_FOUND');
        });

        it('should return 403 when user does not own the link', async () => {
            const otherUserId = new mongoose.Types.ObjectId();
            testLink.userId = otherUserId;

            const request = new NextRequest(`http://localhost:3000/api/v1/analytics/links/${testLink._id}`, {
                headers: { Authorization: `Bearer ${validToken}` }
            });
            const response = await GET(request, { params: { id: testLink._id.toString() } });

            expect(response.status).toBe(403);
            const data = await response.json();
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('FORBIDDEN');
        });
    });

    describe('Date Parameter Validation', () => {
        it('should return 400 for invalid startDate format', async () => {
            const request = new NextRequest(
                `http://localhost:3000/api/v1/analytics/links/${testLink._id}?startDate=invalid-date`,
                { headers: { Authorization: `Bearer ${validToken}` } }
            );
            const response = await GET(request, { params: { id: testLink._id.toString() } });

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('INVALID_PARAMETER');
        });

        it('should return 400 for invalid endDate format', async () => {
            const request = new NextRequest(
                `http://localhost:3000/api/v1/analytics/links/${testLink._id}?endDate=invalid-date`,
                { headers: { Authorization: `Bearer ${validToken}` } }
            );
            const response = await GET(request, { params: { id: testLink._id.toString() } });

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('INVALID_PARAMETER');
        });
    });

    describe('Analytics Data Retrieval', () => {
        beforeEach(() => {
            // Mock analytics aggregation results
            (AnalyticsEvent.countDocuments as jest.Mock).mockResolvedValue(10);
            (AnalyticsEvent.distinct as jest.Mock).mockResolvedValue(['ip1', 'ip2', 'ip3']);
            (AnalyticsEvent.aggregate as jest.Mock).mockImplementation((pipeline) => {
                // Determine which aggregation based on pipeline structure
                const pipelineStr = JSON.stringify(pipeline);

                if (pipelineStr.includes('country')) {
                    return Promise.resolve([
                        { country: 'US', clicks: 5 },
                        { country: 'CA', clicks: 3 },
                        { country: 'UK', clicks: 2 }
                    ]);
                }

                if (pipelineStr.includes('referrer')) {
                    return Promise.resolve([
                        { referrer: 'https://google.com', clicks: 4 },
                        { referrer: 'https://twitter.com', clicks: 3 }
                    ]);
                }

                if (pipelineStr.includes('device')) {
                    return Promise.resolve([
                        { type: 'desktop', clicks: 6 },
                        { type: 'mobile', clicks: 4 }
                    ]);
                }

                // Default to clicks by date
                return Promise.resolve([
                    { date: '2024-01-01', clicks: 3, uniqueClicks: 2 },
                    { date: '2024-01-02', clicks: 4, uniqueClicks: 3 },
                    { date: '2024-01-03', clicks: 3, uniqueClicks: 2 }
                ]);
            });
        });

        it('should return analytics data successfully', async () => {
            const request = new NextRequest(`http://localhost:3000/api/v1/analytics/links/${testLink._id}`, {
                headers: { Authorization: `Bearer ${validToken}` }
            });
            const response = await GET(request, { params: { id: testLink._id.toString() } });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.data).toHaveProperty('linkId', testLink._id.toString());
            expect(data.data).toHaveProperty('totalClicks', 10);
            expect(data.data).toHaveProperty('uniqueClicks', 3);
            expect(data.data).toHaveProperty('clicksByDate');
            expect(data.data).toHaveProperty('topCountries');
            expect(data.data).toHaveProperty('topReferrers');
            expect(data.data).toHaveProperty('deviceTypes');
        });

        it('should filter by date range when provided', async () => {
            const startDate = '2024-01-01';
            const endDate = '2024-01-31';

            const request = new NextRequest(
                `http://localhost:3000/api/v1/analytics/links/${testLink._id}?startDate=${startDate}&endDate=${endDate}`,
                { headers: { Authorization: `Bearer ${validToken}` } }
            );
            const response = await GET(request, { params: { id: testLink._id.toString() } });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);

            // Verify that date filters were applied in the aggregation
            expect(AnalyticsEvent.countDocuments).toHaveBeenCalledWith(
                expect.objectContaining({
                    linkId: testLink._id,
                    timestamp: expect.objectContaining({
                        $gte: new Date(startDate),
                        $lte: expect.any(Date)
                    })
                })
            );
        });

        it('should return empty data structure when no analytics exist', async () => {
            (AnalyticsEvent.countDocuments as jest.Mock).mockResolvedValue(0);
            (AnalyticsEvent.distinct as jest.Mock).mockResolvedValue([]);
            (AnalyticsEvent.aggregate as jest.Mock).mockResolvedValue([]);

            const request = new NextRequest(`http://localhost:3000/api/v1/analytics/links/${testLink._id}`, {
                headers: { Authorization: `Bearer ${validToken}` }
            });
            const response = await GET(request, { params: { id: testLink._id.toString() } });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.data.totalClicks).toBe(0);
            expect(data.data.uniqueClicks).toBe(0);
            expect(data.data.clicksByDate).toEqual([]);
            expect(data.data.topCountries).toEqual([]);
            expect(data.data.topReferrers).toEqual([]);
            expect(data.data.deviceTypes).toEqual([]);
        });
    });

    describe('Error Handling', () => {
        it('should handle database connection errors', async () => {
            mockConnectDB.mockRejectedValue(new Error('Database connection failed'));

            const request = new NextRequest(`http://localhost:3000/api/v1/analytics/links/${testLink._id}`, {
                headers: { Authorization: `Bearer ${validToken}` }
            });
            const response = await GET(request, { params: { id: testLink._id.toString() } });

            expect(response.status).toBe(500);
            const data = await response.json();
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('INTERNAL_ERROR');
        });

        it('should handle aggregation errors', async () => {
            (AnalyticsEvent.countDocuments as jest.Mock).mockRejectedValue(new Error('Aggregation failed'));

            const request = new NextRequest(`http://localhost:3000/api/v1/analytics/links/${testLink._id}`, {
                headers: { Authorization: `Bearer ${validToken}` }
            });
            const response = await GET(request, { params: { id: testLink._id.toString() } });

            expect(response.status).toBe(500);
            const data = await response.json();
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('INTERNAL_ERROR');
        });
    });
});