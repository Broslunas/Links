import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db-utils';
import { aggregateLinkStats } from '../../../../lib/analytics-aggregation';
import Link from '../../../../models/Link';
import { ApiResponse, LinkStats } from '../../../../types';
import { authenticateRequest, AuthContext } from '../../../../lib/auth-middleware';
import { createSuccessResponse, createErrorResponse } from '../../../../lib/api-response';
import { AppError, ErrorCode } from '../../../../lib/api-errors';

export async function GET(
  request: NextRequest,
  { params }: { params: { linkId: string } }
) {
  try {
    const { linkId } = params;

    if (!linkId) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        'Link ID is required',
        400
      );
    }

    await connectDB();

    // Buscar el link por slug en vez de por _id
    const link = await Link.findOne({ slug: linkId });
    if (!link) {
      throw new AppError(
        ErrorCode.LINK_NOT_FOUND,
        'Link not found',
        404
      );
    }

    // Intentar autenticación (opcional para stats públicas)
    let auth: AuthContext | null = null;
    try {
      auth = await authenticateRequest(request);
    } catch (error) {
      // Ignorar errores de autenticación para stats públicas
    }

    const isOwner = auth?.userId === link.userId.toString();
    const isPublicStats = link.isPublicStats;

    // Allow access if user is owner OR if public stats are enabled
    if (!isOwner && !isPublicStats) {
      throw new AppError(
        ErrorCode.FORBIDDEN,
        'Access denied. Link statistics are private.',
        403
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

    return createSuccessResponse(stats);
  } catch (error) {
    if (error instanceof AppError) {
      return createErrorResponse(error);
    }
    
    console.error('Error fetching analytics:', error);
    return createErrorResponse(
      new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to fetch analytics',
        500
      )
    );
  }
}
