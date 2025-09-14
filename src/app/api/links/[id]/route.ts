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
    isClickLimited: link.isClickLimited,
    maxClicks: link.maxClicks,
    isTimeRestricted: link.isTimeRestricted,
    timeRestrictionStart: link.timeRestrictionStart,
    timeRestrictionEnd: link.timeRestrictionEnd,
    timeRestrictionTimezone: link.timeRestrictionTimezone,
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
    'isClickLimited',
    'maxClicks',
    'isTimeRestricted',
    'timeRestrictionStart',
    'timeRestrictionEnd',
    'timeRestrictionTimezone',
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

  // Special handling for click limit fields
  if (Object.prototype.hasOwnProperty.call(body, 'isClickLimited')) {
    if (!body.isClickLimited) {
      // Si se desactiva el límite, limpiar maxClicks
      link.maxClicks = null;
    } else if (body.isClickLimited && (!body.maxClicks || body.maxClicks < 1)) {
      // Si se activa el límite pero no se proporciona maxClicks válido
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        'maxClicks is required and must be greater than 0 for click-limited links',
        400
      );
    } else if (body.isClickLimited && body.maxClicks > 1000000) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        'maxClicks cannot be greater than 1,000,000',
        400
      );
    }
  }

  // Special handling for time restriction fields
  if (Object.prototype.hasOwnProperty.call(body, 'isTimeRestricted')) {
    if (!body.isTimeRestricted) {
      // Si se desactiva la restricción, limpiar campos relacionados
      link.timeRestrictionStart = null;
      link.timeRestrictionEnd = null;
      link.timeRestrictionTimezone = null;
    } else if (body.isTimeRestricted && (!body.timeRestrictionStart || !body.timeRestrictionEnd || !body.timeRestrictionTimezone)) {
      // Si se activa la restricción pero faltan campos
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        'timeRestrictionStart, timeRestrictionEnd, and timeRestrictionTimezone are required for time-restricted links',
        400
      );
    } else if (body.isTimeRestricted) {
      // Validar formato de tiempo
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(body.timeRestrictionStart)) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          'timeRestrictionStart must be in HH:MM format',
          400
        );
      }

      if (!timeRegex.test(body.timeRestrictionEnd)) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          'timeRestrictionEnd must be in HH:MM format',
          400
        );
      }

      if (body.timeRestrictionStart === body.timeRestrictionEnd) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          'timeRestrictionStart and timeRestrictionEnd must be different',
          400
        );
      }
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
    isClickLimited: link.isClickLimited,
    maxClicks: link.maxClicks,
    isTimeRestricted: link.isTimeRestricted,
    timeRestrictionStart: link.timeRestrictionStart,
    timeRestrictionEnd: link.timeRestrictionEnd,
    timeRestrictionTimezone: link.timeRestrictionTimezone,
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
