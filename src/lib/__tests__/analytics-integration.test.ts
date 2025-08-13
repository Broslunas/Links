import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { aggregateLinkStats } from '../analytics-aggregation';
import { extractAnalyticsData, hashIP } from '../analytics';
import AnalyticsEvent from '../../models/AnalyticsEvent';
import Link from '../../models/Link';
import User from '../../models/User';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    // Clear all collections
    await AnalyticsEvent.deleteMany({});
    await Link.deleteMany({});
    await User.deleteMany({});
});

describe('Analytics Integration', () => {
    let userId: mongoose.Types.ObjectId;
    let linkId: mongoose.Types.ObjectId;

    beforeEach(async () => {
        // Create test user
        const user = new User({
            email: 'test@example.com',
            name: 'Test User',
            provider: 'github',
            providerId: 'github123',
        });
        await user.save();
        userId = user._id;

        // Create test link
        const link = new Link({
            userId,
            originalUrl: 'https://example.com',
            slug: 'test-slug',
            isPublicStats: true,
            isActive: true,
        });
        await link.save();
        linkId = link._id;
    });

    it('should process analytics data end-to-end', async () => {
        // Simulate a click request
        const mockRequest = new Request('http://localhost/test', {
            headers: {
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'x-forwarded-for': '203.0.113.1',
                'accept-language': 'en-US,en;q=0.9',
                'referer': 'https://example.com/source'
            }
        });

        // Extract analytics data
        const analyticsData = await extractAnalyticsData(mockRequest);

        // Verify analytics data extraction
        expect(analyticsData.device).toBe('desktop');
        expect(analyticsData.browser).toBe('Chrome');
        expect(analyticsData.os).toBe('Windows');
        expect(analyticsData.language).toBe('en-US');
        expect(analyticsData.referrer).toBe('https://example.com/source');

        // Create analytics event
        const analyticsEvent = new AnalyticsEvent({
            linkId,
            ip: hashIP('203.0.113.1'),
            country: analyticsData.country,
            city: analyticsData.city,
            region: analyticsData.region,
            language: analyticsData.language,
            userAgent: analyticsData.userAgent,
            device: analyticsData.device,
            os: analyticsData.os,
            browser: analyticsData.browser,
            referrer: analyticsData.referrer,
        });

        await analyticsEvent.save();

        // Increment click count
        await Link.findByIdAndUpdate(linkId, { $inc: { clickCount: 1 } });

        // Verify the event was saved
        const savedEvents = await AnalyticsEvent.find({ linkId });
        expect(savedEvents).toHaveLength(1);
        expect(savedEvents[0].device).toBe('desktop');
        expect(savedEvents[0].browser).toBe('Chrome');
        expect(savedEvents[0].os).toBe('Windows');

        // Verify click count was updated
        const updatedLink = await Link.findById(linkId);
        expect(updatedLink?.clickCount).toBe(1);

        // Test analytics aggregation
        const stats = await aggregateLinkStats(linkId.toString());
        expect(stats.totalClicks).toBe(1);
        expect(stats.clicksByDevice).toHaveLength(1);
        expect(stats.clicksByDevice[0]).toEqual({ device: 'desktop', clicks: 1 });
        expect(stats.clicksByBrowser).toHaveLength(1);
        expect(stats.clicksByBrowser[0]).toEqual({ browser: 'Chrome', clicks: 1 });
        expect(stats.clicksByOS).toHaveLength(1);
        expect(stats.clicksByOS[0]).toEqual({ os: 'Windows', clicks: 1 });
    });

    it('should handle multiple clicks and aggregate correctly', async () => {
        // Create multiple analytics events
        const events = [
            {
                linkId,
                timestamp: new Date('2024-01-01T10:00:00Z'),
                ip: hashIP('203.0.113.1'),
                country: 'US',
                city: 'New York',
                region: 'NY',
                language: 'en',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                device: 'desktop' as const,
                os: 'Windows',
                browser: 'Chrome',
                referrer: 'https://google.com',
            },
            {
                linkId,
                timestamp: new Date('2024-01-01T11:00:00Z'),
                ip: hashIP('203.0.113.2'),
                country: 'CA',
                city: 'Toronto',
                region: 'ON',
                language: 'en',
                userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
                device: 'mobile' as const,
                os: 'iOS',
                browser: 'Safari',
                referrer: 'https://twitter.com',
            },
            {
                linkId,
                timestamp: new Date('2024-01-02T10:00:00Z'),
                ip: hashIP('203.0.113.3'),
                country: 'US',
                city: 'Los Angeles',
                region: 'CA',
                language: 'es',
                userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                device: 'desktop' as const,
                os: 'macOS',
                browser: 'Chrome',
            },
        ];

        await AnalyticsEvent.insertMany(events);
        await Link.findByIdAndUpdate(linkId, { clickCount: 3 });

        // Test aggregation
        const stats = await aggregateLinkStats(linkId.toString());

        expect(stats.totalClicks).toBe(3);

        // Check daily aggregation
        expect(stats.clicksByDay).toHaveLength(2);
        expect(stats.clicksByDay[0]).toEqual({ date: '2024-01-01', clicks: 2 });
        expect(stats.clicksByDay[1]).toEqual({ date: '2024-01-02', clicks: 1 });

        // Check country aggregation (sorted by clicks desc)
        expect(stats.clicksByCountry).toHaveLength(2);
        expect(stats.clicksByCountry[0]).toEqual({ country: 'US', clicks: 2 });
        expect(stats.clicksByCountry[1]).toEqual({ country: 'CA', clicks: 1 });

        // Check device aggregation
        expect(stats.clicksByDevice).toHaveLength(2);
        expect(stats.clicksByDevice[0]).toEqual({ device: 'desktop', clicks: 2 });
        expect(stats.clicksByDevice[1]).toEqual({ device: 'mobile', clicks: 1 });

        // Check browser aggregation
        expect(stats.clicksByBrowser).toHaveLength(2);
        expect(stats.clicksByBrowser[0]).toEqual({ browser: 'Chrome', clicks: 2 });
        expect(stats.clicksByBrowser[1]).toEqual({ browser: 'Safari', clicks: 1 });

        // Check OS aggregation
        expect(stats.clicksByOS).toHaveLength(3);
        const windowsOS = stats.clicksByOS.find(item => item.os === 'Windows');
        const iosOS = stats.clicksByOS.find(item => item.os === 'iOS');
        const macOS = stats.clicksByOS.find(item => item.os === 'macOS');

        expect(windowsOS).toEqual({ os: 'Windows', clicks: 1 });
        expect(iosOS).toEqual({ os: 'iOS', clicks: 1 });
        expect(macOS).toEqual({ os: 'macOS', clicks: 1 });
    });

    it('should handle IP hashing correctly', async () => {
        const ip1 = '203.0.113.1';
        const ip2 = '203.0.113.2';

        const hash1a = hashIP(ip1);
        const hash1b = hashIP(ip1);
        const hash2 = hashIP(ip2);

        // Same IP should produce same hash
        expect(hash1a).toBe(hash1b);

        // Different IPs should produce different hashes
        expect(hash1a).not.toBe(hash2);

        // Hashes should be 64 characters (SHA-256)
        expect(hash1a).toHaveLength(64);
        expect(hash2).toHaveLength(64);

        // Hashes should not contain the original IP
        expect(hash1a).not.toContain('203.0.113.1');
        expect(hash2).not.toContain('203.0.113.2');
    });
});