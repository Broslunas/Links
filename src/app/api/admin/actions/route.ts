import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db-utils';
import AdminAction from '@/models/AdminAction';
import User from '@/models/User';
import { ApiResponse } from '@/types';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';

export interface AdminActionResponse {
    _id: string;
    adminId: string;
    adminName?: string;
    adminEmail?: string;
    targetType: 'user' | 'link';
    targetId: string;
    targetName?: string;
    targetEmail?: string;
    actionType: string;
    reason?: string;
    duration?: number;
    previousState?: any;
    newState?: any;
    metadata?: {
        warningId?: string;
        noteId?: string;
        previousRole?: string;
        newRole?: string;
        severity?: string;
        category?: string;
    };
    createdAt: string;
}

export interface ActionsListResponse {
    actions: AdminActionResponse[];
    totalActions: number;
    totalPages: number;
    currentPage: number;
}

// GET - Obtener historial de acciones administrativas con filtros
export async function GET(request: NextRequest) {
    try {
        // Check if user is authenticated and is admin
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
                { status: 401 }
            );
        }

        // Check if user has admin role
        await connectDB();
        const adminUser = await User.findOne({ email: session.user.email });
        if (!adminUser || adminUser.role !== 'admin') {
            return NextResponse.json(
                { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
                { status: 403 }
            );
        }

        // Get query parameters
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const actionType = searchParams.get('actionType') || '';
        const targetType = searchParams.get('targetType') || '';
        const adminId = searchParams.get('adminId') || '';
        const targetId = searchParams.get('targetId') || '';
        const sortBy = searchParams.get('sortBy') || 'createdAt';
        const sortOrder = searchParams.get('sortOrder') || 'desc';

        // Date range filters
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // Build query
        const query: any = {};
        if (actionType) {
            query.actionType = actionType;
        }
        if (targetType) {
            query.targetType = targetType;
        }
        if (adminId) {
            query.adminId = adminId;
        }
        if (targetId) {
            query.targetId = targetId;
        }

        // Date range filter
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                query.createdAt.$lte = new Date(endDate);
            }
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Get total count
        const totalActions = await AdminAction.countDocuments(query);
        const totalPages = Math.ceil(totalActions / limit);

        // Get actions with admin and target user information
        const actions = await AdminAction.aggregate([
            { $match: query },
            {
                $lookup: {
                    from: 'users',
                    localField: 'adminId',
                    foreignField: '_id',
                    as: 'adminInfo'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'targetId',
                    foreignField: '_id',
                    as: 'targetUserInfo'
                }
            },
            {
                $lookup: {
                    from: 'links',
                    localField: 'targetId',
                    foreignField: '_id',
                    as: 'targetLinkInfo'
                }
            },
            {
                $project: {
                    _id: 1,
                    adminId: 1,
                    targetType: 1,
                    targetId: 1,
                    actionType: 1,
                    reason: 1,
                    duration: 1,
                    previousState: 1,
                    newState: 1,
                    metadata: 1,
                    createdAt: 1,
                    adminInfo: { $arrayElemAt: ['$adminInfo', 0] },
                    targetUserInfo: { $arrayElemAt: ['$targetUserInfo', 0] },
                    targetLinkInfo: { $arrayElemAt: ['$targetLinkInfo', 0] }
                }
            },
            { $sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 } },
            { $skip: skip },
            { $limit: limit }
        ]);

        // Format response
        const formattedActions: AdminActionResponse[] = actions.map(action => ({
            _id: action._id.toString(),
            adminId: action.adminId.toString(),
            adminName: action.adminInfo?.name,
            adminEmail: action.adminInfo?.email,
            targetType: action.targetType,
            targetId: action.targetId.toString(),
            targetName: action.targetType === 'user' ? action.targetUserInfo?.name : action.targetLinkInfo?.title,
            targetEmail: action.targetType === 'user' ? action.targetUserInfo?.email : undefined,
            actionType: action.actionType,
            reason: action.reason,
            duration: action.duration,
            previousState: action.previousState,
            newState: action.newState,
            metadata: action.metadata ? {
                warningId: action.metadata.warningId?.toString(),
                noteId: action.metadata.noteId?.toString(),
                previousRole: action.metadata.previousRole,
                newRole: action.metadata.newRole,
                severity: action.metadata.severity,
                category: action.metadata.category
            } : undefined,
            createdAt: action.createdAt.toISOString()
        }));

        const response: ApiResponse<ActionsListResponse> = {
            success: true,
            data: {
                actions: formattedActions,
                totalActions,
                totalPages,
                currentPage: page
            },
            timestamp: new Date().toISOString()
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error fetching admin actions:', error);

        const response: ApiResponse<null> = {
            success: false,
            error: {
                code: 'FETCH_ERROR',
                message: 'Failed to fetch admin actions'
            },
            timestamp: new Date().toISOString()
        };

        return NextResponse.json(response, { status: 500 });
    }
}

// POST - Registrar nueva acción administrativa
export async function POST(request: NextRequest) {
    try {
        // Check if user is authenticated and is admin
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
                { status: 401 }
            );
        }

        // Check if user has admin role
        await connectDB();
        const adminUser = await User.findOne({ email: session.user.email });
        if (!adminUser || adminUser.role !== 'admin') {
            return NextResponse.json(
                { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
                { status: 403 }
            );
        }

        const body = await request.json();
        const {
            targetType,
            targetId,
            actionType,
            reason,
            duration,
            previousState,
            newState,
            metadata
        } = body;

        // Validate required fields
        if (!targetType || !targetId || !actionType) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'targetType, targetId, and actionType are required'
                    }
                },
                { status: 400 }
            );
        }

        // Validate targetType
        if (!['user', 'link'].includes(targetType)) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'targetType must be either "user" or "link"'
                    }
                },
                { status: 400 }
            );
        }

        // Create admin action
        const adminAction = new AdminAction({
            adminId: adminUser._id,
            targetType,
            targetId,
            actionType,
            reason,
            duration,
            previousState,
            newState,
            metadata
        });

        await adminAction.save();

        // Get the created action with populated admin info
        const populatedAction = await AdminAction.aggregate([
            { $match: { _id: adminAction._id } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'adminId',
                    foreignField: '_id',
                    as: 'adminInfo'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'targetId',
                    foreignField: '_id',
                    as: 'targetUserInfo'
                }
            },
            {
                $lookup: {
                    from: 'links',
                    localField: 'targetId',
                    foreignField: '_id',
                    as: 'targetLinkInfo'
                }
            },
            {
                $project: {
                    _id: 1,
                    adminId: 1,
                    targetType: 1,
                    targetId: 1,
                    actionType: 1,
                    reason: 1,
                    duration: 1,
                    previousState: 1,
                    newState: 1,
                    metadata: 1,
                    createdAt: 1,
                    adminInfo: { $arrayElemAt: ['$adminInfo', 0] },
                    targetUserInfo: { $arrayElemAt: ['$targetUserInfo', 0] },
                    targetLinkInfo: { $arrayElemAt: ['$targetLinkInfo', 0] }
                }
            }
        ]);

        const action = populatedAction[0];
        const formattedAction: AdminActionResponse = {
            _id: action._id.toString(),
            adminId: action.adminId.toString(),
            adminName: action.adminInfo?.name,
            adminEmail: action.adminInfo?.email,
            targetType: action.targetType,
            targetId: action.targetId.toString(),
            targetName: action.targetType === 'user' ? action.targetUserInfo?.name : action.targetLinkInfo?.title,
            targetEmail: action.targetType === 'user' ? action.targetUserInfo?.email : undefined,
            actionType: action.actionType,
            reason: action.reason,
            duration: action.duration,
            previousState: action.previousState,
            newState: action.newState,
            metadata: action.metadata ? {
                warningId: action.metadata.warningId?.toString(),
                noteId: action.metadata.noteId?.toString(),
                previousRole: action.metadata.previousRole,
                newRole: action.metadata.newRole,
                severity: action.metadata.severity,
                category: action.metadata.category
            } : undefined,
            createdAt: action.createdAt.toISOString()
        };

        const response: ApiResponse<AdminActionResponse> = {
            success: true,
            data: formattedAction,
            timestamp: new Date().toISOString()
        };

        return NextResponse.json(response, { status: 201 });
    } catch (error) {
        console.error('Error creating admin action:', error);

        const response: ApiResponse<null> = {
            success: false,
            error: {
                code: 'CREATE_ERROR',
                message: 'Failed to create admin action'
            },
            timestamp: new Date().toISOString()
        };

        return NextResponse.json(response, { status: 500 });
    }
}