import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/db-utils';
import Link from '../../../../../models/Link';
import { withAuth, AuthContext, verifyResourceOwnership } from '../../../../../lib/auth-middleware';
import { createSuccessResponse } from '../../../../../lib/api-response';
import { AppError, ErrorCode } from '../../../../../lib/api-errors';

// PATCH /api/links/[id]/favorite - Toggle favorite status
export const PATCH = withAuth(async (
  request: NextRequest,
  auth: AuthContext,
  { params }: { params: { id: string } }
) => {
  const { id } = params;

  if (!id) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      'Link ID is required',
      400
    );
  }

  await connectDB();

  // Buscar el link por slug
  const link = await Link.findOne({ slug: id });
  if (!link) {
    throw new AppError(
      ErrorCode.LINK_NOT_FOUND,
      'Link not found',
      404
    );
  }

  // Verificar que el usuario sea propietario del link
  verifyResourceOwnership(auth.userId, link.userId.toString());

  // Toggle favorite status
  link.isFavorite = !link.isFavorite;
  link.updatedAt = new Date();
  await link.save();

  const linkData = {
    id: link._id.toString(),
    userId: link.userId.toString(),
    originalUrl: link.originalUrl,
    slug: link.slug,
    title: link.title,
    description: link.description,
    isPublicStats: link.isPublicStats,
    isActive: link.isActive,
    isFavorite: link.isFavorite,
    createdAt: link.createdAt,
    updatedAt: link.updatedAt,
    clickCount: link.clickCount,
  };

  return createSuccessResponse({
    ...linkData,
    message: link.isFavorite ? 'Link marcado como favorito' : 'Link removido de favoritos'
  });
});