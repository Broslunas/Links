import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db-utils';
import Link from '@/models/Link';
import User from '@/models/User';
import AnalyticsEvent from '@/models/AnalyticsEvent';
import { ApiResponse } from '@/types';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';

// Force Node.js runtime for Mongoose compatibility
export const runtime = 'nodejs';


export interface AdminStats {
  totalUsers: number;
  totalLinks: number;
  totalClicks: number;
  activeUsers: number;
  recentActivity: {
    id: string;
    type: 'user_registered' | 'link_created' | 'link_clicked';
    description: string;
    timestamp: string;
    user?: string;
  }[];
}

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check if user has admin role
    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    // Get total users count
    const totalUsers = await User.countDocuments();

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

    // Get recent activity (last 10 activities)
    const recentActivity = [];

    // Recent user registrations
    const recentUsers = await User.find({})
      .sort({ createdAt: -1 })
      .limit(3)
      .select('email createdAt');

    for (const user of recentUsers) {
      recentActivity.push({
        id: user._id?.toString() || '',
        type: 'user_registered' as const,
        description: `Nuevo usuario registrado: ${user.email}`,
        timestamp: user.createdAt.toISOString(),
        user: user.email
      });
    }

    // Recent link creations
    const recentLinks = await Link.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(4)
      .populate('userId', 'email')
      .select('title slug createdAt userId');

    for (const link of recentLinks) {
      recentActivity.push({
        id: (link._id as any).toString(),
        type: 'link_created' as const,
        description: `Nuevo enlace creado: ${link.title || link.slug}`,
        timestamp: link.createdAt.toISOString(),
        user: (link.userId as any)?.email || 'Usuario desconocido'
      });
    }

    // Recent clicks
    const recentClicks = await AnalyticsEvent.find({})
      .sort({ timestamp: -1 })
      .limit(3)
      .populate({
        path: 'linkId',
        select: 'title slug userId',
        populate: {
          path: 'userId',
          select: 'email'
        }
      });

    for (const click of recentClicks) {
      if (click.linkId) {
        recentActivity.push({
          id: click._id.toString(),
          type: 'link_clicked' as const,
          description: `Click en enlace: ${click.linkId.title || click.linkId.slug}`,
          timestamp: click.timestamp.toISOString(),
          user: click.linkId.userId?.email || 'Usuario desconocido'
        });
      }
    }

    // Sort all activities by timestamp and take the most recent 10
    recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const limitedRecentActivity = recentActivity.slice(0, 10);

    const stats: AdminStats = {
      totalUsers,
      totalLinks,
      totalClicks,
      activeUsers,
      recentActivity: limitedRecentActivity
    };

    const response: ApiResponse<AdminStats> = {
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching admin stats:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch admin statistics'
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response, { status: 500 });
  }
}