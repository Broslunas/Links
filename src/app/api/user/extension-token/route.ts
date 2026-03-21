import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth-simple';
import { connectDB } from '../../../../lib/db-utils';
import User from '../../../../models/User';
import {
    generateUserExtensionToken,
} from '../../../../lib/api-token';

export const runtime = 'nodejs';

/**
 * GET /api/user/extension-token
 * Get information about the user's Extension token
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
                { status: 401 }
            );
        }

        await connectDB();

        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json(
                { success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                hasToken: !!user.extensionToken,
                createdAt: user.extensionTokenCreatedAt,
                lastUsedAt: user.extensionTokenLastUsedAt,
                tokenPreview: user.extensionToken ? `${user.extensionToken.substring(0, 4)}...${user.extensionToken.substring(user.extensionToken.length - 4)}` : null,
            },
        });

    } catch (error) {
        console.error('Error getting Extension token info:', error);
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
            { status: 500 }
        );
    }
}

/**
 * POST /api/user/extension-token
 * Generate a new Extension token
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
                { status: 401 }
            );
        }

        await connectDB();

        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json(
                { success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } },
                { status: 404 }
            );
        }

        const newToken = await generateUserExtensionToken(user._id?.toString() || '');

        return NextResponse.json({
            success: true,
            data: {
                token: newToken,
                createdAt: new Date(),
                message: user.extensionToken ? 'Extension token regenerated successfully' : 'Extension token generated successfully',
            },
        });

    } catch (error) {
        console.error('Error generating Extension token:', error);
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
            { status: 500 }
        );
    }
}
