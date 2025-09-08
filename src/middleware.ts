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
    // Para dominios personalizados, manejar la lógica específica
    return handleCustomDomain(request, hostname);
  }

  // Para el dominio principal, continuar normalmente
  return NextResponse.next();
}

async function handleCustomDomain(request: NextRequest, hostname: string) {
  const { pathname } = request.nextUrl;
  
  // Si es la página raíz del dominio personalizado, mostrar página de información
  if (pathname === '/') {
    return handleCustomDomainRoot(request, hostname);
  }
  
  // Si es un slug, intentar redirigir
  const slug = pathname.slice(1); // Remover el '/' inicial
  
  // Validar que el slug tenga un formato válido
  if (!isValidSlug(slug)) {
    return new NextResponse('Enlace no válido', { status: 404 });
  }
  
  // Reescribir la URL para que use el handler de slug con información del dominio personalizado
  const url = request.nextUrl.clone();
  url.pathname = `/${slug}`;
  
  // Agregar headers para que el handler sepa que viene de un dominio personalizado
  const response = NextResponse.rewrite(url);
  response.headers.set('x-custom-domain', hostname);
  response.headers.set('x-original-host', hostname);
  
  return response;
}

async function handleCustomDomainRoot(request: NextRequest, hostname: string) {
  try {
    // Verificar si el dominio personalizado existe y está activo
    const verifyResponse = await fetch(`${getBaseUrl(request)}/api/domains/verify-public`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ domain: hostname }),
    });
    
    if (!verifyResponse.ok) {
      return new NextResponse(
        generateCustomDomainErrorPage(hostname, 'Dominio no encontrado o no verificado'),
        {
          status: 404,
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }
    
    const domainData = await verifyResponse.json();
    
    // Generar página de información del dominio personalizado
    return new NextResponse(
      generateCustomDomainInfoPage(hostname, domainData.data),
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  } catch (error) {
    console.error('Error handling custom domain root:', error);
    return new NextResponse(
      generateCustomDomainErrorPage(hostname, 'Error interno del servidor'),
      {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }
}

function getBaseUrl(request: NextRequest): string {
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  const defaultDomain = process.env.DEFAULT_DOMAIN || 'localhost:3000';
  return `${protocol}://${defaultDomain}`;
}

function isValidSlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') {
    return false;
  }
  
  // Check length
  if (slug.length < 1 || slug.length > 50) {
    return false;
  }
  
  // Check format (lowercase letters, numbers, hyphens, underscores)
  return /^[a-z0-9-_]+$/.test(slug);
}

function generateCustomDomainInfoPage(hostname: string, domainData?: any): string {
  const ownerInfo = domainData?.userId ? `
    <div class="owner-info">
      <p><strong>Propietario:</strong> ${domainData.userId.name || 'Usuario'}</p>
    </div>
  ` : '';
  
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${hostname} - Dominio Personalizado</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #333;
        }
        
        .container {
          background: white;
          padding: 3rem;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          text-align: center;
          max-width: 500px;
          width: 90%;
        }
        
        .logo {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          margin: 0 auto 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          color: white;
          font-weight: bold;
        }
        
        h1 {
          color: #2d3748;
          margin-bottom: 1rem;
          font-size: 2rem;
        }
        
        .domain {
          color: #667eea;
          font-weight: 600;
          font-size: 1.2rem;
          margin-bottom: 1.5rem;
        }
        
        .description {
          color: #718096;
          line-height: 1.6;
          margin-bottom: 2rem;
        }
        
        .owner-info {
          background: #f7fafc;
          padding: 1rem;
          border-radius: 10px;
          margin-bottom: 2rem;
          border-left: 4px solid #667eea;
        }
        
        .footer {
          color: #a0aec0;
          font-size: 0.9rem;
        }
        
        .footer a {
          color: #667eea;
          text-decoration: none;
        }
        
        .footer a:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">🔗</div>
        <h1>Dominio Personalizado</h1>
        <div class="domain">${hostname}</div>
        <div class="description">
          Este es un dominio personalizado configurado para acortar enlaces.
          Para acceder a un enlace específico, agrega el código del enlace después del dominio.
        </div>
        ${ownerInfo}
        <div class="footer">
          Powered by <a href="https://broslunas.link" target="_blank">Broslunas Links</a>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateCustomDomainErrorPage(hostname: string, error: string): string {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Error - ${hostname}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #fc466b 0%, #3f5efb 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #333;
        }
        
        .container {
          background: white;
          padding: 3rem;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          text-align: center;
          max-width: 500px;
          width: 90%;
        }
        
        .error-icon {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #fc466b 0%, #3f5efb 100%);
          border-radius: 50%;
          margin: 0 auto 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          color: white;
        }
        
        h1 {
          color: #2d3748;
          margin-bottom: 1rem;
          font-size: 2rem;
        }
        
        .domain {
          color: #fc466b;
          font-weight: 600;
          font-size: 1.2rem;
          margin-bottom: 1.5rem;
        }
        
        .error-message {
          color: #718096;
          line-height: 1.6;
          margin-bottom: 2rem;
          background: #fed7d7;
          padding: 1rem;
          border-radius: 10px;
          border-left: 4px solid #fc466b;
        }
        
        .footer {
          color: #a0aec0;
          font-size: 0.9rem;
        }
        
        .footer a {
          color: #3f5efb;
          text-decoration: none;
        }
        
        .footer a:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="error-icon">⚠️</div>
        <h1>Error de Dominio</h1>
        <div class="domain">${hostname}</div>
        <div class="error-message">
          ${error}
        </div>
        <div class="footer">
          Powered by <a href="https://broslunas.link" target="_blank">Broslunas Links</a>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Configurar qué rutas debe procesar el middleware
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