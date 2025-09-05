import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db-utils';
import User from '@/models/User';
import UserWarning from '@/models/UserWarning';
import AdminAction from '@/models/AdminAction';
import { ApiResponse } from '@/types';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import mongoose from 'mongoose';

export interface ResolveWarningRequest {
    resolutionNotes: string;
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

// PUT /api/admin/warnings/:warningId/resolve - Resolve warning
export async function PUT(
    request: NextRequest,
    { params }: { params: { warningId: string } }
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

        const { warningId } = params;

        // Validate warningId format
        if (!mongoose.Types.ObjectId.isValid(warningId)) {
            return NextResponse.json(
                { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid warning ID format' } },
                { status: 400 }
            );
        }

        // Find the warning
        const warning = await UserWarning.findOne({
            _id: warningId,
            isDeleted: false
        });

        if (!warning) {
            return NextResponse.json(
                { success: false, error: { code: 'WARNING_NOT_FOUND', message: 'Warning not found' } },
                { status: 404 }
            );
        }

        // Check if warning is already resolved
        if (!warning.isActive) {
            return NextResponse.json(
                { success: false, error: { code: 'VALIDATION_ERROR', message: 'Warning is already resolved' } },
                { status: 400 }
            );
        }

        // Parse and validate request body
        const body: ResolveWarningRequest = await request.json();
        const { resolutionNotes } = body;

        // Validate resolution notes
        if (!resolutionNotes || resolutionNotes.trim().length === 0) {
            return NextResponse.json(
                { success: false, error: { code: 'VALIDATION_ERROR', message: 'Resolution notes are required' } },
                { status: 400 }
            );
        }

        if (resolutionNotes.length > 1000) {
            return NextResponse.json(
                { success: false, error: { code: 'VALIDATION_ERROR', message: 'Resolution notes cannot exceed 1000 characters' } },
                { status: 400 }
            );
        }

        // Resolve the warning
        const resolvedWarning = await UserWarning.findByIdAndUpdate(
            warningId,
            {
                isActive: false,
                resolvedAt: new Date(),
                resolvedBy: adminUser._id,
                resolutionNotes: resolutionNotes.trim()
            },
            { new: true }
        ).populate('authorId', 'name email')
            .populate('resolvedBy', 'name email')
            .populate('editHistory.editedBy', 'name email');

        // Record admin action
        await AdminAction.create({
            adminId: adminUser._id,
            targetType: 'user',
            targetId: resolvedWarning!.userId,
            actionType: 'resolve_warning',
            reason: 'Warning resolved by admin',
            metadata: {
                warningId: resolvedWarning!._id,
                severity: resolvedWarning!.severity,
                category: resolvedWarning!.category,
                resolutionNotes: resolutionNotes.trim()
            }
        });

        const formattedWarning: UserWarningResponse = {
            _id: resolvedWarning!._id.toString(),
            userId: resolvedWarning!.userId.toString(),
            authorId: resolvedWarning!.authorId.toString(),
            authorName: (resolvedWarning!.authorId as any)?.name || 'Unknown',
            title: resolvedWarning!.title,
            description: resolvedWarning!.description,
            severity: resolvedWarning!.severity,
            category: resolvedWarning!.category,
            isActive: resolvedWarning!.isActive,
            resolvedAt: resolvedWarning!.resolvedAt?.toISOString(),
            resolvedBy: resolvedWarning!.resolvedBy?.toString(),
            resolvedByName: (resolvedWarning!.resolvedBy as any)?.name || 'Unknown',
            resolutionNotes: resolvedWarning!.resolutionNotes,
            isDeleted: resolvedWarning!.isDeleted,
            editHistory: resolvedWarning!.editHistory.map((edit: any) => ({
                editedAt: edit.editedAt.toISOString(),
                editedBy: edit.editedBy.toString(),
                editedByName: (edit.editedBy as any)?.name || 'Unknown',
                previousData: edit.previousData
            })),
            createdAt: resolvedWarning!.createdAt.toISOString(),
            updatedAt: resolvedWarning!.updatedAt.toISOString()
        };

        const response: ApiResponse<UserWarningResponse> = {
            success: true,
            data: formattedWarning,
            timestamp: new Date().toISOString()
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error resolving warning:', error);

        const response: ApiResponse<null> = {
            success: false,
            error: {
                code: 'RESOLVE_ERROR',
                message: 'Failed to resolve warning'
            },
            timestamp: new Date().toISOString()
        };

        return NextResponse.json(response, { status: 500 });
    }
}