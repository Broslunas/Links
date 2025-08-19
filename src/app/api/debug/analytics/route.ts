import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db-utils';
import AnalyticsEvent from '../../../../models/AnalyticsEvent';
import { ApiResponse } from '../../../../types';
import { requireDevelopment } from '../../../../lib/auth-middleware';

export const GET = requireDevelopment(async (request: NextRequest) => {
  try {
    // Test database connection
    await connectDB();

    // Get analytics stats
    const totalEvents = await AnalyticsEvent.countDocuments();
    const eventsWithReferrer = await AnalyticsEvent.countDocuments({ referrer: { $exists: true, $nin: [null, ''] } });
    const eventsWithoutReferrer = await AnalyticsEvent.countDocuments({ $or: [{ referrer: { $exists: false } }, { referrer: null }, { referrer: '' }] });

    // Get sample events with referrer data
    const sampleEventsWithReferrer = await AnalyticsEvent.find({ 
      referrer: { $exists: true, $nin: [null, ''] }
    })
      .sort({ timestamp: -1 })
      .limit(5)
      .lean();

    // Get sample events without referrer data
    const sampleEventsWithoutReferrer = await AnalyticsEvent.find({ 
      $or: [{ referrer: { $exists: false } }, { referrer: null }, { referrer: '' }] 
    })
      .sort({ timestamp: -1 })
      .limit(5)
      .lean();

    // Get unique referrers
    const uniqueReferrers = await AnalyticsEvent.distinct('referrer', { 
      referrer: { $exists: true, $nin: [null, ''] } 
    });

    // Get recent events (last 10)
    const recentEvents = await AnalyticsEvent.find({})
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        database: {
          connected: true,
        },
        stats: {
          totalEvents,
          eventsWithReferrer,
          eventsWithoutReferrer,
          uniqueReferrers: uniqueReferrers.length,
        },
        uniqueReferrers,
        sampleEventsWithReferrer,
        sampleEventsWithoutReferrer,
        recentEvents: recentEvents.map(event => ({
          linkId: event.linkId,
          timestamp: event.timestamp,
          country: event.country,
          device: event.device,
          browser: event.browser,
          referrer: event.referrer || 'No referrer',
        })),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Debug analytics error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        code: 'DEBUG_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
});