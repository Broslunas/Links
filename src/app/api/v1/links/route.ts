import { NextRequest } from 'next/server';
import { connectDB } from '../../../../lib/db-utils';
import Link from '../../../../models/Link';
import { withApiV1Middleware, createApiSuccessResponse, createApiErrorResponse } from '../../../../lib/api-v1-middleware';
import { authenticateRequest, AuthContext } from '../../../../lib/auth-middleware';
import { AppError, ErrorCode } from '../../../../lib/api-errors';
import { LinkV1Response, GetLinksV1Params, CreateLinkV1Request } from '../../../../types/api-v1';
import { generateSlug, isValidUrl } from '../../../../lib/db-utils';
import mongoose from 'mongoose';

/**
 * GET /api/v1/links - Get user's links with pagination and filters
 */
export async function GET(request: NextRequest) {
    return withApiV1Middleware(request, async (request, context) => {
        try {
            // Authenticate the request
            const auth: AuthContext = await authenticateRequest(request);

            await connectDB();

            // Parse query parameters
            const url = new URL(request.url);
            const params = parseQueryParams(url.searchParams);

            // Validate parameters
            validateQueryParams(params);

            // Build MongoDB query
            const query = buildMongoQuery(auth.userId, params);

            // Build sort options
            const sortOptions = buildSortOptions(params);

            // Calculate pagination
            const skip = (params.page - 1) * params.limit;

            // Execute queries in parallel
            const [links, totalCount] = await Promise.all([
                Link.find(query)
                    .sort(sortOptions)
                    .skip(skip)
                    .limit(params.limit)
                    .lean(),
                Link.countDocuments(query)
            ]);

            // Transform links to API response format
            const transformedLinks: LinkV1Response[] = links.map(transformLinkToV1Response);

            // Calculate pagination metadata
            const totalPages = Math.ceil(totalCount / params.limit);
            const pagination = {
                page: params.page,
                limit: params.limit,
                total: totalCount,
                totalPages
            };

            return createApiSuccessResponse(
                transformedLinks,
                200,
                pagination,
                context.requestId
            );

        } catch (error) {
            if (error instanceof AppError) {
                return createApiErrorResponse(
                    error.code,
                    error.message,
                    error.statusCode,
                    error.details,
                    context.requestId
                );
            }

            console.error('[API v1 Links GET Error]:', error);
            return createApiErrorResponse(
                ErrorCode.INTERNAL_ERROR,
                'An internal server error occurred',
                500,
                undefined,
                context.requestId
            );
        }
    });
}

/**
 * Parse and validate query parameters
 */
function parseQueryParams(searchParams: URLSearchParams): GetLinksV1Params & { page: number; limit: number; sortBy: 'createdAt' | 'clickCount' | 'title'; sortOrder: 'asc' | 'desc' } {
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const search = searchParams.get('search') || undefined;
    const sortBy = (searchParams.get('sortBy') as 'createdAt' | 'clickCount' | 'title') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';

    return {
        page,
        limit,
        search,
        sortBy,
        sortOrder
    };
}

/**
 * Validate query parameters
 */
function validateQueryParams(params: GetLinksV1Params & { page: number; limit: number; sortBy: 'createdAt' | 'clickCount' | 'title'; sortOrder: 'asc' | 'desc' }): void {
    // Validate sortBy
    const validSortFields = ['createdAt', 'clickCount', 'title'];
    if (!validSortFields.includes(params.sortBy)) {
        throw new AppError(
            ErrorCode.VALIDATION_ERROR,
            `Invalid sortBy parameter. Must be one of: ${validSortFields.join(', ')}`,
            400,
            { parameter: 'sortBy', validValues: validSortFields }
        );
    }

    // Validate sortOrder
    const validSortOrders = ['asc', 'desc'];
    if (!validSortOrders.includes(params.sortOrder)) {
        throw new AppError(
            ErrorCode.VALIDATION_ERROR,
            `Invalid sortOrder parameter. Must be one of: ${validSortOrders.join(', ')}`,
            400,
            { parameter: 'sortOrder', validValues: validSortOrders }
        );
    }

    // Validate search length
    if (params.search && params.search.length > 100) {
        throw new AppError(
            ErrorCode.VALIDATION_ERROR,
            'Search parameter cannot exceed 100 characters',
            400,
            { parameter: 'search', maxLength: 100 }
        );
    }
}

/**
 * Build MongoDB query based on parameters
 */
function buildMongoQuery(userId: string, params: GetLinksV1Params): any {
    const query: any = {
        userId: new mongoose.Types.ObjectId(userId)
    };

    // Add search filter if provided
    if (params.search) {
        const searchRegex = new RegExp(params.search, 'i');
        query.$or = [
            { title: searchRegex },
            { description: searchRegex },
            { slug: searchRegex },
            { originalUrl: searchRegex }
        ];
    }

    return query;
}

/**
 * Build sort options for MongoDB query
 */
function buildSortOptions(params: GetLinksV1Params & { sortBy: 'createdAt' | 'clickCount' | 'title'; sortOrder: 'asc' | 'desc' }): any {
    const sortDirection = params.sortOrder === 'asc' ? 1 : -1;

    switch (params.sortBy) {
        case 'clickCount':
            return { clickCount: sortDirection, createdAt: -1 };
        case 'title':
            return { title: sortDirection, createdAt: -1 };
        case 'createdAt':
        default:
            return { createdAt: sortDirection };
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

/**
 * POST /api/v1/links - Create a new link
 */
export async function POST(request: NextRequest) {
    return withApiV1Middleware(request, async (request, context) => {
        try {
            // Authenticate the request
            const auth: AuthContext = await authenticateRequest(request);

            await connectDB();

            // Parse request body
            const body: CreateLinkV1Request = await request.json();

            // Validate required fields
            validateCreateLinkRequest(body);

            // Sanitize and validate URL
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

            // Handle slug generation or validation
            let finalSlug = body.slug?.trim().toLowerCase();

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

            // Create the link
            const newLink = new Link({
                userId: new mongoose.Types.ObjectId(auth.userId),
                originalUrl: sanitizedUrl,
                slug: finalSlug,
                title: body.title?.trim() || undefined,
                description: body.description?.trim() || undefined,
                isPublicStats: body.isPublicStats || false,
            });

            await newLink.save();

            // Transform to API response format
            const responseData = transformLinkToV1Response(newLink.toObject());

            return createApiSuccessResponse(
                responseData,
                201,
                undefined,
                context.requestId
            );

        } catch (error) {
            if (error instanceof AppError) {
                return createApiErrorResponse(
                    error.code,
                    error.message,
                    error.statusCode,
                    error.details,
                    context.requestId
                );
            }

            console.error('[API v1 Links POST Error]:', error);
            return createApiErrorResponse(
                ErrorCode.INTERNAL_ERROR,
                'An internal server error occurred',
                500,
                undefined,
                context.requestId
            );
        }
    });
}

/**
 * Validate create link request body
 */
function validateCreateLinkRequest(body: CreateLinkV1Request): void {
    if (!body.originalUrl || typeof body.originalUrl !== 'string') {
        throw new AppError(
            ErrorCode.VALIDATION_ERROR,
            'originalUrl is required and must be a string',
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

    if (body.slug && typeof body.slug !== 'string') {
        throw new AppError(
            ErrorCode.VALIDATION_ERROR,
            'slug must be a string',
            400,
            { field: 'slug' }
        );
    }

    if (body.title && typeof body.title !== 'string') {
        throw new AppError(
            ErrorCode.VALIDATION_ERROR,
            'title must be a string',
            400,
            { field: 'title' }
        );
    }

    if (body.title && body.title.length > 200) {
        throw new AppError(
            ErrorCode.VALIDATION_ERROR,
            'title cannot exceed 200 characters',
            400,
            { field: 'title', maxLength: 200 }
        );
    }

    if (body.description && typeof body.description !== 'string') {
        throw new AppError(
            ErrorCode.VALIDATION_ERROR,
            'description must be a string',
            400,
            { field: 'description' }
        );
    }

    if (body.description && body.description.length > 500) {
        throw new AppError(
            ErrorCode.VALIDATION_ERROR,
            'description cannot exceed 500 characters',
            400,
            { field: 'description', maxLength: 500 }
        );
    }

    if (body.isPublicStats !== undefined && typeof body.isPublicStats !== 'boolean') {
        throw new AppError(
            ErrorCode.VALIDATION_ERROR,
            'isPublicStats must be a boolean',
            400,
            { field: 'isPublicStats' }
        );
    }
}

/**
 * Validate slug format
 */
function validateSlugFormat(slug: string): void {
    if (slug.length < 1 || slug.length > 50) {
        throw new AppError(
            ErrorCode.INVALID_SLUG,
            'Slug must be between 1 and 50 characters',
            400,
            { slug, minLength: 1, maxLength: 50 }
        );
    }

    if (!/^[a-z0-9-_]+$/.test(slug)) {
        throw new AppError(
            ErrorCode.INVALID_SLUG,
            'Slug can only contain lowercase letters, numbers, hyphens, and underscores',
            400,
            { slug }
        );
    }
}

/**
 * Generate unique slug with collision detection
 */
async function generateUniqueSlug(maxAttempts: number = 10): Promise<string> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const slug = generateSlug(6 + attempt); // Increase length with each attempt
        const existingLink = await Link.findOne({ slug });

        if (!existingLink) {
            return slug;
        }
    }

    // If we still haven't found a unique slug, use timestamp
    const timestamp = Date.now().toString(36);
    return generateSlug(4) + timestamp.slice(-4);
}

/**
 * Generate alternative slug suggestions
 */
async function generateAlternativeSlugs(baseSlug: string): Promise<string[]> {
    const suggestions: string[] = [];

    // Try with numbers
    for (let i = 1; i <= 5; i++) {
        const suggestion = `${baseSlug}${i}`;
        const exists = await Link.findOne({ slug: suggestion });
        if (!exists) {
            suggestions.push(suggestion);
        }
    }

    // Try with random suffixes
    for (let i = 0; i < 3; i++) {
        const suffix = generateSlug(3);
        const suggestion = `${baseSlug}-${suffix}`;
        const exists = await Link.findOne({ slug: suggestion });
        if (!exists) {
            suggestions.push(suggestion);
        }
    }

    return suggestions.slice(0, 3); // Return max 3 suggestions
}