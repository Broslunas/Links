import { notFound } from 'next/navigation';
import { handleRedirect, isValidSlug } from '../../lib/redirect-handler';
import { headers } from 'next/headers';
import { RedirectPage } from '../../components/ui/RedirectPage';

interface SlugPageProps {
  params: {
    slug: string;
  };
}

// Generate metadata for SEO
export async function generateMetadata({ params }: SlugPageProps) {
  return {
    title: 'Redirecting...',
    description: 'Redirecting to your destination.',
    robots: 'noindex, nofollow', // Don't index redirect pages
  };
}
export default async function SlugPage({ params }: SlugPageProps) {
  const { slug } = params;

  // Validate slug format
  if (!isValidSlug(slug)) {
    notFound();
  }

  try {
    console.log('🔍 SlugPage: Processing slug:', slug);
    
    // Create a mock request object for handleRedirect
    const headersList = headers();
    const host = headersList.get('host') || 'localhost:3000';
    const protocol = headersList.get('x-forwarded-proto') || 'http';
    const mockRequest = new Request(`${protocol}://${host}/${slug}`, {
      headers: headersList
    });

    console.log('🔍 SlugPage: Calling handleRedirect with:', slug);
    // Use the handleRedirect function which includes expired link checks
    const result = await handleRedirect(slug, mockRequest);
    console.log('🔍 SlugPage: handleRedirect result:', result);

    // If there's an error (including expired links), show 404
    if (!result.success) {
      console.log('❌ SlugPage: Redirect failed, showing 404');
      notFound();
    }
    
    console.log('✅ SlugPage: Redirect successful, showing redirect page');

    // Render the redirect page with destination URL
    return (
      <RedirectPage
        destinationUrl={result.originalUrl!}
        redirectDelay={3000}
      />
    );
  } catch (error) {
    console.error('Error in slug page:', error);
    notFound();
  }
}
