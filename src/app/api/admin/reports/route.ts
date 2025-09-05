import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db-utils';
import User from '@/models/User';
import UserNote from '@/models/UserNote';
import UserWarning from '@/models/UserWarning';
import AdminAction from '@/models/AdminAction';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';

// GET - Generate admin activity dashboard and statistics
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

        // Get query parameters for date filtering
        const { searchParams } = new URL(request.url);
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');
        const reportType = searchParams.get('type') || 'dashboard';

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

        if (reportType === 'dashboard') {
            // Generate dashboard statistics
            const [
                totalUsers,
                activeUsers,
                adminUsers,
                totalNotes,
                totalWarnings,
                activeWarnings,
                criticalWarnings,
                totalAdminActions,
                recentActions
            ] = await Promise.all([
                // Total users
                User.countDocuments(),

                // Active users
                User.countDocuments({ isActive: { $ne: false } }),

                // Admin users
                User.countDocuments({ role: 'admin' }),

                // Total notes
                UserNote.countDocuments({ isDeleted: false, ...dateFilter }),

                // Total warnings
                UserWarning.countDocuments({ isDeleted: false, ...dateFilter }),

                // Active warnings
                UserWarning.countDocuments({ isDeleted: false, isActive: true, ...dateFilter }),

                // Critical warnings
                UserWarning.countDocuments({
                    isDeleted: false,
                    isActive: true,
                    severity: 'critical',
                    ...dateFilter
                }),

                // Total admin actions
                AdminAction.countDocuments(dateFilter),

                // Recent admin actions (last 10)
                AdminAction.find(dateFilter)
                    .populate('adminId', 'name email')
                    .sort({ createdAt: -1 })
                    .limit(10)
                    .lean()
            ]);

            // Get warning severity distribution
            const warningSeverityStats = await UserWarning.aggregate([
                {
                    $match: {
                        isDeleted: false,
                        isActive: true,
                        ...(dateFrom || dateTo ? dateFilter : {})
                    }
                },
                {
                    $group: {
                        _id: '$severity',
                        count: { $sum: 1 }
                    }
                }
            ]);

            // Get admin activity stats
            const adminActivityStats = await AdminAction.aggregate([
                { $match: dateFilter },
                {
                    $group: {
                        _id: {
                            adminId: '$adminId',
                            actionType: '$actionType'
                        },
                        count: { $sum: 1 }
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id.adminId',
                        foreignField: '_id',
                        as: 'admin'
                    }
                },
                {
                    $project: {
                        adminId: '$_id.adminId',
                        actionType: '$_id.actionType',
                        count: 1,
                        adminName: { $arrayElemAt: ['$admin.name', 0] },
                        adminEmail: { $arrayElemAt: ['$admin.email', 0] }
                    }
                }
            ]);

            // Get notes category distribution
            const notesCategoryStats = await UserNote.aggregate([
                {
                    $match: {
                        isDeleted: false,
                        ...(dateFrom || dateTo ? dateFilter : {})
                    }
                },
                {
                    $group: {
                        _id: '$category',
                        count: { $sum: 1 }
                    }
                }
            ]);

            // Get daily activity trends (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const dailyTrends = await AdminAction.aggregate([
                {
                    $match: {
                        createdAt: { $gte: thirtyDaysAgo }
                    }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: '%Y-%m-%d',
                                date: '$createdAt'
                            }
                        },
                        actions: { $sum: 1 },
                        uniqueAdmins: { $addToSet: '$adminId' }
                    }
                },
                {
                    $project: {
                        date: '$_id',
                        actions: 1,
                        uniqueAdmins: { $size: '$uniqueAdmins' }
                    }
                },
                { $sort: { date: 1 } }
            ]);

            return NextResponse.json({
                success: true,
                data: {
                    overview: {
                        totalUsers,
                        activeUsers,
                        inactiveUsers: totalUsers - activeUsers,
                        adminUsers,
                        totalNotes,
                        totalWarnings,
                        activeWarnings,
                        resolvedWarnings: totalWarnings - activeWarnings,
                        criticalWarnings,
                        totalAdminActions
                    },
                    warningSeverityDistribution: warningSeverityStats.reduce((acc, item) => {
                        acc[item._id] = item.count;
                        return acc;
                    }, {}),
                    notesCategoryDistribution: notesCategoryStats.reduce((acc, item) => {
                        acc[item._id || 'uncategorized'] = item.count;
                        return acc;
                    }, {}),
                    adminActivity: adminActivityStats,
                    recentActions: recentActions.map(action => ({
                        _id: action._id,
                        actionType: action.actionType,
                        targetType: action.targetType,
                        reason: action.reason,
                        createdAt: action.createdAt,
                        admin: action.adminId ? {
                            name: action.adminId.name,
                            email: action.adminId.email
                        } : null
                    })),
                    dailyTrends,
                    dateRange: {
                        from: dateFrom,
                        to: dateTo
                    }
                },
                timestamp: new Date().toISOString()
            });
        }

        return NextResponse.json({
            success: false,
            error: { code: 'INVALID_REPORT_TYPE', message: 'Invalid report type' }
        }, { status: 400 });

    } catch (error) {
        console.error('Error generating reports:', error);
        return NextResponse.json(
            { success: false, error: { code: 'REPORT_ERROR', message: 'Failed to generate reports' } },
            { status: 500 }
        );
    }
}