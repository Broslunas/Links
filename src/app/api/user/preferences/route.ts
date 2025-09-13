import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth-simple';
import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';

// Force Node.js runtime for Mongoose compatibility
export const runtime = 'nodejs';


// GET /api/user/preferences - Get user preferences
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: { message: 'No autorizado' } },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: { message: 'Usuario no encontrado' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        defaultPublicStats: user.defaultPublicStats ?? false,
        emailNotifications: user.emailNotifications ?? true,
      },
    });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return NextResponse.json(
      { error: { message: 'Error interno del servidor' } },
      { status: 500 }
    );
  }
}

// PUT /api/user/preferences - Update user preferences
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: { message: 'No autorizado' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { defaultPublicStats, emailNotifications } = body;

    // Validate input
    if (typeof defaultPublicStats !== 'boolean' && defaultPublicStats !== undefined) {
      return NextResponse.json(
        { error: { message: 'defaultPublicStats debe ser un valor booleano' } },
        { status: 400 }
      );
    }

    if (typeof emailNotifications !== 'boolean' && emailNotifications !== undefined) {
      return NextResponse.json(
        { error: { message: 'emailNotifications debe ser un valor booleano' } },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: { message: 'Usuario no encontrado' } },
        { status: 404 }
      );
    }

    // Update preferences
    if (defaultPublicStats !== undefined) {
      user.defaultPublicStats = defaultPublicStats;
    }
    if (emailNotifications !== undefined) {
      user.emailNotifications = emailNotifications;
    }

    await user.save();

    return NextResponse.json({
      success: true,
      data: {
        defaultPublicStats: user.defaultPublicStats,
        emailNotifications: user.emailNotifications,
        message: 'Preferencias actualizadas correctamente',
      },
    });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return NextResponse.json(
      { error: { message: 'Error interno del servidor' } },
      { status: 500 }
    );
  }
}