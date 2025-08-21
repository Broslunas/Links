import { notFound } from 'next/navigation';
import { isValidSlug } from '../../lib/redirect-handler';
import { connectDB } from '../../lib/db-utils';
import Link from '../../models/Link';
import TempLink from '../../models/TempLink';
import { headers } from 'next/headers';
import { RedirectPage } from '../../components/ui/RedirectPage';
import { extractAnalyticsData, hashIP } from '../../lib/analytics';
import AnalyticsEvent from '../../models/AnalyticsEvent';

// Custom error classes for better error handling
class ExpiredLinkError extends Error {
  constructor(message: string, public expirationDate?: Date) {
    super(message);
    this.name = 'ExpiredLinkError';
  }
}

class DatabaseConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseConnectionError';
  }
}

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
    await connectDB();
  } catch (dbError) {
    console.error('Database connection error:', dbError);
    throw new DatabaseConnectionError('Unable to connect to database for redirect processing');
  }

  try {
    // Find the link by slug (check both regular links and temporary links)
    // First check for expired temp links to provide specific error messaging
    const expiredTempLink = await TempLink.findOne({
      slug: slug.toLowerCase(),
      expiresAt: { $lte: new Date() }, // Only expired temp links
    });

    if (expiredTempLink) {
      throw new ExpiredLinkError(
        `This temporary link expired on ${expiredTempLink.expiresAt.toLocaleDateString('es-ES')}`,
        expiredTempLink.expiresAt
      );
    }

    // Now check for active links
    const [link, tempLink] = await Promise.all([
      Link.findOne({
        slug: slug.toLowerCase(),
        isActive: true,
        isDisabledByAdmin: { $ne: true } // Exclude links disabled by admin
      }),
      TempLink.findOne({
        slug: slug.toLowerCase(),
        expiresAt: { $gt: new Date() }, // Only non-expired temp links
      }),
    ]);

    // Determine which link to use (regular links take precedence)
    const targetLink = link || tempLink;
    const isTemporary = !link && !!tempLink;

    if (!targetLink) {
      notFound();
    }

    // Record analytics in the background (fire and forget)
    recordAnalytics(targetLink, isTemporary).catch((error) => {
      console.error('Error recording analytics:', error);
    });

    // Render the redirect page with destination URL and metadata
    return (
      <RedirectPage
        destinationUrl={targetLink.originalUrl}
        title={targetLink.title || undefined}
        redirectDelay={3000}
      />
    );
  } catch (error) {
    // Re-throw custom errors to be handled by error boundary
    if (error instanceof ExpiredLinkError || error instanceof DatabaseConnectionError) {
      throw error;
    }

    console.error('Error in slug page:', error);

    // For other database/server errors, throw a generic server error
    if (error instanceof Error && (
      error.message.includes('database') ||
      error.message.includes('connection') ||
      error.message.includes('timeout')
    )) {
      throw new Error('Server error occurred while processing redirect');
    }

    // For unknown errors, show 404
    notFound();
  }
}

// Separate function to handle analytics recording
async function recordAnalytics(
  targetLink: any,
  isTemporary: boolean
) {
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

    // Extract analytics data
    const analyticsData = await extractAnalyticsData(mockRequest);

    // Get client IP
    let clientIP = '127.0.0.1';
    if (forwardedFor) {
      clientIP = forwardedFor.split(',')[0].trim();
    } else if (realIP) {
      clientIP = realIP;
    } else if (cfConnectingIP) {
      clientIP = cfConnectingIP;
    }

    // Record analytics event
    const analyticsEvent = new AnalyticsEvent({
      linkId: targetLink._id,
      ip: hashIP(clientIP),
      country: analyticsData.country,
      city: analyticsData.city,
      region: analyticsData.region,
      language: analyticsData.language,
      userAgent: analyticsData.userAgent,
      device: analyticsData.device,
      os: analyticsData.os,
      browser: analyticsData.browser,
      referrer: analyticsData.referrer,
    });

    // Save analytics event and increment click count in parallel
    const updatePromises = [analyticsEvent.save()];

    if (isTemporary) {
      // Update temporary link click count
      updatePromises.push(
        TempLink.findByIdAndUpdate(targetLink._id, { $inc: { clickCount: 1 } })
      );
    } else {
      // Update regular link click count
      updatePromises.push(
        Link.findByIdAndUpdate(targetLink._id, { $inc: { clickCount: 1 } })
      );
    }

    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error recording analytics:', error);
    throw error;
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
