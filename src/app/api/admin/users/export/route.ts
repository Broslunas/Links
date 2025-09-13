import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db-utils';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';

// Force Node.js runtime for Mongoose compatibility
export const runtime = 'nodejs';


// GET - Export filtered users list
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

        // Get query parameters (same as main users endpoint)
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const role = searchParams.get('role') || '';
        const format = searchParams.get('format') || 'csv'; // csv or json

        // Enhanced filtering parameters
        const searchInNotes = searchParams.get('searchInNotes') === 'true';
        const searchInWarnings = searchParams.get('searchInWarnings') === 'true';
        const registrationDateFrom = searchParams.get('registrationDateFrom');
        const registrationDateTo = searchParams.get('registrationDateTo');
        const lastActivityFrom = searchParams.get('lastActivityFrom');
        const lastActivityTo = searchParams.get('lastActivityTo');
        const minRiskScore = searchParams.get('minRiskScore');
        const maxRiskScore = searchParams.get('maxRiskScore');
        const warningCountMin = searchParams.get('warningCountMin');
        const warningCountMax = searchParams.get('warningCountMax');
        const hasNotes = searchParams.get('hasNotes') === 'true';
        const hasWarnings = searchParams.get('hasWarnings') === 'true';
        const warningSeverity = searchParams.get('warningSeverity');

        // Build base query (same logic as main endpoint)
        const query: any = {};

        if (search) {
            const searchConditions = [
                { email: { $regex: search, $options: 'i' } },
                { name: { $regex: search, $options: 'i' } }
            ];
            query.$or = searchConditions;
        }

        if (role) {
            query.role = role;
        }

        // Date range filters
        if (registrationDateFrom || registrationDateTo) {
            query.createdAt = {};
            if (registrationDateFrom) {
                query.createdAt.$gte = new Date(registrationDateFrom);
            }
            if (registrationDateTo) {
                query.createdAt.$lte = new Date(registrationDateTo);
            }
        }

        if (lastActivityFrom || lastActivityTo) {
            query.lastLogin = {};
            if (lastActivityFrom) {
                query.lastLogin.$gte = new Date(lastActivityFrom);
            }
            if (lastActivityTo) {
                query.lastLogin.$lte = new Date(lastActivityTo);
            }
        }

        // Use same aggregation pipeline as main endpoint (without pagination)
        const aggregationPipeline: any[] = [
            { $match: query },
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
                $lookup: {
                    from: 'usernotes',
                    let: { userId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$userId', '$$userId'] },
                                        { $eq: ['$isDeleted', false] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'notes'
                }
            },
            {
                $lookup: {
                    from: 'userwarnings',
                    let: { userId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$userId', '$$userId'] },
                                        { $eq: ['$isDeleted', false] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'warnings'
                }
            },
            {
                $addFields: {
                    activeWarnings: {
                        $filter: {
                            input: '$warnings',
                            cond: { $eq: ['$$this.isActive', true] }
                        }
                    },
                    criticalWarnings: {
                        $filter: {
                            input: '$warnings',
                            cond: {
                                $and: [
                                    { $eq: ['$$this.isActive', true] },
                                    { $eq: ['$$this.severity', 'critical'] }
                                ]
                            }
                        }
                    }
                }
            },
            {
                $addFields: {
                    highestWarningSeverity: {
                        $cond: {
                            if: { $gt: [{ $size: '$criticalWarnings' }, 0] },
                            then: 'critical',
                            else: {
                                $cond: {
                                    if: {
                                        $gt: [
                                            {
                                                $size: {
                                                    $filter: {
                                                        input: '$activeWarnings',
                                                        cond: { $eq: ['$$this.severity', 'high'] }
                                                    }
                                                }
                                            },
                                            0
                                        ]
                                    },
                                    then: 'high',
                                    else: {
                                        $cond: {
                                            if: {
                                                $gt: [
                                                    {
                                                        $size: {
                                                            $filter: {
                                                                input: '$activeWarnings',
                                                                cond: { $eq: ['$$this.severity', 'medium'] }
                                                            }
                                                        }
                                                    },
                                                    0
                                                ]
                                            },
                                            then: 'medium',
                                            else: {
                                                $cond: {
                                                    if: {
                                                        $gt: [
                                                            {
                                                                $size: {
                                                                    $filter: {
                                                                        input: '$activeWarnings',
                                                                        cond: { $eq: ['$$this.severity', 'low'] }
                                                                    }
                                                                }
                                                            },
                                                            0
                                                        ]
                                                    },
                                                    then: 'low',
                                                    else: null
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    email: 1,
                    name: 1,
                    role: 1,
                    isActive: { $ifNull: ['$isActive', true] },
                    createdAt: 1,
                    lastLogin: 1,
                    linksCount: { $size: '$links' },
                    totalClicks: { $size: '$clicks' },
                    notesCount: { $size: '$notes' },
                    activeWarningsCount: { $size: '$activeWarnings' },
                    criticalWarningsCount: { $size: '$criticalWarnings' },
                    highestWarningSeverity: 1,
                    notes: 1,
                    warnings: 1,
                    riskScore: {
                        $add: [
                            { $size: '$activeWarnings' },
                            {
                                $multiply: [
                                    { $size: { $filter: { input: '$activeWarnings', cond: { $eq: ['$$this.severity', 'low'] } } } },
                                    1
                                ]
                            },
                            {
                                $multiply: [
                                    { $size: { $filter: { input: '$activeWarnings', cond: { $eq: ['$$this.severity', 'medium'] } } } },
                                    3
                                ]
                            },
                            {
                                $multiply: [
                                    { $size: { $filter: { input: '$activeWarnings', cond: { $eq: ['$$this.severity', 'high'] } } } },
                                    7
                                ]
                            },
                            {
                                $multiply: [
                                    { $size: { $filter: { input: '$activeWarnings', cond: { $eq: ['$$this.severity', 'critical'] } } } },
                                    15
                                ]
                            },
                            { $multiply: [{ $size: '$notes' }, 0.5] }
                        ]
                    }
                }
            }
        ];

        // Apply additional filtering (same logic as main endpoint)
        const additionalMatch: any = {};
        const searchConditions: any[] = [];

        if (search && (searchInNotes || searchInWarnings)) {
            if (searchInNotes) {
                searchConditions.push({
                    'notes.content': { $regex: search, $options: 'i' }
                });
            }
            if (searchInWarnings) {
                searchConditions.push({
                    'warnings.reason': { $regex: search, $options: 'i' }
                });
            }
        }

        if (hasNotes) {
            additionalMatch.notesCount = { $gt: 0 };
        }

        if (hasWarnings) {
            additionalMatch.activeWarningsCount = { $gt: 0 };
        }

        if (warningSeverity) {
            additionalMatch.highestWarningSeverity = warningSeverity;
        }

        if (minRiskScore || maxRiskScore) {
            additionalMatch.riskScore = {};
            if (minRiskScore) {
                additionalMatch.riskScore.$gte = parseFloat(minRiskScore);
            }
            if (maxRiskScore) {
                additionalMatch.riskScore.$lte = parseFloat(maxRiskScore);
            }
        }

        if (warningCountMin || warningCountMax) {
            additionalMatch.activeWarningsCount = {};
            if (warningCountMin) {
                additionalMatch.activeWarningsCount.$gte = parseInt(warningCountMin);
            }
            if (warningCountMax) {
                additionalMatch.activeWarningsCount.$lte = parseInt(warningCountMax);
            }
        }

        if (searchConditions.length > 0) {
            if (additionalMatch.$or) {
                additionalMatch.$and = [
                    { $or: additionalMatch.$or },
                    { $or: searchConditions }
                ];
                delete additionalMatch.$or;
            } else {
                additionalMatch.$or = searchConditions;
            }
        }

        if (Object.keys(additionalMatch).length > 0) {
            aggregationPipeline.push({ $match: additionalMatch });
        }

        // Add sorting
        aggregationPipeline.push({ $sort: { createdAt: -1 } });

        const users = await User.aggregate(aggregationPipeline);

        if (format === 'csv') {
            // Generate CSV
            const csvHeaders = [
                'ID',
                'Email',
                'Name',
                'Role',
                'Status',
                'Registration Date',
                'Last Login',
                'Links Count',
                'Total Clicks',
                'Notes Count',
                'Active Warnings',
                'Critical Warnings',
                'Highest Warning Severity',
                'Risk Score'
            ];

            const csvRows = users.map(user => [
                user._id.toString(),
                user.email,
                user.name || '',
                user.role || 'user',
                user.isActive ? 'Active' : 'Inactive',
                new Date(user.createdAt).toLocaleDateString(),
                user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : '',
                user.linksCount,
                user.totalClicks,
                user.notesCount || 0,
                user.activeWarningsCount || 0,
                user.criticalWarningsCount || 0,
                user.highestWarningSeverity || '',
                user.riskScore || 0
            ]);

            const csvContent = [
                csvHeaders.join(','),
                ...csvRows.map(row => row.map(field =>
                    typeof field === 'string' && field.includes(',')
                        ? `"${field.replace(/"/g, '""')}"`
                        : field
                ).join(','))
            ].join('\n');

            return new NextResponse(csvContent, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`
                }
            });
        } else {
            // Return JSON
            const formattedUsers = users.map(user => ({
                _id: user._id.toString(),
                email: user.email,
                name: user.name,
                role: user.role || 'user',
                isActive: user.isActive,
                createdAt: user.createdAt.toISOString(),
                lastLogin: user.lastLogin?.toISOString(),
                linksCount: user.linksCount,
                totalClicks: user.totalClicks,
                notesCount: user.notesCount || 0,
                activeWarningsCount: user.activeWarningsCount || 0,
                criticalWarningsCount: user.criticalWarningsCount || 0,
                highestWarningSeverity: user.highestWarningSeverity,
                riskScore: user.riskScore || 0
            }));

            return NextResponse.json({
                success: true,
                data: formattedUsers,
                timestamp: new Date().toISOString()
            });
        }
    } catch (error) {
        console.error('Error exporting users:', error);
        return NextResponse.json(
            { success: false, error: { code: 'EXPORT_ERROR', message: 'Failed to export users' } },
            { status: 500 }
        );
    }
}