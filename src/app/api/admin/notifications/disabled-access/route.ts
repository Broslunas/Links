import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import { notificationService } from '@/lib/notification-service';
import { connectDB } from '@/lib/mongodb';

// POST /api/admin/notifications/disabled-access - Report disabled user access attempt
export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const body = await request.json();
        const { userId, attemptType, metadata } = body;

        if (!userId || !attemptType) {
            return NextResponse.json(
                { error: 'Missing required fields: userId, attemptType' },
                { status: 400 }
            );
        }

        await notificationService.onDisabledUserAccessAttempt(userId, attemptType, metadata);

        return NextResponse.json({
            success: true,
            message: 'Disabled user access attempt reported successfully',
        });
    } catch (error) {
        console.error('Error reporting disabled user access attempt:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}