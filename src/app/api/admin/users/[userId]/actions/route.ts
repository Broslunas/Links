import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db-utils';
import AdminAction from '@/models/AdminAction';
import User from '@/models/User';
import { ApiResponse } from '@/types';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import { AdminActionResponse, ActionsListResponse } from '../../../actions/route';

// GET - Obtener historial de acciones administrativas para un usuario específico
export async function GET(
    request: NextRequest,
    { params }: { params: { userId: string } }
) {
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

        const { userId } = params;

        // Validate userId
        if (!userId) {
            return NextResponse.json(
                { success: false, error: { code: 'VALIDATION_ERROR', message: 'User ID is required' } },
                { status: 400 }
            );
        }

        // Check if target user exists
        const targetUser = await User.findById(userId);
        if (!targetUser) {
            return NextResponse.json(
                { success: false, error: { code: 'NOT_FOUND', message: 'User not found' } },
                { status: 404 }
            );
        }

        // Get query parameters
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const actionType = searchParams.get('actionType') || '';
        const adminId = searchParams.get('adminId') || '';
        const sortBy = searchParams.get('sortBy') || 'createdAt';
        const sortOrder = searchParams.get('sortOrder') || 'desc';

        // Date range filters
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // Build query - filter by targetId (userId) and targetType 'user'
        const query: any = {
            targetId: userId,
            targetType: 'user'
        };

        if (actionType) {
            query.actionType = actionType;
        }
        if (adminId) {
            query.adminId = adminId;
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

        // Get actions with admin information
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
                    adminInfo: { $arrayElemAt: ['$adminInfo', 0] }
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
            targetName: targetUser.name,
            targetEmail: targetUser.email,
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
        console.error('Error fetching user admin actions:', error);

        const response: ApiResponse<null> = {
            success: false,
            error: {
                code: 'FETCH_ERROR',
                message: 'Failed to fetch user admin actions'
            },
            timestamp: new Date().toISOString()
        };

        return NextResponse.json(response, { status: 500 });
    }
}