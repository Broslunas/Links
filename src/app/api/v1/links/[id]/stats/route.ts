import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '../../../../../../lib/db-utils';
import Link from '../../../../../../models/Link';
import AnalyticsEvent from '../../../../../../models/AnalyticsEvent';
import { createSuccessResponse, createErrorResponse, withErrorHandler } from '../../../../../../lib/api-response';
import { createError } from '../../../../../../lib/api-errors';
import { validateApiToken } from '../../../../../../lib/api-token';
import { applyRateLimit } from '../../../../../../lib/rate-limit';

interface RouteParams {
    params: {
        id: string;
    };
}

// GET /api/v1/links/[id]/stats - Get link statistics via API token
export const GET = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request, 'api-get-stats', 200, 3600); // 200 requests per hour
    if (!rateLimitResult.success) {
        throw createError.rateLimitExceeded();
    }

    // Extract and validate API token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw createError.unauthorized('Missing or invalid Authorization header');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const user = await validateApiToken(token);

    if (!user) {
        throw createError.unauthorized('Invalid API token');
    }

    const { id } = params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw createError.validation('Invalid link ID format');
    }

    await connectDB();

    // Find the link and verify ownership
    const link = await Link.findOne({ _id: id, userId: user._id });
    if (!link) {
        throw createError.notFound('Link not found or not owned by user');
    }

    // Parse query parameters for date filtering
    const url = new URL(request.url);
    const startDateParam = url.searchParams.get('startDate');
    const endDateParam = url.searchParams.get('endDate');

    // Build date filter
    const dateFilter: any = { linkId: link._id };

    if (startDateParam) {
        const startDate = new Date(startDateParam);
        if (isNaN(startDate.getTime())) {
            throw createError.validation('Invalid startDate format. Use YYYY-MM-DD');
        }
        dateFilter.timestamp = { $gte: startDate };
    }

    if (endDateParam) {
        const endDate = new Date(endDateParam);
        if (isNaN(endDate.getTime())) {
            throw createError.validation('Invalid endDate format. Use YYYY-MM-DD');
        }
        // Set end date to end of day
        endDate.setHours(23, 59, 59, 999);
        dateFilter.timestamp = { ...dateFilter.timestamp, $lte: endDate };
    }

    // Get analytics data
    const [
        totalClicks,
        uniqueClicks,
        clicksByDay,
        clicksByCountry,
        clicksByDevice,
        clicksByBrowser,
        clicksByOS,
    ] = await Promise.all([
        // Total clicks
        AnalyticsEvent.countDocuments(dateFilter),

        // Unique clicks (by IP hash)
        AnalyticsEvent.distinct('ip', dateFilter).then(ips => ips.length),

        // Clicks by day
        AnalyticsEvent.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
                    },
                    clicks: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } },
            { $project: { date: '$_id', clicks: 1, _id: 0 } }
        ]),

        // Clicks by country
        AnalyticsEvent.aggregate([
            { $match: dateFilter },
            { $group: { _id: '$country', clicks: { $sum: 1 } } },
            { $sort: { clicks: -1 } },
            { $limit: 10 },
            { $project: { country: '$_id', clicks: 1, _id: 0 } }
        ]),

        // Clicks by device
        AnalyticsEvent.aggregate([
            { $match: dateFilter },
            { $group: { _id: '$device', clicks: { $sum: 1 } } },
            { $sort: { clicks: -1 } },
            { $project: { device: '$_id', clicks: 1, _id: 0 } }
        ]),

        // Clicks by browser
        AnalyticsEvent.aggregate([
            { $match: dateFilter },
            { $group: { _id: '$browser', clicks: { $sum: 1 } } },
            { $sort: { clicks: -1 } },
            { $limit: 10 },
            { $project: { browser: '$_id', clicks: 1, _id: 0 } }
        ]),

        // Clicks by OS
        AnalyticsEvent.aggregate([
            { $match: dateFilter },
            { $group: { _id: '$os', clicks: { $sum: 1 } } },
            { $sort: { clicks: -1 } },
            { $limit: 10 },
            { $project: { os: '$_id', clicks: 1, _id: 0 } }
        ]),
    ]);

    const responseData = {
        linkId: link._id,
        slug: link.slug,
        originalUrl: link.originalUrl,
        title: link.title,
        totalClicks,
        uniqueClicks,
        clicksByDay,
        clicksByCountry,
        clicksByDevice,
        clicksByBrowser,
        clicksByOS,
        dateRange: {
            start: startDateParam || null,
            end: endDateParam || null,
        },
    };

    return createSuccessResponse(responseData);
});