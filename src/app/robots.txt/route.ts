export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

export function GET() {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://broslunas.link';

  const robotsTxt = `User-agent: *
Allow: /

# Disallow private areas
Disallow: /api/
Disallow: /dashboard/
Disallow: /auth/
Disallow: /stats/

# Allow public pages
Allow: /
Allow: /features
Allow: /contacto
Allow: /help
Allow: /status
Allow: /privacy-policy
Allow: /terms-and-services
Allow: /gpdr
Allow: /cookies
Allow: /status

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml

# Crawl delay (optional)
Crawl-delay: 1
`;

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
    },
  });
}
