import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db-utils';
import { hashIP, extractAnalyticsData } from '../../../../lib/analytics';
import AnalyticsEvent from '../../../../models/AnalyticsEvent';
import Link from '../../../../models/Link';
import { ApiResponse } from '../../../../types';

export async function POST(request: NextRequest) {
    try {
        const { linkId } = await request.json();

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

        await connectDB();

        // Verify the link exists
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

        // Extract analytics data from request
        const analyticsData = await extractAnalyticsData(request);
        const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            request.headers.get('x-real-ip') ||
            '127.0.0.1';

        // Create analytics event
        const analyticsEvent = new AnalyticsEvent({
            linkId,
            ip: hashIP(clientIP),
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

        // Increment click count on the link
        await Link.findByIdAndUpdate(linkId, { $inc: { clickCount: 1 } });

        return NextResponse.json<ApiResponse>({
            success: true,
            data: { recorded: true },
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Error recording analytics:', error);
        return NextResponse.json<ApiResponse>({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to record analytics',
            },
            timestamp: new Date().toISOString(),
        }, { status: 500 });
    }
}