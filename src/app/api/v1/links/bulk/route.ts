import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/db-utils';
import Link, { ILink } from '../../../../../models/Link';
import { withApiV1Middleware, createApiSuccessResponse, createApiErrorResponse } from '../../../../../lib/api-v1-middleware';
import { authenticateRequest, AuthContext } from '../../../../../lib/auth-middleware';
import { AppError, ErrorCode } from '../../../../../lib/api-errors';
import { LinkV1Response, CreateLinkV1Request } from '../../../../../types/api-v1';
import { generateSlug, isValidUrl } from '../../../../../lib/db-utils';
import mongoose from 'mongoose';

// Force Node.js runtime for Mongoose compatibility
export const runtime = 'nodejs';

/**
 * Helper function to validate a single link creation request
 */
function validateCreateLinkRequest(link: CreateLinkV1Request): void {
    if (!link.originalUrl) {
        throw new AppError(
            ErrorCode.VALIDATION_ERROR,
            'Missing required field: originalUrl',
            400,
            { field: 'originalUrl' }
        );
    }
}

/**
 * Helper function to validate slug format
 */
function validateSlugFormat(slug: string): void {
    const slugRegex = /^[a-z0-9-_]+$/;
    if (!slugRegex.test(slug)) {
        throw new AppError(
            ErrorCode.INVALID_SLUG,
            'Slug can only contain lowercase letters, numbers, hyphens, and underscores',
            400,
            { slug }
        );
    }
}

/**
 * Generate a unique slug, retrying if there's a collision
 */
async function generateUniqueSlug(): Promise<string> {
    let attempts = 0;
    const maxAttempts = 5;
    let slug: string;

    do {
        slug = generateSlug(6);
        const existingLink = await Link.findOne({ slug });
        if (!existingLink) {
            return slug;
        }
        attempts++;
    } while (attempts < maxAttempts);

    throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to generate a unique slug after multiple attempts',
        500,
        { maxAttempts, baseSlug: slug?.slice(0, 10) + '...' }
    );
}

/**
 * Generate alternative slugs when a slug is already taken
 */
async function generateAlternativeSlugs(baseSlug: string): Promise<string[]> {
    const alternatives: string[] = [];
    const timestamp = Date.now().toString(36).slice(-4);
    
    alternatives.push(`${baseSlug}-${timestamp}`);
    alternatives.push(`${baseSlug}-${Math.floor(Math.random() * 1000)}`);
    
    return alternatives;
}

/**
 * Create a single link with proper validation and error handling
 */
async function createSingleLink(linkData: CreateLinkV1Request, userId: string): Promise<LinkV1Response> {
    // Sanitize and validate URL
    let sanitizedUrl = linkData.originalUrl.trim();
    if (!sanitizedUrl.startsWith('http://') && !sanitizedUrl.startsWith('https://')) {
        sanitizedUrl = 'https://' + sanitizedUrl;
    }

    if (!isValidUrl(sanitizedUrl)) {
        throw new AppError(
            ErrorCode.INVALID_URL,
            'Invalid URL format',
            400,
            { url: linkData.originalUrl }
        );
    }

    // Handle slug generation or validation
    let finalSlug = linkData.slug?.trim().toLowerCase();

    if (finalSlug) {
        // Validate custom slug format
        validateSlugFormat(finalSlug);

        // Check if custom slug already exists
        const existingLink = await Link.findOne({ slug: finalSlug });
        if (existingLink) {
            const suggestedSlugs = await generateAlternativeSlugs(finalSlug);
            throw new AppError(
                ErrorCode.SLUG_TAKEN,
                `Slug '${finalSlug}' is already taken`,
                409,
                { slug: finalSlug, suggestedSlugs }
            );
        }
    } else {
        // Generate unique slug
        finalSlug = await generateUniqueSlug();
    }

    // Create the link with proper typing
    const newLink = new Link({
        userId: new mongoose.Types.ObjectId(userId),
        originalUrl: sanitizedUrl,
        slug: finalSlug,
        title: linkData.title?.trim() || undefined,
        description: linkData.description?.trim() || undefined,
        isPublicStats: linkData.isPublicStats || false,
    }) as ILink & { _id: mongoose.Types.ObjectId };

    await newLink.save();

    // Transform to API response format
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    return {
        id: newLink._id.toString(),
        originalUrl: newLink.originalUrl,
        slug: newLink.slug,
        title: newLink.title || undefined,
        description: newLink.description || undefined,
        shortUrl: `${baseUrl}/${newLink.slug}`,
        isPublicStats: newLink.isPublicStats,
        isActive: newLink.isActive,
        clickCount: newLink.clickCount,
        createdAt: newLink.createdAt.toISOString(),
        updatedAt: newLink.updatedAt.toISOString()
    };
}

/**
 * POST /api/v1/links/bulk - Create multiple links in a single request
 */
export async function POST(request: NextRequest) {
    return withApiV1Middleware(request, async (request, context) => {
        try {
            // Authenticate the request
            const auth: AuthContext = await authenticateRequest(request);
            await connectDB();

            // Parse request body
            const body: { links: CreateLinkV1Request[] } = await request.json();

            // Validate request body
            if (!Array.isArray(body?.links) || body.links.length === 0) {
                throw new AppError(
                    ErrorCode.VALIDATION_ERROR,
                    'Request body must contain a non-empty "links" array',
                    400
                );
            }

            // Validate each link in the request
            body.links.forEach((link, index) => {
                try {
                    validateCreateLinkRequest(link);
                } catch (error) {
                    if (error instanceof AppError) {
                        // Create a new error with enhanced details
                        throw new AppError(
                            error.code,
                            `Link at index ${index}: ${error.message}`,
                            error.statusCode,
                            { ...error.details, linkIndex: index },
                            error.isOperational
                        );
                    }
                    throw error;
                }
            });

            // Process links in parallel with proper typing
            const results = await Promise.allSettled(
                body.links.map(link => 
                    createSingleLink(link, auth.userId)
                )
            );

            // Process results
            const createdLinks: LinkV1Response[] = [];
            const errors: Array<{
                index: number;
                error: {
                    code: string;
                    message: string;
                    details?: any;
                };
            }> = [];

            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    createdLinks.push(result.value);
                } else {
                    const error = result.reason;
                    errors.push({
                        index,
                        error: {
                            code: error.code || ErrorCode.INTERNAL_ERROR,
                            message: error.message || 'Unknown error',
                            details: error.details
                        }
                    });
                }
            });

            // Prepare response
            const responseData = {
                created: createdLinks,
                errors: errors.length > 0 ? errors : undefined,
                stats: {
                    total: body.links.length,
                    success: createdLinks.length,
                    failed: errors.length
                }
            };

            // Determine appropriate status code
            const statusCode = createdLinks.length > 0 ? 201 : 400;

            const response = createApiSuccessResponse(
                responseData,
                statusCode,
                undefined,
                context.requestId
            );

            // Add CORS headers
            response.headers.set('Access-Control-Allow-Origin', '*');
            response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
            response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            
            return response;

        } catch (error) {
            if (error instanceof AppError) {
                const response = createApiErrorResponse(
                    error.code,
                    error.message,
                    error.statusCode,
                    error.details,
                    context.requestId
                );
                response.headers.set('Access-Control-Allow-Origin', '*');
                response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
                response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
                return response;
            }

            console.error('[API v1 Links Bulk POST Error]:', error);
            const response = createApiErrorResponse(
                ErrorCode.INTERNAL_ERROR,
                'An internal server error occurred',
                500,
                undefined,
                context.requestId
            );
            response.headers.set('Access-Control-Allow-Origin', '*');
            response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
            response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            return response;
        }
    });
}

/**
 * OPTIONS /api/v1/links/bulk - Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
}
