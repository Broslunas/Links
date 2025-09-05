import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db-utils';
import Dashboard from '../../../../models/Dashboard';
import { UpdateDashboardData } from '../../../../types/dashboard';
import { createSuccessResponse, createErrorResponse, parseRequestBody } from '../../../../lib/api-response';
import { createError, AppError, ErrorCode } from '../../../../lib/api-errors';
import { withAuth, AuthContext, verifyResourceOwnership } from '../../../../lib/auth-middleware';
import { validateUpdateDashboardData } from '../../../../lib/validations';
import mongoose from 'mongoose';

interface RouteParams {
    params: {
        id: string;
    };
}

// GET /api/dashboards/[id] - Get specific dashboard
export const GET = withAuth(async (request: NextRequest, auth: AuthContext, { params }: RouteParams) => {
    const { id } = params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError(
            ErrorCode.NOT_FOUND,
            'Invalid dashboard ID format',
            404
        );
    }

    await connectDB();

    try {
        // Use exec() instead of lean() to get a proper Mongoose document
        const dashboard = await Dashboard.findById(id).exec();

        if (!dashboard) {
            throw new AppError(
                ErrorCode.NOT_FOUND,
                'Dashboard not found',
                404
            );
        }

        // Check if user owns the dashboard or has shared access
        const hasAccess = dashboard.userId.toString() === auth.userId ||
            (dashboard.sharedWith && dashboard.sharedWith.some((share: { userId: string }) => share.userId === auth.userId));

        if (!hasAccess) {
            throw new AppError(
                ErrorCode.FORBIDDEN,
                'Access denied: You do not have permission to view this dashboard',
                403
            );
        }

        const responseData = {
            id: dashboard._id.toString(),
            userId: dashboard.userId.toString(),
            name: dashboard.name,
            description: dashboard.description,
            layout: dashboard.layout,
            widgets: dashboard.widgets,
            isDefault: dashboard.isDefault,
            isShared: dashboard.isShared,
            sharedWith: dashboard.sharedWith,
            createdAt: dashboard.createdAt,
            updatedAt: dashboard.updatedAt,
        };

        return createSuccessResponse(responseData);
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }

        console.error('[GET Dashboard Error]:', error);
        throw new AppError(
            ErrorCode.DATABASE_ERROR,
            'Failed to retrieve dashboard',
            500
        );
    }
});

// PUT /api/dashboards/[id] - Update dashboard
export const PUT = withAuth(async (request: NextRequest, auth: AuthContext, { params }: RouteParams) => {
    const { id } = params;
    const body: UpdateDashboardData = await parseRequestBody<UpdateDashboardData>(request);

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError(
            ErrorCode.NOT_FOUND,
            'Invalid dashboard ID format',
            404
        );
    }

    // Validate the request data
    const validation = validateUpdateDashboardData(body);
    if (!validation.isValid) {
        throw new AppError(
            ErrorCode.VALIDATION_ERROR,
            'Validation failed',
            400,
            { errors: validation.errors }
        );
    }

    await connectDB();

    try {
        const dashboard = await Dashboard.findById(id);

        if (!dashboard) {
            throw new AppError(
                ErrorCode.NOT_FOUND,
                'Dashboard not found',
                404
            );
        }

        // Check if user owns the dashboard or has write access
        const isOwner = dashboard.userId.toString() === auth.userId;
        const hasWriteAccess = dashboard.sharedWith.some(
            (share: { userId: string; permission: string }) => share.userId === auth.userId && share.permission === 'write'
        );

        if (!isOwner && !hasWriteAccess) {
            throw new AppError(
                ErrorCode.FORBIDDEN,
                'Access denied: You do not have permission to modify this dashboard',
                403
            );
        }

        // If setting as default, unset any existing default dashboard for the owner
        if (body.isDefault === true && isOwner) {
            await Dashboard.updateMany(
                { userId: dashboard.userId, isDefault: true, _id: { $ne: id } },
                { $set: { isDefault: false } }
            );
        }

        // Update the dashboard
        const updateData: any = {};

        if (body.name !== undefined) updateData.name = body.name.trim();
        if (body.description !== undefined) updateData.description = body.description?.trim();
        if (body.layout !== undefined) updateData.layout = { ...dashboard.layout, ...body.layout };
        if (body.widgets !== undefined) updateData.widgets = body.widgets;
        if (body.isDefault !== undefined && isOwner) updateData.isDefault = body.isDefault;
        if (body.isShared !== undefined && isOwner) updateData.isShared = body.isShared;
        if (body.sharedWith !== undefined && isOwner) updateData.sharedWith = body.sharedWith;

        const updatedDashboard = await Dashboard.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).exec();

        if (!updatedDashboard) {
            throw new AppError(
                ErrorCode.NOT_FOUND,
                'Dashboard not found after update',
                404
            );
        }

        const responseData = {
            id: updatedDashboard._id.toString(),
            userId: updatedDashboard.userId.toString(),
            name: updatedDashboard.name,
            description: updatedDashboard.description,
            layout: updatedDashboard.layout,
            widgets: updatedDashboard.widgets,
            isDefault: updatedDashboard.isDefault,
            isShared: updatedDashboard.isShared,
            sharedWith: updatedDashboard.sharedWith,
            createdAt: updatedDashboard.createdAt,
            updatedAt: updatedDashboard.updatedAt,
        };

        return createSuccessResponse(responseData);
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }

        console.error('[PUT Dashboard Error]:', error);

        if (error instanceof Error && error.message.includes('validation failed')) {
            throw new AppError(
                ErrorCode.VALIDATION_ERROR,
                'Dashboard validation failed',
                400,
                { details: error.message }
            );
        }

        throw new AppError(
            ErrorCode.DATABASE_ERROR,
            'Failed to update dashboard',
            500
        );
    }
});

// DELETE /api/dashboards/[id] - Delete dashboard
export const DELETE = withAuth(async (request: NextRequest, auth: AuthContext, { params }: RouteParams) => {
    const { id } = params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError(
            ErrorCode.NOT_FOUND,
            'Invalid dashboard ID format',
            404
        );
    }

    await connectDB();

    try {
        const dashboard = await Dashboard.findById(id);

        if (!dashboard) {
            throw new AppError(
                ErrorCode.NOT_FOUND,
                'Dashboard not found',
                404
            );
        }

        // Only the owner can delete the dashboard
        verifyResourceOwnership(auth.userId, dashboard.userId.toString());

        // Prevent deletion of default dashboard if it's the only one
        if (dashboard.isDefault) {
            const dashboardCount = await Dashboard.countDocuments({ userId: auth.userId });
            if (dashboardCount === 1) {
                throw new AppError(
                    ErrorCode.VALIDATION_ERROR,
                    'Cannot delete the only dashboard. Create another dashboard first.',
                    400
                );
            }

            // If deleting default dashboard and there are others, set another as default
            const otherDashboard = await Dashboard.findOne({
                userId: auth.userId,
                _id: { $ne: id }
            }).sort({ createdAt: 1 });

            if (otherDashboard) {
                await Dashboard.findByIdAndUpdate(otherDashboard._id, { isDefault: true });
            }
        }

        await Dashboard.findByIdAndDelete(id);

        return createSuccessResponse({ message: 'Dashboard deleted successfully' });
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }

        console.error('[DELETE Dashboard Error]:', error);
        throw new AppError(
            ErrorCode.DATABASE_ERROR,
            'Failed to delete dashboard',
            500
        );
    }
});