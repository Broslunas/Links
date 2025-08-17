import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db-utils';
import Link from '../../../../models/Link';
import { ApiResponse } from '../../../../types';
import { requireDevelopment } from '../../../../lib/auth-middleware';

export const GET = requireDevelopment(async (request: NextRequest) => {

    try {
        await connectDB();

        // Get all links (limit to 20 for debugging)
        const links = await Link.find({})
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();

        const totalCount = await Link.countDocuments();

        return NextResponse.json<ApiResponse>({
            success: true,
            data: {
                totalLinks: totalCount,
                recentLinks: links.map(link => ({
                    id: link._id,
                    slug: link.slug,
                    originalUrl: link.originalUrl,
                    isActive: link.isActive,
                    clickCount: link.clickCount,
                    userId: link.userId,
                    createdAt: link.createdAt
                }))
            },
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Error in debug links endpoint:', error);
        return NextResponse.json<ApiResponse>({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to get links',
            },
            timestamp: new Date().toISOString(),
        }, { status: 500 });
    }
});