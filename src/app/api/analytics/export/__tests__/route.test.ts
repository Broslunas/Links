/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '../route';
import { getServerSession } from 'next-auth';
import { connectDB } from '../../../../../lib/db-utils';
import { aggregateLinkStats } from '../../../../../lib/analytics-aggregation';
import Link from '../../../../../models/Link';

// Mock dependencies
jest.mock('next-auth');
jest.mock('../../../../../lib/db-utils');
jest.mock('../../../../../lib/analytics-aggregation');
jest.mock('../../../../../models/Link');

// Mock global Request and Response
global.Request = jest.fn();
global.Response = jest.fn();

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockAggregateLinkStats = aggregateLinkStats as jest.MockedFunction<typeof aggregateLinkStats>;
const mockLink = Link as jest.Mocked<typeof Link>;

describe('/api/analytics/export', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return 401 if user is not authenticated', async () => {
        mockGetServerSession.mockResolvedValue(null);

        const request = new NextRequest('http://localhost:3000/api/analytics/export?linkId=123');
        const response = await GET(request);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 400 if linkId is missing', async () => {
        mockGetServerSession.mockResolvedValue({
            user: { id: 'user123', email: 'test@example.com' },
            expires: '2024-01-01',
        });

        const request = new NextRequest('http://localhost:3000/api/analytics/export');
        const response = await GET(request);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 if link is not found', async () => {
        mockGetServerSession.mockResolvedValue({
            user: { id: 'user123', email: 'test@example.com' },
            expires: '2024-01-01',
        });
        mockConnectDB.mockResolvedValue(undefined);
        mockLink.findById.mockResolvedValue(null);

        const request = new NextRequest('http://localhost:3000/api/analytics/export?linkId=123');
        const response = await GET(request);

        expect(response.status).toBe(404);
        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('NOT_FOUND');
    });

    it('should return 403 if user does not own the link', async () => {
        mockGetServerSession.mockResolvedValue({
            user: { id: 'user123', email: 'test@example.com' },
            expires: '2024-01-01',
        });
        mockConnectDB.mockResolvedValue(undefined);
        mockLink.findById.mockResolvedValue({
            _id: 'link123',
            userId: { toString: () => 'differentUser' },
            slug: 'test-slug',
            originalUrl: 'https://example.com',
            createdAt: new Date(),
        });

        const request = new NextRequest('http://localhost:3000/api/analytics/export?linkId=123');
        const response = await GET(request);

        expect(response.status).toBe(403);
        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('FORBIDDEN');
    });

    it('should export CSV data successfully', async () => {
        const mockStats = {
            totalClicks: 100,
            clicksByDay: [
                { date: '2024-01-01', clicks: 50 },
                { date: '2024-01-02', clicks: 50 },
            ],
            clicksByCountry: [
                { country: 'United States', clicks: 60 },
                { country: 'Canada', clicks: 40 },
            ],
            clicksByDevice: [
                { device: 'desktop', clicks: 70 },
                { device: 'mobile', clicks: 30 },
            ],
            clicksByBrowser: [
                { browser: 'Chrome', clicks: 80 },
                { browser: 'Firefox', clicks: 20 },
            ],
            clicksByOS: [
                { os: 'Windows', clicks: 60 },
                { os: 'macOS', clicks: 40 },
            ],
        };

        mockGetServerSession.mockResolvedValue({
            user: { id: 'user123', email: 'test@example.com' },
            expires: '2024-01-01',
        });
        mockConnectDB.mockResolvedValue(undefined);
        mockLink.findById.mockResolvedValue({
            _id: 'link123',
            userId: { toString: () => 'user123' },
            slug: 'test-slug',
            originalUrl: 'https://example.com',
            createdAt: new Date(),
        });
        mockAggregateLinkStats.mockResolvedValue(mockStats);

        const request = new NextRequest('http://localhost:3000/api/analytics/export?linkId=123&format=csv');
        const response = await GET(request);

        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toBe('text/csv');
        expect(response.headers.get('content-disposition')).toContain('attachment');
        expect(response.headers.get('content-disposition')).toContain('.csv');

        const csvContent = await response.text();
        expect(csvContent).toContain('# Analytics Export');
        expect(csvContent).toContain('# Link: test-slug');
        expect(csvContent).toContain('# Total Clicks: 100');
        expect(csvContent).toContain('Date,Clicks');
        expect(csvContent).toContain('2024-01-01,50');
        expect(csvContent).toContain('Country,Clicks');
        expect(csvContent).toContain('"United States",60');
    });

    it('should export JSON data successfully', async () => {
        const mockStats = {
            totalClicks: 100,
            clicksByDay: [{ date: '2024-01-01', clicks: 50 }],
            clicksByCountry: [{ country: 'United States', clicks: 60 }],
            clicksByDevice: [{ device: 'desktop', clicks: 70 }],
            clicksByBrowser: [{ browser: 'Chrome', clicks: 80 }],
            clicksByOS: [{ os: 'Windows', clicks: 60 }],
        };

        mockGetServerSession.mockResolvedValue({
            user: { id: 'user123', email: 'test@example.com' },
            expires: '2024-01-01',
        });
        mockConnectDB.mockResolvedValue(undefined);
        mockLink.findById.mockResolvedValue({
            _id: 'link123',
            userId: { toString: () => 'user123' },
            slug: 'test-slug',
            originalUrl: 'https://example.com',
            createdAt: new Date(),
        });
        mockAggregateLinkStats.mockResolvedValue(mockStats);

        const request = new NextRequest('http://localhost:3000/api/analytics/export?linkId=123&format=json');
        const response = await GET(request);

        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toBe('application/json');
        expect(response.headers.get('content-disposition')).toContain('attachment');
        expect(response.headers.get('content-disposition')).toContain('.json');

        const jsonContent = await response.json();
        expect(jsonContent.linkInfo.slug).toBe('test-slug');
        expect(jsonContent.statistics.totalClicks).toBe(100);
        expect(jsonContent.exportInfo.exportedAt).toBeDefined();
    });

    it('should handle date range parameters', async () => {
        const mockStats = {
            totalClicks: 50,
            clicksByDay: [{ date: '2024-01-01', clicks: 50 }],
            clicksByCountry: [{ country: 'United States', clicks: 50 }],
            clicksByDevice: [{ device: 'desktop', clicks: 50 }],
            clicksByBrowser: [{ browser: 'Chrome', clicks: 50 }],
            clicksByOS: [{ os: 'Windows', clicks: 50 }],
        };

        mockGetServerSession.mockResolvedValue({
            user: { id: 'user123', email: 'test@example.com' },
            expires: '2024-01-01',
        });
        mockConnectDB.mockResolvedValue(undefined);
        mockLink.findById.mockResolvedValue({
            _id: 'link123',
            userId: { toString: () => 'user123' },
            slug: 'test-slug',
            originalUrl: 'https://example.com',
            createdAt: new Date(),
        });
        mockAggregateLinkStats.mockResolvedValue(mockStats);

        const startDate = '2024-01-01T00:00:00.000Z';
        const endDate = '2024-01-31T23:59:59.999Z';
        const request = new NextRequest(
            `http://localhost:3000/api/analytics/export?linkId=123&startDate=${startDate}&endDate=${endDate}`
        );
        const response = await GET(request);

        expect(response.status).toBe(200);
        expect(mockAggregateLinkStats).toHaveBeenCalledWith('123', {
            startDate: new Date(startDate),
            endDate: new Date(endDate),
        });
    });
});