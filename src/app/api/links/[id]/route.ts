import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db-utils';
import Link from '../../../../models/Link';
import { ApiResponse } from '../../../../types';
import { withAuth, AuthContext, verifyResourceOwnership, verifyLinkAccessBySlug } from '../../../../lib/auth-middleware';
import { createSuccessResponse, createErrorResponse } from '../../../../lib/api-response';
import { AppError, ErrorCode } from '../../../../lib/api-errors';

// Force Node.js runtime for Mongoose compatibility
export const runtime = 'nodejs';


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

  // Verificar acceso al enlace (propietario o permisos compartidos)
  const { isOwner, sharedLink, link } = await verifyLinkAccessBySlug(
    auth.userId,
    id,
    'canView' // Requiere al menos permiso de visualización
  );

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
  
  // Verificar acceso al enlace (propietario o permisos compartidos)
  const { isOwner, sharedLink, link } = await verifyLinkAccessBySlug(
    auth.userId,
    id,
    'canEdit' // Requiere permiso de edición para modificar
  );

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
    'slug',
  ];
  updatableFields.forEach(field => {
    // Permite actualizar el campo aunque el valor sea vacío, null, false, etc.
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      link[field] = body[field];
    }
  });

  // Special handling for slug updates
  if (Object.prototype.hasOwnProperty.call(body, 'slug') && body.slug !== link.slug) {
    const newSlug = body.slug.trim().toLowerCase();
    
    // Validate slug format
    if (!/^[a-zA-Z0-9-_]+$/.test(newSlug)) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        'Slug can only contain letters, numbers, hyphens, and underscores',
        400
      );
    }
    
    if (newSlug.length < 3 || newSlug.length > 50) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        'Slug must be between 3 and 50 characters',
        400
      );
    }
    
    // Check if slug is already taken
    const existingLink = await Link.findOne({ slug: newSlug });
    if (existingLink) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        `Slug '${newSlug}' is already taken`,
        409
      );
    }
    
    link.slug = newSlug;
  }

  // Special handling for converting temporary to permanent links
  if (Object.prototype.hasOwnProperty.call(body, 'isTemporary')) {
    if (!body.isTemporary) {
      // Si se convierte a permanente, limpiar campos relacionados con temporalidad
      link.expiresAt = null;
      link.isExpired = false;
    } else if (body.isTemporary && !body.expiresAt) {
      // Si se convierte a temporal pero no se proporciona expiresAt, usar validación
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        'expiresAt is required for temporary links',
        400
      );
    }
  }

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
    isTemporary: link.isTemporary,
    expiresAt: link.expiresAt?.toISOString(),
    isExpired: link.isExpired,
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
  
  // Verificar acceso al enlace (propietario o permisos compartidos)
  const { isOwner, sharedLink, link } = await verifyLinkAccessBySlug(
    auth.userId,
    id,
    'canDelete' // Requiere permiso de eliminación
  );

  await link.deleteOne();

  return createSuccessResponse({ message: 'Enlace eliminado correctamente' });
});
