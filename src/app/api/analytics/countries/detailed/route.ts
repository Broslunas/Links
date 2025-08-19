import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth-simple';
import { connectDB } from '../../../../../lib/db-utils';
import AnalyticsEvent from '../../../../../models/AnalyticsEvent';
import Link from '../../../../../models/Link';
import { ApiResponse } from '../../../../../types';
import { startOfDay, endOfDay } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    await connectDB();

    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const limit = parseInt(url.searchParams.get('limit') || '5');

    // Get all user's links
    const userLinks = await Link.find({ userId: session.user.id, isActive: true });
    const linkIds = userLinks.map(link => link._id);

    if (linkIds.length === 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'No active links found',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    // Build date filter
    let dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter = {
        timestamp: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      };
    }

    // Get detailed country data with link information
    const countryDetails = await AnalyticsEvent.aggregate([
      { $match: { linkId: { $in: linkIds }, ...dateFilter } },
      {
        $group: {
          _id: {
            country: '$country',
            linkId: '$linkId',
          },
          clicks: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'links',
          localField: '_id.linkId',
          foreignField: '_id',
          as: 'linkInfo',
        },
      },
      {
        $project: {
          _id: 0,
          country: '$_id.country',
          linkId: '$_id.linkId',
          clicks: 1,
          slug: { $arrayElemAt: ['$linkInfo.slug', 0] },
          title: { $arrayElemAt: ['$linkInfo.title', 0] },
          originalUrl: { $arrayElemAt: ['$linkInfo.originalUrl', 0] },
        },
      },
      {
        $group: {
          _id: '$country',
          totalClicks: { $sum: '$clicks' },
          links: {
            $push: {
              linkId: '$linkId',
              slug: '$slug',
              title: '$title',
              originalUrl: '$originalUrl',
              clicks: '$clicks',
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          country: '$_id',
          totalClicks: 1,
          links: {
            $slice: [
              {
                $sortArray: {
                  input: '$links',
                  sortBy: { clicks: -1 },
                },
              },
              3, // Top 3 links per country
            ],
          },
        },
      },
      { $sort: { totalClicks: -1 } },
      { $limit: limit },
    ]);

    // Also get overall country statistics for the map
    const countryStats = await AnalyticsEvent.aggregate([
      { $match: { linkId: { $in: linkIds }, ...dateFilter } },
      {
        $group: {
          _id: '$country',
          clicks: { $sum: 1 },
        },
      },
      { $sort: { clicks: -1 } },
      {
        $project: {
          _id: 0,
          country: '$_id',
          clicks: 1,
        },
      },
    ]);

    const responseData = {
      topCountries: countryDetails,
      allCountries: countryStats,
      totalCountries: countryStats.length,
    };

    return NextResponse.json<ApiResponse>({
      success: true,
      data: responseData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching detailed country analytics:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch detailed country analytics',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}