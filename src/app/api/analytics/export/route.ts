import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth-simple';
import { connectDB } from '../../../../lib/db-utils';
import { aggregateLinkStats } from '../../../../lib/analytics-aggregation';
import AnalyticsEvent from '../../../../models/AnalyticsEvent';
import Link from '../../../../models/Link';
import { ApiResponse } from '../../../../types';
import { format } from 'date-fns';

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
    const linkId = url.searchParams.get('linkId');
    const format_param = url.searchParams.get('format') || 'csv';
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    if (!linkId) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Link ID is required',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Buscar el link por ObjectId o por slug
    let link;
    if (require('mongoose').Types.ObjectId.isValid(linkId)) {
      link = await Link.findById(linkId);
    } else {
      link = await Link.findOne({ slug: linkId });
    }
    if (!link) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Link not found',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    if (link.userId.toString() !== session.user.id) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 403 }
      );
    }

    // Get aggregated stats
    const stats = await aggregateLinkStats((link._id as any).toString(), {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    // Generate filename with timestamp
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
    const filename = `analytics_${link.slug}_${timestamp}`;

    if (format_param === 'json') {
      // JSON Export
      const jsonData = {
        linkInfo: {
          slug: link.slug,
          originalUrl: link.originalUrl,
          createdAt: link.createdAt,
        },
        exportInfo: {
          exportedAt: new Date().toISOString(),
          dateRange: {
            startDate: startDate || null,
            endDate: endDate || null,
          },
        },
        statistics: stats,
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
      const csvData = generateCSV(stats, link);

      return new NextResponse(csvData, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      });
    }
  } catch (error) {
    console.error('Error exporting analytics:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to export analytics',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

function generateCSV(stats: any, link: any): string {
  const lines: string[] = [];

  // Header information
  lines.push('# Analytics Export');
  lines.push(`# Link: ${link.slug}`);
  lines.push(`# Original URL: ${link.originalUrl}`);
  lines.push(`# Exported at: ${new Date().toISOString()}`);
  lines.push(`# Total Clicks: ${stats.totalClicks}`);
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
