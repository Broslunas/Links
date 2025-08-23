import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db-utils';
import MaintenanceState from '@/models/MaintenanceState';

export async function GET(request: NextRequest) {
    try {
        console.log('Maintenance status API called');

        // Connect to database
        await connectDB();

        // Get maintenance state from database
        const state = await MaintenanceState.getSingleton();
        console.log('Current maintenance state:', state);

        return NextResponse.json({
            isActive: state.isActive,
            message: state.message,
            estimatedDuration: state.estimatedDuration,
            activatedBy: state.activatedBy,
            activatedAt: state.activatedAt.toISOString()
        });
    } catch (error) {
        console.error('Error in maintenance status API:', error);
        return NextResponse.json(
            {
                isActive: false,
                message: null,
                estimatedDuration: null,
                activatedBy: null,
                activatedAt: null,
                error: 'API error'
            },
            { status: 200 }
        );
    }
}