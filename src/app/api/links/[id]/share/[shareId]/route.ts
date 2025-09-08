import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../../../lib/db-utils';
import { withAuth, AuthContext, verifyLinkAccess } from '../../../../../../lib/auth-middleware';
import { createSuccessResponse } from '../../../../../../lib/api-response';
import { AppError, ErrorCode } from '../../../../../../lib/api-errors';
import SharedLink from '../../../../../../models/SharedLink';

// PUT /api/links/[id]/share/[shareId] - Actualizar permisos de un enlace compartido
export const PUT = withAuth(async (
  request: NextRequest,
  auth: AuthContext,
  { params }: { params: { id: string; shareId: string } }
) => {
  const { id, shareId } = params;

  if (!id || !shareId) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      'Link ID and Share ID are required',
      400
    );
  }

  await connectDB();

  // Verificar que el usuario tenga permisos para gestionar el enlace
  const { isOwner, sharedLink: userSharedLink } = await verifyLinkAccess(auth.userId, id, 'canShare');
  
  // Solo el propietario o usuarios con permiso canShare pueden modificar permisos
  if (!isOwner && (!userSharedLink || !userSharedLink.permissions.canShare)) {
    throw new AppError(
      ErrorCode.FORBIDDEN,
      'Access denied: You do not have permission to modify sharing permissions',
      403
    );
  }

  const body = await request.json();
  const { permissions, expiresAt, isActive } = body;

  // Buscar el enlace compartido específico
  const sharedLink = await SharedLink.findById(shareId);
  if (!sharedLink) {
    throw new AppError(
      ErrorCode.NOT_FOUND,
      'Shared link not found',
      404
    );
  }

  // Verificar que el enlace compartido corresponde al enlace correcto
  if (sharedLink.linkId.toString() !== id) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      'Share ID does not match the provided link ID',
      400
    );
  }

  // Actualizar permisos si se proporcionan
  if (permissions && typeof permissions === 'object') {
    const validPermissions = ['canView', 'canEdit', 'canDelete', 'canViewStats', 'canShare'];
    const providedPermissions = Object.keys(permissions);
    const invalidPermissions = providedPermissions.filter(p => !validPermissions.includes(p));
    
    if (invalidPermissions.length > 0) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        `Invalid permissions: ${invalidPermissions.join(', ')}`,
        400
      );
    }

    sharedLink.permissions = {
      canView: permissions.canView !== undefined ? permissions.canView : sharedLink.permissions.canView,
      canEdit: permissions.canEdit !== undefined ? permissions.canEdit : sharedLink.permissions.canEdit,
      canDelete: permissions.canDelete !== undefined ? permissions.canDelete : sharedLink.permissions.canDelete,
      canViewStats: permissions.canViewStats !== undefined ? permissions.canViewStats : sharedLink.permissions.canViewStats,
      canShare: permissions.canShare !== undefined ? permissions.canShare : sharedLink.permissions.canShare,
    };
  }

  // Actualizar fecha de expiración si se proporciona
  if (expiresAt !== undefined) {
    sharedLink.expiresAt = expiresAt ? new Date(expiresAt) : null;
  }

  // Actualizar estado activo si se proporciona
  if (isActive !== undefined) {
    sharedLink.isActive = isActive;
  }

  sharedLink.updatedAt = new Date();
  await sharedLink.save();

  return createSuccessResponse({
    message: 'Shared link updated successfully',
    sharedLink: {
      id: sharedLink._id.toString(),
      linkId: sharedLink.linkId.toString(),
      sharedWithEmail: sharedLink.sharedWithEmail,
      permissions: sharedLink.permissions,
      isActive: sharedLink.isActive,
      expiresAt: sharedLink.expiresAt,
      createdAt: sharedLink.createdAt,
      updatedAt: sharedLink.updatedAt,
    }
  });
});

// DELETE /api/links/[id]/share/[shareId] - Eliminar un enlace compartido
export const DELETE = withAuth(async (
  request: NextRequest,
  auth: AuthContext,
  { params }: { params: { id: string; shareId: string } }
) => {
  const { id, shareId } = params;

  if (!id || !shareId) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      'Link ID and Share ID are required',
      400
    );
  }

  await connectDB();

  // Buscar el enlace compartido específico
  const sharedLink = await SharedLink.findById(shareId);
  if (!sharedLink) {
    throw new AppError(
      ErrorCode.NOT_FOUND,
      'Shared link not found',
      404
    );
  }

  // Verificar que el enlace compartido corresponde al enlace correcto
  if (sharedLink.linkId.toString() !== id) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      'Share ID does not match the provided link ID',
      400
    );
  }

  // Verificar permisos: el propietario, el usuario con quien se compartió, o alguien con permisos de compartir
  const { isOwner, sharedLink: userSharedLink } = await verifyLinkAccess(auth.userId, id);
  const isSharedWithUser = sharedLink.sharedWithUserId.toString() === auth.userId;
  const canManageSharing = userSharedLink && userSharedLink.permissions.canShare;

  if (!isOwner && !isSharedWithUser && !canManageSharing) {
    throw new AppError(
      ErrorCode.FORBIDDEN,
      'Access denied: You do not have permission to remove this shared link',
      403
    );
  }

  // Eliminar el enlace compartido
  await SharedLink.findByIdAndDelete(shareId);

  return createSuccessResponse({
    message: 'Shared link removed successfully'
  });
});

// GET /api/links/[id]/share/[shareId] - Obtener detalles de un enlace compartido específico
export const GET = withAuth(async (
  request: NextRequest,
  auth: AuthContext,
  { params }: { params: { id: string; shareId: string } }
) => {
  const { id, shareId } = params;

  if (!id || !shareId) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      'Link ID and Share ID are required',
      400
    );
  }

  await connectDB();

  // Verificar que el usuario tenga acceso al enlace
  await verifyLinkAccess(auth.userId, id);

  // Buscar el enlace compartido específico
  const sharedLink = await SharedLink.findById(shareId)
    .populate('sharedWithUserId', 'email name image')
    .populate('ownerId', 'email name');

  if (!sharedLink) {
    throw new AppError(
      ErrorCode.NOT_FOUND,
      'Shared link not found',
      404
    );
  }

  // Verificar que el enlace compartido corresponde al enlace correcto
  if (sharedLink.linkId.toString() !== id) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      'Share ID does not match the provided link ID',
      400
    );
  }

  return createSuccessResponse({
    sharedLink: {
      id: sharedLink._id.toString(),
      linkId: sharedLink.linkId.toString(),
      sharedWithUser: {
        id: sharedLink.sharedWithUserId._id.toString(),
        email: sharedLink.sharedWithUserId.email,
        name: sharedLink.sharedWithUserId.name,
        image: sharedLink.sharedWithUserId.image,
      },
      owner: {
        id: sharedLink.ownerId._id.toString(),
        email: sharedLink.ownerId.email,
        name: sharedLink.ownerId.name,
      },
      permissions: sharedLink.permissions,
      isActive: sharedLink.isActive,
      expiresAt: sharedLink.expiresAt,
      createdAt: sharedLink.createdAt,
      updatedAt: sharedLink.updatedAt,
    }
  });
});