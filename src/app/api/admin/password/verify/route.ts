import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db-utils';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import bcrypt from 'bcryptjs';

// POST /api/admin/password/verify - Verificar contraseña de administrador
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    await connectDB();
    
    // Verificar que el usuario es administrador
    const adminUser = await User.findOne({ email: session.user.email });
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const { password } = await request.json();

    // Validar que se proporcionó una contraseña
    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Password is required' } },
        { status: 400 }
      );
    }

    // Verificar si el administrador tiene una contraseña establecida
    if (!adminUser.adminPassword) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_PASSWORD_SET', message: 'No admin password has been set' } },
        { status: 400 }
      );
    }

    // Verificar la contraseña
    const isPasswordValid = await bcrypt.compare(password, adminUser.adminPassword);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_PASSWORD', message: 'Invalid password' } },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password verified successfully'
    });

  } catch (error) {
    console.error('Error verifying admin password:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

// GET /api/admin/password/verify - Verificar si el administrador tiene contraseña establecida
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    await connectDB();
    
    // Verificar que el usuario es administrador
    const adminUser = await User.findOne({ email: session.user.email });
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      hasPassword: !!adminUser.adminPassword,
      passwordCreatedAt: adminUser.adminPasswordCreatedAt
    });

  } catch (error) {
    console.error('Error checking admin password status:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}