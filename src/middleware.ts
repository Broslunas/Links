import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Lista de rutas que no deben ser procesadas por el middleware de dominios personalizados
const EXCLUDED_PATHS = [
  '/api',
  '/auth',
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/dashboard',
  '/admin',
  '/settings',
  '/profile',
  '/analytics',
  '/links',
];

// Lista de dominios que se consideran como dominio principal
const DEFAULT_DOMAINS = [
  'localhost:3000',
  'localhost',
  '127.0.0.1:3000',
  '127.0.0.1',
  'broslunas.link',
  'www.broslunas.link',
  process.env.DEFAULT_DOMAIN,
  process.env.VERCEL_URL,
  process.env.NEXT_PUBLIC_APP_URL?.replace('https://', '').replace('http://', ''),
].filter(Boolean);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || request.nextUrl.hostname;
  
  // Excluir rutas específicas del procesamiento de dominios personalizados
  const isExcludedPath = EXCLUDED_PATHS.some(path => pathname.startsWith(path));
  if (isExcludedPath) {
    return NextResponse.next();
  }

  // Verificar si es un dominio personalizado
  const isCustomDomain = !DEFAULT_DOMAINS.includes(hostname);
  
  if (isCustomDomain) {
    // Permitir acceso libre a todas las rutas en dominios personalizados
    return NextResponse.next();
  }

  // Para el dominio principal, continuar normalmente
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};