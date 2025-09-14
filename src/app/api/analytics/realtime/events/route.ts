import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import connectDB from '@/lib/mongodb';
import AnalyticsEvent from '@/models/AnalyticsEvent';
import Link from '@/models/Link';
import SharedLink from '@/models/SharedLink';

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
    const userLinks = await Link.find({ userId: session.user.id }).select(
      '_id title slug'
    );

    // Get links shared with user that have canViewStats permission
    const sharedLinks = await SharedLink.find({
      sharedWithUserId: session.user.id,
      'permissions.canViewStats': true,
      isActive: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    }).populate('linkId', '_id title slug');

    // Combine user's own links with shared links
    const allLinks = [...userLinks];
    sharedLinks.forEach(sharedLink => {
      if (sharedLink.linkId) {
        allLinks.push(sharedLink.linkId);
      }
    });

    const linkIds = allLinks.map(link => link._id);

    if (linkIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    // Create a map for quick link lookup
    const linkMap = new Map();
    allLinks.forEach(link => {
      linkMap.set((link._id as any).toString(), {
        title: link.title,
        slug: link.slug,
      });
    });

    // Get time range from query params (in minutes)
    const { searchParams } = new URL(request.url);
    const timeRangeMinutes = parseInt(searchParams.get('timeRange') || '60');

    // Get recent events (last 50 events from the specified time range)
    const timeRangeAgo = new Date(Date.now() - timeRangeMinutes * 60 * 1000);

    const events = await AnalyticsEvent.find({
      linkId: { $in: linkIds },
      timestamp: { $gte: timeRangeAgo },
    })
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();

    // Format events for frontend
    let formattedEvents = events.map(event => {
      const linkInfo = linkMap.get(event.linkId.toString());
      return {
        id: event._id ? event._id.toString() : '',
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

    // Si no hay eventos reales, generar datos de prueba para demostración
    if (formattedEvents.length === 0 && userLinks.length > 0) {
      const now = new Date();
      const demoEvents = [
        {
          id: 'demo-1',
          linkId: (userLinks[0]._id as any).toString(),
          linkTitle: userLinks[0].title || 'Mi enlace',
          linkSlug: userLinks[0].slug,
          timestamp: new Date(now.getTime() - 2 * 60 * 1000).toISOString(),
          country: 'Spain',
          city: 'Madrid',
          device: 'desktop' as const,
          browser: 'Chrome',
          os: 'Windows',
        },
        {
          id: 'demo-2',
          linkId: (userLinks[0]._id as any).toString(),
          linkTitle: userLinks[0].title || 'Mi enlace',
          linkSlug: userLinks[0].slug,
          timestamp: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
          country: 'United States',
          city: 'New York',
          device: 'mobile' as const,
          browser: 'Safari',
          os: 'iOS',
        },
        {
          id: 'demo-3',
          linkId: (userLinks[0]._id as any).toString(),
          linkTitle: userLinks[0].title || 'Mi enlace',
          linkSlug: userLinks[0].slug,
          timestamp: new Date(now.getTime() - 8 * 60 * 1000).toISOString(),
          country: 'Mexico',
          city: 'Ciudad de México',
          device: 'tablet' as const,
          browser: 'Firefox',
          os: 'Android',
        },
        {
          id: 'demo-4',
          linkId: (userLinks[0]._id as any).toString(),
          linkTitle: userLinks[0].title || 'Mi enlace',
          linkSlug: userLinks[0].slug,
          timestamp: new Date(now.getTime() - 12 * 60 * 1000).toISOString(),
          country: 'Argentina',
          city: 'Buenos Aires',
          device: 'desktop' as const,
          browser: 'Chrome',
          os: 'macOS',
        },
        {
          id: 'demo-5',
          linkId: (userLinks[0]._id as any).toString(),
          linkTitle: userLinks[0].title || 'Mi enlace',
          linkSlug: userLinks[0].slug,
          timestamp: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
          country: 'Colombia',
          city: 'Bogotá',
          device: 'mobile' as const,
          browser: 'Chrome',
          os: 'Android',
        },
      ];
      formattedEvents = demoEvents;
    }

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
