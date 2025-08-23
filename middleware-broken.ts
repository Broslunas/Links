import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log('🔍 TEST MIDDLEWARE EXECUTING FOR:', pathname);

  // Simple test - redirect all dashboard requests to maintenance
  if (pathname.startsWith('/dashboard')) {
    console.log('🚫 REDIRECTING TO MAINTENANCE');
    return NextResponse.redirect(new URL('/maintenance', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};