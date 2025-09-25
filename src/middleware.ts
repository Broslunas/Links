import { NextRequest, NextResponse } from 'next/server';

// Lista de rutas que no deben ser procesadas por el middleware de dominios personalizados
const EXCLUDED_PATHS = ['/slug/'];

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
  process.env.NEXT_PUBLIC_APP_URL?.replace('https://', '').replace(
    'http://',
    ''
  ),
].filter(Boolean);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || request.nextUrl.hostname;
  const mainDomain =
    process.env.NEXT_PUBLIC_APP_URL || 'https://broslunas.link';

  // Excluir rutas específicas del procesamiento de dominios personalizados
  const isExcludedPath = EXCLUDED_PATHS.some(path => pathname.startsWith(path));
  if (isExcludedPath) {
    return NextResponse.next();
  }

  // Verificar si es un dominio personalizado
  const isCustomDomain = !DEFAULT_DOMAINS.includes(hostname);

  if (!isCustomDomain) {
    // Para el dominio principal, continuar normalmente
    return NextResponse.next();
  }

  try {
    // Verificar si el dominio personalizado existe y está verificado usando la API
    const apiUrl = `${mainDomain}/api/domains/verify-domain?domain=${encodeURIComponent(hostname)}`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!response.ok || !data.success || !data.exists) {
      // Si el dominio no existe o no está verificado, redirigir al dominio principal
      const url = new URL(mainDomain);
      url.pathname = pathname;
      return NextResponse.redirect(url);
    }

    // Si el dominio está verificado, continuar con la petición
    return NextResponse.next();
  } catch (error) {
    console.error('Error verificando dominio personalizado:', error);

    // En caso de error, redirigir al dominio principal
    const url = new URL(mainDomain);
    url.pathname = pathname;
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - _next/data (Next.js data files)
     * - favicon.ico (favicon file)
     * - robots.txt
     * - sitemap.xml
     */
    '/((?!api|_next/static|_next/image|_next/data|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
