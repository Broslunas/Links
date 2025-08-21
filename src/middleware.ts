import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas que no requieren verificación
  const publicRoutes = [
    '/auth/signin',
    '/auth/signup',
    '/auth/verify-2fa',
    '/api/auth',
    '/_next',
    '/favicon.ico',
    '/images',
    '/api/public',
  ];

  // Verificar si es una ruta pública
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  if (isPublicRoute) {
    return NextResponse.next();
  }

  try {
    // Obtener el token de autenticación
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // Si no hay token, redirigir a login
    if (!token) {
      const loginUrl = new URL('/auth/signin', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Si el usuario está autenticado, verificar si necesita 2FA
    if (token && token.id) {
      // Verificar si ya completó la verificación 2FA en esta sesión
      const twoFAVerified =
        request.cookies.get('2fa-verified')?.value === 'true';
      const twoFAVerifiedTime = request.cookies.get('2fa-verified-time')?.value;

      // Verificar si la verificación 2FA es válida (no más de 1 hora)
      const isVerificationValid =
        twoFAVerified &&
        twoFAVerifiedTime &&
        Date.now() - parseInt(twoFAVerifiedTime) < 3600000; // 1 hora

      // Si ya verificó 2FA y la verificación es válida, permitir acceso
      if (isVerificationValid) {
        return NextResponse.next();
      }

      // Si el usuario tiene 2FA habilitado y no está en la página de verificación
      if (token.twoFactorEnabled && pathname !== '/auth/verify-2fa') {
        // Si está intentando acceder al dashboard o cualquier ruta protegida
        if (pathname.startsWith('/dashboard') || pathname === '/') {
          const verifyUrl = new URL('/auth/verify-2fa', request.url);
          verifyUrl.searchParams.set('callbackUrl', pathname);
          return NextResponse.redirect(verifyUrl);
        }
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error('❌ Error en middleware:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
