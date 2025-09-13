import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth-simple';
import { connectDB } from '../../../../lib/db-utils';
import User from '../../../../models/User';
import {
    generateUserApiToken,
    revokeApiToken,
} from '../../../../lib/api-token';

// Force Node.js runtime for Mongoose compatibility
export const runtime = 'nodejs';


/**
 * GET /api/user/token
 * Get information about the user's API token (without showing the full token value)
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

        // Return token information without the actual token value
        const tokenInfo = {
            hasToken: !!user.apiToken,
            createdAt: user.apiTokenCreatedAt,
            lastUsedAt: user.apiTokenLastUsedAt,
            // Show only the prefix and last 4 characters for security
            tokenPreview: user.apiToken ? `${user.apiToken.substring(0, 4)}...${user.apiToken.substring(user.apiToken.length - 4)}` : null,
        };

        return NextResponse.json({
            success: true,
            data: tokenInfo,
        });

    } catch (error) {
        console.error('Error getting API token info:', error);
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
            { status: 500 }
        );
    }
}

/**
 * POST /api/user/token
 * Generate a new API token for the user
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

        // Generate new token (this will replace any existing token)
        const newToken = await generateUserApiToken(user._id?.toString() || '');

        return NextResponse.json({
            success: true,
            data: {
                token: newToken,
                createdAt: new Date(),
                message: user.apiToken ? 'API token regenerated successfully' : 'API token generated successfully',
            },
        });

    } catch (error) {
        console.error('Error generating API token:', error);

        if (error instanceof Error && error.message === 'Failed to generate unique API token') {
            return NextResponse.json(
                { success: false, error: { code: 'TOKEN_GENERATION_FAILED', message: 'Failed to generate unique token. Please try again.' } },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/user/token
 * Revoke the user's API token
 */
export async function DELETE(request: NextRequest) {
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

        if (!user.apiToken) {
            return NextResponse.json(
                { success: false, error: { code: 'NO_TOKEN_EXISTS', message: 'No API token exists to revoke' } },
                { status: 400 }
            );
        }

        // Revoke the token
        await revokeApiToken(user._id?.toString() || '');

        return NextResponse.json({
            success: true,
            data: {
                message: 'API token revoked successfully',
            },
        });

    } catch (error) {
        console.error('Error revoking API token:', error);
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
            { status: 500 }
        );
    }
}