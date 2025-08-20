import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth-simple';
import { connectDB } from '../../../../lib/db-utils';
import User from '../../../../models/User';
import { ApiResponse } from '../../../../types';

export async function PUT(request: NextRequest) {
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

    await connectDB();

    // Parse request body
    const body = await request.json();
    const { name, defaultPublicStats, emailNotifications } = body;

    // Validate name if provided
    if (name !== undefined) {
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Name is required and must be a non-empty string',
            },
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
      }

      const trimmedName = name.trim();
      
      // Validate name length
      if (trimmedName.length > 100) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Name must be 100 characters or less',
            },
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
      }
    }

    // Validate preferences if provided
    if (defaultPublicStats !== undefined && typeof defaultPublicStats !== 'boolean') {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'defaultPublicStats must be a boolean value',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    if (emailNotifications !== undefined && typeof emailNotifications !== 'boolean') {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'emailNotifications must be a boolean value',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Find and update user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
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

    // Update user fields
    if (name !== undefined) {
      user.name = name.trim();
    }
    if (defaultPublicStats !== undefined) {
      user.defaultPublicStats = defaultPublicStats;
    }
    if (emailNotifications !== undefined) {
      user.emailNotifications = emailNotifications;
    }

    await user.save();

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: {
          name: user.name,
          defaultPublicStats: user.defaultPublicStats,
          emailNotifications: user.emailNotifications,
          message: 'Profile updated successfully',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update profile',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}