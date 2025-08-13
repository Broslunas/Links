import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth-simple';
import { connectDB } from '../../../../lib/db-utils';
import { aggregateLinkStats } from '../../../../lib/analytics-aggregation';
import Link from '../../../../models/Link';
import { ApiResponse, LinkStats } from '../../../../types';

export async function GET(
  request: NextRequest,
  { params }: { params: { linkId: string } }
) {
  try {
    const { linkId } = params;

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

    await connectDB();

    // Buscar el link por slug en vez de por _id
    const link = await Link.findOne({ slug: linkId });
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

    // Check if this is a public stats request or authenticated request
    const session = await getServerSession(authOptions);
    const isOwner = session?.user?.id === link.userId.toString();
    const isPublicStats = link.isPublicStats;

    // Allow access if user is owner OR if public stats are enabled
    if (!isOwner && !isPublicStats) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied. Link statistics are private.',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 403 }
      );
    }

    // Parse query parameters for date filtering
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    // Aggregate statistics usando el _id (ObjectId)
    const stats = await aggregateLinkStats(link._id.toString(), {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    return NextResponse.json<ApiResponse<LinkStats>>({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch analytics',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
