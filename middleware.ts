import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import connectDB from '@/lib/mongodb';
import User, { IUser } from '@/models/User';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Solo aplicar middleware a rutas de admin
  if (pathname.startsWith('/dashboard/admin')) {
    try {
      // Verificar si el usuario está autenticado
      const token = await getToken({ 
        req: request, 
        secret: process.env.NEXTAUTH_SECRET 
      });

      if (!token || !token.email) {
        return NextResponse.redirect(new URL('/auth/signin', request.url));
      }

      // Conectar a la base de datos y verificar el rol
      await connectDB();
      const user = await User.findOne({ email: token.email }).lean() as IUser | null;

      if (!user || user.role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      return NextResponse.next();
    } catch (error) {
      console.error('Admin middleware error:', error);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/admin/:path*'
  ]
};