import { notFound, redirect } from 'next/navigation';
import { shouldRedirectToMainDomain } from '../../lib/redirect-handler';
import { headers } from 'next/headers';

interface CustomDomainRedirectProps {
  searchParams: {
    path?: string;
  };
}

export default async function CustomDomainRedirect({ searchParams }: CustomDomainRedirectProps) {
  const { path = '/' } = searchParams;

  try {
    // Create a mock request object
    const headersList = headers();
    const host = headersList.get('host') || 'localhost:3000';
    const protocol = headersList.get('x-forwarded-proto') || 'http';
    
    const mockRequest = new Request(`${protocol}://${host}${path}`, {
      headers: headersList
    });

    // Check if should redirect to main domain
    const result = await shouldRedirectToMainDomain(path, mockRequest);

    if (!result.success) {
      notFound();
    }

    if (result.shouldRedirectToMain && result.mainDomainUrl) {
      redirect(result.mainDomainUrl);
    }

    // If no redirect needed, redirect to the original path
    redirect(path);
    
  } catch (error) {
    console.error('Error in custom domain redirect:', error);
    notFound();
  }
}