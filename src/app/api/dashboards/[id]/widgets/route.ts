import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/db-utils';
import Dashboard from '../../../../../models/Dashboard';
import { CreateWidgetData } from '../../../../../types/dashboard';
import { createSuccessResponse, createErrorResponse, parseRequestBody } from '../../../../../lib/api-response';
import { createError, AppError, ErrorCode } from '../../../../../lib/api-errors';
import { withAuth, AuthContext } from '../../../../../lib/auth-middleware';
import { validateCreateWidgetData } from '../../../../../lib/validations';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

interface RouteParams {
    params: {
        id: string;
    };
}

// GET /api/dashboards/[id]/widgets - Get widgets for a dashboard
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
            dashboard.sharedWith.some((share: { userId: string }) => share.userId === auth.userId);

        if (!hasAccess) {
            throw new AppError(
                ErrorCode.FORBIDDEN,
                'Access denied: You do not have permission to view this dashboard',
                403
            );
        }

        return createSuccessResponse(dashboard.widgets);
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }

        console.error('[GET Dashboard Widgets Error]:', error);
        throw new AppError(
            ErrorCode.DATABASE_ERROR,
            'Failed to retrieve dashboard widgets',
            500
        );
    }
});

// POST /api/dashboards/[id]/widgets - Add widget to dashboard
export const POST = withAuth(async (request: NextRequest, auth: AuthContext, { params }: RouteParams) => {
    const { id } = params;
    const body: CreateWidgetData = await parseRequestBody<CreateWidgetData>(request);

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError(
            ErrorCode.NOT_FOUND,
            'Invalid dashboard ID format',
            404
        );
    }

    // Validate the request data
    const validation = validateCreateWidgetData(body);
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

        // Create the new widget with a unique ID
        const newWidget = {
            id: uuidv4(),
            type: body.type,
            position: body.position,
            size: body.size,
            config: {
                showHeader: true,
                ...body.config,
            },
            filters: body.filters || [],
        };

        // Check for widget position overlaps
        const widgets = [...dashboard.widgets, newWidget];
        for (let i = 0; i < widgets.length - 1; i++) {
            const widget1 = widgets[i];
            const widget2 = newWidget;

            const w1Right = widget1.position.x + widget1.size.width;
            const w1Bottom = widget1.position.y + widget1.size.height;
            const w2Right = widget2.position.x + widget2.size.width;
            const w2Bottom = widget2.position.y + widget2.size.height;

            const overlaps = !(
                w1Right <= widget2.position.x ||
                widget1.position.x >= w2Right ||
                w1Bottom <= widget2.position.y ||
                widget1.position.y >= w2Bottom
            );

            if (overlaps) {
                throw new AppError(
                    ErrorCode.VALIDATION_ERROR,
                    `Widget overlaps with existing widget ${widget1.id}`,
                    400,
                    { conflictingWidgetId: widget1.id }
                );
            }
        }

        // Add the widget to the dashboard
        dashboard.widgets.push(newWidget);
        await dashboard.save();

        return createSuccessResponse(newWidget, 201);
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }

        console.error('[POST Dashboard Widget Error]:', error);

        if (error instanceof Error && error.message.includes('validation failed')) {
            throw new AppError(
                ErrorCode.VALIDATION_ERROR,
                'Widget validation failed',
                400,
                { details: error.message }
            );
        }

        throw new AppError(
            ErrorCode.DATABASE_ERROR,
            'Failed to add widget to dashboard',
            500
        );
    }
});