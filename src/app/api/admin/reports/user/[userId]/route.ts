import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db-utils';
import User from '@/models/User';
import UserNote from '@/models/UserNote';
import UserWarning from '@/models/UserWarning';
import AdminAction from '@/models/AdminAction';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import mongoose from 'mongoose';

// Force Node.js runtime for Mongoose compatibility
export const runtime = 'nodejs';


// GET - Generate comprehensive user report
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
        const { searchParams } = new URL(request.url);
        const format = searchParams.get('format') || 'json';
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');

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

        // Get user information
        const user = await User.findById(userId).lean() as any;
        if (!user) {
            return NextResponse.json(
                { success: false, error: { code: 'NOT_FOUND', message: 'User not found' } },
                { status: 404 }
            );
        }

        // Get user's links and analytics
        const userLinks = await User.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(userId) } },
            {
                $lookup: {
                    from: 'links',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'links'
                }
            },
            {
                $lookup: {
                    from: 'analyticsevents',
                    let: { userId: '$_id' },
                    pipeline: [
                        {
                            $lookup: {
                                from: 'links',
                                localField: 'linkId',
                                foreignField: '_id',
                                as: 'linkData'
                            }
                        },
                        {
                            $match: {
                                $expr: {
                                    $eq: [{ $arrayElemAt: ['$linkData.userId', 0] }, '$$userId']
                                }
                            }
                        }
                    ],
                    as: 'clicks'
                }
            },
            {
                $project: {
                    links: 1,
                    totalClicks: { $size: '$clicks' },
                    clicksByDate: {
                        $map: {
                            input: '$clicks',
                            as: 'click',
                            in: {
                                date: { $dateToString: { format: '%Y-%m-%d', date: '$$click.createdAt' } },
                                timestamp: '$$click.createdAt'
                            }
                        }
                    }
                }
            }
        ]);

        const userActivity = userLinks[0] || { links: [], totalClicks: 0, clicksByDate: [] };

        // Get all notes for this user
        const notes = await UserNote.find({
            userId,
            isDeleted: false,
            ...dateFilter
        })
            .populate('authorId', 'name email')
            .sort({ createdAt: -1 })
            .lean();

        // Get all warnings for this user
        const warnings = await UserWarning.find({
            userId,
            isDeleted: false,
            ...dateFilter
        })
            .populate('authorId', 'name email')
            .sort({ createdAt: -1 })
            .lean();

        // Get all admin actions related to this user
        const adminActions = await AdminAction.find({
            targetType: 'user',
            targetId: userId,
            ...dateFilter
        })
            .populate('adminId', 'name email')
            .sort({ createdAt: -1 })
            .lean();

        // Calculate risk metrics
        const activeWarnings = warnings.filter(w => w.isActive);
        const riskScore = activeWarnings.reduce((score, warning) => {
            const severityMultiplier = {
                low: 1,
                medium: 3,
                high: 7,
                critical: 15
            };
            return score + (severityMultiplier[warning.severity as keyof typeof severityMultiplier] || 1);
        }, 0) + (notes.length * 0.5);

        // Generate activity timeline
        const timeline = [
            ...notes.map(note => ({
                type: 'note',
                date: note.createdAt,
                data: note
            })),
            ...warnings.map(warning => ({
                type: 'warning',
                date: warning.createdAt,
                data: warning
            })),
            ...adminActions.map(action => ({
                type: 'admin_action',
                date: action.createdAt,
                data: action
            }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Prepare comprehensive report data
        const reportData = {
            user: {
                _id: userId,
                email: user.email,
                name: user.name,
                role: user.role || 'user',
                isActive: user.isActive ?? true,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin
            },
            activity: {
                linksCount: userActivity.links.length,
                totalClicks: userActivity.totalClicks,
                links: userActivity.links.map((link: any) => ({
                    _id: link._id.toString(),
                    originalUrl: link.originalUrl,
                    shortCode: link.shortCode,
                    title: link.title,
                    createdAt: link.createdAt,
                    isActive: link.isActive ?? true
                }))
            },
            notes: {
                total: notes.length,
                byCategory: notes.reduce((acc: any, note) => {
                    const category = note.category || 'uncategorized';
                    acc[category] = (acc[category] || 0) + 1;
                    return acc;
                }, {}),
                items: notes.map((note: any) => ({
                    _id: note._id.toString(),
                    content: note.content,
                    category: note.category,
                    createdAt: note.createdAt,
                    author: note.authorId ? {
                        name: note.authorId.name,
                        email: note.authorId.email
                    } : null
                }))
            },
            warnings: {
                total: warnings.length,
                active: activeWarnings.length,
                resolved: warnings.length - activeWarnings.length,
                bySeverity: warnings.reduce((acc: any, warning) => {
                    acc[warning.severity] = (acc[warning.severity] || 0) + 1;
                    return acc;
                }, {}),
                items: warnings.map((warning: any) => ({
                    _id: warning._id.toString(),
                    reason: warning.reason,
                    severity: warning.severity,
                    category: warning.category,
                    isActive: warning.isActive,
                    resolvedAt: warning.resolvedAt,
                    resolutionNotes: warning.resolutionNotes,
                    createdAt: warning.createdAt,
                    author: warning.authorId ? {
                        name: warning.authorId.name,
                        email: warning.authorId.email
                    } : null
                }))
            },
            adminActions: {
                total: adminActions.length,
                byType: adminActions.reduce((acc: any, action) => {
                    acc[action.actionType] = (acc[action.actionType] || 0) + 1;
                    return acc;
                }, {}),
                items: adminActions.map((action: any) => ({
                    _id: action._id.toString(),
                    actionType: action.actionType,
                    reason: action.reason,
                    previousState: action.previousState,
                    newState: action.newState,
                    createdAt: action.createdAt,
                    admin: action.adminId ? {
                        name: action.adminId.name,
                        email: action.adminId.email
                    } : null
                }))
            },
            riskAssessment: {
                score: riskScore,
                level: riskScore >= 15 ? 'critical' : riskScore >= 7 ? 'high' : riskScore >= 3 ? 'medium' : 'low',
                factors: {
                    activeWarnings: activeWarnings.length,
                    criticalWarnings: activeWarnings.filter(w => w.severity === 'critical').length,
                    totalNotes: notes.length,
                    recentActivity: timeline.filter(item =>
                        new Date(item.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                    ).length
                }
            },
            timeline: timeline.slice(0, 50), // Limit to last 50 events
            summary: {
                accountAge: Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
                lastActivity: user.lastLogin ? Math.floor((Date.now() - new Date(user.lastLogin).getTime()) / (1000 * 60 * 60 * 24)) : null,
                totalInteractions: notes.length + warnings.length + adminActions.length
            },
            generatedAt: new Date().toISOString(),
            dateRange: {
                from: dateFrom,
                to: dateTo
            }
        };

        if (format === 'pdf') {
            // For PDF format, return structured data that can be used by a PDF generator
            return NextResponse.json({
                success: true,
                data: {
                    ...reportData,
                    format: 'pdf',
                    title: `User Report - ${user.name || user.email}`,
                    subtitle: `Generated on ${new Date().toLocaleDateString()}`
                }
            });
        } else if (format === 'csv') {
            // Generate CSV format for user report
            const csvData = [
                ['User Report'],
                ['Generated:', new Date().toISOString()],
                [''],
                ['User Information'],
                ['Email', user.email],
                ['Name', user.name || ''],
                ['Role', user.role || 'user'],
                ['Status', user.isActive ? 'Active' : 'Inactive'],
                ['Registration Date', user.createdAt.toISOString()],
                ['Last Login', user.lastLogin?.toISOString() || 'Never'],
                [''],
                ['Activity Summary'],
                ['Links Created', userActivity.links.length],
                ['Total Clicks', userActivity.totalClicks],
                ['Notes Count', notes.length],
                ['Warnings Count', warnings.length],
                ['Active Warnings', activeWarnings.length],
                ['Risk Score', riskScore],
                ['Risk Level', riskScore >= 15 ? 'Critical' : riskScore >= 7 ? 'High' : riskScore >= 3 ? 'Medium' : 'Low'],
                [''],
                ['Recent Notes'],
                ['Date', 'Category', 'Content', 'Author'],
                ...notes.slice(0, 10).map(note => [
                    new Date(note.createdAt).toLocaleDateString(),
                    note.category || '',
                    note.content.substring(0, 100) + (note.content.length > 100 ? '...' : ''),
                    note.authorId?.name || ''
                ]),
                [''],
                ['Recent Warnings'],
                ['Date', 'Severity', 'Category', 'Reason', 'Status', 'Author'],
                ...warnings.slice(0, 10).map(warning => [
                    new Date(warning.createdAt).toLocaleDateString(),
                    warning.severity,
                    warning.category || '',
                    warning.reason.substring(0, 100) + (warning.reason.length > 100 ? '...' : ''),
                    warning.isActive ? 'Active' : 'Resolved',
                    warning.authorId?.name || ''
                ])
            ];

            const csvContent = csvData.map(row =>
                row.map(field =>
                    typeof field === 'string' && field.includes(',')
                        ? `"${field.replace(/"/g, '""')}"`
                        : field
                ).join(',')
            ).join('\n');

            return new NextResponse(csvContent, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="user-report-${user.email}-${new Date().toISOString().split('T')[0]}.csv"`
                }
            });
        }

        // Default JSON format
        return NextResponse.json({
            success: true,
            data: reportData
        });

    } catch (error) {
        console.error('Error generating user report:', error);
        return NextResponse.json(
            { success: false, error: { code: 'REPORT_ERROR', message: 'Failed to generate user report' } },
            { status: 500 }
        );
    }
}