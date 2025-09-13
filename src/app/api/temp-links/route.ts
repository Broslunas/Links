import { NextRequest, NextResponse } from 'next/server';
import * as crypto from 'crypto';
import mongoose from 'mongoose';
import { connectDB, generateSlug } from '../../../lib/db-utils';
import TempLink from '../../../models/TempLink';
import Link from '../../../models/Link';
import { CreateTempLinkData, CreateTempLinkResponse } from '../../../types';
import {
    createSuccessResponse,
    createErrorResponse,
    withErrorHandler,
    validateRequest,
    validateUrl,
    validateSlug,
    parseRequestBody,
    getClientIP
} from '../../../lib/api-response';
import { createError, AppError, ErrorCode } from '../../../lib/api-errors';
import { checkTempLinkRateLimit } from '../../../lib/rate-limiter';

// Force Node.js runtime for Mongoose compatibility
export const runtime = 'nodejs';


// POST /api/temp-links - Create temporary link without authentication
export const POST = withErrorHandler(async (request: NextRequest) => {
    const clientIP = getClientIP(request);

    // Check rate limit
    const rateLimitResult = await checkTempLinkRateLimit(clientIP);

    if (!rateLimitResult.allowed) {
        const resetTime = new Date(rateLimitResult.resetTime);
        throw new AppError(
            ErrorCode.RATE_LIMIT_EXCEEDED,
            `Rate limit exceeded. You can create ${5} temporary links per hour. Try again at ${resetTime.toLocaleTimeString()}`,
            429,
            {
                limit: 5,
                window: '1 hour',
                remaining: rateLimitResult.remaining,
                resetTime: resetTime.toISOString()
            }
        );
    }

    const body: CreateTempLinkData = await parseRequestBody<CreateTempLinkData>(request);
    const { originalUrl, slug, title, description } = body;

    // Validate required fields
    validateRequest(body, ['originalUrl'], ['slug', 'title', 'description']);

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

        // Check if custom slug already exists in both regular links and temp links
        const [existingLink, existingTempLink] = await Promise.all([
            Link.findOne({ slug: finalSlug }),
            TempLink.findOne({ slug: finalSlug, expiresAt: { $gt: new Date() } })
        ]);

        if (existingLink || existingTempLink) {
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

    // Generate unique token for the temporary link
    const token = crypto.randomBytes(32).toString('hex');

    // Set expiration to 24 hours from now
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Create the temporary link
    const newTempLink = new TempLink({
        originalUrl: sanitizedUrl,
        slug: finalSlug,
        token,
        title: title?.trim() || undefined,
        description: description?.trim() || undefined,
        expiresAt,
    });

    await newTempLink.save();

    const responseData: CreateTempLinkResponse = {
        id: newTempLink._id.toString(),
        originalUrl: newTempLink.originalUrl,
        slug: newTempLink.slug,
        token: newTempLink.token,
        title: newTempLink.title,
        description: newTempLink.description,
        clickCount: newTempLink.clickCount,
        expiresAt: newTempLink.expiresAt,
        createdAt: newTempLink.createdAt,
        updatedAt: newTempLink.updatedAt,
        shortUrl: `${process.env.NEXTAUTH_URL}/${newTempLink.slug}`,
    };

    // Add rate limit headers to response
    const response = createSuccessResponse(responseData, 201);
    response.headers.set('X-RateLimit-Limit', '5');
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());

    return response;
});

// Helper function to generate unique slug with collision detection
async function generateUniqueSlug(maxAttempts: number = 10): Promise<string> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const slug = generateSlug(6 + attempt); // Increase length with each attempt

        // Check both regular links and temp links
        const [existingLink, existingTempLink] = await Promise.all([
            Link.findOne({ slug }),
            TempLink.findOne({ slug, expiresAt: { $gt: new Date() } })
        ]);

        if (!existingLink && !existingTempLink) {
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
        const [existsInLinks, existsInTempLinks] = await Promise.all([
            Link.findOne({ slug: suggestion }),
            TempLink.findOne({ slug: suggestion, expiresAt: { $gt: new Date() } })
        ]);

        if (!existsInLinks && !existsInTempLinks) {
            suggestions.push(suggestion);
        }
    }

    // Try with random suffixes
    for (let i = 0; i < 3; i++) {
        const suffix = generateSlug(3);
        const suggestion = `${baseSlug}-${suffix}`;
        const [existsInLinks, existsInTempLinks] = await Promise.all([
            Link.findOne({ slug: suggestion }),
            TempLink.findOne({ slug: suggestion, expiresAt: { $gt: new Date() } })
        ]);

        if (!existsInLinks && !existsInTempLinks) {
            suggestions.push(suggestion);
        }
    }

    return suggestions.slice(0, 3); // Return max 3 suggestions
}