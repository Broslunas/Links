import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db-utils';
import User from '@/models/User';
import UserWarning from '@/models/UserWarning';
import AdminAction from '@/models/AdminAction';
import { ApiResponse } from '@/types';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import mongoose from 'mongoose';

export interface UpdateWarningRequest {
    title?: string;
    description?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    category?: 'behavior' | 'technical' | 'legal' | 'spam' | 'abuse' | 'other';
}

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

// PUT /api/admin/warnings/:warningId - Update warning
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

        // Parse and validate request body
        const body: UpdateWarningRequest = await request.json();
        const { title, description, severity, category } = body;

        // Validate title if provided
        if (title !== undefined) {
            if (!title || title.trim().length === 0) {
                return NextResponse.json(
                    { success: false, error: { code: 'VALIDATION_ERROR', message: 'Warning title cannot be empty' } },
                    { status: 400 }
                );
            }

            if (title.length > 200) {
                return NextResponse.json(
                    { success: false, error: { code: 'VALIDATION_ERROR', message: 'Warning title cannot exceed 200 characters' } },
                    { status: 400 }
                );
            }
        }

        // Validate description if provided
        if (description !== undefined) {
            if (!description || description.trim().length === 0) {
                return NextResponse.json(
                    { success: false, error: { code: 'VALIDATION_ERROR', message: 'Warning description cannot be empty' } },
                    { status: 400 }
                );
            }

            if (description.length > 1000) {
                return NextResponse.json(
                    { success: false, error: { code: 'VALIDATION_ERROR', message: 'Warning description cannot exceed 1000 characters' } },
                    { status: 400 }
                );
            }
        }

        // Validate severity if provided
        if (severity !== undefined) {
            const validSeverities = ['low', 'medium', 'high', 'critical'];
            if (!validSeverities.includes(severity)) {
                return NextResponse.json(
                    { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid severity level' } },
                    { status: 400 }
                );
            }
        }

        // Validate category if provided
        if (category !== undefined) {
            const validCategories = ['behavior', 'technical', 'legal', 'spam', 'abuse', 'other'];
            if (!validCategories.includes(category)) {
                return NextResponse.json(
                    { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid category' } },
                    { status: 400 }
                );
            }
        }

        // Store previous data for edit history
        const previousData = {
            title: warning.title,
            description: warning.description,
            severity: warning.severity,
            category: warning.category
        };

        // Check if any changes are being made
        const hasChanges = (
            (title !== undefined && title.trim() !== warning.title) ||
            (description !== undefined && description.trim() !== warning.description) ||
            (severity !== undefined && severity !== warning.severity) ||
            (category !== undefined && category !== warning.category)
        );

        if (!hasChanges) {
            return NextResponse.json(
                { success: false, error: { code: 'VALIDATION_ERROR', message: 'No changes detected' } },
                { status: 400 }
            );
        }

        // Update the warning
        const updateData: any = {};
        if (title !== undefined) updateData.title = title.trim();
        if (description !== undefined) updateData.description = description.trim();
        if (severity !== undefined) updateData.severity = severity;
        if (category !== undefined) updateData.category = category;

        // Add to edit history
        updateData.$push = {
            editHistory: {
                editedAt: new Date(),
                editedBy: adminUser._id,
                previousData
            }
        };

        const updatedWarning = await UserWarning.findByIdAndUpdate(
            warningId,
            updateData,
            { new: true }
        ).populate('authorId', 'name email')
            .populate('resolvedBy', 'name email')
            .populate('editHistory.editedBy', 'name email');

        // Record admin action
        await AdminAction.create({
            adminId: adminUser._id,
            targetType: 'user',
            targetId: updatedWarning!.userId,
            actionType: 'edit_warning',
            reason: 'Updated warning details',
            metadata: {
                warningId: updatedWarning!._id,
                changedFields: Object.keys(updateData).filter(key => key !== '$push')
            }
        });

        const formattedWarning: UserWarningResponse = {
            _id: updatedWarning!._id.toString(),
            userId: updatedWarning!.userId.toString(),
            authorId: updatedWarning!.authorId.toString(),
            authorName: (updatedWarning!.authorId as any)?.name || 'Unknown',
            title: updatedWarning!.title,
            description: updatedWarning!.description,
            severity: updatedWarning!.severity,
            category: updatedWarning!.category,
            isActive: updatedWarning!.isActive,
            resolvedAt: updatedWarning!.resolvedAt?.toISOString(),
            resolvedBy: updatedWarning!.resolvedBy?.toString(),
            resolvedByName: (updatedWarning!.resolvedBy as any)?.name || undefined,
            resolutionNotes: updatedWarning!.resolutionNotes,
            isDeleted: updatedWarning!.isDeleted,
            editHistory: updatedWarning!.editHistory.map((edit: any) => ({
                editedAt: edit.editedAt.toISOString(),
                editedBy: edit.editedBy.toString(),
                editedByName: (edit.editedBy as any)?.name || 'Unknown',
                previousData: edit.previousData
            })),
            createdAt: updatedWarning!.createdAt.toISOString(),
            updatedAt: updatedWarning!.updatedAt.toISOString()
        };

        const response: ApiResponse<UserWarningResponse> = {
            success: true,
            data: formattedWarning,
            timestamp: new Date().toISOString()
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error updating warning:', error);

        const response: ApiResponse<null> = {
            success: false,
            error: {
                code: 'UPDATE_ERROR',
                message: 'Failed to update warning'
            },
            timestamp: new Date().toISOString()
        };

        return NextResponse.json(response, { status: 500 });
    }
}

// DELETE /api/admin/warnings/:warningId - Soft delete warning
export async function DELETE(
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

        // Soft delete the warning
        const deletedWarning = await UserWarning.findByIdAndUpdate(
            warningId,
            {
                isDeleted: true,
                deletedAt: new Date(),
                deletedBy: adminUser._id,
                isActive: false // Also deactivate when deleted
            },
            { new: true }
        );

        // Record admin action
        await AdminAction.create({
            adminId: adminUser._id,
            targetType: 'user',
            targetId: deletedWarning!.userId,
            actionType: 'delete_warning',
            reason: 'Warning deleted by admin',
            metadata: {
                warningId: deletedWarning!._id,
                severity: deletedWarning!.severity,
                category: deletedWarning!.category
            }
        });

        const response: ApiResponse<{ message: string }> = {
            success: true,
            data: { message: 'Warning deleted successfully' },
            timestamp: new Date().toISOString()
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error deleting warning:', error);

        const response: ApiResponse<null> = {
            success: false,
            error: {
                code: 'DELETE_ERROR',
                message: 'Failed to delete warning'
            },
            timestamp: new Date().toISOString()
        };

        return NextResponse.json(response, { status: 500 });
    }
}