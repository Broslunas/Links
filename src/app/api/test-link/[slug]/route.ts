import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db-utils';
import Link from '../../../../models/Link';
import { ApiResponse } from '../../../../types';

// Force Node.js runtime for Mongoose compatibility
export const runtime = 'nodejs';


export async function GET(
    request: NextRequest,
    { params }: { params: { slug: string } }
) {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json<ApiResponse>({
            success: false,
            error: {
                code: 'NOT_ALLOWED',
                message: 'Test endpoint only available in development',
            },
            timestamp: new Date().toISOString(),
        }, { status: 403 });
    }

    try {
        const { slug } = params;

        await connectDB();

        // Find the link by slug
        const link = await Link.findOne({
            slug: slug.toLowerCase()
        });

        if (!link) {
            return NextResponse.json<ApiResponse>({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Link not found',
                },
                data: {
                    searchedSlug: slug.toLowerCase(),
                    totalLinks: await Link.countDocuments()
                },
                timestamp: new Date().toISOString(),
            }, { status: 404 });
        }

        return NextResponse.json<ApiResponse>({
            success: true,
            data: {
                link: {
                    id: link._id,
                    slug: link.slug,
                    originalUrl: link.originalUrl,
                    isActive: link.isActive,
                    clickCount: link.clickCount,
                    userId: link.userId,
                    createdAt: link.createdAt
                },
                status: link.isActive ? 'active' : 'inactive'
            },
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Error in test link endpoint:', error);
        return NextResponse.json<ApiResponse>({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to test link',
            },
            timestamp: new Date().toISOString(),
        }, { status: 500 });
    }
}