import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db-utils';
import User from '@/models/User';
import UserNote from '@/models/UserNote';
import UserWarning from '@/models/UserWarning';
import AdminAction from '@/models/AdminAction';
import { ApiResponse } from '@/types';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';

export interface AdminUser {
  _id: string;
  email: string;
  name?: string;
  role: 'user' | 'admin';
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  linksCount: number;
  totalClicks: number;
  notesCount: number;
  activeWarningsCount: number;
  criticalWarningsCount: number;
  highestWarningSeverity?: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
}

export interface UsersListResponse {
  users: AdminUser[];
  totalUsers: number;
  totalPages: number;
  currentPage: number;
}

// GET - Obtener lista de usuarios
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
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

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

    // Build base query
    const query: any = {};

    // Enhanced search functionality
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

    // Handle special filters for notes and warnings
    const hasNotes = searchParams.get('hasNotes') === 'true';
    const hasWarnings = searchParams.get('hasWarnings') === 'true';
    const warningSeverity = searchParams.get('warningSeverity');

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count
    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit);

    // Get users with aggregation to include links count, total clicks, notes and warnings
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
              // Base score from warning count (1 point per warning)
              { $size: '$activeWarnings' },
              // Severity multipliers
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
              // Add points for having notes (0.5 per note)
              { $multiply: [{ $size: '$notes' }, 0.5] }
            ]
          }
        }
      }
    ];

    // Add additional filtering based on notes/warnings and enhanced search
    const additionalMatch: any = {};
    const searchConditions: any[] = [];

    // Enhanced search in notes and warnings content
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

    // Risk score filtering
    if (minRiskScore || maxRiskScore) {
      additionalMatch.riskScore = {};
      if (minRiskScore) {
        additionalMatch.riskScore.$gte = parseFloat(minRiskScore);
      }
      if (maxRiskScore) {
        additionalMatch.riskScore.$lte = parseFloat(maxRiskScore);
      }
    }

    // Warning count filtering
    if (warningCountMin || warningCountMax) {
      additionalMatch.activeWarningsCount = {};
      if (warningCountMin) {
        additionalMatch.activeWarningsCount.$gte = parseInt(warningCountMin);
      }
      if (warningCountMax) {
        additionalMatch.activeWarningsCount.$lte = parseInt(warningCountMax);
      }
    }

    // Apply additional search conditions
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

    // Add sorting and pagination
    aggregationPipeline.push(
      { $sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 } },
      { $skip: skip },
      { $limit: limit }
    );

    const users = await User.aggregate(aggregationPipeline);

    // Format response
    const formattedUsers: AdminUser[] = users.map(user => ({
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

    const response: ApiResponse<UsersListResponse> = {
      success: true,
      data: {
        users: formattedUsers,
        totalUsers,
        totalPages,
        currentPage: page
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching users:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch users'
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// PUT - Actualizar usuario (rol, estado activo)
export async function PUT(request: NextRequest) {
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
    const { userId, role, isActive } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'User ID is required' } },
        { status: 400 }
      );
    }

    // Prevent admin from changing their own role
    if (userId === adminUser._id.toString() && role && role !== adminUser.role) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Cannot change your own role' } },
        { status: 403 }
      );
    }

    // Get the user before update to check if it's being disabled
    const userBeforeUpdate = await User.findById(userId).select('_id email name isActive');
    if (!userBeforeUpdate) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      );
    }

    // Update user
    const updateData: any = {};
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, select: '_id email name role isActive createdAt' }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      );
    }

    // Log admin actions for user changes
    const adminActions = [];

    // Log role change action
    if (role !== undefined && role !== userBeforeUpdate.role) {
      const roleChangeAction = new AdminAction({
        adminId: adminUser._id,
        targetType: 'user',
        targetId: userId,
        actionType: 'change_role',
        reason: `Role changed from ${userBeforeUpdate.role || 'user'} to ${role}`,
        previousState: { role: userBeforeUpdate.role || 'user' },
        newState: { role: role },
        metadata: {
          previousRole: userBeforeUpdate.role || 'user',
          newRole: role
        }
      });
      adminActions.push(roleChangeAction.save());
    }

    // Log user enable/disable action
    if (isActive !== undefined && isActive !== userBeforeUpdate.isActive) {
      const statusAction = isActive ? 'enable_user' : 'disable_user';
      const statusChangeAction = new AdminAction({
        adminId: adminUser._id,
        targetType: 'user',
        targetId: userId,
        actionType: statusAction,
        reason: `User ${isActive ? 'enabled' : 'disabled'} by admin`,
        previousState: { isActive: userBeforeUpdate.isActive ?? true },
        newState: { isActive: isActive }
      });
      adminActions.push(statusChangeAction.save());
    }

    // Save all admin actions
    if (adminActions.length > 0) {
      try {
        await Promise.all(adminActions);
      } catch (actionError) {
        console.error('Error logging admin actions:', actionError);
        // Don't fail the user update if action logging fails
      }
    }

    // Send webhook notification if user status is being changed
    if (isActive !== undefined && isActive !== userBeforeUpdate.isActive) {
      const action = isActive ? 'active' : 'inactive';
      try {
        await fetch('https://hook.eu2.make.com/oiwghj44buyslgsi7ykp5v2wo3yfvgye', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userName: updatedUser.name,
            userEmail: updatedUser.email,
            adminName: adminUser.name,
            adminEmail: adminUser.email,
            action: action
          })
        });
      } catch (webhookError) {
        console.error('Error sending webhook notification:', webhookError);
        // Don't fail the user update if webhook fails
      }
    }

    const response: ApiResponse<AdminUser> = {
      success: true,
      data: {
        _id: updatedUser._id.toString(),
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role || 'user',
        isActive: updatedUser.isActive ?? true,
        createdAt: updatedUser.createdAt.toISOString(),
        linksCount: 0, // Will be updated by frontend
        totalClicks: 0, // Will be updated by frontend
        notesCount: 0, // Will be updated by frontend
        activeWarningsCount: 0, // Will be updated by frontend
        criticalWarningsCount: 0, // Will be updated by frontend
        highestWarningSeverity: undefined,
        riskScore: 0 // Will be updated by frontend
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating user:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: 'Failed to update user'
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response, { status: 500 });
  }
}