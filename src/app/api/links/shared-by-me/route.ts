import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db-utils';
import { withAuth, AuthContext } from '../../../../lib/auth-middleware';
import { createSuccessResponse } from '../../../../lib/api-response';
import { AppError, ErrorCode } from '../../../../lib/api-errors';
import SharedLink from '../../../../models/SharedLink';
import Link from '../../../../models/Link';

// Force Node.js runtime for Mongoose compatibility
export const runtime = 'nodejs';


// GET /api/links/shared-by-me - Obtener enlaces que he compartido
export const GET = withAuth(async (
  request: NextRequest,
  auth: AuthContext
) => {
  await connectDB();

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';
  const linkId = searchParams.get('linkId') || ''; // Filtrar por enlace específico
  const isActive = searchParams.get('isActive'); // true, false, o null para todos
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  // Construir filtros
  const filters: any = {
    ownerId: auth.userId
  };

  // Filtrar por enlace específico
  if (linkId) {
    filters.linkId = linkId;
  }

  // Filtrar por estado activo
  if (isActive !== null && isActive !== undefined && isActive !== '') {
    filters.isActive = isActive === 'true';
  }

  // Construir ordenamiento
  const sortOptions: any = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Calcular skip
  const skip = (page - 1) * limit;

  // Obtener enlaces compartidos con información del enlace y usuario compartido
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
        localField: 'sharedWithUserId',
        foreignField: '_id',
        as: 'sharedWithUser'
      }
    },
    { $unwind: '$link' },
    { $unwind: '$sharedWithUser' },
    {
      $match: search ? {
        $or: [
          { 'link.title': { $regex: search, $options: 'i' } },
          { 'link.slug': { $regex: search, $options: 'i' } },
          { 'link.description': { $regex: search, $options: 'i' } },
          { 'sharedWithUser.name': { $regex: search, $options: 'i' } },
          { 'sharedWithUser.email': { $regex: search, $options: 'i' } }
        ]
      } : {}
    },
    {
      $project: {
        _id: 1,
        permissions: 1,
        isActive: 1,
        expiresAt: 1,
        createdAt: 1,
        updatedAt: 1,
        link: {
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
        sharedWithUser: {
          _id: '$sharedWithUser._id',
          name: '$sharedWithUser.name',
          email: '$sharedWithUser.email',
          image: '$sharedWithUser.image'
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
        localField: 'sharedWithUserId',
        foreignField: '_id',
        as: 'sharedWithUser'
      }
    },
    { $unwind: '$link' },
    { $unwind: '$sharedWithUser' },
    {
      $match: search ? {
        $or: [
          { 'link.title': { $regex: search, $options: 'i' } },
          { 'link.slug': { $regex: search, $options: 'i' } },
          { 'link.description': { $regex: search, $options: 'i' } },
          { 'sharedWithUser.name': { $regex: search, $options: 'i' } },
          { 'sharedWithUser.email': { $regex: search, $options: 'i' } }
        ]
      } : {}
    },
    { $count: 'total' }
  ]);

  const totalSharedLinks = totalCountAggregation[0]?.total || 0;
  const totalPages = Math.ceil(totalSharedLinks / limit);

  // Formatear resultados
  const formattedSharedLinks = sharedLinksAggregation.map(item => ({
    id: item._id.toString(),
    permissions: item.permissions,
    isActive: item.isActive,
    expiresAt: item.expiresAt,
    sharedAt: item.createdAt,
    updatedAt: item.updatedAt,
    link: {
      id: item.link._id.toString(),
      slug: item.link.slug,
      title: item.link.title,
      description: item.link.description,
      originalUrl: item.link.originalUrl,
      isActive: item.link.isActive,
      clickCount: item.link.clickCount,
      isPublicStats: item.link.isPublicStats,
      createdAt: item.link.createdAt,
      updatedAt: item.link.updatedAt
    },
    sharedWithUser: {
      id: item.sharedWithUser._id.toString(),
      name: item.sharedWithUser.name,
      email: item.sharedWithUser.email,
      image: item.sharedWithUser.image
    }
  }));

  // Obtener estadísticas adicionales
  const statsAggregation = await SharedLink.aggregate([
    { $match: { ownerId: auth.userId } },
    {
      $group: {
        _id: null,
        totalShared: { $sum: 1 },
        activeShares: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$isActive', true] },
                  {
                    $or: [
                      { $eq: ['$expiresAt', null] },
                      { $gt: ['$expiresAt', new Date()] }
                    ]
                  }
                ]
              },
              1,
              0
            ]
          }
        },
        expiredShares: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: ['$expiresAt', null] },
                  { $lt: ['$expiresAt', new Date()] }
                ]
              },
              1,
              0
            ]
          }
        },
        inactiveShares: {
          $sum: {
            $cond: [{ $eq: ['$isActive', false] }, 1, 0]
          }
        }
      }
    }
  ]);

  const stats = statsAggregation[0] || {
    totalShared: 0,
    activeShares: 0,
    expiredShares: 0,
    inactiveShares: 0
  };

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
    stats: {
      totalShared: stats.totalShared,
      activeShares: stats.activeShares,
      expiredShares: stats.expiredShares,
      inactiveShares: stats.inactiveShares
    },
    filters: {
      search,
      linkId,
      isActive,
      sortBy,
      sortOrder
    }
  });
});