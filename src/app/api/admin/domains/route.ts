import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import { connectDB } from '@/lib/db-utils';
import CustomDomain from '@/models/CustomDomain';
import User from '@/models/User';
import { ApiResponse } from '@/types';

export interface AdminDomain {
  _id: string;
  domain: string;
  subdomain?: string;
  fullDomain: string;
  isVerified: boolean;
  isActive: boolean;
  isBlocked: boolean;
  blockedReason?: string;
  sslStatus: 'pending' | 'active' | 'error';
  sslError?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
  user: {
    _id: string;
    name?: string;
    email: string;
  };
}

export interface DomainsListResponse {
  domains: AdminDomain[];
  totalDomains: number;
  totalPages: number;
  currentPage: number;
}

// GET - Obtener lista de dominios para administradores
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
    const status = searchParams.get('status') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build filter query
    const filter: any = {};

    // Search filter
    if (search) {
      filter.$or = [
        { fullDomain: { $regex: search, $options: 'i' } },
        { domain: { $regex: search, $options: 'i' } },
        { subdomain: { $regex: search, $options: 'i' } }
      ];
    }

    // Status filter
    if (status) {
      switch (status) {
        case 'verified':
          filter.isVerified = true;
          break;
        case 'unverified':
          filter.isVerified = false;
          break;
        case 'active':
          filter.isActive = true;
          break;
        case 'inactive':
          filter.isActive = false;
          break;
        case 'blocked':
          filter.isBlocked = true;
          break;
        case 'ssl_error':
          filter.sslStatus = 'error';
          break;
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get total count
    const totalDomains = await CustomDomain.countDocuments(filter);
    const totalPages = Math.ceil(totalDomains / limit);

    // Get domains with user information
    const domains = await CustomDomain.find(filter)
      .populate('userId', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Format response
    const formattedDomains: AdminDomain[] = domains.map(domain => ({
      _id: domain._id?.toString() || '',
      domain: domain.domain,
      subdomain: domain.subdomain,
      fullDomain: domain.fullDomain,
      isVerified: domain.isVerified,
      isActive: domain.isActive,
      isBlocked: domain.isBlocked || false,
      blockedReason: domain.blockedReason,
      sslStatus: domain.sslStatus,
      sslError: domain.sslError,
      isDefault: domain.isDefault,
      createdAt: domain.createdAt?.toISOString() || '',
      updatedAt: domain.updatedAt?.toISOString() || '',
      userId: domain.userId?._id?.toString() || '',
      user: {
        _id: domain.userId?._id?.toString() || '',
        name: domain.userId?.name,
        email: domain.userId?.email || ''
      }
    }));

    const response: ApiResponse<DomainsListResponse> = {
      success: true,
      data: {
        domains: formattedDomains,
        totalDomains,
        totalPages,
        currentPage: page
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching domains:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}