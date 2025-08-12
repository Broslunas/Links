import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth-simple';
import { connectDB, generateSlug, isValidUrl } from '../../../lib/db-utils';
import Link from '../../../models/Link';
import { CreateLinkData, ApiResponse } from '../../../types';

// GET /api/links - Get user's links
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json<ApiResponse>({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Authentication required',
                },
                timestamp: new Date().toISOString(),
            }, { status: 401 });
        }

        await connectDB();

        const links = await Link.find({ userId: session.user.id })
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json<ApiResponse>({
            success: true,
            data: links,
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Error fetching links:', error);
        return NextResponse.json<ApiResponse>({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to fetch links',
            },
            timestamp: new Date().toISOString(),
        }, { status: 500 });
    }
}

// POST /api/links - Create new link
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json<ApiResponse>({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Authentication required',
                },
                timestamp: new Date().toISOString(),
            }, { status: 401 });
        }

        const body: CreateLinkData = await request.json();
        const { originalUrl, slug, title, description, isPublicStats = false } = body;

        // Validate required fields
        if (!originalUrl) {
            return NextResponse.json<ApiResponse>({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Original URL is required',
                },
                timestamp: new Date().toISOString(),
            }, { status: 400 });
        }

        // Validate URL format
        if (!isValidUrl(originalUrl)) {
            return NextResponse.json<ApiResponse>({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid URL format',
                },
                timestamp: new Date().toISOString(),
            }, { status: 400 });
        }

        // Sanitize URL (ensure it has protocol)
        let sanitizedUrl = originalUrl.trim();
        if (!sanitizedUrl.startsWith('http://') && !sanitizedUrl.startsWith('https://')) {
            sanitizedUrl = 'https://' + sanitizedUrl;
        }

        // Validate sanitized URL
        if (!isValidUrl(sanitizedUrl)) {
            return NextResponse.json<ApiResponse>({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid URL format after sanitization',
                },
                timestamp: new Date().toISOString(),
            }, { status: 400 });
        }

        await connectDB();

        // Generate or validate slug
        let finalSlug = slug?.trim().toLowerCase();

        if (finalSlug) {
            // Validate custom slug format
            if (!/^[a-z0-9-_]+$/.test(finalSlug)) {
                return NextResponse.json<ApiResponse>({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Slug can only contain lowercase letters, numbers, hyphens, and underscores',
                    },
                    timestamp: new Date().toISOString(),
                }, { status: 400 });
            }

            if (finalSlug.length > 50) {
                return NextResponse.json<ApiResponse>({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Slug must be 50 characters or less',
                    },
                    timestamp: new Date().toISOString(),
                }, { status: 400 });
            }

            // Check if custom slug already exists
            const existingLink = await Link.findOne({ slug: finalSlug });
            if (existingLink) {
                return NextResponse.json<ApiResponse>({
                    success: false,
                    error: {
                        code: 'SLUG_EXISTS',
                        message: 'This slug is already taken. Please choose a different one.',
                        details: { suggestedSlugs: await generateAlternativeSlugs(finalSlug) },
                    },
                    timestamp: new Date().toISOString(),
                }, { status: 409 });
            }
        } else {
            // Generate unique slug
            finalSlug = await generateUniqueSlug();
        }

        // Create the link
        const newLink = new Link({
            userId: session.user.id,
            originalUrl: sanitizedUrl,
            slug: finalSlug,
            title: title?.trim() || undefined,
            description: description?.trim() || undefined,
            isPublicStats,
        });

        await newLink.save();

        return NextResponse.json<ApiResponse>({
            success: true,
            data: {
                id: newLink._id,
                userId: newLink.userId,
                originalUrl: newLink.originalUrl,
                slug: newLink.slug,
                title: newLink.title,
                description: newLink.description,
                isPublicStats: newLink.isPublicStats,
                isActive: newLink.isActive,
                clickCount: newLink.clickCount,
                createdAt: newLink.createdAt,
                updatedAt: newLink.updatedAt,
                shortUrl: `${process.env.NEXTAUTH_URL}/${newLink.slug}`,
            },
            timestamp: new Date().toISOString(),
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating link:', error);

        // Handle duplicate key error (slug collision)
        if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
            return NextResponse.json<ApiResponse>({
                success: false,
                error: {
                    code: 'SLUG_EXISTS',
                    message: 'This slug is already taken. Please try again.',
                },
                timestamp: new Date().toISOString(),
            }, { status: 409 });
        }

        return NextResponse.json<ApiResponse>({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to create link',
            },
            timestamp: new Date().toISOString(),
        }, { status: 500 });
    }
}

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