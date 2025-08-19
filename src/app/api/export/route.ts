import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth-simple';
import { connectDB } from '../../../lib/db-utils';
import Link from '../../../models/Link';
import AnalyticsEvent from '../../../models/AnalyticsEvent';
import User from '../../../models/User';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Connect to database and fetch user data
    await connectDB();
    
    // Find user in database
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Fetch user's links
    const links = await Link.find({ userId: user._id }).lean();
    
    // Fetch user's analytics
    const analytics = await AnalyticsEvent.find({ 
      linkId: { $in: links.map(link => link._id) } 
    }).lean();

    // Prepare export data with real user data
    const exportData = {
      user: {
        name: user.name || session.user.name,
        email: user.email,
        provider: user.provider,
        createdAt: user.createdAt,
        exportDate: new Date().toISOString(),
      },
      links: links.map(link => ({
        id: link._id,
        slug: link.slug,
        originalUrl: link.originalUrl,
        title: link.title,
        description: link.description,
        isPublicStats: link.isPublicStats,
        clickCount: link.clickCount,
        createdAt: link.createdAt,
        updatedAt: link.updatedAt,
        expiresAt: link.expiresAt,
        tags: link.tags || []
      })),
      analytics: analytics.map(event => ({
        id: event._id,
        linkId: event.linkId,
        type: event.type,
        timestamp: event.timestamp,
        userAgent: event.userAgent,
        ip: event.ip,
        country: event.country,
        city: event.city,
        referrer: event.referrer,
        device: event.device,
        browser: event.browser,
        os: event.os
      })),
      summary: {
        totalLinks: links.length,
        totalClicks: links.reduce((sum, link) => sum + (link.clickCount || 0), 0),
        totalAnalyticsEvents: analytics.length,
        exportDate: new Date().toISOString()
      }
    };
    
    // Generate a unique ID for this export
    const exportId = `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store export data in memory cache
    global.exportCache = global.exportCache || new Map();
    global.exportCache.set(exportId, {
      data: exportData,
      createdAt: new Date(),
      email: session.user.email
    });
    
    // Clean up old exports (older than 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    global.exportCache.forEach((value, key) => {
      if (value.createdAt < oneHourAgo) {
        global.exportCache!.delete(key);
      }
    });
    
    const downloadUrl = `${request.nextUrl.origin}/api/export/${exportId}`;
    
    return NextResponse.json({
      success: true,
      downloadUrl,
      exportId,
      summary: exportData.summary
    });
    
  } catch (error) {
    console.error('Error creating export:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}