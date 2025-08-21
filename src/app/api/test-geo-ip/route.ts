import { NextRequest, NextResponse } from 'next/server';
import { getGeoInfo } from '../../../lib/analytics';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testIP = searchParams.get('ip');

    if (!testIP) {
      return NextResponse.json(
        {
          success: false,
          error: 'IP parameter is required. Usage: /api/test-geo-ip?ip=8.8.8.8',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Get geographic information for the specified IP
    const geoInfo = await getGeoInfo(testIP);

    // Return detailed information
    return NextResponse.json({
      success: true,
      data: {
        testIP,
        geoInfo,
        isUnknown: geoInfo.country === 'Unknown' && geoInfo.city === 'Unknown',
        isLocal: geoInfo.country === 'Local',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Test-Geo-IP] Error:', error);
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
