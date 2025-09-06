import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db-utils';
import Link from '../../../../models/Link';
import { ApiResponse } from '../../../../types';
import { withAuth, AuthContext, verifyResourceOwnership } from '../../../../lib/auth-middleware';
import { createSuccessResponse, createErrorResponse } from '../../../../lib/api-response';
import { AppError, ErrorCode } from '../../../../lib/api-errors';

export const GET = withAuth(async (
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

  // Buscar el link por slug en vez de por _id
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
    isFavorite: link.isFavorite,
    isTemporary: link.isTemporary,
    expiresAt: link.expiresAt?.toISOString(),
    isExpired: link.isExpired,
    createdAt: link.createdAt,
    updatedAt: link.updatedAt,
    clickCount: link.clickCount,
  };

  return createSuccessResponse(linkData);
});

export const PUT = withAuth(async (
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

  const body = await request.json();
  // Only allow updating certain fields
  const updatableFields = [
    'title',
    'description',
    'isPublicStats',
    'isActive',
    'originalUrl',
    'isFavorite',
    'isTemporary',
    'expiresAt',
    'isExpired',
  ];
  updatableFields.forEach(field => {
    // Permite actualizar el campo aunque el valor sea vacío, null, false, etc.
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      link[field] = body[field];
    }
  });

  // Special handling for extending expired links
  if (body.extendTime && link.isTemporary) {
    const now = new Date();
    const extensionHours = parseInt(body.extendTime);
    
    if (extensionHours > 0 && extensionHours <= 720) { // Max 30 days
      link.expiresAt = new Date(now.getTime() + extensionHours * 60 * 60 * 1000);
      link.isExpired = false;
      link.isActive = true;
    }
  }
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

  return createSuccessResponse(linkData);
});
export const DELETE = withAuth(async (
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

  await link.deleteOne();

  return createSuccessResponse({ message: 'Enlace eliminado correctamente' });
});
