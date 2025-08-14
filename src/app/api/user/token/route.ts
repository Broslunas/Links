import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth-simple';
import { connectDB } from '../../../../lib/db-utils';
import { validateUserSession } from '../../../../lib/user-utils';
import User from '../../../../models/User';
import { createSuccessResponse, createErrorResponse, withErrorHandler } from '../../../../lib/api-response';
import { createError } from '../../../../lib/api-errors';
import { generateUserApiToken, revokeApiToken } from '../../../../lib/api-token';
import { applyConfiguredRateLimit } from '../../../../lib/rate-limit';

// GET /api/user/token - Get current API token status
export const GET = withErrorHandler(async (request: NextRequest) => {
    const session = await getServerSession(authOptions);
    const userValidation = validateUserSession(session);

    if (!userValidation.isValid) {
        if (userValidation.error === 'Authentication required') {
            throw createError.unauthorized();
        }
        throw createError.validation(userValidation.error!);
    }

    await connectDB();

    const user = await User.findById(userValidation.userId).select('apiToken apiTokenCreatedAt');

    if (!user) {
        throw createError.notFound('User not found');
    }

    const responseData = {
        hasToken: !!user.apiToken,
        tokenCreatedAt: user.apiTokenCreatedAt || null,
        // Don't return the actual token for security
    };

    return createSuccessResponse(responseData);
});

// POST /api/user/token - Generate new API token
export const POST = withErrorHandler(async (request: NextRequest) => {
    // Apply rate limiting
    const rateLimitResult = await applyConfiguredRateLimit(request, 'generate-token');
    if (!rateLimitResult.success) {
        throw createError.rateLimitExceeded();
    }

    const session = await getServerSession(authOptions);
    const userValidation = validateUserSession(session);

    if (!userValidation.isValid) {
        if (userValidation.error === 'Authentication required') {
            throw createError.unauthorized();
        }
        throw createError.validation(userValidation.error!);
    }

    await connectDB();

    try {
        const token = await generateUserApiToken(userValidation.userId!.toString());

        const responseData = {
            token,
            createdAt: new Date().toISOString(),
            message: 'API token generated successfully. Please save it securely as it will not be shown again.',
        };

        return createSuccessResponse(responseData, 201);
    } catch (error) {
        console.error('Error generating API token:', error);
        throw createError.internal('Failed to generate API token');
    }
});

// DELETE /api/user/token - Revoke API token
export const DELETE = withErrorHandler(async (request: NextRequest) => {
    // Apply rate limiting
    const rateLimitResult = await applyConfiguredRateLimit(request, 'revoke-token');
    if (!rateLimitResult.success) {
        throw createError.rateLimitExceeded();
    }

    const session = await getServerSession(authOptions);
    const userValidation = validateUserSession(session);

    if (!userValidation.isValid) {
        if (userValidation.error === 'Authentication required') {
            throw createError.unauthorized();
        }
        throw createError.validation(userValidation.error!);
    }

    await connectDB();

    try {
        await revokeApiToken(userValidation.userId!.toString());

        const responseData = {
            message: 'API token revoked successfully',
        };

        return createSuccessResponse(responseData);
    } catch (error) {
        console.error('Error revoking API token:', error);
        throw createError.internal('Failed to revoke API token');
    }
});