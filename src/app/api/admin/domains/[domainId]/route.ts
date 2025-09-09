import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-simple';
import { connectDB } from '@/lib/db-utils';
import CustomDomain from '@/models/CustomDomain';
import User from '@/models/User';
import { isValidObjectId } from 'mongoose';

// PATCH /api/admin/domains/[domainId] - Block/Unblock domain
export async function PATCH(request: NextRequest, { params }: { params: { domainId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if user is admin
    await connectDB();
    const adminUser = await User.findOne({ email: session.user.email });
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const { domainId } = params;
    
    if (!isValidObjectId(domainId)) {
      return NextResponse.json({ error: 'Invalid domain ID' }, { status: 400 });
    }

    const body = await request.json();
    const { isBlocked, blockedReason } = body;

    if (typeof isBlocked !== 'boolean') {
      return NextResponse.json({ error: 'isBlocked must be a boolean' }, { status: 400 });
    }

    const updateData: any = {
      isBlocked,
      isActive: !isBlocked, // Desactivar dominio cuando se bloquea
      updatedAt: new Date()
    };

    if (isBlocked && blockedReason) {
      updateData.blockedReason = blockedReason;
    } else if (!isBlocked) {
      updateData.$unset = { blockedReason: 1 };
    }

    const domain = await CustomDomain.findByIdAndUpdate(
      domainId,
      updateData,
      { new: true }
    );

    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      domain: {
        _id: domain._id?.toString(),
        domain: domain.domain,
        fullDomain: domain.fullDomain,
        isVerified: domain.isVerified,
        isActive: domain.isActive,
        isBlocked: domain.isBlocked,
        blockedReason: domain.blockedReason,
        userId: domain.userId?.toString(),
        createdAt: domain.createdAt?.toISOString(),
        updatedAt: domain.updatedAt?.toISOString()
      }
    });

  } catch (error) {
    console.error('Error updating domain:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/domains/[domainId] - Delete domain
export async function DELETE(request: NextRequest, { params }: { params: { domainId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if user is admin
    await connectDB();
    const adminUser = await User.findOne({ email: session.user.email });
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const { domainId } = params;
    
    if (!isValidObjectId(domainId)) {
      return NextResponse.json({ error: 'Invalid domain ID' }, { status: 400 });
    }

    const domain = await CustomDomain.findByIdAndDelete(domainId);

    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Domain deleted successfully',
      deletedDomain: {
        _id: domain._id?.toString(),
        domain: domain.domain,
        fullDomain: domain.fullDomain
      }
    });

  } catch (error) {
    console.error('Error deleting domain:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/admin/domains/[domainId] - Get domain details
export async function GET(request: NextRequest, { params }: { params: { domainId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if user is admin
    await connectDB();
    const adminUser = await User.findOne({ email: session.user.email });
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const { domainId } = params;
    
    if (!isValidObjectId(domainId)) {
      return NextResponse.json({ error: 'Invalid domain ID' }, { status: 400 });
    }

    const domain = await CustomDomain.findById(domainId).populate('userId', 'name email');

    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      domain: {
        _id: domain._id?.toString(),
        domain: domain.domain,
        fullDomain: domain.fullDomain,
        isVerified: domain.isVerified,
        isActive: domain.isActive,
        isBlocked: domain.isBlocked,
        blockedReason: domain.blockedReason,
        userId: domain.userId?.toString(),
        user: domain.userId,
        createdAt: domain.createdAt?.toISOString(),
        updatedAt: domain.updatedAt?.toISOString(),
        lastVerificationCheck: domain.lastVerificationCheck?.toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching domain:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}