import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth-simple';
import { validateUserSession } from '../../../../lib/user-utils';
import { ApiResponse } from '../../../../types';

export async function GET(request: NextRequest) {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json<ApiResponse>({
            success: false,
            error: {
                code: 'NOT_ALLOWED',
                message: 'Debug endpoint only available in development',
            },
            timestamp: new Date().toISOString(),
        }, { status: 403 });
    }

    try {
        const session = await getServerSession(authOptions);
        const userValidation = validateUserSession(session);

        return NextResponse.json<ApiResponse>({
            success: true,
            data: {
                session: session ? {
                    user: {
                        id: session.user?.id,
                        email: session.user?.email,
                        name: session.user?.name,
                        provider: session.user?.provider
                    },
                    expires: session.expires
                } : null,
                validation: {
                    isValid: userValidation.isValid,
                    userId: userValidation.userId?.toString(),
                    error: userValidation.error
                }
            },
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Error in debug session endpoint:', error);
        return NextResponse.json<ApiResponse>({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to get session debug info',
            },
            timestamp: new Date().toISOString(),
        }, { status: 500 });
    }
}