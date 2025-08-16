import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db-utils';
import Link from '../../../../models/Link';
import { ApiResponse } from '../../../../types';
import { requireDevelopment } from '../../../../lib/auth-middleware';

export const GET = requireDevelopment(async (request: NextRequest) => {

  try {
    // Test database connection
    await connectDB();

    // Get database stats
    const totalLinks = await Link.countDocuments();
    const activeLinks = await Link.countDocuments({ isActive: true });
    const inactiveLinks = await Link.countDocuments({ isActive: false });

    // Check for specific link "wplace"
    const wplaceLink = await Link.findOne({ slug: 'wplace' });

    // Get recent links
    const recentLinks = await Link.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        database: {
          connected: true,
          uri: process.env.MONGODB_URI ? 'Configured' : 'Not configured',
        },
        stats: {
          totalLinks,
          activeLinks,
          inactiveLinks,
        },
        wplaceLink: wplaceLink
          ? {
              exists: true,
              slug: wplaceLink.slug,
              originalUrl: wplaceLink.originalUrl,
              isActive: wplaceLink.isActive,
              clickCount: wplaceLink.clickCount,
              createdAt: wplaceLink.createdAt,
            }
          : {
              exists: false,
            },
        recentLinks: recentLinks.map(link => ({
          slug: link.slug,
          originalUrl: link.originalUrl,
          isActive: link.isActive,
          clickCount: link.clickCount,
          createdAt: link.createdAt,
        })),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Debug: Error de base de datos:', error);

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to connect to database',
          details: {
            error: error instanceof Error ? error.message : String(error),
            mongoUri: process.env.MONGODB_URI ? 'Configured' : 'Not configured',
          },
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
});
