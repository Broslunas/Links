import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log('🔍 TEST MIDDLEWARE EXECUTING FOR:', pathname);

  // Simple test - log dashboard requests
  if (pathname.startsWith('/dashboard')) {
    console.log('🔍 DASHBOARD REQUEST DETECTED');
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};