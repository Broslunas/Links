import { notFound } from 'next/navigation';
import { handleRedirect, isValidSlug, type ErrorType } from '../../lib/redirect-handler';
import { headers } from 'next/headers';
import { RedirectPage } from '../../components/ui/RedirectPage';
import { ErrorPage } from '../../components/ui/ErrorPage';

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
    return <ErrorPage type="404" />;
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

    // If there's an error, show the appropriate error page
    if (!result.success) {
      console.log('❌ SlugPage: Redirect failed:', result.error);
      return <ErrorPage 
        type={result.errorType || '404'}
        message={result.error}
      />;
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
    return <ErrorPage type="404" />;
  }
}
