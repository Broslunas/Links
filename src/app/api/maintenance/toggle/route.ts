import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-simple';
import { connectDB } from '@/lib/db-utils';
import MaintenanceState from '@/models/MaintenanceState';

export async function POST(request: NextRequest) {
    try {
        console.log('Maintenance toggle API called');

        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Check if user is admin
        const isAdmin = session.user.role === 'admin';
        if (!isAdmin) {
            return NextResponse.json(
                { success: false, error: 'Admin access required' },
                { status: 403 }
            );
        }

        const body = await request.json();
        console.log('Toggle request:', body);

        // Connect to database
        await connectDB();

        // Update maintenance state in database
        const newState = await MaintenanceState.updateSingleton({
            isActive: body.isActive,
            message: body.message || null,
            estimatedDuration: body.estimatedDuration || null,
            activatedBy: session.user.email
        });

        return NextResponse.json({
            success: true,
            data: {
                isActive: newState.isActive,
                message: newState.message,
                estimatedDuration: newState.estimatedDuration,
                activatedBy: newState.activatedBy,
                activatedAt: newState.activatedAt.toISOString()
            }
        });
    } catch (error) {
        console.error('Error in maintenance toggle API:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to toggle maintenance mode'
            },
            { status: 500 }
        );
    }
}