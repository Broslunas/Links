import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import connectDB from '@/lib/mongodb';
import AnalyticsEvent from '@/models/AnalyticsEvent';
import Link from '@/models/Link';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Debes iniciar sesión para acceder a esta información',
                    },
                },
                { status: 401 }
            );
        }

        await connectDB();

        // Get user's links
        const userLinks = await Link.find({ userId: session.user.id }).select('_id title slug');
        const linkIds = userLinks.map(link => link._id);

        if (linkIds.length === 0) {
            return NextResponse.json({
                success: true,
                data: [],
            });
        }

        // Create a map for quick link lookup
        const linkMap = new Map();
        userLinks.forEach(link => {
            linkMap.set(link._id.toString(), {
                title: link.title,
                slug: link.slug,
            });
        });

        // Get recent events (last 50 events from the last hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        const events = await AnalyticsEvent.find({
            linkId: { $in: linkIds },
            timestamp: { $gte: oneHourAgo },
        })
            .sort({ timestamp: -1 })
            .limit(50)
            .lean();

        // Format events for frontend
        const formattedEvents = events.map(event => {
            const linkInfo = linkMap.get(event.linkId.toString());
            return {
                id: event._id.toString(),
                linkId: event.linkId.toString(),
                linkTitle: linkInfo?.title || '',
                linkSlug: linkInfo?.slug || '',
                timestamp: event.timestamp.toISOString(),
                country: event.country,
                city: event.city,
                device: event.device,
                browser: event.browser,
                os: event.os,
            };
        });

        return NextResponse.json({
            success: true,
            data: formattedEvents,
        });

    } catch (error) {
        console.error('Error fetching realtime events:', error);
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Error interno del servidor',
                },
            },
            { status: 500 }
        );
    }
}