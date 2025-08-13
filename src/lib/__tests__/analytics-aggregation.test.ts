import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { aggregateLinkStats, aggregateUserStats, getRealtimeStats } from '../analytics-aggregation';
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

describe('Analytics Aggregation', () => {
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

    describe('aggregateLinkStats', () => {
        it('should aggregate basic link statistics', async () => {
            // Create test analytics events
            const events = [
                {
                    linkId,
                    timestamp: new Date('2024-01-01T10:00:00Z'),
                    ip: 'hashed-ip-1',
                    country: 'US',
                    city: 'New York',
                    region: 'NY',
                    language: 'en',
                    userAgent: 'Mozilla/5.0',
                    device: 'desktop' as const,
                    os: 'Windows',
                    browser: 'Chrome',
                },
                {
                    linkId,
                    timestamp: new Date('2024-01-01T11:00:00Z'),
                    ip: 'hashed-ip-2',
                    country: 'CA',
                    city: 'Toronto',
                    region: 'ON',
                    language: 'en',
                    userAgent: 'Mozilla/5.0',
                    device: 'mobile' as const,
                    os: 'iOS',
                    browser: 'Safari',
                },
                {
                    linkId,
                    timestamp: new Date('2024-01-02T10:00:00Z'),
                    ip: 'hashed-ip-3',
                    country: 'US',
                    city: 'Los Angeles',
                    region: 'CA',
                    language: 'en',
                    userAgent: 'Mozilla/5.0',
                    device: 'desktop' as const,
                    os: 'macOS',
                    browser: 'Chrome',
                },
            ];

            await AnalyticsEvent.insertMany(events);

            const stats = await aggregateLinkStats(linkId.toString());

            expect(stats.totalClicks).toBe(3);
            expect(stats.clicksByDay).toHaveLength(2);
            expect(stats.clicksByDay[0]).toEqual({ date: '2024-01-01', clicks: 2 });
            expect(stats.clicksByDay[1]).toEqual({ date: '2024-01-02', clicks: 1 });

            expect(stats.clicksByCountry).toHaveLength(2);
            expect(stats.clicksByCountry[0]).toEqual({ country: 'US', clicks: 2 });
            expect(stats.clicksByCountry[1]).toEqual({ country: 'CA', clicks: 1 });

            expect(stats.clicksByDevice).toHaveLength(2);
            expect(stats.clicksByDevice[0]).toEqual({ device: 'desktop', clicks: 2 });
            expect(stats.clicksByDevice[1]).toEqual({ device: 'mobile', clicks: 1 });

            expect(stats.clicksByBrowser).toHaveLength(2);
            expect(stats.clicksByBrowser[0]).toEqual({ browser: 'Chrome', clicks: 2 });
            expect(stats.clicksByBrowser[1]).toEqual({ browser: 'Safari', clicks: 1 });

            expect(stats.clicksByOS).toHaveLength(3);
            expect(stats.clicksByOS.find(item => item.os === 'Windows')).toEqual({ os: 'Windows', clicks: 1 });
            expect(stats.clicksByOS.find(item => item.os === 'iOS')).toEqual({ os: 'iOS', clicks: 1 });
            expect(stats.clicksByOS.find(item => item.os === 'macOS')).toEqual({ os: 'macOS', clicks: 1 });
        });

        it('should filter by date range', async () => {
            // Create events across different dates
            const events = [
                {
                    linkId,
                    timestamp: new Date('2024-01-01T10:00:00Z'),
                    ip: 'hashed-ip-1',
                    country: 'US',
                    city: 'New York',
                    region: 'NY',
                    language: 'en',
                    userAgent: 'Mozilla/5.0',
                    device: 'desktop' as const,
                    os: 'Windows',
                    browser: 'Chrome',
                },
                {
                    linkId,
                    timestamp: new Date('2024-01-15T10:00:00Z'),
                    ip: 'hashed-ip-2',
                    country: 'CA',
                    city: 'Toronto',
                    region: 'ON',
                    language: 'en',
                    userAgent: 'Mozilla/5.0',
                    device: 'mobile' as const,
                    os: 'iOS',
                    browser: 'Safari',
                },
                {
                    linkId,
                    timestamp: new Date('2024-02-01T10:00:00Z'),
                    ip: 'hashed-ip-3',
                    country: 'UK',
                    city: 'London',
                    region: 'England',
                    language: 'en',
                    userAgent: 'Mozilla/5.0',
                    device: 'tablet' as const,
                    os: 'Android',
                    browser: 'Firefox',
                },
            ];

            await AnalyticsEvent.insertMany(events);

            // Filter for January 2024
            const stats = await aggregateLinkStats(linkId.toString(), {
                startDate: new Date('2024-01-01T00:00:00Z'),
                endDate: new Date('2024-01-31T23:59:59Z'),
            });

            expect(stats.totalClicks).toBe(2);
            expect(stats.clicksByCountry).toHaveLength(2);
            expect(stats.clicksByCountry.find(item => item.country === 'UK')).toBeUndefined();
        });

        it('should return empty stats for non-existent link', async () => {
            const nonExistentLinkId = new mongoose.Types.ObjectId();
            const stats = await aggregateLinkStats(nonExistentLinkId.toString());

            expect(stats.totalClicks).toBe(0);
            expect(stats.clicksByDay).toHaveLength(0);
            expect(stats.clicksByCountry).toHaveLength(0);
            expect(stats.clicksByDevice).toHaveLength(0);
            expect(stats.clicksByBrowser).toHaveLength(0);
            expect(stats.clicksByOS).toHaveLength(0);
        });
    });

    describe('aggregateUserStats', () => {
        it('should aggregate user statistics', async () => {
            // Create another link for the same user
            const link2 = new Link({
                userId,
                originalUrl: 'https://example2.com',
                slug: 'test-slug-2',
                isPublicStats: false,
                isActive: true,
            });
            await link2.save();

            // Create analytics events for both links
            const events = [
                {
                    linkId,
                    timestamp: new Date(),
                    ip: 'hashed-ip-1',
                    country: 'US',
                    city: 'New York',
                    region: 'NY',
                    language: 'en',
                    userAgent: 'Mozilla/5.0',
                    device: 'desktop' as const,
                    os: 'Windows',
                    browser: 'Chrome',
                },
                {
                    linkId,
                    timestamp: new Date(),
                    ip: 'hashed-ip-2',
                    country: 'CA',
                    city: 'Toronto',
                    region: 'ON',
                    language: 'en',
                    userAgent: 'Mozilla/5.0',
                    device: 'mobile' as const,
                    os: 'iOS',
                    browser: 'Safari',
                },
                {
                    linkId: link2._id,
                    timestamp: new Date(),
                    ip: 'hashed-ip-3',
                    country: 'UK',
                    city: 'London',
                    region: 'England',
                    language: 'en',
                    userAgent: 'Mozilla/5.0',
                    device: 'tablet' as const,
                    os: 'Android',
                    browser: 'Firefox',
                },
            ];

            await AnalyticsEvent.insertMany(events);

            const stats = await aggregateUserStats(userId.toString());

            expect(stats.totalLinks).toBe(2);
            expect(stats.totalClicks).toBe(3);
            expect(stats.topLinks).toHaveLength(2);

            // First link should have more clicks
            expect(stats.topLinks[0].clicks).toBe(2);
            expect(stats.topLinks[0].slug).toBe('test-slug');
            expect(stats.topLinks[1].clicks).toBe(1);
            expect(stats.topLinks[1].slug).toBe('test-slug-2');
        });
    });

    describe('getRealtimeStats', () => {
        it('should get realtime statistics', async () => {
            const now = new Date();
            const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
            const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

            // Create events at different times
            const events = [
                {
                    linkId,
                    timestamp: now, // Within last hour
                    ip: 'hashed-ip-1',
                    country: 'US',
                    city: 'New York',
                    region: 'NY',
                    language: 'en',
                    userAgent: 'Mozilla/5.0',
                    device: 'desktop' as const,
                    os: 'Windows',
                    browser: 'Chrome',
                },
                {
                    linkId,
                    timestamp: oneHourAgo, // Within last 24h but not last hour
                    ip: 'hashed-ip-2',
                    country: 'CA',
                    city: 'Toronto',
                    region: 'ON',
                    language: 'en',
                    userAgent: 'Mozilla/5.0',
                    device: 'mobile' as const,
                    os: 'iOS',
                    browser: 'Safari',
                },
                {
                    linkId,
                    timestamp: twoHoursAgo, // Within last 24h but not last hour
                    ip: 'hashed-ip-3',
                    country: 'UK',
                    city: 'London',
                    region: 'England',
                    language: 'en',
                    userAgent: 'Mozilla/5.0',
                    device: 'tablet' as const,
                    os: 'Android',
                    browser: 'Firefox',
                },
            ];

            await AnalyticsEvent.insertMany(events);

            const stats = await getRealtimeStats(linkId.toString());

            expect(stats.clicksLast24h).toBe(3);
            expect(stats.clicksLastHour).toBe(1);
            expect(stats.recentCountries).toContain('US');
            expect(stats.recentCountries).toContain('CA');
            expect(stats.recentCountries).toContain('UK');
        });
    });
});