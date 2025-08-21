import { NextRequest, NextResponse } from 'next/server';
import { getClientIP, getGeoInfo } from '../../../lib/analytics';

export async function GET(request: NextRequest) {
  try {
    // Get client IP
    const clientIP = getClientIP(request);

    // Get geographic information
    const geoInfo = await getGeoInfo(clientIP);

    // Return detailed information
    return NextResponse.json({
      success: true,
      data: {
        clientIP,
        geoInfo,
        headers: {
          'x-forwarded-for': request.headers.get('x-forwarded-for'),
          'x-real-ip': request.headers.get('x-real-ip'),
          'cf-connecting-ip': request.headers.get('cf-connecting-ip'),
          'x-client-ip': request.headers.get('x-client-ip'),
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Test-Geo] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
