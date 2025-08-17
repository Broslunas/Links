import { NextRequest, NextResponse } from 'next/server';
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

    // Buscar el link por slug
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

    // Verificar que las estadísticas públicas estén habilitadas
    if (!link.isPublicStats) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Public statistics are not enabled for this link',
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

    // Obtener estadísticas completas
    const fullStats = await aggregateLinkStats(link._id.toString(), {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    // Filtrar información sensible para estadísticas públicas
    const publicStats: Partial<LinkStats> = {
      totalClicks: fullStats.totalClicks,
      clicksByDay: fullStats.clicksByDay,
      clicksByCountry: fullStats.clicksByCountry,
      clicksByDevice: fullStats.clicksByDevice,
      clicksByBrowser: fullStats.clicksByBrowser,
      clicksByOS: fullStats.clicksByOS,
      // Excluir información sensible como referrers específicos
      // que podrían revelar información privada
    };

    // Información básica del link (sin información sensible)
    const linkInfo = {
      slug: link.slug,
      title: link.title,
      description: link.description,
      createdAt: link.createdAt,
      // No incluir originalUrl, userId u otra información sensible
    };

    return NextResponse.json<ApiResponse<{ stats: Partial<LinkStats>; link: any }>>(
      {
        success: true,
        data: {
          stats: publicStats,
          link: linkInfo,
        },
        timestamp: new Date().toISOString(),
      }
    );
  } catch (error) {
    console.error('Error fetching public stats:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch public statistics',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}