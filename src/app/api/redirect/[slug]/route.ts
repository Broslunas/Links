import { NextRequest, NextResponse } from 'next/server';
import { handleRedirect, isValidSlug } from '../../../../lib/redirect-handler';
import { ApiResponse } from '../../../../types';

export async function GET(
    request: NextRequest,
    { params }: { params: { slug: string } }
) {
    const { slug } = params;

    // Validate slug format
    if (!isValidSlug(slug)) {
        return NextResponse.json<ApiResponse>({
            success: false,
            error: {
                code: 'INVALID_SLUG',
                message: 'Invalid slug format',
            },
            timestamp: new Date().toISOString(),
        }, { status: 400 });
    }

    try {
        // Handle the redirect with analytics
        const result = await handleRedirect(slug, request);

        if (!result.success) {
            return NextResponse.json<ApiResponse>({
                success: false,
                error: {
                    code: 'LINK_NOT_FOUND',
                    message: result.error || 'Link not found',
                },
                timestamp: new Date().toISOString(),
            }, { status: 404 });
        }

        // Return the original URL for API consumers
        // In a real redirect scenario, this would be a 302 redirect
        return NextResponse.json<ApiResponse>({
            success: true,
            data: {
                originalUrl: result.originalUrl,
                redirected: true
            },
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Error in redirect API:', error);
        return NextResponse.json<ApiResponse>({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to process redirect',
            },
            timestamp: new Date().toISOString(),
        }, { status: 500 });
    }
}