import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db-utils';
import User from '@/models/User';
import UserNote from '@/models/UserNote';
import AdminAction from '@/models/AdminAction';
import { ApiResponse } from '@/types';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import mongoose from 'mongoose';

export interface CreateNoteRequest {
    content: string;
    category: 'behavior' | 'technical' | 'legal' | 'other';
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

// GET /api/admin/users/:userId/notes - Retrieve user notes
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
        const category = searchParams.get('category');
        const includeDeleted = searchParams.get('includeDeleted') === 'true';

        // Build query
        const query: any = { userId: new mongoose.Types.ObjectId(userId) };
        if (!includeDeleted) {
            query.isDeleted = false;
        }
        if (category) {
            query.category = category;
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Get notes with author information
        const notes = await UserNote.find(query)
            .populate('authorId', 'name email')
            .populate('editHistory.editedBy', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalNotes = await UserNote.countDocuments(query);
        const totalPages = Math.ceil(totalNotes / limit);

        // Format response
        const formattedNotes: UserNoteResponse[] = notes.map(note => ({
            _id: note._id.toString(),
            userId: note.userId.toString(),
            authorId: note.authorId.toString(),
            authorName: (note.authorId as any)?.name || 'Unknown',
            content: note.content,
            category: note.category,
            isDeleted: note.isDeleted,
            editHistory: note.editHistory.map((edit: any) => ({
                editedAt: edit.editedAt.toISOString(),
                editedBy: edit.editedBy.toString(),
                editedByName: (edit.editedBy as any)?.name || 'Unknown',
                previousContent: edit.previousContent
            })),
            createdAt: note.createdAt.toISOString(),
            updatedAt: note.updatedAt.toISOString()
        }));

        const response: ApiResponse<{
            notes: UserNoteResponse[];
            totalNotes: number;
            totalPages: number;
            currentPage: number;
        }> = {
            success: true,
            data: {
                notes: formattedNotes,
                totalNotes,
                totalPages,
                currentPage: page
            },
            timestamp: new Date().toISOString()
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error fetching user notes:', error);

        const response: ApiResponse<null> = {
            success: false,
            error: {
                code: 'FETCH_ERROR',
                message: 'Failed to fetch user notes'
            },
            timestamp: new Date().toISOString()
        };

        return NextResponse.json(response, { status: 500 });
    }
}

// POST /api/admin/users/:userId/notes - Add new note
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
        const body: CreateNoteRequest = await request.json();
        const { content, category } = body;

        if (!content || content.trim().length === 0) {
            return NextResponse.json(
                { success: false, error: { code: 'VALIDATION_ERROR', message: 'Note content is required' } },
                { status: 400 }
            );
        }

        if (content.length > 2000) {
            return NextResponse.json(
                { success: false, error: { code: 'VALIDATION_ERROR', message: 'Note content cannot exceed 2000 characters' } },
                { status: 400 }
            );
        }

        const validCategories = ['behavior', 'technical', 'legal', 'other'];
        if (!category || !validCategories.includes(category)) {
            return NextResponse.json(
                { success: false, error: { code: 'VALIDATION_ERROR', message: 'Valid category is required' } },
                { status: 400 }
            );
        }

        // Create the note
        const newNote = await UserNote.create({
            userId: new mongoose.Types.ObjectId(userId),
            authorId: adminUser._id,
            content: content.trim(),
            category,
            isDeleted: false,
            editHistory: []
        });

        // Record admin action
        await AdminAction.create({
            adminId: adminUser._id,
            targetType: 'user',
            targetId: new mongoose.Types.ObjectId(userId),
            actionType: 'add_note',
            reason: `Added note in category: ${category}`,
            metadata: {
                noteId: newNote._id
            }
        });

        // Populate author information for response
        await newNote.populate('authorId', 'name email');

        const formattedNote: UserNoteResponse = {
            _id: newNote._id.toString(),
            userId: newNote.userId.toString(),
            authorId: newNote.authorId.toString(),
            authorName: (newNote.authorId as any)?.name || 'Unknown',
            content: newNote.content,
            category: newNote.category,
            isDeleted: newNote.isDeleted,
            editHistory: [],
            createdAt: newNote.createdAt.toISOString(),
            updatedAt: newNote.updatedAt.toISOString()
        };

        const response: ApiResponse<UserNoteResponse> = {
            success: true,
            data: formattedNote,
            timestamp: new Date().toISOString()
        };

        return NextResponse.json(response, { status: 201 });
    } catch (error) {
        console.error('Error creating user note:', error);

        const response: ApiResponse<null> = {
            success: false,
            error: {
                code: 'CREATE_ERROR',
                message: 'Failed to create user note'
            },
            timestamp: new Date().toISOString()
        };

        return NextResponse.json(response, { status: 500 });
    }
}