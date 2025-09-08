import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db-utils';
import { withAuth, AuthContext } from '../../../../lib/auth-middleware';
import { createSuccessResponse } from '../../../../lib/api-response';
import { AppError, ErrorCode } from '../../../../lib/api-errors';
import SharedLink from '../../../../models/SharedLink';
import Link from '../../../../models/Link';
import mongoose from 'mongoose';

// GET /api/links/shared-with-me - Obtener enlaces compartidos conmigo
export const GET = withAuth(async (
  request: NextRequest,
  auth: AuthContext
) => {
  await connectDB();

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';
  const permission = searchParams.get('permission') || ''; // canView, canEdit, etc.
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  // Construir filtros - convertir userId a ObjectId
  const filters: any = {
    sharedWithUserId: new mongoose.Types.ObjectId(auth.userId),
    isActive: true,
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  };



  // Filtrar por permiso específico
  if (permission && ['canView', 'canEdit', 'canDelete', 'canViewStats', 'canShare'].includes(permission)) {
    filters[`permissions.${permission}`] = true;
  }

  // Construir ordenamiento
  const sortOptions: any = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Calcular skip
  const skip = (page - 1) * limit;



  // Obtener enlaces compartidos con información del enlace y propietario
  

  
  const sharedLinksAggregation = await SharedLink.aggregate([
    { $match: filters },
    {
      $lookup: {
        from: 'links',
        localField: 'linkId',
        foreignField: '_id',
        as: 'link'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'ownerId',
        foreignField: '_id',
        as: 'owner'
      }
    },
    { $unwind: '$link' },
    { $unwind: '$owner' },
    {
      $match: search ? {
        $or: [
          { 'link.title': { $regex: search, $options: 'i' } },
          { 'link.slug': { $regex: search, $options: 'i' } },
          { 'link.description': { $regex: search, $options: 'i' } },
          { 'owner.name': { $regex: search, $options: 'i' } },
          { 'owner.email': { $regex: search, $options: 'i' } }
        ]
      } : {}
    },
    {
      $project: {
        _id: 1,
        permissions: 1,
        expiresAt: 1,
        sharedAt: '$createdAt',
        linkId: {
          _id: '$link._id',
          slug: '$link.slug',
          title: '$link.title',
          description: '$link.description',
          originalUrl: '$link.originalUrl',
          isActive: '$link.isActive',
          clickCount: '$link.clickCount',
          isPublicStats: '$link.isPublicStats',
          createdAt: '$link.createdAt',
          updatedAt: '$link.updatedAt'
        },
        sharedBy: {
          _id: '$owner._id',
          name: '$owner.name',
          email: '$owner.email',
          image: '$owner.image'
        }
      }
    },
    { $sort: sortOptions },
    { $skip: skip },
    { $limit: limit }
  ]);

  // Contar total de enlaces compartidos
  const totalCountAggregation = await SharedLink.aggregate([
    { $match: filters },
    {
      $lookup: {
        from: 'links',
        localField: 'linkId',
        foreignField: '_id',
        as: 'link'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'ownerId',
        foreignField: '_id',
        as: 'owner'
      }
    },
    { $unwind: '$link' },
    { $unwind: '$owner' },
    {
      $match: search ? {
        $or: [
          { 'link.title': { $regex: search, $options: 'i' } },
          { 'link.slug': { $regex: search, $options: 'i' } },
          { 'link.description': { $regex: search, $options: 'i' } },
          { 'owner.name': { $regex: search, $options: 'i' } },
          { 'owner.email': { $regex: search, $options: 'i' } }
        ]
      } : {}
    },
    { $count: 'total' }
  ]);

  const totalSharedLinks = totalCountAggregation[0]?.total || 0;
  const totalPages = Math.ceil(totalSharedLinks / limit);

  // Formatear resultados
  const formattedSharedLinks = sharedLinksAggregation.map(item => ({
    _id: item._id.toString(),
    permissions: item.permissions,
    expiresAt: item.expiresAt,
    sharedAt: item.sharedAt,
    linkId: {
      _id: item.linkId._id.toString(),
      slug: item.linkId.slug,
      title: item.linkId.title,
      description: item.linkId.description,
      originalUrl: item.linkId.originalUrl,
      isActive: item.linkId.isActive,
      clickCount: item.linkId.clickCount,
      isPublicStats: item.linkId.isPublicStats,
      createdAt: item.linkId.createdAt,
      updatedAt: item.linkId.updatedAt
    },
    sharedBy: {
      _id: item.sharedBy._id.toString(),
      name: item.sharedBy.name,
      email: item.sharedBy.email,
      image: item.sharedBy.image
    }
  }));

  return createSuccessResponse({
    sharedLinks: formattedSharedLinks,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: totalSharedLinks,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    },
    filters: {
      search,
      permission,
      sortBy,
      sortOrder
    }
  });
});