import { NextRequest } from 'next/server';
import { GET } from '../[slug]/route';
import { connectDB } from '../../../../lib/db-utils';
import Link from '../../../../models/Link';
import AnalyticsEvent from '../../../../models/AnalyticsEvent';

// Mock the database connection and models
jest.mock('../../../../lib/db-utils');
jest.mock('../../../../models/Link');
jest.mock('../../../../models/AnalyticsEvent');

const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockLink = Link as jest.Mocked<typeof Link>;
const mockAnalyticsEvent = AnalyticsEvent as any;

describe('/api/redirect/[slug]', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return original URL for valid active link', async () => {
        const mockLinkDoc = {
            _id: 'link123',
            originalUrl: 'https://example.com',
            slug: 'test',
            isActive: true
        };

        (mockConnectDB as any).mockResolvedValue({});
        mockLink.findOne.mockResolvedValue(mockLinkDoc);
        mockLink.findByIdAndUpdate.mockResolvedValue(mockLinkDoc);

        const mockAnalyticsEventInstance = {
            save: jest.fn().mockResolvedValue(undefined)
        };
        mockAnalyticsEvent.mockImplementation(() => mockAnalyticsEventInstance);

        const request = new NextRequest('http://localhost/api/redirect/test', {
            headers: {
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'accept-language': 'en-US,en;q=0.9',
                'x-forwarded-for': '192.168.1.1'
            }
        });

        const response = await GET(request, { params: { slug: 'test' } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.originalUrl).toBe('https://example.com');
        expect(data.data.redirected).toBe(true);
    });

    it('should return 404 for non-existent link', async () => {
        (mockConnectDB as any).mockResolvedValue({});
        mockLink.findOne.mockResolvedValue(null);

        const request = new NextRequest('http://localhost/api/redirect/nonexistent');
        const response = await GET(request, { params: { slug: 'nonexistent' } });
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('LINK_NOT_FOUND');
    });

    it('should return 400 for invalid slug format', async () => {
        const request = new NextRequest('http://localhost/api/redirect/INVALID-SLUG');
        const response = await GET(request, { params: { slug: 'INVALID-SLUG' } });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('INVALID_SLUG');
    });

    it('should handle database errors gracefully', async () => {
        (mockConnectDB as any).mockRejectedValue(new Error('Database connection failed'));

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        const request = new NextRequest('http://localhost/api/redirect/test');
        const response = await GET(request, { params: { slug: 'test' } });
        const data = await response.json();

        // The redirect handler catches the error and returns a 404 with "Link not found or inactive"
        expect(response.status).toBe(404);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('LINK_NOT_FOUND');
        expect(consoleSpy).toHaveBeenCalledWith('Error in redirect handler:', expect.any(Error));

        consoleSpy.mockRestore();
    });
});