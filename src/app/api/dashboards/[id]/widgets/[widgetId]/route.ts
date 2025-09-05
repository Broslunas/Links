import { NextRequest } from 'next/server';
import { connectDB } from '../../../../../../lib/db-utils';
import Dashboard from '../../../../../../models/Dashboard';
import { UpdateWidgetData } from '../../../../../../types/dashboard';
import {
  createSuccessResponse,
  parseRequestBody,
} from '../../../../../../lib/api-response';
import { AppError, ErrorCode } from '../../../../../../lib/api-errors';
import { withAuth, AuthContext } from '../../../../../../lib/auth-middleware';
import { validateUpdateWidgetData } from '../../../../../../lib/validations';
import mongoose from 'mongoose';

interface RouteParams {
  params: {
    id: string;
    widgetId: string;
  };
}

// GET /api/dashboards/[id]/widgets/[widgetId] - Get specific widget
export const GET = withAuth(
  async (request: NextRequest, auth: AuthContext, { params }: RouteParams) => {
    const { id, widgetId } = params;

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
        throw new AppError(ErrorCode.NOT_FOUND, 'Dashboard not found', 404);
      }

      // Check if user owns the dashboard or has shared access
      const hasAccess =
        dashboard.userId.toString() === auth.userId ||
        dashboard.sharedWith.some(
          (share: { userId: string }) => share.userId === auth.userId
        );

      if (!hasAccess) {
        throw new AppError(
          ErrorCode.FORBIDDEN,
          'Access denied: You do not have permission to view this dashboard',
          403
        );
      }

      // Find the specific widget
      const widget = dashboard.widgets.find(
        (w: { id: string }) => w.id === widgetId
      );

      if (!widget) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Widget not found', 404);
      }

      return createSuccessResponse(widget);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      console.error('[GET Widget Error]:', error);
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        'Failed to retrieve widget',
        500
      );
    }
  }
);

// PUT /api/dashboards/[id]/widgets/[widgetId] - Update widget
export const PUT = withAuth(
  async (request: NextRequest, auth: AuthContext, { params }: RouteParams) => {
    const { id, widgetId } = params;
    const body: UpdateWidgetData =
      await parseRequestBody<UpdateWidgetData>(request);

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        'Invalid dashboard ID format',
        404
      );
    }

    // Validate the request data
    const validation = validateUpdateWidgetData(body);
    if (!validation.isValid) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Validation failed', 400, {
        errors: validation.errors,
      });
    }

    await connectDB();

    try {
      const dashboard = await Dashboard.findById(id);

      if (!dashboard) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Dashboard not found', 404);
      }

      // Check if user owns the dashboard or has write access
      const isOwner = dashboard.userId.toString() === auth.userId;
      const hasWriteAccess = dashboard.sharedWith.some(
        (share: { userId: string; permission: string }) =>
          share.userId === auth.userId && share.permission === 'write'
      );

      if (!isOwner && !hasWriteAccess) {
        throw new AppError(
          ErrorCode.FORBIDDEN,
          'Access denied: You do not have permission to modify this dashboard',
          403
        );
      }

      // Find the widget to update
      const widgetIndex = dashboard.widgets.findIndex(
        (w: { id: string }) => w.id === widgetId
      );

      if (widgetIndex === -1) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Widget not found', 404);
      }

      const currentWidget = dashboard.widgets[widgetIndex];

      // Create updated widget
      const updatedWidget = {
        ...currentWidget,
        ...(body.position && { position: body.position }),
        ...(body.size && { size: body.size }),
        ...(body.config && {
          config: { ...currentWidget.config, ...body.config },
        }),
        ...(body.filters !== undefined && { filters: body.filters }),
      };

      // Check for widget position overlaps if position or size changed
      if (body.position || body.size) {
        const otherWidgets = dashboard.widgets.filter(
          (_: any, index: number) => index !== widgetIndex
        );

        for (const otherWidget of otherWidgets) {
          const w1Right = updatedWidget.position.x + updatedWidget.size.width;
          const w1Bottom = updatedWidget.position.y + updatedWidget.size.height;
          const w2Right = otherWidget.position.x + otherWidget.size.width;
          const w2Bottom = otherWidget.position.y + otherWidget.size.height;

          const overlaps = !(
            w1Right <= otherWidget.position.x ||
            updatedWidget.position.x >= w2Right ||
            w1Bottom <= otherWidget.position.y ||
            updatedWidget.position.y >= w2Bottom
          );

          if (overlaps) {
            throw new AppError(
              ErrorCode.VALIDATION_ERROR,
              `Widget would overlap with existing widget ${otherWidget.id}`,
              400,
              { conflictingWidgetId: otherWidget.id }
            );
          }
        }
      }

      // Update the widget
      dashboard.widgets[widgetIndex] = updatedWidget;
      await dashboard.save();

      return createSuccessResponse(updatedWidget);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      console.error('[PUT Widget Error]:', error);

      if (
        error instanceof Error &&
        error.message.includes('validation failed')
      ) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          'Widget validation failed',
          400,
          { details: error.message }
        );
      }

      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        'Failed to update widget',
        500
      );
    }
  }
);

// DELETE /api/dashboards/[id]/widgets/[widgetId] - Delete widget
export const DELETE = withAuth(
  async (request: NextRequest, auth: AuthContext, { params }: RouteParams) => {
    const { id, widgetId } = params;

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
        throw new AppError(ErrorCode.NOT_FOUND, 'Dashboard not found', 404);
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

      // Find and remove the widget
      const widgetIndex = dashboard.widgets.findIndex((w: { id: string }) => w.id === widgetId);

      if (widgetIndex === -1) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Widget not found', 404);
      }

      dashboard.widgets.splice(widgetIndex, 1);
      await dashboard.save();

      return createSuccessResponse({ message: 'Widget deleted successfully' });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      console.error('[DELETE Widget Error]:', error);
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        'Failed to delete widget',
        500
      );
    }
  }
);
