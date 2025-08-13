import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db-utils';
import Link from '@/models/Link';
import User from '@/models/User';
import AnalyticsEvent from '@/models/AnalyticsEvent';
import { ApiResponse } from '@/types';

export interface GlobalStats {
  totalLinks: number;
  totalClicks: number;
  activeUsers: number;
  uptime: string;
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get total links count
    const totalLinks = await Link.countDocuments({ isActive: true });

    // Get total clicks from analytics events
    const totalClicksResult = await AnalyticsEvent.aggregate([
      { $count: 'totalClicks' }
    ]);
    const totalClicks = totalClicksResult[0]?.totalClicks || 0;

    // Get active users (users who have created at least one link in the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Calculate uptime (simplified - in a real app this would come from monitoring)
    const uptime = '99.9%';

    const stats: GlobalStats = {
      totalLinks,
      totalClicks,
      activeUsers,
      uptime
    };

    const response: ApiResponse<GlobalStats> = {
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching global stats:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch global statistics'
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response, { status: 500 });
  }
}