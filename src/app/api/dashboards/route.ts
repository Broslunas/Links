import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db-utils';
import Dashboard from '../../../models/Dashboard';
import { CreateDashboardData, UpdateDashboardData } from '../../../types/dashboard';
import { createSuccessResponse, createErrorResponse, parseRequestBody } from '../../../lib/api-response';
import { createError, AppError, ErrorCode } from '../../../lib/api-errors';
import { withAuth, AuthContext, verifyResourceOwnership } from '../../../lib/auth-middleware';
import { validateCreateDashboardData, validateUpdateDashboardData } from '../../../lib/validations';
import mongoose from 'mongoose';

// GET /api/dashboards - Get user's dashboards
export const GET = withAuth(async (request: NextRequest, auth: AuthContext) => {
    await connectDB();

    try {
        const dashboards = await Dashboard.find({ userId: auth.userId })
            .sort({ createdAt: -1 })
            .exec();

        // Transform the response to match the expected format
        const transformedDashboards = dashboards.map(dashboard => ({
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
        }));

        return createSuccessResponse(transformedDashboards);
    } catch (error) {
        console.error('[GET Dashboards Error]:', error);
        throw new AppError(
            ErrorCode.DATABASE_ERROR,
            'Failed to retrieve dashboards',
            500
        );
    }
});

// POST /api/dashboards - Create new dashboard
export const POST = withAuth(async (request: NextRequest, auth: AuthContext) => {
    const body: CreateDashboardData = await parseRequestBody<CreateDashboardData>(request);

    // Validate the request data
    const validation = validateCreateDashboardData(body);
    if (!validation.isValid) {
        throw new AppError(
            ErrorCode.VALIDATION_ERROR,
            'Validation failed',
            400,
            { errors: validation.errors }
        );
    }

    const { name, description, layout, isDefault = false } = body;

    await connectDB();

    try {
        // If this is set as default, unset any existing default dashboard
        if (isDefault) {
            await Dashboard.updateMany(
                { userId: auth.userId, isDefault: true },
                { $set: { isDefault: false } }
            );
        }

        // Create the dashboard
        const newDashboard = new Dashboard({
            userId: new mongoose.Types.ObjectId(auth.userId),
            name: name.trim(),
            description: description?.trim(),
            layout: layout || {
                columns: 12,
                rows: 20,
                gap: 16,
                responsive: true,
            },
            widgets: [],
            isDefault,
            isShared: false,
            sharedWith: [],
        });

        await newDashboard.save();

        const responseData = {
            id: newDashboard._id.toString(),
            userId: newDashboard.userId.toString(),
            name: newDashboard.name,
            description: newDashboard.description,
            layout: newDashboard.layout,
            widgets: newDashboard.widgets,
            isDefault: newDashboard.isDefault,
            isShared: newDashboard.isShared,
            sharedWith: newDashboard.sharedWith,
            createdAt: newDashboard.createdAt,
            updatedAt: newDashboard.updatedAt,
        };

        return createSuccessResponse(responseData, 201);
    } catch (error) {
        console.error('[POST Dashboard Error]:', error);

        if (error instanceof Error && error.message.includes('duplicate key')) {
            throw new AppError(
                ErrorCode.RESOURCE_EXISTS,
                'A default dashboard already exists for this user',
                409
            );
        }

        throw new AppError(
            ErrorCode.DATABASE_ERROR,
            'Failed to create dashboard',
            500
        );
    }
});