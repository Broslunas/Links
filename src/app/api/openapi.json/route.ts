import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/openapi.json
 * Serves the OpenAPI specification file
 */
export async function GET(request: NextRequest) {
  try {
    // Read the OpenAPI spec from the public directory
    const specPath = join(process.cwd(), 'public', 'specs', 'openapi.json');

    const specContent = readFileSync(specPath, 'utf8');

    const spec = JSON.parse(specContent);

    // Update server URLs based on the current request
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    spec.servers = [
      {
        url: `${baseUrl}/api/v1`,
        description:
          process.env.NODE_ENV === 'production'
            ? 'Production server'
            : 'Development server',
      },
    ];

    return NextResponse.json(spec, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error serving OpenAPI spec:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: 'Failed to load OpenAPI specification',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
