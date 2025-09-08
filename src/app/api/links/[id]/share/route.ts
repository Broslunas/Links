import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/db-utils';
import { withAuth, AuthContext, verifyLinkAccess } from '../../../../../lib/auth-middleware';
import { createSuccessResponse } from '../../../../../lib/api-response';
import { AppError, ErrorCode } from '../../../../../lib/api-errors';
import SharedLink from '../../../../../models/SharedLink';
import User from '../../../../../models/User';

// POST /api/links/[id]/share - Compartir enlace con otro usuario
export const POST = withAuth(async (
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

  // Verificar que el usuario tenga permisos para compartir el enlace
  const { isOwner, sharedLink } = await verifyLinkAccess(auth.userId, id, 'canShare');
  
  // Solo el propietario o usuarios con permiso canShare pueden compartir
  if (!isOwner && (!sharedLink || !sharedLink.permissions.canShare)) {
    throw new AppError(
      ErrorCode.FORBIDDEN,
      'Access denied: You do not have permission to share this link',
      403
    );
  }

  const body = await request.json();
  const { email, permissions, expiresAt } = body;

  if (!email) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      'Email is required',
      400
    );
  }

  if (!permissions || typeof permissions !== 'object') {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      'Permissions object is required',
      400
    );
  }

  // Validar estructura de permisos
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

  // Buscar el usuario con el que se va a compartir
  const targetUser = await User.findOne({ email: email.toLowerCase() });
  if (!targetUser) {
    throw new AppError(
      ErrorCode.NOT_FOUND,
      'User not found with the provided email',
      404
    );
  }

  // Verificar que no se esté compartiendo consigo mismo
  if (targetUser._id.toString() === auth.userId) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      'Cannot share link with yourself',
      400
    );
  }

  // Verificar si ya existe un enlace compartido con este usuario
  const existingShare = await SharedLink.findOne({
    linkId: id,
    sharedWithUserId: targetUser._id
  });

  if (existingShare) {
    // Actualizar permisos existentes
    existingShare.permissions = {
      canView: permissions.canView || false,
      canEdit: permissions.canEdit || false,
      canDelete: permissions.canDelete || false,
      canViewStats: permissions.canViewStats || false,
      canShare: permissions.canShare || false,
    };
    existingShare.isActive = true;
    existingShare.expiresAt = expiresAt ? new Date(expiresAt) : null;
    existingShare.updatedAt = new Date();
    
    await existingShare.save();

    return createSuccessResponse({
      message: 'Link sharing permissions updated successfully',
      sharedLink: {
        id: existingShare._id.toString(),
        linkId: existingShare.linkId.toString(),
        sharedWithEmail: existingShare.sharedWithEmail,
        permissions: existingShare.permissions,
        isActive: existingShare.isActive,
        expiresAt: existingShare.expiresAt,
        createdAt: existingShare.createdAt,
        updatedAt: existingShare.updatedAt,
      }
    });
  }

  // Crear nuevo enlace compartido
  const newSharedLink = new SharedLink({
    linkId: id,
    ownerId: isOwner ? auth.userId : sharedLink.ownerId,
    sharedWithUserId: targetUser._id,
    sharedWithEmail: email.toLowerCase(),
    permissions: {
      canView: permissions.canView || false,
      canEdit: permissions.canEdit || false,
      canDelete: permissions.canDelete || false,
      canViewStats: permissions.canViewStats || false,
      canShare: permissions.canShare || false,
    },
    expiresAt: expiresAt ? new Date(expiresAt) : null,
  });

  await newSharedLink.save();

  return createSuccessResponse({
    message: 'Link shared successfully',
    sharedLink: {
      id: newSharedLink._id.toString(),
      linkId: newSharedLink.linkId.toString(),
      sharedWithEmail: newSharedLink.sharedWithEmail,
      permissions: newSharedLink.permissions,
      isActive: newSharedLink.isActive,
      expiresAt: newSharedLink.expiresAt,
      createdAt: newSharedLink.createdAt,
      updatedAt: newSharedLink.updatedAt,
    }
  });
});

// GET /api/links/[id]/share - Obtener lista de usuarios con los que se ha compartido el enlace
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

  // Verificar que el usuario tenga acceso al enlace
  const { isOwner, sharedLink } = await verifyLinkAccess(auth.userId, id);

  // Obtener todos los enlaces compartidos para este link
  const sharedLinks = await SharedLink.find({
    linkId: id,
    isActive: true
  })
  .populate('sharedWithUserId', 'email name image')
  .populate('ownerId', 'email name')
  .sort({ createdAt: -1 });

  const formattedShares = sharedLinks.map(share => ({
    id: share._id.toString(),
    sharedWithUser: {
      id: share.sharedWithUserId._id.toString(),
      email: share.sharedWithUserId.email,
      name: share.sharedWithUserId.name,
      image: share.sharedWithUserId.image,
    },
    owner: {
      id: share.ownerId._id.toString(),
      email: share.ownerId.email,
      name: share.ownerId.name,
    },
    permissions: share.permissions,
    expiresAt: share.expiresAt,
    createdAt: share.createdAt,
    updatedAt: share.updatedAt,
  }));

  return createSuccessResponse({
    shares: formattedShares,
    isOwner,
    totalShares: formattedShares.length
  });
});

// DELETE /api/links/[id]/share - Eliminar enlace compartido por userId
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

  const body = await request.json();
  const { userId } = body;

  if (!userId) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      'User ID is required',
      400
    );
  }

  // Verificar que el usuario tenga acceso al enlace
  const { isOwner, sharedLink } = await verifyLinkAccess(auth.userId, id);

  // Buscar el enlace compartido específico
  const sharedLinkToDelete = await SharedLink.findOne({
    linkId: id,
    sharedWithUserId: userId,
    isActive: true
  });

  if (!sharedLinkToDelete) {
    throw new AppError(
      ErrorCode.NOT_FOUND,
      'Shared link not found',
      404
    );
  }

  // Verificar permisos: el propietario, el usuario con quien se compartió, o alguien con permisos de compartir
  const isSharedWithUser = sharedLinkToDelete.sharedWithUserId.toString() === auth.userId;
  const canManageSharing = sharedLink && sharedLink.permissions.canShare;

  if (!isOwner && !isSharedWithUser && !canManageSharing) {
    throw new AppError(
      ErrorCode.FORBIDDEN,
      'Access denied: You do not have permission to remove this shared link',
      403
    );
  }

  // Eliminar el enlace compartido
  await SharedLink.findByIdAndDelete(sharedLinkToDelete._id);

  return createSuccessResponse({
    message: 'Shared link removed successfully'
  });
});