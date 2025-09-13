import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db-utils';
import User from '@/models/User';
import UserNote from '@/models/UserNote';
import AdminAction from '@/models/AdminAction';
import { ApiResponse } from '@/types';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import mongoose from 'mongoose';

// Force Node.js runtime for Mongoose compatibility
export const runtime = 'nodejs';

export interface UpdateNoteRequest {
    content?: string;
    category?: 'behavior' | 'technical' | 'legal' | 'other';
}

export interface UserNoteResponse {
    _id: string;
    userId: string;
    authorId: string;
    authorName: string;
    content: string;
    category: 'behavior' | 'technical' | 'legal' | 'other';
    isDeleted: boolean;
    editHistory: {
        editedAt: string;
        editedBy: string;
        editedByName: string;
        previousContent: string;
    }[];
    createdAt: string;
    updatedAt: string;
}

// PUT /api/admin/notes/:noteId - Edit existing note
export async function PUT(
    request: NextRequest,
    { params }: { params: { noteId: string } }
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

        const { noteId } = params;

        // Validate noteId format
        if (!mongoose.Types.ObjectId.isValid(noteId)) {
            return NextResponse.json(
                { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid note ID format' } },
                { status: 400 }
            );
        }

        // Find the note
        const note = await UserNote.findById(noteId).populate('authorId', 'name email');
        if (!note) {
            return NextResponse.json(
                { success: false, error: { code: 'NOTE_NOT_FOUND', message: 'Note not found' } },
                { status: 404 }
            );
        }

        // Check if note is already deleted
        if (note.isDeleted) {
            return NextResponse.json(
                { success: false, error: { code: 'NOTE_DELETED', message: 'Cannot edit deleted note' } },
                { status: 400 }
            );
        }

        // Check permissions - only the author or another admin can edit
        const isAuthor = note.authorId._id.toString() === adminUser._id?.toString();
        if (!isAuthor) {
            // For now, allow any admin to edit any note
            // In the future, this could be restricted based on additional permissions
            console.log(`Admin ${adminUser.name} (${adminUser.email}) editing note by ${(note.authorId as any)?.name}`);
        }

        // Parse and validate request body
        const body: UpdateNoteRequest = await request.json();
        const { content, category } = body;

        // Validate content if provided
        if (content !== undefined) {
            if (!content || content.trim().length === 0) {
                return NextResponse.json(
                    { success: false, error: { code: 'VALIDATION_ERROR', message: 'Note content cannot be empty' } },
                    { status: 400 }
                );
            }

            if (content.length > 2000) {
                return NextResponse.json(
                    { success: false, error: { code: 'VALIDATION_ERROR', message: 'Note content cannot exceed 2000 characters' } },
                    { status: 400 }
                );
            }
        }

        // Validate category if provided
        if (category !== undefined) {
            const validCategories = ['behavior', 'technical', 'legal', 'other'];
            if (!validCategories.includes(category)) {
                return NextResponse.json(
                    { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid category' } },
                    { status: 400 }
                );
            }
        }

        // Store previous content for edit history if content is being changed
        const updateData: any = {};
        let previousContent = note.content;

        if (content !== undefined && content.trim() !== note.content) {
            updateData.content = content.trim();

            // Add to edit history
            note.editHistory.push({
                editedAt: new Date(),
                editedBy: adminUser._id,
                previousContent: note.content
            });
        }

        if (category !== undefined && category !== note.category) {
            updateData.category = category;
        }

        // If no changes, return current note
        if (Object.keys(updateData).length === 0) {
            const formattedNote: UserNoteResponse = {
                _id: note._id.toString(),
                userId: note.userId.toString(),
                authorId: note.authorId._id.toString(),
                authorName: (note.authorId as any)?.name || 'Unknown',
                content: note.content,
                category: note.category,
                isDeleted: note.isDeleted,
                editHistory: note.editHistory.map((edit: any) => ({
                    editedAt: edit.editedAt.toISOString(),
                    editedBy: edit.editedBy.toString(),
                    editedByName: 'Unknown', // Would need to populate this
                    previousContent: edit.previousContent
                })),
                createdAt: note.createdAt.toISOString(),
                updatedAt: note.updatedAt.toISOString()
            };

            return NextResponse.json({
                success: true,
                data: formattedNote,
                timestamp: new Date().toISOString()
            });
        }

        // Update the note
        const updatedNote = await UserNote.findByIdAndUpdate(
            noteId,
            {
                ...updateData,
                editHistory: note.editHistory
            },
            { new: true }
        ).populate('authorId', 'name email')
            .populate('editHistory.editedBy', 'name email');

        // Record admin action
        await AdminAction.create({
            adminId: adminUser._id,
            targetType: 'user',
            targetId: note.userId,
            actionType: 'edit_note',
            reason: `Edited note in category: ${updatedNote!.category}`,
            metadata: {
                noteId: updatedNote!._id,
                category: updatedNote!.category
            }
        });

        const formattedNote: UserNoteResponse = {
            _id: updatedNote!._id.toString(),
            userId: updatedNote!.userId.toString(),
            authorId: updatedNote!.authorId._id.toString(),
            authorName: (updatedNote!.authorId as any)?.name || 'Unknown',
            content: updatedNote!.content,
            category: updatedNote!.category,
            isDeleted: updatedNote!.isDeleted,
            editHistory: updatedNote!.editHistory.map((edit: any) => ({
                editedAt: edit.editedAt.toISOString(),
                editedBy: edit.editedBy.toString(),
                editedByName: (edit.editedBy as any)?.name || 'Unknown',
                previousContent: edit.previousContent
            })),
            createdAt: updatedNote!.createdAt.toISOString(),
            updatedAt: updatedNote!.updatedAt.toISOString()
        };

        const response: ApiResponse<UserNoteResponse> = {
            success: true,
            data: formattedNote,
            timestamp: new Date().toISOString()
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error updating user note:', error);

        const response: ApiResponse<null> = {
            success: false,
            error: {
                code: 'UPDATE_ERROR',
                message: 'Failed to update user note'
            },
            timestamp: new Date().toISOString()
        };

        return NextResponse.json(response, { status: 500 });
    }
}

// DELETE /api/admin/notes/:noteId - Soft delete note
export async function DELETE(
    request: NextRequest,
    { params }: { params: { noteId: string } }
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

        const { noteId } = params;

        // Validate noteId format
        if (!mongoose.Types.ObjectId.isValid(noteId)) {
            return NextResponse.json(
                { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid note ID format' } },
                { status: 400 }
            );
        }

        // Find the note
        const note = await UserNote.findById(noteId).populate('authorId', 'name email');
        if (!note) {
            return NextResponse.json(
                { success: false, error: { code: 'NOTE_NOT_FOUND', message: 'Note not found' } },
                { status: 404 }
            );
        }

        // Check if note is already deleted
        if (note.isDeleted) {
            return NextResponse.json(
                { success: false, error: { code: 'NOTE_ALREADY_DELETED', message: 'Note is already deleted' } },
                { status: 400 }
            );
        }

        // Check permissions - only the author or another admin can delete
        const isAuthor = note.authorId._id.toString() === adminUser._id?.toString();
        if (!isAuthor) {
            // For now, allow any admin to delete any note
            // In the future, this could be restricted based on additional permissions
            console.log(`Admin ${adminUser.name} (${adminUser.email}) deleting note by ${(note.authorId as any)?.name}`);
        }

        // Soft delete the note
        const deletedNote = await UserNote.findByIdAndUpdate(
            noteId,
            {
                isDeleted: true,
                deletedAt: new Date(),
                deletedBy: adminUser._id
            },
            { new: true }
        ).populate('authorId', 'name email')
            .populate('deletedBy', 'name email');

        // Record admin action
        await AdminAction.create({
            adminId: adminUser._id,
            targetType: 'user',
            targetId: note.userId,
            actionType: 'delete_note',
            reason: `Deleted note in category: ${note.category}`,
            metadata: {
                noteId: note._id,
                category: note.category
            }
        });

        const response: ApiResponse<{ message: string; noteId: string }> = {
            success: true,
            data: {
                message: 'Note deleted successfully',
                noteId: deletedNote!._id.toString()
            },
            timestamp: new Date().toISOString()
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error deleting user note:', error);

        const response: ApiResponse<null> = {
            success: false,
            error: {
                code: 'DELETE_ERROR',
                message: 'Failed to delete user note'
            },
            timestamp: new Date().toISOString()
        };

        return NextResponse.json(response, { status: 500 });
    }
}