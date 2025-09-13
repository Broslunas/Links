import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB, generateSlug, isValidUrl } from '../../../lib/db-utils';
import Link from '../../../models/Link';
import { CreateLinkData, ApiResponse } from '../../../types';
import { createSuccessResponse, createErrorResponse, withErrorHandler, validateRequest, validateUrl, validateSlug, parseRequestBody } from '../../../lib/api-response';
import { createError, AppError, ErrorCode } from '../../../lib/api-errors';
import { withAuth, AuthContext } from '../../../lib/auth-middleware';

// Force Node.js runtime for Mongoose compatibility
export const runtime = 'nodejs';


// GET /api/links - Get user's links
export const GET = withAuth(async (request: NextRequest, auth: AuthContext) => {
    await connectDB();

    const links = await Link.find({ userId: auth.userId })
        .sort({ createdAt: -1 })
        .lean();

    return createSuccessResponse(links);
});

// POST /api/links - Create new link
export const POST = withAuth(async (request: NextRequest, auth: AuthContext) => {
    const body: CreateLinkData = await parseRequestBody<CreateLinkData>(request);
    const { originalUrl, slug, title, description, isPublicStats = false, isTemporary = false, expiresAt } = body;

    // Validate required fields
    validateRequest(body, ['originalUrl'], ['slug', 'title', 'description', 'isPublicStats', 'isTemporary', 'expiresAt']);

    // Validate temporary link fields
    if (isTemporary) {
        if (!expiresAt) {
            throw new AppError(
                ErrorCode.VALIDATION_ERROR,
                'expiresAt is required for temporary links',
                400
            );
        }
        
        const expirationDate = new Date(expiresAt);
        const now = new Date();
        const maxExpirationDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 días
        
        if (expirationDate <= now) {
            throw new AppError(
                ErrorCode.VALIDATION_ERROR,
                'Expiration date must be in the future',
                400
            );
        }
        
        if (expirationDate > maxExpirationDate) {
            throw new AppError(
                ErrorCode.VALIDATION_ERROR,
                'Expiration date cannot be more than 30 days in the future',
                400
            );
        }
    } else if (expiresAt) {
        throw new AppError(
            ErrorCode.VALIDATION_ERROR,
            'expiresAt can only be set for temporary links',
            400
        );
    }

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
        userId: auth.userId,
        originalUrl: sanitizedUrl,
        slug: finalSlug,
        title: title?.trim() || undefined,
        description: description?.trim() || undefined,
        isPublicStats,
        isTemporary,
        expiresAt: isTemporary ? new Date(expiresAt!) : undefined,
    });

    await newLink.save();

    const responseData = {
        id: newLink._id,
        userId: newLink.userId,
        originalUrl: newLink.originalUrl,
        slug: newLink.slug,
        title: newLink.title,
        description: newLink.description,
        isPublicStats: newLink.isPublicStats,
        isActive: newLink.isActive,
        isFavorite: newLink.isFavorite,
        clickCount: newLink.clickCount,
        isTemporary: newLink.isTemporary,
        expiresAt: newLink.expiresAt?.toISOString(),
        createdAt: newLink.createdAt,
        updatedAt: newLink.updatedAt,
        shortUrl: `${process.env.NEXTAUTH_URL}/${newLink.slug}`,
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