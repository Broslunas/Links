import { NextRequest } from 'next/server';
import { createApiSuccessResponse } from '../../../../lib/api-v1-middleware';

/**
 * Health check endpoint for API v1
 * GET /api/v1/health
 */
export async function GET(request: NextRequest) {
    const healthData = {
        status: 'healthy',
        version: 'v1',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    };

    return createApiSuccessResponse(healthData);
}