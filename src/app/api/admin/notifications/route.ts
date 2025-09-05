import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import { notificationService } from '@/lib/notification-service';
import { connectDB } from '@/lib/db-utils';

// GET /api/admin/notifications - Get recent alerts
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== 'admin') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const type = searchParams.get('type') as any;
        const severity = searchParams.get('severity') as 'high' | 'critical';

        let alerts;
        if (type) {
            alerts = notificationService.getAlertsByType(type, limit);
        } else if (severity) {
            alerts = notificationService.getAlertsBySeverity(severity, limit);
        } else {
            alerts = notificationService.getRecentAlerts(limit);
        }

        return NextResponse.json({
            success: true,
            data: alerts,
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/admin/notifications/activity - Report suspicious activity
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== 'admin') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await connectDB();

        const body = await request.json();
        const { userId, activityType, metadata } = body;

        if (!userId || !activityType) {
            return NextResponse.json(
                { error: 'Missing required fields: userId, activityType' },
                { status: 400 }
            );
        }

        await notificationService.detectSuspiciousActivity(userId, activityType, metadata);

        return NextResponse.json({
            success: true,
            message: 'Activity reported successfully',
        });
    } catch (error) {
        console.error('Error reporting suspicious activity:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}