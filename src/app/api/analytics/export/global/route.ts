import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth-simple';
import { connectDB } from '../../../../../lib/db-utils';
import AnalyticsEvent from '../../../../../models/AnalyticsEvent';
import Link from '../../../../../models/Link';
import { ApiResponse } from '../../../../../types';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

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
    const format_param = url.searchParams.get('format') || 'csv';
    const type = url.searchParams.get('type');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    if (type !== 'global') {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Type must be "global" for this endpoint',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

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

    // Aggregate global analytics data
    const [totalClicks, totalUniqueClicks, clicksByDay, clicksByCountry, clicksByDevice, clicksByBrowser, clicksByOS, topLinks] = await Promise.all([
      // Total clicks
      AnalyticsEvent.countDocuments({ linkId: { $in: linkIds }, ...dateFilter }),

      // Total unique clicks (unique IPs)
      AnalyticsEvent.distinct('ip', { linkId: { $in: linkIds }, ...dateFilter }).then(ips => ips.length),

      // Clicks by day
      AnalyticsEvent.aggregate([
        { $match: { linkId: { $in: linkIds }, ...dateFilter } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$timestamp' },
            },
            clicks: { $sum: 1 },
          },
        },
        { $sort: { '_id': 1 } },
        {
          $project: {
            _id: 0,
            date: '$_id',
            clicks: 1,
          },
        },
      ]),

      // Clicks by country
      AnalyticsEvent.aggregate([
        { $match: { linkId: { $in: linkIds }, ...dateFilter } },
        {
          $group: {
            _id: '$country',
            clicks: { $sum: 1 },
          },
        },
        { $sort: { clicks: -1 } },
        { $limit: 20 },
        {
          $project: {
            _id: 0,
            country: '$_id',
            clicks: 1,
          },
        },
      ]),

      // Clicks by device
      AnalyticsEvent.aggregate([
        { $match: { linkId: { $in: linkIds }, ...dateFilter } },
        {
          $group: {
            _id: '$device',
            clicks: { $sum: 1 },
          },
        },
        { $sort: { clicks: -1 } },
        {
          $project: {
            _id: 0,
            device: '$_id',
            clicks: 1,
          },
        },
      ]),

      // Clicks by browser
      AnalyticsEvent.aggregate([
        { $match: { linkId: { $in: linkIds }, ...dateFilter } },
        {
          $group: {
            _id: '$browser',
            clicks: { $sum: 1 },
          },
        },
        { $sort: { clicks: -1 } },
        { $limit: 15 },
        {
          $project: {
            _id: 0,
            browser: '$_id',
            clicks: 1,
          },
        },
      ]),

      // Clicks by OS
      AnalyticsEvent.aggregate([
        { $match: { linkId: { $in: linkIds }, ...dateFilter } },
        {
          $group: {
            _id: '$os',
            clicks: { $sum: 1 },
          },
        },
        { $sort: { clicks: -1 } },
        { $limit: 15 },
        {
          $project: {
            _id: 0,
            os: '$_id',
            clicks: 1,
          },
        },
      ]),

      // Top performing links
      AnalyticsEvent.aggregate([
        { $match: { linkId: { $in: linkIds }, ...dateFilter } },
        {
          $group: {
            _id: '$linkId',
            clicks: { $sum: 1 },
          },
        },
        { $sort: { clicks: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'links',
            localField: '_id',
            foreignField: '_id',
            as: 'linkInfo',
          },
        },
        {
          $project: {
            _id: 0,
            linkId: '$_id',
            slug: { $arrayElemAt: ['$linkInfo.slug', 0] },
            title: { $arrayElemAt: ['$linkInfo.title', 0] },
            clicks: 1,
          },
        },
      ]),
    ]);

    const globalStats = {
      totalLinks: userLinks.length,
      totalClicks,
      totalUniqueClicks,
      topLinks,
      clicksByDay,
      clicksByCountry,
      clicksByDevice,
      clicksByBrowser,
      clicksByOS,
    };

    // Generate filename with timestamp
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
    const filename = `global_analytics_${timestamp}`;

    if (format_param === 'json') {
      // JSON Export
      const jsonData = {
        exportInfo: {
          type: 'global',
          exportedAt: new Date().toISOString(),
          dateRange: {
            startDate: startDate || null,
            endDate: endDate || null,
          },
          totalLinks: userLinks.length,
        },
        statistics: globalStats,
      };

      return new NextResponse(JSON.stringify(jsonData, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}.json"`,
        },
      });
    } else {
      // CSV Export
      const csvData = generateGlobalCSV(globalStats);

      return new NextResponse(csvData, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      });
    }
  } catch (error) {
    console.error('Error exporting global analytics:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to export global analytics',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

function generateGlobalCSV(stats: any): string {
  const lines: string[] = [];

  // Header information
  lines.push('# Global Analytics Export');
  lines.push(`# Total Links: ${stats.totalLinks}`);
  lines.push(`# Total Clicks: ${stats.totalClicks}`);
  lines.push(`# Total Unique Clicks: ${stats.totalUniqueClicks}`);
  lines.push(`# Exported at: ${new Date().toISOString()}`);
  lines.push('');

  // Top Links
  lines.push('## Top Performing Links');
  lines.push('Slug,Title,Clicks');
  (Array.isArray(stats.topLinks) ? stats.topLinks : []).forEach(
    (item: any) => {
      const title = item.title ? `"${item.title.replace(/"/g, '""')}"` : '';
      lines.push(`${item.slug},${title},${item.clicks}`);
    }
  );
  lines.push('');

  // Clicks by Day
  lines.push('## Clicks by Day');
  lines.push('Date,Clicks');
  (Array.isArray(stats.clicksByDay) ? stats.clicksByDay : []).forEach(
    (item: any) => {
      lines.push(`${item.date},${item.clicks}`);
    }
  );
  lines.push('');

  // Clicks by Country
  lines.push('## Clicks by Country');
  lines.push('Country,Clicks');
  (Array.isArray(stats.clicksByCountry) ? stats.clicksByCountry : []).forEach(
    (item: any) => {
      lines.push(`"${item.country}",${item.clicks}`);
    }
  );
  lines.push('');

  // Clicks by Device
  lines.push('## Clicks by Device');
  lines.push('Device,Clicks');
  (Array.isArray(stats.clicksByDevice) ? stats.clicksByDevice : []).forEach(
    (item: any) => {
      lines.push(`${item.device},${item.clicks}`);
    }
  );
  lines.push('');

  // Clicks by Browser
  lines.push('## Clicks by Browser');
  lines.push('Browser,Clicks');
  (Array.isArray(stats.clicksByBrowser) ? stats.clicksByBrowser : []).forEach(
    (item: any) => {
      lines.push(`"${item.browser}",${item.clicks}`);
    }
  );
  lines.push('');

  // Clicks by OS
  lines.push('## Clicks by Operating System');
  lines.push('Operating System,Clicks');
  (Array.isArray(stats.clicksByOS) ? stats.clicksByOS : []).forEach(
    (item: any) => {
      lines.push(`"${item.os}",${item.clicks}`);
    }
  );

  return lines.join('\n');
}