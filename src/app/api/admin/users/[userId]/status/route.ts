import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '../../../../../../lib/db-utils';
import { authOptions } from '../../../../../../lib/auth-simple';
import User from '../../../../../../models/User';
import {
  setUserActiveStatus,
  getUserStatus,
} from '../../../../../../lib/user-status';
import { ApiResponse } from '../../../../../../types';

// GET - Get user status
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    // Check if user is admin
    await connectDB();
    const adminUser = (await User.findOne({ email: session.user.email })) as {
      _id: { toString(): string };
      role: string;
      email: string;
    } | null;
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Admin access required',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 403 }
      );
    }

    const { userId } = params;
    const userStatus = await getUserStatus(userId);

    if (!userStatus) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: userStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting user status:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get user status',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// PATCH - Update user status (block/unblock)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    // Check if user is admin
    await connectDB();
    const adminUser = (await User.findOne({ email: session.user.email })) as {
      _id: { toString(): string };
      role: string;
      email: string;
    } | null;
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Admin access required',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 403 }
      );
    }

    const { userId } = params;
    const body = await request.json();
    const { isActive, reason } = body;

    if (typeof isActive !== 'boolean') {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'isActive must be a boolean value',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Prevent admin from blocking themselves
    if (userId === adminUser._id.toString()) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Cannot modify your own account status',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 403 }
      );
    }

    const success = await setUserActiveStatus(userId, isActive);

    if (!success) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: 'UPDATE_FAILED',
            message: 'Failed to update user status',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    // Log the admin action
    console.log(
      `Admin ${session.user.email} ${isActive ? 'activated' : 'blocked'} user ${userId}${reason ? ` - Reason: ${reason}` : ''}`
    );

    // Get updated user status
    const updatedStatus = await getUserStatus(userId);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        message: `User ${isActive ? 'activated' : 'blocked'} successfully`,
        userStatus: updatedStatus,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update user status',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
