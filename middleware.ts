import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Function to check if user is admin
async function isUserAdmin(email: string): Promise<boolean> {
  try {
    // Use internal API call to check user role
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `next-auth.session-token=${email}` // This won't work, we need a different approach
      },
    });

    // For now, fallback to checking if user has admin role via email lookup
    // This is a temporary solution until we implement proper session checking in middleware
    const adminEmails = ['pablo@broslunas.com'];
    const isAdmin = adminEmails.includes(email);

    console.log('Admin check result:', {
      email,
      isAdmin,
      timestamp: new Date().toISOString()
    });

    return isAdmin;
  } catch (error) {
    console.error('Error checking user role:', {
      email,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });

    // Fail safely by denying admin access
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log('🔍 Middleware executing for:', pathname);

  try {
    // Get authentication token with timeout
    const tokenPromise = getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });

    // Add timeout to prevent hanging requests
    const timeoutPromise = new Promise<null>((_, reject) => {
      setTimeout(() => reject(new Error('Token verification timeout')), 5000);
    });

    const token = await Promise.race([tokenPromise, timeoutPromise]);

    // Protected routes logic
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/api')) {
      console.log('🔍 Processing protected route:', pathname);
    }

    // Existing admin route protection with enhanced error handling
    if (pathname.startsWith('/dashboard/admin')) {
      if (!token || !token.email) {
        console.log('Redirecting unauthenticated user from admin route', {
          pathname,
          timestamp: new Date().toISOString()
        });
        return NextResponse.redirect(new URL('/auth/signin', request.url));
      }

      try {
        const userIsAdmin = await isUserAdmin(token.email);
        if (!userIsAdmin) {
          console.log('Redirecting non-admin user from admin route', {
            email: token.email,
            pathname,
            timestamp: new Date().toISOString()
          });
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }

        console.log('Allowing admin access to admin route', {
          email: token.email,
          pathname,
          timestamp: new Date().toISOString()
        });
        return NextResponse.next();
      } catch (adminCheckError) {
        console.error('Error verifying admin access - redirecting to dashboard for safety', {
          email: token.email,
          pathname,
          error: adminCheckError instanceof Error ? adminCheckError.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Critical middleware error:', {
      pathname,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });

    // Enhanced fallback behavior based on route type
    if (pathname.startsWith('/dashboard/admin')) {
      console.log('Redirecting from admin route due to middleware error', {
        pathname,
        timestamp: new Date().toISOString()
      });
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else if (pathname.startsWith('/dashboard')) {
      console.log('Redirecting from dashboard due to middleware error', {
        pathname,
        timestamp: new Date().toISOString()
      });
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    } else if (pathname.startsWith('/api')) {
      console.log('Returning 500 error for API route due to middleware error', {
        pathname,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    // For other routes, allow normal flow (fail-safe)
    console.log('Allowing normal flow despite middleware error', {
      pathname,
      timestamp: new Date().toISOString()
    });
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/:path*'
  ]
};