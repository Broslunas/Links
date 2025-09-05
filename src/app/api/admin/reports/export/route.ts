import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db-utils';
import User from '@/models/User';
import UserNote from '@/models/UserNote';
import UserWarning from '@/models/UserWarning';
import AdminAction from '@/models/AdminAction';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';

// GET - Export reports in various formats
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
        const reportType = searchParams.get('type') || 'notes'; // notes, warnings, actions
        const format = searchParams.get('format') || 'csv'; // csv, json
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');
        const severity = searchParams.get('severity'); // for warnings
        const category = searchParams.get('category');
        const isActive = searchParams.get('isActive'); // for warnings

        // Build date filter
        const dateFilter: any = {};
        if (dateFrom || dateTo) {
            dateFilter.createdAt = {};
            if (dateFrom) {
                dateFilter.createdAt.$gte = new Date(dateFrom);
            }
            if (dateTo) {
                dateFilter.createdAt.$lte = new Date(dateTo);
            }
        }

        let data: any[] = [];
        let filename = '';
        let headers: string[] = [];

        if (reportType === 'notes') {
            // Build notes filter
            const notesFilter: any = { isDeleted: false, ...dateFilter };
            if (category) {
                notesFilter.category = category;
            }

            // Get notes with user and author information
            const notes = await UserNote.find(notesFilter)
                .populate('userId', 'email name role')
                .populate('authorId', 'name email')
                .sort({ createdAt: -1 })
                .lean();

            if (format === 'csv') {
                headers = [
                    'Note ID',
                    'User Email',
                    'User Name',
                    'User Role',
                    'Category',
                    'Content',
                    'Author Name',
                    'Author Email',
                    'Created Date',
                    'Updated Date'
                ];

                data = notes.map((note: any) => [
                    note._id.toString(),
                    note.userId?.email || '',
                    note.userId?.name || '',
                    note.userId?.role || 'user',
                    note.category || '',
                    note.content,
                    note.authorId?.name || '',
                    note.authorId?.email || '',
                    new Date(note.createdAt).toISOString(),
                    new Date(note.updatedAt).toISOString()
                ]);

                filename = `notes-report-${new Date().toISOString().split('T')[0]}.csv`;
            } else {
                data = notes.map((note: any) => ({
                    _id: note._id.toString(),
                    user: {
                        email: note.userId?.email,
                        name: note.userId?.name,
                        role: note.userId?.role || 'user'
                    },
                    category: note.category,
                    content: note.content,
                    author: {
                        name: note.authorId?.name,
                        email: note.authorId?.email
                    },
                    createdAt: note.createdAt,
                    updatedAt: note.updatedAt
                }));
            }

        } else if (reportType === 'warnings') {
            // Build warnings filter
            const warningsFilter: any = { isDeleted: false, ...dateFilter };
            if (severity) {
                warningsFilter.severity = severity;
            }
            if (category) {
                warningsFilter.category = category;
            }
            if (isActive !== null && isActive !== undefined) {
                warningsFilter.isActive = isActive === 'true';
            }

            // Get warnings with user and author information
            const warnings = await UserWarning.find(warningsFilter)
                .populate('userId', 'email name role')
                .populate('authorId', 'name email')
                .sort({ createdAt: -1 })
                .lean();

            if (format === 'csv') {
                headers = [
                    'Warning ID',
                    'User Email',
                    'User Name',
                    'User Role',
                    'Severity',
                    'Category',
                    'Reason',
                    'Status',
                    'Resolution Notes',
                    'Author Name',
                    'Author Email',
                    'Created Date',
                    'Resolved Date'
                ];

                data = warnings.map((warning: any) => [
                    warning._id.toString(),
                    warning.userId?.email || '',
                    warning.userId?.name || '',
                    warning.userId?.role || 'user',
                    warning.severity,
                    warning.category || '',
                    warning.reason,
                    warning.isActive ? 'Active' : 'Resolved',
                    warning.resolutionNotes || '',
                    warning.authorId?.name || '',
                    warning.authorId?.email || '',
                    new Date(warning.createdAt).toISOString(),
                    warning.resolvedAt ? new Date(warning.resolvedAt).toISOString() : ''
                ]);

                filename = `warnings-report-${new Date().toISOString().split('T')[0]}.csv`;
            } else {
                data = warnings.map((warning: any) => ({
                    _id: warning._id.toString(),
                    user: {
                        email: warning.userId?.email,
                        name: warning.userId?.name,
                        role: warning.userId?.role || 'user'
                    },
                    severity: warning.severity,
                    category: warning.category,
                    reason: warning.reason,
                    isActive: warning.isActive,
                    resolutionNotes: warning.resolutionNotes,
                    author: {
                        name: warning.authorId?.name,
                        email: warning.authorId?.email
                    },
                    createdAt: warning.createdAt,
                    resolvedAt: warning.resolvedAt
                }));
            }

        } else if (reportType === 'actions') {
            // Build admin actions filter
            const actionsFilter: any = { ...dateFilter };
            const actionType = searchParams.get('actionType');
            const targetType = searchParams.get('targetType');

            if (actionType) {
                actionsFilter.actionType = actionType;
            }
            if (targetType) {
                actionsFilter.targetType = targetType;
            }

            // Get admin actions with admin information
            const actions = await AdminAction.find(actionsFilter)
                .populate('adminId', 'name email')
                .sort({ createdAt: -1 })
                .lean();

            if (format === 'csv') {
                headers = [
                    'Action ID',
                    'Admin Name',
                    'Admin Email',
                    'Action Type',
                    'Target Type',
                    'Target ID',
                    'Reason',
                    'Previous State',
                    'New State',
                    'Created Date'
                ];

                data = actions.map((action: any) => [
                    action._id.toString(),
                    action.adminId?.name || '',
                    action.adminId?.email || '',
                    action.actionType,
                    action.targetType,
                    action.targetId?.toString() || '',
                    action.reason || '',
                    JSON.stringify(action.previousState || {}),
                    JSON.stringify(action.newState || {}),
                    new Date(action.createdAt).toISOString()
                ]);

                filename = `admin-actions-report-${new Date().toISOString().split('T')[0]}.csv`;
            } else {
                data = actions.map((action: any) => ({
                    _id: action._id.toString(),
                    admin: {
                        name: action.adminId?.name,
                        email: action.adminId?.email
                    },
                    actionType: action.actionType,
                    targetType: action.targetType,
                    targetId: action.targetId?.toString(),
                    reason: action.reason,
                    previousState: action.previousState,
                    newState: action.newState,
                    createdAt: action.createdAt
                }));
            }

        } else {
            return NextResponse.json({
                success: false,
                error: { code: 'INVALID_REPORT_TYPE', message: 'Invalid report type' }
            }, { status: 400 });
        }

        if (format === 'csv') {
            // Generate CSV content
            const csvContent = [
                headers.join(','),
                ...data.map(row =>
                    row.map((field: any) =>
                        typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))
                            ? `"${field.replace(/"/g, '""')}"`
                            : field
                    ).join(',')
                )
            ].join('\n');

            return new NextResponse(csvContent, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="${filename}"`
                }
            });
        } else {
            // Return JSON format
            return NextResponse.json({
                success: true,
                data: {
                    reportType,
                    items: data,
                    totalItems: data.length,
                    filters: {
                        dateFrom,
                        dateTo,
                        severity,
                        category,
                        isActive
                    },
                    generatedAt: new Date().toISOString()
                }
            });
        }

    } catch (error) {
        console.error('Error exporting report:', error);
        return NextResponse.json(
            { success: false, error: { code: 'EXPORT_ERROR', message: 'Failed to export report' } },
            { status: 500 }
        );
    }
}