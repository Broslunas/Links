import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth-simple';
import { connectDB } from '../../../../lib/db-utils';
import Link from '../../../../models/Link';
import { ApiResponse } from '../../../../types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    const { id } = params;

    if (!id) {
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
    const link = await Link.findOne({ slug: id });
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

    if (link.userId.toString() !== session.user.id) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 403 }
      );
    }

    // Transform the link data
    const linkData = {
      id: link._id.toString(),
      userId: link.userId.toString(),
      originalUrl: link.originalUrl,
      slug: link.slug,
      title: link.title,
      description: link.description,
      isPublicStats: link.isPublicStats,
      isActive: link.isActive,
      createdAt: link.createdAt,
      updatedAt: link.updatedAt,
      clickCount: link.clickCount,
    };

    return NextResponse.json<ApiResponse>({
      success: true,
      data: linkData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching link:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch link',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
