import { NextRequest } from 'next/server';
import { connectDB } from '../../../../../../lib/db-utils';
import AnalyticsEvent from '../../../../../../models/AnalyticsEvent';
import Link from '../../../../../../models/Link';
import { withApiV1Middleware, createApiSuccessResponse, createApiErrorResponse } from '../../../../../../lib/api-v1-middleware';
import { authenticateRequest, AuthContext, verifyLinkOwnership } from '../../../../../../lib/auth-middleware';
import { AppError, ErrorCode } from '../../../../../../lib/api-errors';
import { LinkAnalyticsV1Response, LinkAnalyticsV1Params } from '../../../../../../types/api-v1';
import mongoose from 'mongoose';

// Force Node.js runtime for Mongoose compatibility
export const runtime = 'nodejs';


interface RouteParams {
    params: {
        id: string;
    };
}

/**
 * GET /api/v1/analytics/links/{id}
 * Get analytics data for a specific link
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    return withApiV1Middleware(request, async (request, context) => {
        try {
            // Authenticate the request
            const auth: AuthContext = await authenticateRequest(request);

            await connectDB();

            const { id: linkId } = params;
            const { searchParams } = new URL(request.url);

            // Parse query parameters
            const startDate = searchParams.get('startDate');
            const endDate = searchParams.get('endDate');
            const groupBy = searchParams.get('groupBy') as 'day' | 'week' | 'month' | null;

            // Validate linkId format
            if (!mongoose.Types.ObjectId.isValid(linkId)) {
                throw new AppError(
                    ErrorCode.LINK_NOT_FOUND,
                    'Invalid link ID format',
                    404
                );
            }

            // Verify link ownership
            await verifyLinkOwnership(auth.userId, linkId);

            // Get link details
            const link = await Link.findById(linkId);
            if (!link) {
                throw new AppError(
                    ErrorCode.LINK_NOT_FOUND,
                    'Link not found',
                    404
                );
            }

            // Build date filter
            const dateFilter: any = {};
            if (startDate) {
                const start = new Date(startDate);
                if (isNaN(start.getTime())) {
                    throw new AppError(
                        ErrorCode.INVALID_PARAMETER,
                        'Invalid startDate format. Use ISO 8601 format (YYYY-MM-DD)',
                        400
                    );
                }
                dateFilter.$gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                if (isNaN(end.getTime())) {
                    throw new AppError(
                        ErrorCode.INVALID_PARAMETER,
                        'Invalid endDate format. Use ISO 8601 format (YYYY-MM-DD)',
                        400
                    );
                }
                // Set end date to end of day
                end.setHours(23, 59, 59, 999);
                dateFilter.$lte = end;
            }

            const matchFilter: any = { linkId: new mongoose.Types.ObjectId(linkId) };
            if (Object.keys(dateFilter).length > 0) {
                matchFilter.timestamp = dateFilter;
            }

            // Get total clicks and unique clicks
            const [totalClicks, uniqueClicks] = await Promise.all([
                AnalyticsEvent.countDocuments(matchFilter),
                AnalyticsEvent.distinct('ip', matchFilter).then(ips => ips.length)
            ]);

            // Get clicks by date with grouping
            const clicksByDate = await getClicksByDate(linkId, dateFilter, groupBy || 'day');

            // Get top countries
            const topCountries = await AnalyticsEvent.aggregate([
                { $match: matchFilter },
                { $group: { _id: '$country', clicks: { $sum: 1 } } },
                { $sort: { clicks: -1 } },
                { $limit: 10 },
                { $project: { country: '$_id', clicks: 1, _id: 0 } }
            ]);

            // Get top referrers (excluding empty/null referrers)
            const referrerMatchFilter = {
                ...matchFilter,
                referrer: { $exists: true, $nin: [null, ''] }
            };
            const topReferrers = await AnalyticsEvent.aggregate([
                { $match: referrerMatchFilter },
                { $group: { _id: '$referrer', clicks: { $sum: 1 } } },
                { $sort: { clicks: -1 } },
                { $limit: 10 },
                { $project: { referrer: '$_id', clicks: 1, _id: 0 } }
            ]);

            // Get device types
            const deviceTypes = await AnalyticsEvent.aggregate([
                { $match: matchFilter },
                { $group: { _id: '$device', clicks: { $sum: 1 } } },
                { $sort: { clicks: -1 } },
                { $project: { type: '$_id', clicks: 1, _id: 0 } }
            ]);

            const response: LinkAnalyticsV1Response = {
                linkId,
                totalClicks,
                uniqueClicks,
                clicksByDate,
                topCountries,
                topReferrers,
                deviceTypes
            };

            return createApiSuccessResponse(response);

        } catch (error) {
            if (error instanceof AppError) {
                return createApiErrorResponse(
                    error.code,
                    error.message,
                    error.statusCode,
                    error.details,
                    context.requestId
                );
            }

            console.error('[Analytics API Error]:', error);
            return createApiErrorResponse(
                ErrorCode.INTERNAL_ERROR,
                'Failed to retrieve analytics data',
                500,
                undefined,
                context.requestId
            );
        }
    });
}

/**
 * Helper function to get clicks by date with proper grouping
 */
async function getClicksByDate(
    linkId: string,
    dateFilter: any,
    groupBy: 'day' | 'week' | 'month'
): Promise<Array<{ date: string; clicks: number; uniqueClicks: number }>> {
    const matchFilter: any = { linkId: new mongoose.Types.ObjectId(linkId) };
    if (Object.keys(dateFilter).length > 0) {
        matchFilter.timestamp = dateFilter;
    }

    let dateGrouping: any;
    let dateFormat: string;

    switch (groupBy) {
        case 'week':
            dateGrouping = {
                year: { $year: '$timestamp' },
                week: { $week: '$timestamp' }
            };
            dateFormat = '%Y-W%U'; // Year-Week format
            break;
        case 'month':
            dateGrouping = {
                year: { $year: '$timestamp' },
                month: { $month: '$timestamp' }
            };
            dateFormat = '%Y-%m'; // Year-Month format
            break;
        case 'day':
        default:
            dateGrouping = {
                year: { $year: '$timestamp' },
                month: { $month: '$timestamp' },
                day: { $dayOfMonth: '$timestamp' }
            };
            dateFormat = '%Y-%m-%d'; // Year-Month-Day format
            break;
    }

    const pipeline: any[] = [
        { $match: matchFilter },
        {
            $group: {
                _id: dateGrouping,
                clicks: { $sum: 1 },
                uniqueIps: { $addToSet: '$ip' }
            }
        },
        {
            $project: {
                date: {
                    $dateToString: {
                        format: dateFormat,
                        date: {
                            $dateFromParts: groupBy === 'day'
                                ? { year: '$_id.year', month: '$_id.month', day: '$_id.day' }
                                : groupBy === 'month'
                                    ? { year: '$_id.year', month: '$_id.month', day: 1 }
                                    : { year: '$_id.year', month: 1, day: 1 } // For week, we'll format differently
                        }
                    }
                },
                clicks: 1,
                uniqueClicks: { $size: '$uniqueIps' },
                _id: 0
            }
        },
        { $sort: { date: 1 } }
    ];

    // Special handling for week grouping
    if (groupBy === 'week') {
        (pipeline[1] as any) = {
            $group: {
                _id: dateGrouping,
                clicks: { $sum: 1 },
                uniqueIps: { $addToSet: '$ip' },
                firstDate: { $min: '$timestamp' }
            }
        };
        (pipeline[2] as any) = {
            $project: {
                date: {
                    $dateToString: {
                        format: '%Y-W%U',
                        date: '$firstDate'
                    }
                },
                clicks: 1,
                uniqueClicks: { $size: '$uniqueIps' },
                _id: 0
            }
        };
    }

    return await AnalyticsEvent.aggregate(pipeline);
}