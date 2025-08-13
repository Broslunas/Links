import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth-simple';
import { connectDB } from '../../../../../lib/db-utils';
import AnalyticsEvent from '../../../../../models/AnalyticsEvent';
import Link from '../../../../../models/Link';
import { ApiResponse } from '../../../../../types';
import { format } from 'date-fns';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json<ApiResponse>({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Authentication required',
                },
                timestamp: new Date().toISOString(),
            }, { status: 401 });
        }

        await connectDB();

        const url = new URL(request.url);
        const linkId = url.searchParams.get('linkId');
        const format_param = url.searchParams.get('format') || 'csv';
        const startDate = url.searchParams.get('startDate');
        const endDate = url.searchParams.get('endDate');
        const limit = parseInt(url.searchParams.get('limit') || '1000');

        if (!linkId) {
            return NextResponse.json<ApiResponse>({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Link ID is required',
                },
                timestamp: new Date().toISOString(),
            }, { status: 400 });
        }

        // Verify link ownership
        const link = await Link.findById(linkId);
        if (!link) {
            return NextResponse.json<ApiResponse>({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Link not found',
                },
                timestamp: new Date().toISOString(),
            }, { status: 404 });
        }

        if (link.userId.toString() !== session.user.id) {
            return NextResponse.json<ApiResponse>({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Access denied',
                },
                timestamp: new Date().toISOString(),
            }, { status: 403 });
        }

        // Build query filter
        const filter: any = { linkId: new mongoose.Types.ObjectId(linkId) };
        if (startDate || endDate) {
            filter.timestamp = {};
            if (startDate) filter.timestamp.$gte = new Date(startDate);
            if (endDate) filter.timestamp.$lte = new Date(endDate);
        }

        // Get raw analytics events
        const events = await AnalyticsEvent.find(filter)
            .sort({ timestamp: -1 })
            .limit(limit)
            .lean();

        // Generate filename with timestamp
        const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
        const filename = `detailed_analytics_${link.slug}_${timestamp}`;

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
                    totalEvents: events.length,
                    limitApplied: limit,
                },
                events: events.map(event => ({
                    timestamp: event.timestamp,
                    country: event.country,
                    city: event.city,
                    region: event.region,
                    language: event.language,
                    device: event.device,
                    os: event.os,
                    browser: event.browser,
                    referrer: event.referrer || null,
                    // Note: IP is excluded for privacy
                })),
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
            const csvData = generateDetailedCSV(events, link);

            return new NextResponse(csvData, {
                status: 200,
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="${filename}.csv"`,
                },
            });
        }

    } catch (error) {
        console.error('Error exporting detailed analytics:', error);
        return NextResponse.json<ApiResponse>({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to export detailed analytics',
            },
            timestamp: new Date().toISOString(),
        }, { status: 500 });
    }
}

function generateDetailedCSV(events: any[], link: any): string {
    const lines: string[] = [];

    // Header information
    lines.push('# Detailed Analytics Export');
    lines.push(`# Link: ${link.slug}`);
    lines.push(`# Original URL: ${link.originalUrl}`);
    lines.push(`# Exported at: ${new Date().toISOString()}`);
    lines.push(`# Total Events: ${events.length}`);
    lines.push('');

    // CSV Headers
    lines.push('Timestamp,Country,City,Region,Language,Device,OS,Browser,Referrer');

    // Data rows
    events.forEach((event) => {
        const row = [
            event.timestamp.toISOString(),
            `"${event.country}"`,
            `"${event.city}"`,
            `"${event.region}"`,
            event.language,
            event.device,
            `"${event.os}"`,
            `"${event.browser}"`,
            event.referrer ? `"${event.referrer}"` : '',
        ];
        lines.push(row.join(','));
    });

    return lines.join('\n');
}