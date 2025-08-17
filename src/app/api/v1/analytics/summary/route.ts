import { NextRequest } from 'next/server';
import { connectDB } from '../../../../../lib/db-utils';
import AnalyticsEvent from '../../../../../models/AnalyticsEvent';
import Link from '../../../../../models/Link';
import { withApiV1Middleware, createApiSuccessResponse, createApiErrorResponse } from '../../../../../lib/api-v1-middleware';
import { authenticateRequest, AuthContext } from '../../../../../lib/auth-middleware';
import { AppError, ErrorCode } from '../../../../../lib/api-errors';
import { AnalyticsSummaryV1Response } from '../../../../../types/api-v1';
import mongoose from 'mongoose';

/**
 * GET /api/v1/analytics/summary
 * Get summary analytics for all user's links
 */
export async function GET(request: NextRequest) {
    return withApiV1Middleware(request, async (request, context) => {
        try {
            // Authenticate the request
            const auth: AuthContext = await authenticateRequest(request);

            await connectDB();

            const userId = new mongoose.Types.ObjectId(auth.userId);

            // Get current date boundaries
            const now = new Date();
            const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

            // Get all user's links
            const userLinks = await Link.find({ userId, isActive: true }).select('_id slug title');
            const linkIds = userLinks.map(link => link._id);

            if (linkIds.length === 0) {
                // Return empty summary if user has no links
                const emptySummary: AnalyticsSummaryV1Response = {
                    totalLinks: 0,
                    totalClicks: 0,
                    totalUniqueClicks: 0,
                    clicksThisMonth: 0,
                    clicksLastMonth: 0,
                    topPerformingLinks: []
                };
                return createApiSuccessResponse(emptySummary);
            }

            // Run all analytics queries in parallel
            const [
                totalClicks,
                totalUniqueClicks,
                clicksThisMonth,
                clicksLastMonth,
                topPerformingLinksData
            ] = await Promise.all([
                // Total clicks across all user's links
                AnalyticsEvent.countDocuments({ linkId: { $in: linkIds } }),

                // Total unique clicks (unique IPs across all links)
                AnalyticsEvent.distinct('ip', { linkId: { $in: linkIds } }).then(ips => ips.length),

                // Clicks this month
                AnalyticsEvent.countDocuments({
                    linkId: { $in: linkIds },
                    timestamp: { $gte: startOfThisMonth }
                }),

                // Clicks last month
                AnalyticsEvent.countDocuments({
                    linkId: { $in: linkIds },
                    timestamp: { $gte: startOfLastMonth, $lte: endOfLastMonth }
                }),

                // Top performing links (by click count)
                AnalyticsEvent.aggregate([
                    { $match: { linkId: { $in: linkIds } } },
                    { $group: { _id: '$linkId', clicks: { $sum: 1 } } },
                    { $sort: { clicks: -1 } },
                    { $limit: 10 },
                    {
                        $lookup: {
                            from: 'links',
                            localField: '_id',
                            foreignField: '_id',
                            as: 'linkData'
                        }
                    },
                    { $unwind: '$linkData' },
                    {
                        $project: {
                            id: { $toString: '$_id' },
                            slug: '$linkData.slug',
                            title: '$linkData.title',
                            clicks: 1,
                            _id: 0
                        }
                    }
                ])
            ]);

            const response: AnalyticsSummaryV1Response = {
                totalLinks: userLinks.length,
                totalClicks,
                totalUniqueClicks,
                clicksThisMonth,
                clicksLastMonth,
                topPerformingLinks: topPerformingLinksData
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

            console.error('[Analytics Summary API Error]:', error);
            return createApiErrorResponse(
                ErrorCode.INTERNAL_ERROR,
                'Failed to retrieve analytics summary',
                500,
                undefined,
                context.requestId
            );
        }
    });
}