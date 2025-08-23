import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-simple';
import { sendTestMaintenanceWebhook } from '@/utils/maintenanceWebhook';

export async function POST(request: NextRequest) {
    try {
        console.log('Test webhook API called');

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

        const body = await request.json().catch(() => ({}));

        console.log('Sending test webhook notification...');

        // Send test webhook
        const success = await sendTestMaintenanceWebhook({
            activatedBy: session.user.email,
            ...body
        });

        if (success) {
            return NextResponse.json({
                success: true,
                message: 'Test webhook sent successfully'
            });
        } else {
            return NextResponse.json({
                success: false,
                error: 'Failed to send test webhook'
            }, { status: 500 });
        }

    } catch (error) {
        console.error('Error in test webhook API:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to send test webhook'
            },
            { status: 500 }
        );
    }
}