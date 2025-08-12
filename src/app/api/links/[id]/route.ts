import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth-simple';
import { connectDB, isValidUrl } from '../../../../lib/db-utils';
import Link from '../../../../models/Link';
import { UpdateLinkData, ApiResponse } from '../../../../types';
import mongoose from 'mongoose';

// GET /api/links/[id] - Get specific link
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(params.id)) {
            return NextResponse.json<ApiResponse>({
                success: false,
                error: {
                    code: 'INVALID_ID',
                    message: 'Invalid link ID format',
                },
                timestamp: new Date().toISOString(),
            }, { status: 400 });
        }

        await connectDB();

        const link = await Link.findOne({
            _id: params.id,
            userId: session.user.id
        }).lean();

        if (!link) {
            return NextResponse.json<ApiResponse>({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Link not found',
                },
                timestamp: new Date().toISOString(),
            }, { status: 404 });
        }

        return NextResponse.json<ApiResponse>({
            success: true,
            data: {
                ...link,
                id: (link as any)._id.toString(),
                shortUrl: `${process.env.NEXTAUTH_URL}/${(link as any).slug}`,
            },
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Error fetching link:', error);
        return NextResponse.json<ApiResponse>({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to fetch link',
            },
            timestamp: new Date().toISOString(),
        }, { status: 500 });
    }
}

// PUT /api/links/[id] - Update link
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(params.id)) {
            return NextResponse.json<ApiResponse>({
                success: false,
                error: {
                    code: 'INVALID_ID',
                    message: 'Invalid link ID format',
                },
                timestamp: new Date().toISOString(),
            }, { status: 400 });
        }

        const body: UpdateLinkData = await request.json();
        const { originalUrl, slug, title, description, isPublicStats, isActive } = body;

        await connectDB();

        // Check if link exists and belongs to user
        const existingLink = await Link.findOne({
            _id: params.id,
            userId: session.user.id
        });

        if (!existingLink) {
            return NextResponse.json<ApiResponse>({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Link not found',
                },
                timestamp: new Date().toISOString(),
            }, { status: 404 });
        }

        // Prepare update data
        const updateData: Partial<UpdateLinkData> = {};

        // Validate and update URL if provided
        if (originalUrl !== undefined) {
            if (!originalUrl.trim()) {
                return NextResponse.json<ApiResponse>({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Original URL cannot be empty',
                    },
                    timestamp: new Date().toISOString(),
                }, { status: 400 });
            }

            let sanitizedUrl = originalUrl.trim();
            if (!sanitizedUrl.startsWith('http://') && !sanitizedUrl.startsWith('https://')) {
                sanitizedUrl = 'https://' + sanitizedUrl;
            }

            if (!isValidUrl(sanitizedUrl)) {
                return NextResponse.json<ApiResponse>({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid URL format',
                    },
                    timestamp: new Date().toISOString(),
                }, { status: 400 });
            }

            updateData.originalUrl = sanitizedUrl;
        }

        // Validate and update slug if provided
        if (slug !== undefined) {
            const trimmedSlug = slug.trim().toLowerCase();

            if (trimmedSlug && trimmedSlug !== existingLink.slug) {
                // Validate slug format
                if (!/^[a-z0-9-_]+$/.test(trimmedSlug)) {
                    return NextResponse.json<ApiResponse>({
                        success: false,
                        error: {
                            code: 'VALIDATION_ERROR',
                            message: 'Slug can only contain lowercase letters, numbers, hyphens, and underscores',
                        },
                        timestamp: new Date().toISOString(),
                    }, { status: 400 });
                }

                if (trimmedSlug.length > 50) {
                    return NextResponse.json<ApiResponse>({
                        success: false,
                        error: {
                            code: 'VALIDATION_ERROR',
                            message: 'Slug must be 50 characters or less',
                        },
                        timestamp: new Date().toISOString(),
                    }, { status: 400 });
                }

                // Check if new slug already exists
                const slugExists = await Link.findOne({
                    slug: trimmedSlug,
                    _id: { $ne: params.id }
                });

                if (slugExists) {
                    return NextResponse.json<ApiResponse>({
                        success: false,
                        error: {
                            code: 'SLUG_EXISTS',
                            message: 'This slug is already taken. Please choose a different one.',
                        },
                        timestamp: new Date().toISOString(),
                    }, { status: 409 });
                }

                updateData.slug = trimmedSlug;
            }
        }

        // Update other fields
        if (title !== undefined) {
            updateData.title = title.trim() || undefined;
        }
        if (description !== undefined) {
            updateData.description = description.trim() || undefined;
        }
        if (isPublicStats !== undefined) {
            updateData.isPublicStats = isPublicStats;
        }
        if (isActive !== undefined) {
            updateData.isActive = isActive;
        }

        // Update the link
        const updatedLink = await Link.findByIdAndUpdate(
            params.id,
            updateData,
            { new: true, runValidators: true }
        ).lean();

        return NextResponse.json<ApiResponse>({
            success: true,
            data: {
                ...updatedLink,
                id: (updatedLink as any)!._id.toString(),
                shortUrl: `${process.env.NEXTAUTH_URL}/${(updatedLink as any)!.slug}`,
            },
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Error updating link:', error);

        // Handle duplicate key error (slug collision)
        if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
            return NextResponse.json<ApiResponse>({
                success: false,
                error: {
                    code: 'SLUG_EXISTS',
                    message: 'This slug is already taken. Please choose a different one.',
                },
                timestamp: new Date().toISOString(),
            }, { status: 409 });
        }

        return NextResponse.json<ApiResponse>({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to update link',
            },
            timestamp: new Date().toISOString(),
        }, { status: 500 });
    }
}

// DELETE /api/links/[id] - Delete link
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(params.id)) {
            return NextResponse.json<ApiResponse>({
                success: false,
                error: {
                    code: 'INVALID_ID',
                    message: 'Invalid link ID format',
                },
                timestamp: new Date().toISOString(),
            }, { status: 400 });
        }

        await connectDB();

        // Find and delete the link (only if it belongs to the user)
        const deletedLink = await Link.findOneAndDelete({
            _id: params.id,
            userId: session.user.id
        });

        if (!deletedLink) {
            return NextResponse.json<ApiResponse>({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Link not found',
                },
                timestamp: new Date().toISOString(),
            }, { status: 404 });
        }

        // TODO: In a future task, we should also delete associated analytics data
        // This would be handled in task 8 when we implement analytics

        return NextResponse.json<ApiResponse>({
            success: true,
            data: {
                message: 'Link deleted successfully',
                deletedId: params.id,
            },
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Error deleting link:', error);
        return NextResponse.json<ApiResponse>({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to delete link',
            },
            timestamp: new Date().toISOString(),
        }, { status: 500 });
    }
}