import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db-utils';
import User from '@/models/User';
import { ApiResponse } from '@/types';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';

export interface AdminUser {
  _id: string;
  email: string;
  name?: string;
  role: 'user' | 'admin';
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  linksCount: number;
  totalClicks: number;
}

export interface UsersListResponse {
  users: AdminUser[];
  totalUsers: number;
  totalPages: number;
  currentPage: number;
}

// GET - Obtener lista de usuarios
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check if user has admin role
    await connectDB();
    const adminUser = await User.findOne({ email: session.user.email });
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query
    const query: any = {};
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) {
      query.role = role;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count
    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit);

    // Get users with aggregation to include links count and total clicks
    const users = await User.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'links',
          localField: '_id',
          foreignField: 'userId',
          as: 'links'
        }
      },
      {
        $lookup: {
          from: 'analyticsevents',
          let: { userId: '$_id' },
          pipeline: [
            {
              $lookup: {
                from: 'links',
                localField: 'linkId',
                foreignField: '_id',
                as: 'linkData'
              }
            },
            {
              $match: {
                $expr: {
                  $eq: [{ $arrayElemAt: ['$linkData.userId', 0] }, '$$userId']
                }
              }
            }
          ],
          as: 'clicks'
        }
      },
      {
        $project: {
          _id: 1,
          email: 1,
          name: 1,
          role: 1,
          isActive: { $ifNull: ['$isActive', true] },
          createdAt: 1,
          lastLogin: 1,
          linksCount: { $size: '$links' },
          totalClicks: { $size: '$clicks' }
        }
      },
      { $sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 } },
      { $skip: skip },
      { $limit: limit }
    ]);

    // Format response
    const formattedUsers: AdminUser[] = users.map(user => ({
      _id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role || 'user',
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      lastLogin: user.lastLogin?.toISOString(),
      linksCount: user.linksCount,
      totalClicks: user.totalClicks
    }));

    const response: ApiResponse<UsersListResponse> = {
      success: true,
      data: {
        users: formattedUsers,
        totalUsers,
        totalPages,
        currentPage: page
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching users:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch users'
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// PUT - Actualizar usuario (rol, estado activo)
export async function PUT(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check if user has admin role
    await connectDB();
    const adminUser = await User.findOne({ email: session.user.email });
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, role, isActive } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'User ID is required' } },
        { status: 400 }
      );
    }

    // Prevent admin from changing their own role
    if (userId === adminUser._id.toString() && role && role !== adminUser.role) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Cannot change your own role' } },
        { status: 403 }
      );
    }

    // Update user
    const updateData: any = {};
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, select: '_id email name role isActive createdAt' }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      );
    }

    const response: ApiResponse<AdminUser> = {
      success: true,
      data: {
        _id: updatedUser._id.toString(),
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role || 'user',
        isActive: updatedUser.isActive ?? true,
        createdAt: updatedUser.createdAt.toISOString(),
        linksCount: 0, // Will be updated by frontend
        totalClicks: 0 // Will be updated by frontend
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating user:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: 'Failed to update user'
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response, { status: 500 });
  }
}