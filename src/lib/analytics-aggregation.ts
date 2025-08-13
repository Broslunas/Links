import mongoose from 'mongoose';
import AnalyticsEvent from '../models/AnalyticsEvent';
import { LinkStats } from '../types';

export interface DateRange {
    startDate?: Date;
    endDate?: Date;
}

/**
 * Aggregate statistics for a specific link
 */
export async function aggregateLinkStats(
    linkId: string,
    dateRange?: DateRange
): Promise<LinkStats> {
    const linkObjectId = new mongoose.Types.ObjectId(linkId);

    // Build date filter
    const dateFilter: any = {};
    if (dateRange?.startDate) {
        dateFilter.$gte = dateRange.startDate;
    }
    if (dateRange?.endDate) {
        dateFilter.$lte = dateRange.endDate;
    }

    // Base match condition
    const matchCondition: any = { linkId: linkObjectId };
    if (Object.keys(dateFilter).length > 0) {
        matchCondition.timestamp = dateFilter;
    }

    // Aggregate total clicks
    const totalClicksResult = await AnalyticsEvent.aggregate([
        { $match: matchCondition },
        { $count: 'totalClicks' }
    ]);
    const totalClicks = totalClicksResult[0]?.totalClicks || 0;

    // Aggregate clicks by day
    const clicksByDay = await AnalyticsEvent.aggregate([
        { $match: matchCondition },
        {
            $group: {
                _id: {
                    $dateToString: {
                        format: '%Y-%m-%d',
                        date: '$timestamp'
                    }
                },
                clicks: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } },
        {
            $project: {
                _id: 0,
                date: '$_id',
                clicks: 1
            }
        }
    ]);

    // Aggregate clicks by country
    const clicksByCountry = await AnalyticsEvent.aggregate([
        { $match: matchCondition },
        {
            $group: {
                _id: '$country',
                clicks: { $sum: 1 }
            }
        },
        { $sort: { clicks: -1 } },
        {
            $project: {
                _id: 0,
                country: '$_id',
                clicks: 1
            }
        }
    ]);

    // Aggregate clicks by device
    const clicksByDevice = await AnalyticsEvent.aggregate([
        { $match: matchCondition },
        {
            $group: {
                _id: '$device',
                clicks: { $sum: 1 }
            }
        },
        { $sort: { clicks: -1 } },
        {
            $project: {
                _id: 0,
                device: '$_id',
                clicks: 1
            }
        }
    ]);

    // Aggregate clicks by browser
    const clicksByBrowser = await AnalyticsEvent.aggregate([
        { $match: matchCondition },
        {
            $group: {
                _id: '$browser',
                clicks: { $sum: 1 }
            }
        },
        { $sort: { clicks: -1 } },
        {
            $project: {
                _id: 0,
                browser: '$_id',
                clicks: 1
            }
        }
    ]);

    // Aggregate clicks by OS
    const clicksByOS = await AnalyticsEvent.aggregate([
        { $match: matchCondition },
        {
            $group: {
                _id: '$os',
                clicks: { $sum: 1 }
            }
        },
        { $sort: { clicks: -1 } },
        {
            $project: {
                _id: 0,
                os: '$_id',
                clicks: 1
            }
        }
    ]);

    return {
        totalClicks,
        clicksByDay,
        clicksByCountry,
        clicksByDevice,
        clicksByBrowser,
        clicksByOS,
    };
}

/**
 * Get analytics summary for multiple links (for dashboard overview)
 */
export async function aggregateUserStats(
    userId: string,
    dateRange?: DateRange
): Promise<{
    totalLinks: number;
    totalClicks: number;
    topLinks: Array<{
        linkId: string;
        slug: string;
        clicks: number;
    }>;
}> {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Build date filter
    const dateFilter: any = {};
    if (dateRange?.startDate) {
        dateFilter.$gte = dateRange.startDate;
    }
    if (dateRange?.endDate) {
        dateFilter.$lte = dateRange.endDate;
    }

    // Get user's links with click counts
    const pipeline: any[] = [
        {
            $lookup: {
                from: 'links',
                localField: 'linkId',
                foreignField: '_id',
                as: 'link'
            }
        },
        {
            $unwind: '$link'
        },
        {
            $match: {
                'link.userId': userObjectId,
                ...(Object.keys(dateFilter).length > 0 ? { timestamp: dateFilter } : {})
            }
        },
        {
            $group: {
                _id: '$linkId',
                slug: { $first: '$link.slug' },
                clicks: { $sum: 1 }
            }
        },
        {
            $sort: { clicks: -1 }
        },
        {
            $limit: 10
        },
        {
            $project: {
                _id: 0,
                linkId: { $toString: '$_id' },
                slug: 1,
                clicks: 1
            }
        }
    ];

    const topLinks = await AnalyticsEvent.aggregate(pipeline);

    // Get total clicks for user
    const totalClicksPipeline: any[] = [
        {
            $lookup: {
                from: 'links',
                localField: 'linkId',
                foreignField: '_id',
                as: 'link'
            }
        },
        {
            $unwind: '$link'
        },
        {
            $match: {
                'link.userId': userObjectId,
                ...(Object.keys(dateFilter).length > 0 ? { timestamp: dateFilter } : {})
            }
        },
        {
            $count: 'totalClicks'
        }
    ];

    const totalClicksResult = await AnalyticsEvent.aggregate(totalClicksPipeline);
    const totalClicks = totalClicksResult[0]?.totalClicks || 0;

    // Get total links count (from Link collection directly)
    const Link = mongoose.models.Link;
    const totalLinks = await Link.countDocuments({ userId: userObjectId });

    return {
        totalLinks,
        totalClicks,
        topLinks,
    };
}

/**
 * Get real-time analytics for the last 24 hours
 */
export async function getRealtimeStats(linkId: string): Promise<{
    clicksLast24h: number;
    clicksLastHour: number;
    recentCountries: string[];
}> {
    const linkObjectId = new mongoose.Types.ObjectId(linkId);
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

    // Clicks in last 24 hours
    const clicksLast24h = await AnalyticsEvent.countDocuments({
        linkId: linkObjectId,
        timestamp: { $gte: last24h }
    });

    // Clicks in last hour
    const clicksLastHour = await AnalyticsEvent.countDocuments({
        linkId: linkObjectId,
        timestamp: { $gte: lastHour }
    });

    // Recent countries (last 24h)
    const recentCountriesResult = await AnalyticsEvent.aggregate([
        {
            $match: {
                linkId: linkObjectId,
                timestamp: { $gte: last24h }
            }
        },
        {
            $group: {
                _id: '$country',
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
        {
            $project: {
                _id: 0,
                country: '$_id'
            }
        }
    ]);

    const recentCountries = recentCountriesResult.map(item => item.country);

    return {
        clicksLast24h,
        clicksLastHour,
        recentCountries,
    };
}