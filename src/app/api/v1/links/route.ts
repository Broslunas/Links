import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB, generateSlug } from '../../../../lib/db-utils';
import Link from '../../../../models/Link';
import { CreateLinkData } from '../../../../types';
import { createSuccessResponse, createErrorResponse, withErrorHandler, validateRequest, validateUrl, validateSlug, parseRequestBody } from '../../../../lib/api-response';
import { createError, AppError, ErrorCode } from '../../../../lib/api-errors';
import { validateApiToken } from '../../../../lib/api-token';
import { applyRateLimit } from '../../../../lib/rate-limit';

// GET /api/v1/links - Get user's links via API token
export const GET = withErrorHandler(async (request: NextRequest) => {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request, 'api-get-links', 100, 3600); // 100 requests per hour
    if (!rateLimitResult.success) {
        throw createError.rateLimitExceeded();
    }

    // Extract and validate API token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw createError.unauthorized('Missing or invalid Authorization header');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const user = await validateApiToken(token);

    if (!user) {
        throw createError.unauthorized('Invalid API token');
    }

    await connectDB();

    // Parse query parameters for pagination
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50')));
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await Link.countDocuments({ userId: user._id });
    const totalPages = Math.ceil(total / limit);

    // Get links with pagination
    const links = await Link.find({ userId: user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    // Format response data
    const formattedLinks = links.map(link => ({
        id: link._id,
        originalUrl: link.originalUrl,
        slug: link.slug,
        shortUrl: `${process.env.NEXTAUTH_URL}/${link.slug}`,
        title: link.title,
        description: link.description,
        isPublicStats: link.isPublicStats,
        isActive: link.isActive,
        clickCount: link.clickCount,
        createdAt: link.createdAt,
        updatedAt: link.updatedAt,
    }));

    const responseData = {
        links: formattedLinks,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        },
    };

    return createSuccessResponse(responseData);
});

// POST /api/v1/links - Create new link via API token
export const POST = withErrorHandler(async (request: NextRequest) => {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request, 'api-create-link', 50, 3600); // 50 requests per hour
    if (!rateLimitResult.success) {
        throw createError.rateLimitExceeded();
    }

    // Extract and validate API token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw createError.unauthorized('Missing or invalid Authorization header');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const user = await validateApiToken(token);

    if (!user) {
        throw createError.unauthorized('Invalid API token');
    }

    const body: CreateLinkData = await parseRequestBody<CreateLinkData>(request);
    const { originalUrl, slug, title, description, isPublicStats = false } = body;

    // Validate required fields
    validateRequest(body, ['originalUrl'], ['slug', 'title', 'description', 'isPublicStats']);

    // Validate and sanitize URL
    let sanitizedUrl = originalUrl.trim();
    if (!sanitizedUrl.startsWith('http://') && !sanitizedUrl.startsWith('https://')) {
        sanitizedUrl = 'https://' + sanitizedUrl;
    }
    validateUrl(sanitizedUrl);

    await connectDB();

    // Generate or validate slug
    let finalSlug = slug?.trim().toLowerCase();

    if (finalSlug) {
        validateSlug(finalSlug);

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
        userId: user._id,
        originalUrl: sanitizedUrl,
        slug: finalSlug,
        title: title?.trim() || undefined,
        description: description?.trim() || undefined,
        isPublicStats,
    });

    await newLink.save();

    const responseData = {
        id: newLink._id,
        originalUrl: newLink.originalUrl,
        slug: newLink.slug,
        shortUrl: `${process.env.NEXTAUTH_URL}/${newLink.slug}`,
        title: newLink.title,
        description: newLink.description,
        isPublicStats: newLink.isPublicStats,
        isActive: newLink.isActive,
        clickCount: newLink.clickCount,
        createdAt: newLink.createdAt,
        updatedAt: newLink.updatedAt,
    };

    return createSuccessResponse(responseData, 201);
});

// Helper function to generate unique slug with collision detection
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

// Helper function to generate alternative slug suggestions
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