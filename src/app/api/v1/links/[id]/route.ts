import { NextRequest, NextResponse } from 'next/server';
import { connectDB, isValidUrl } from '../../../../../lib/db-utils';
import Link from '../../../../../models/Link';
import { withApiV1Middleware, createApiSuccessResponse, createApiErrorResponse } from '../../../../../lib/api-v1-middleware';
import { authenticateRequest, AuthContext, verifyLinkOwnership } from '../../../../../lib/auth-middleware';
import { AppError, ErrorCode } from '../../../../../lib/api-errors';
import { LinkV1Response, UpdateLinkV1Request } from '../../../../../types/api-v1';
import mongoose from 'mongoose';

// Force Node.js runtime for Mongoose compatibility
export const runtime = 'nodejs';

/**
 * Helper function to add CORS headers to responses
 */
function addCorsHeaders(response: NextResponse): NextResponse {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Max-Age', '86400');
    return response;
}

/**
 * OPTIONS /api/v1/links/{id} - Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
    const response = new NextResponse(null, { status: 204 });
    return addCorsHeaders(response);
}


interface RouteParams {
    params: {
        id: string;
    };
}

/**
 * PUT /api/v1/links/{id} - Update a link
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
    return withApiV1Middleware(request, async (request, context) => {
        try {
            // Authenticate the request
            const auth: AuthContext = await authenticateRequest(request);

            await connectDB();

            // Validate link ID format
            if (!mongoose.Types.ObjectId.isValid(params.id)) {
                throw new AppError(
                    ErrorCode.VALIDATION_ERROR,
                    'Invalid link ID format',
                    400,
                    { linkId: params.id }
                );
            }

            // Verify link ownership
            await verifyLinkOwnership(auth.userId, params.id);

            // Parse request body
            const body: UpdateLinkV1Request = await request.json();

            // Validate update request
            validateUpdateLinkRequest(body);

            // Build update object
            const updateData: any = {};

            if (body.originalUrl !== undefined) {
                let sanitizedUrl = body.originalUrl.trim();
                if (!sanitizedUrl.startsWith('http://') && !sanitizedUrl.startsWith('https://')) {
                    sanitizedUrl = 'https://' + sanitizedUrl;
                }

                if (!isValidUrl(sanitizedUrl)) {
                    throw new AppError(
                        ErrorCode.INVALID_URL,
                        'Invalid URL format',
                        400,
                        { url: body.originalUrl }
                    );
                }

                updateData.originalUrl = sanitizedUrl;
            }

            if (body.title !== undefined) {
                updateData.title = body.title?.trim() || undefined;
            }

            if (body.description !== undefined) {
                updateData.description = body.description?.trim() || undefined;
            }

            if (body.isPublicStats !== undefined) {
                updateData.isPublicStats = body.isPublicStats;
            }

            if (body.isActive !== undefined) {
                updateData.isActive = body.isActive;
            }

            // Update the link
            const updatedLink = await Link.findByIdAndUpdate(
                params.id,
                updateData,
                { new: true, runValidators: true }
            );

            if (!updatedLink) {
                throw new AppError(
                    ErrorCode.LINK_NOT_FOUND,
                    'Link not found',
                    404,
                    { linkId: params.id }
                );
            }

            // Transform to API response format
            const responseData = transformLinkToV1Response(updatedLink.toObject());

            const response = createApiSuccessResponse(
                responseData,
                200,
                undefined,
                context.requestId
            );
            return addCorsHeaders(response);

        } catch (error) {
            if (error instanceof AppError) {
                const response = createApiErrorResponse(
                    error.code,
                    error.message,
                    error.statusCode,
                    error.details,
                    context.requestId
                );
                return addCorsHeaders(response);
            }

            console.error('[API v1 Links PUT Error]:', error);
            const response = createApiErrorResponse(
                ErrorCode.INTERNAL_ERROR,
                'An internal server error occurred',
                500,
                undefined,
                context.requestId
            );
            return addCorsHeaders(response);
        }
    });
}

/**
 * DELETE /api/v1/links/{id} - Delete a link
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    return withApiV1Middleware(request, async (request, context) => {
        try {
            // Authenticate the request
            const auth: AuthContext = await authenticateRequest(request);

            await connectDB();

            // Validate link ID format
            if (!mongoose.Types.ObjectId.isValid(params.id)) {
                throw new AppError(
                    ErrorCode.VALIDATION_ERROR,
                    'Invalid link ID format',
                    400,
                    { linkId: params.id }
                );
            }

            // Verify link ownership
            await verifyLinkOwnership(auth.userId, params.id);

            // Delete the link
            const deletedLink = await Link.findByIdAndDelete(params.id);

            if (!deletedLink) {
                throw new AppError(
                    ErrorCode.LINK_NOT_FOUND,
                    'Link not found',
                    404,
                    { linkId: params.id }
                );
            }

            // Return 204 No Content for successful deletion
            const response = new NextResponse(null, {
                status: 204,
                headers: {
                    'X-Request-ID': context.requestId
                }
            });
            return addCorsHeaders(response);

        } catch (error) {
            if (error instanceof AppError) {
                const response = createApiErrorResponse(
                    error.code,
                    error.message,
                    error.statusCode,
                    error.details,
                    context.requestId
                );
                return addCorsHeaders(response);
            }

            console.error('[API v1 Links DELETE Error]:', error);
            const response = createApiErrorResponse(
                ErrorCode.INTERNAL_ERROR,
                'An internal server error occurred',
                500,
                undefined,
                context.requestId
            );
            return addCorsHeaders(response);
        }
    });
}

/**
 * Validate update link request body
 */
function validateUpdateLinkRequest(body: UpdateLinkV1Request): void {
    // Check if at least one field is provided
    const hasValidField = body.originalUrl !== undefined ||
        body.title !== undefined ||
        body.description !== undefined ||
        body.isPublicStats !== undefined ||
        body.isActive !== undefined;

    if (!hasValidField) {
        throw new AppError(
            ErrorCode.VALIDATION_ERROR,
            'At least one field must be provided for update',
            400
        );
    }

    if (body.originalUrl !== undefined) {
        if (typeof body.originalUrl !== 'string') {
            throw new AppError(
                ErrorCode.VALIDATION_ERROR,
                'originalUrl must be a string',
                400,
                { field: 'originalUrl' }
            );
        }

        if (body.originalUrl.length > 2048) {
            throw new AppError(
                ErrorCode.VALIDATION_ERROR,
                'originalUrl cannot exceed 2048 characters',
                400,
                { field: 'originalUrl', maxLength: 2048 }
            );
        }
    }

    if (body.title !== undefined && body.title !== null) {
        if (typeof body.title !== 'string') {
            throw new AppError(
                ErrorCode.VALIDATION_ERROR,
                'title must be a string',
                400,
                { field: 'title' }
            );
        }

        if (body.title.length > 200) {
            throw new AppError(
                ErrorCode.VALIDATION_ERROR,
                'title cannot exceed 200 characters',
                400,
                { field: 'title', maxLength: 200 }
            );
        }
    }

    if (body.description !== undefined && body.description !== null) {
        if (typeof body.description !== 'string') {
            throw new AppError(
                ErrorCode.VALIDATION_ERROR,
                'description must be a string',
                400,
                { field: 'description' }
            );
        }

        if (body.description.length > 500) {
            throw new AppError(
                ErrorCode.VALIDATION_ERROR,
                'description cannot exceed 500 characters',
                400,
                { field: 'description', maxLength: 500 }
            );
        }
    }

    if (body.isPublicStats !== undefined && typeof body.isPublicStats !== 'boolean') {
        throw new AppError(
            ErrorCode.VALIDATION_ERROR,
            'isPublicStats must be a boolean',
            400,
            { field: 'isPublicStats' }
        );
    }

    if (body.isActive !== undefined && typeof body.isActive !== 'boolean') {
        throw new AppError(
            ErrorCode.VALIDATION_ERROR,
            'isActive must be a boolean',
            400,
            { field: 'isActive' }
        );
    }
}

/**
 * Transform Link document to API v1 response format
 */
function transformLinkToV1Response(link: any): LinkV1Response {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    return {
        id: link._id.toString(),
        originalUrl: link.originalUrl,
        slug: link.slug,
        title: link.title || undefined,
        description: link.description || undefined,
        shortUrl: `${baseUrl}/${link.slug}`,
        isPublicStats: link.isPublicStats,
        isActive: link.isActive,
        clickCount: link.clickCount,
        createdAt: link.createdAt.toISOString(),
        updatedAt: link.updatedAt.toISOString()
    };
}