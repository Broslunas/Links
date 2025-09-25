import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectDB } from './lib/db-utils';
import CustomDomain from './models/CustomDomain';

// Forzar Node.js runtime para compatibilidad con Mongoose
export const runtime = 'nodejs';

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
    // Conectar a la base de datos
    await connectDB();

    // Verificar si el dominio personalizado existe y está verificado
    const customDomain = await CustomDomain.findOne({
      fullDomain: hostname,
      isVerified: true,
      isActive: true,
      isBlocked: { $ne: true },
    });

    if (!customDomain) {
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
