import { NextResponse } from 'next/server'

export function GET() {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://brl-links.vercel.app'

  const robotsTxt = `User-agent: *
Allow: /

# Disallow private areas
Disallow: /api/
Disallow: /dashboard/
Disallow: /auth/

# Allow public pages
Allow: /
Allow: /features
Allow: /pricing
Allow: /help
Allow: /status
Allow: /privacy-policy
Allow: /terms-and-services

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml

# Crawl delay (optional)
Crawl-delay: 1
`

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
    },
  })
}