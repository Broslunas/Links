import { redirect, notFound } from 'next/navigation';
import { handleRedirect, isValidSlug } from '../../lib/redirect-handler';
import { connectDB } from '../../lib/db-utils';
import Link from '../../models/Link';
import { headers } from 'next/headers';

interface SlugPageProps {
    params: {
        slug: string;
    };
}

export default async function SlugPage({ params }: SlugPageProps) {
    const { slug } = params;

    // Debug logging
    console.log(`🔍 [SlugPage] Processing slug: "${slug}"`);
    console.log(`🔍 [SlugPage] Slug validation: ${isValidSlug(slug)}`);

    // Validate slug format
    if (!isValidSlug(slug)) {
        console.log(`❌ [SlugPage] Invalid slug format: "${slug}"`);
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
                'referer': referrer || '',
                'accept-language': acceptLanguage,
                'x-forwarded-for': forwardedFor || '',
                'x-real-ip': realIP || '',
                'cf-connecting-ip': cfConnectingIP || ''
            }
        });

        // Handle the redirect with analytics
        console.log(`🔍 [SlugPage] Calling handleRedirect for: "${slug}"`);
        const result = await handleRedirect(slug, mockRequest);
        console.log(`📊 [SlugPage] Redirect result:`, result);

        if (!result.success || !result.originalUrl) {
            console.log(`❌ [SlugPage] Redirect failed for: "${slug}"`);
            notFound();
        }

        console.log(`✅ [SlugPage] Redirecting to: ${result.originalUrl}`);
        // Redirect to the original URL
        redirect(result.originalUrl);

    } catch (error) {
        // Check if this is a Next.js redirect (which is expected behavior)
        if (error && typeof error === 'object' && 'digest' in error &&
            typeof error.digest === 'string' && error.digest.includes('NEXT_REDIRECT')) {
            // This is a successful redirect, re-throw to let Next.js handle it
            console.log(`🔄 [SlugPage] Next.js redirect successful for "${slug}"`);
            throw error;
        }

        // This is a real error
        console.error(`❌ [SlugPage] Real error in slug redirection for "${slug}":`, error);
        notFound();
    }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: SlugPageProps) {
    const { slug } = params;

    try {
        await connectDB();

        const link = await Link.findOne({
            slug: slug.toLowerCase(),
            isActive: true
        });

        if (!link) {
            return {
                title: 'Link Not Found',
                description: 'The requested link could not be found.',
            };
        }

        return {
            title: link.title || 'Redirecting...',
            description: link.description || `Redirecting to ${link.originalUrl}`,
            robots: 'noindex, nofollow', // Don't index redirect pages
        };
    } catch (error) {
        return {
            title: 'Redirecting...',
            description: 'Redirecting to your destination.',
        };
    }
}
