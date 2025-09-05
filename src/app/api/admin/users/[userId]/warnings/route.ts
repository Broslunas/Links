import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db-utils';
import User from '@/models/User';
import UserWarning from '@/models/UserWarning';
import AdminAction from '@/models/AdminAction';
import { ApiResponse } from '@/types';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import { notificationService } from '@/lib/notification-service';
import mongoose from 'mongoose';

export interface CreateWarningRequest {
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: 'behavior' | 'technical' | 'legal' | 'spam' | 'abuse' | 'other';
}

export interface UserWarningResponse {
    _id: string;
    userId: string;
    authorId: string;
    authorName: string;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: 'behavior' | 'technical' | 'legal' | 'spam' | 'abuse' | 'other';
    isActive: boolean;
    resolvedAt?: string;
    resolvedBy?: string;
    resolvedByName?: string;
    resolutionNotes?: string;
    isDeleted: boolean;
    editHistory: {
        editedAt: string;
        editedBy: string;
        editedByName: string;
        previousData: {
            title: string;
            description: string;
            severity: string;
            category: string;
        };
    }[];
    createdAt: string;
    updatedAt: string;
}

// GET /api/admin/users/:userId/warnings - Retrieve user warnings
export async function GET(
    request: NextRequest,
    { params }: { params: { userId: string } }
) {
    try {
        // Check authentication and admin role
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
                { status: 401 }
            );
        }

        await connectDB();
        const adminUser = await User.findOne({ email: session.user.email });
        if (!adminUser || adminUser.role !== 'admin') {
            return NextResponse.json(
                { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
                { status: 403 }
            );
        }

        const { userId } = params;

        // Validate userId format
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return NextResponse.json(
                { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid user ID format' } },
                { status: 400 }
            );
        }

        // Check if target user exists
        const targetUser = await User.findById(userId);
        if (!targetUser) {
            return NextResponse.json(
                { success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } },
                { status: 404 }
            );
        }

        // Get query parameters for pagination and filtering
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const severity = searchParams.get('severity');
        const category = searchParams.get('category');
        const isActive = searchParams.get('isActive');
        const includeDeleted = searchParams.get('includeDeleted') === 'true';

        // Build query
        const query: any = { userId: new mongoose.Types.ObjectId(userId) };
        if (!includeDeleted) {
            query.isDeleted = false;
        }
        if (severity) {
            query.severity = severity;
        }
        if (category) {
            query.category = category;
        }
        if (isActive !== null && isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Get warnings with author and resolver information
        const warnings = await UserWarning.find(query)
            .populate('authorId', 'name email')
            .populate('resolvedBy', 'name email')
            .populate('editHistory.editedBy', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalWarnings = await UserWarning.countDocuments(query);
        const totalPages = Math.ceil(totalWarnings / limit);

        // Format response
        const formattedWarnings: UserWarningResponse[] = warnings.map(warning => ({
            _id: warning._id.toString(),
            userId: warning.userId.toString(),
            authorId: warning.authorId.toString(),
            authorName: (warning.authorId as any)?.name || 'Unknown',
            title: warning.title,
            description: warning.description,
            severity: warning.severity,
            category: warning.category,
            isActive: warning.isActive,
            resolvedAt: warning.resolvedAt?.toISOString(),
            resolvedBy: warning.resolvedBy?.toString(),
            resolvedByName: (warning.resolvedBy as any)?.name || undefined,
            resolutionNotes: warning.resolutionNotes,
            isDeleted: warning.isDeleted,
            editHistory: warning.editHistory.map((edit: any) => ({
                editedAt: edit.editedAt.toISOString(),
                editedBy: edit.editedBy.toString(),
                editedByName: (edit.editedBy as any)?.name || 'Unknown',
                previousData: edit.previousData
            })),
            createdAt: warning.createdAt.toISOString(),
            updatedAt: warning.updatedAt.toISOString()
        }));

        const response: ApiResponse<{
            warnings: UserWarningResponse[];
            totalWarnings: number;
            totalPages: number;
            currentPage: number;
        }> = {
            success: true,
            data: {
                warnings: formattedWarnings,
                totalWarnings,
                totalPages,
                currentPage: page
            },
            timestamp: new Date().toISOString()
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error fetching user warnings:', error);

        const response: ApiResponse<null> = {
            success: false,
            error: {
                code: 'FETCH_ERROR',
                message: 'Failed to fetch user warnings'
            },
            timestamp: new Date().toISOString()
        };

        return NextResponse.json(response, { status: 500 });
    }
}

// POST /api/admin/users/:userId/warnings - Create new warning
export async function POST(
    request: NextRequest,
    { params }: { params: { userId: string } }
) {
    try {
        // Check authentication and admin role
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
                { status: 401 }
            );
        }

        await connectDB();
        const adminUser = await User.findOne({ email: session.user.email });
        if (!adminUser || adminUser.role !== 'admin') {
            return NextResponse.json(
                { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
                { status: 403 }
            );
        }

        const { userId } = params;

        // Validate userId format
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return NextResponse.json(
                { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid user ID format' } },
                { status: 400 }
            );
        }

        // Check if target user exists
        const targetUser = await User.findById(userId);
        if (!targetUser) {
            return NextResponse.json(
                { success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } },
                { status: 404 }
            );
        }

        // Parse and validate request body
        const body: CreateWarningRequest = await request.json();
        const { title, description, severity, category } = body;

        // Validate title
        if (!title || title.trim().length === 0) {
            return NextResponse.json(
                { success: false, error: { code: 'VALIDATION_ERROR', message: 'Warning title is required' } },
                { status: 400 }
            );
        }

        if (title.length > 200) {
            return NextResponse.json(
                { success: false, error: { code: 'VALIDATION_ERROR', message: 'Warning title cannot exceed 200 characters' } },
                { status: 400 }
            );
        }

        // Validate description
        if (!description || description.trim().length === 0) {
            return NextResponse.json(
                { success: false, error: { code: 'VALIDATION_ERROR', message: 'Warning description is required' } },
                { status: 400 }
            );
        }

        if (description.length > 1000) {
            return NextResponse.json(
                { success: false, error: { code: 'VALIDATION_ERROR', message: 'Warning description cannot exceed 1000 characters' } },
                { status: 400 }
            );
        }

        // Validate severity
        const validSeverities = ['low', 'medium', 'high', 'critical'];
        if (!severity || !validSeverities.includes(severity)) {
            return NextResponse.json(
                { success: false, error: { code: 'VALIDATION_ERROR', message: 'Valid severity level is required' } },
                { status: 400 }
            );
        }

        // Validate category
        const validCategories = ['behavior', 'technical', 'legal', 'spam', 'abuse', 'other'];
        if (!category || !validCategories.includes(category)) {
            return NextResponse.json(
                { success: false, error: { code: 'VALIDATION_ERROR', message: 'Valid category is required' } },
                { status: 400 }
            );
        }

        // Create the warning
        const newWarning = await UserWarning.create({
            userId: new mongoose.Types.ObjectId(userId),
            authorId: adminUser._id,
            title: title.trim(),
            description: description.trim(),
            severity,
            category,
            isActive: true,
            isDeleted: false,
            editHistory: []
        });

        // Record admin action
        await AdminAction.create({
            adminId: adminUser._id,
            targetType: 'user',
            targetId: new mongoose.Types.ObjectId(userId),
            actionType: 'add_warning',
            reason: `Added ${severity} warning in category: ${category}`,
            metadata: {
                warningId: newWarning._id,
                severity,
                category
            }
        });

        // Trigger notification system for critical warnings
        await notificationService.onWarningCreated(newWarning);

        // Populate author information for response
        await newWarning.populate('authorId', 'name email');

        const formattedWarning: UserWarningResponse = {
            _id: newWarning._id.toString(),
            userId: newWarning.userId.toString(),
            authorId: newWarning.authorId.toString(),
            authorName: (newWarning.authorId as any)?.name || 'Unknown',
            title: newWarning.title,
            description: newWarning.description,
            severity: newWarning.severity,
            category: newWarning.category,
            isActive: newWarning.isActive,
            resolvedAt: newWarning.resolvedAt?.toISOString(),
            resolvedBy: newWarning.resolvedBy?.toString(),
            resolvedByName: undefined,
            resolutionNotes: newWarning.resolutionNotes,
            isDeleted: newWarning.isDeleted,
            editHistory: [],
            createdAt: newWarning.createdAt.toISOString(),
            updatedAt: newWarning.updatedAt.toISOString()
        };

        const response: ApiResponse<UserWarningResponse> = {
            success: true,
            data: formattedWarning,
            timestamp: new Date().toISOString()
        };

        return NextResponse.json(response, { status: 201 });
    } catch (error) {
        console.error('Error creating user warning:', error);

        const response: ApiResponse<null> = {
            success: false,
            error: {
                code: 'CREATE_ERROR',
                message: 'Failed to create user warning'
            },
            timestamp: new Date().toISOString()
        };

        return NextResponse.json(response, { status: 500 });
    }
}