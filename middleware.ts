import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for auth pages, API routes, and static files
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/auth/signin') ||
    pathname.startsWith('/auth/signout') ||
    pathname.startsWith('/auth/callback') ||
    pathname.startsWith('/auth/verify-2fa') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return NextResponse.next();
  }

  try {
    // Get the token from the request
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // If no token, redirect to sign in
    if (!token) {
      const signInUrl = new URL('/auth/signin', request.url);
      signInUrl.searchParams.set('callbackUrl', request.url);
      return NextResponse.redirect(signInUrl);
    }

    // Check if user has 2FA enabled
    if (token.twoFactorEnabled) {
      // Check if 2FA is already verified in this session
      const twoFactorVerified = request.cookies.get('2fa-verified')?.value;

      if (!twoFactorVerified) {
        const verifyUrl = new URL('/auth/verify-2fa', request.url);
        verifyUrl.searchParams.set('callbackUrl', request.url);
        return NextResponse.redirect(verifyUrl);
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error('❌ Error en middleware:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/', '/dashboard/:path*'],
};
