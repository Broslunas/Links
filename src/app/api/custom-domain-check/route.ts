import { NextRequest, NextResponse } from 'next/server';
import { shouldRedirectToMainDomain } from '../../../lib/redirect-handler';

export async function POST(request: NextRequest) {
  try {
    const { domain, path } = await request.json();
    
    if (!domain || !path) {
      return NextResponse.json(
        { error: 'Domain and path are required' },
        { status: 400 }
      );
    }
    
    // Create a mock request with the custom domain
    const mockRequest = new Request(`https://${domain}${path}`, {
      headers: {
        'host': domain,
        'x-forwarded-proto': 'https'
      }
    });
    
    const result = await shouldRedirectToMainDomain(path, mockRequest);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to check redirect' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      shouldRedirect: result.shouldRedirectToMain || false,
      redirectUrl: result.mainDomainUrl || null
    });
    
  } catch (error) {
    console.error('Error in custom domain check API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}