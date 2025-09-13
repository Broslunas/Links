import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

// Force Node.js runtime for Mongoose compatibility
export const runtime = 'nodejs';


export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Conectar a la base de datos
    await connectDB();

    // Buscar el usuario en la base de datos
    const user = await User.findOne({ email: session.user.email }).select('isActive');
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Retornar el estado de la cuenta (por defecto true si no está definido)
    return NextResponse.json({
      success: true,
      isActive: user.isActive ?? true
    });

  } catch (error) {
    console.error('Error checking user status:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}