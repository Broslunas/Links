import { redirect, notFound } from 'next/navigation';
import { handleRedirect, isValidSlug } from '../../lib/redirect-handler';
import { connectDB } from '../../lib/db-utils';
import Link from '../../models/Link';
import TempLink from '../../models/TempLink';
import { headers } from 'next/headers';

interface SlugPageProps {
  params: {
    slug: string;
  };
}

export default async function SlugPage({ params }: SlugPageProps) {
  const { slug } = params;

  // Validate slug format
  if (!isValidSlug(slug)) {
    notFound();
  }

  try {
    // Get request headers for analytics
    const headersList = headers();
    const userAgent = headersList.get('user-agent') || '';
    const referrer = headersList.get('referer') || undefined;
    const acceptLanguage = headersList.get('accept-language') || 'en';
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIP = headersList.get('x-real-ip');
    const cfConnectingIP = headersList.get('cf-connecting-ip');

    // Create a mock request object for analytics extraction
    const mockRequest = new Request('http://localhost', {
      headers: {
        'user-agent': userAgent,
        referer: referrer || '',
        'accept-language': acceptLanguage,
        'x-forwarded-for': forwardedFor || '',
        'x-real-ip': realIP || '',
        'cf-connecting-ip': cfConnectingIP || '',
      },
    });

    const result = await handleRedirect(slug, mockRequest);

    if (!result.success || !result.originalUrl) {
      notFound();
    }
    // Redirect to the original URL
    redirect(result.originalUrl);
  } catch (error) {
    // Check if this is a Next.js redirect (which is expected behavior)
    if (
      error &&
      typeof error === 'object' &&
      'digest' in error &&
      typeof error.digest === 'string' &&
      error.digest.includes('NEXT_REDIRECT')
    ) {
      throw error;
    }

    notFound();
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: SlugPageProps) {
  const { slug } = params;

  try {
    await connectDB();

    // Check both regular links and temporary links
    const [link, tempLink] = await Promise.all([
      Link.findOne({
        slug: slug.toLowerCase(),
        isActive: true,
      }),
      TempLink.findOne({
        slug: slug.toLowerCase(),
        expiresAt: { $gt: new Date() },
      }),
    ]);

    const targetLink = link || tempLink;

    if (!targetLink) {
      return {
        title: 'Link Not Found',
        description: 'The requested link could not be found.',
      };
    }

    return {
      title: targetLink.title || 'Redirecting...',
      description:
        targetLink.description || `Redirecting to ${targetLink.originalUrl}`,
      robots: 'noindex, nofollow', // Don't index redirect pages
    };
  } catch (error) {
    return {
      title: 'Redirecting...',
      description: 'Redirecting to your destination.',
    };
  }
}
