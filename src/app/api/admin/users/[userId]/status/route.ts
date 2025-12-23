// Ensure this route runs in Node.js, not Edge Runtime
// export const runtime = 'nodejs';
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
