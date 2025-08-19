import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth-simple';
import { cleanupExpiredExports, getExportStats } from '../../../../lib/cleanup-exports';

/**
 * POST /api/admin/cleanup-exports
 * Manually trigger cleanup of expired exports
 * Requires authentication
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Get stats before cleanup
    const statsBefore = await getExportStats();
    
    // Perform cleanup
    const { deletedCount } = await cleanupExpiredExports();
    
    // Get stats after cleanup
    const statsAfter = await getExportStats();
    
    return NextResponse.json({
      success: true,
      message: `Limpieza completada. ${deletedCount} exportaciones expiradas eliminadas.`,
      stats: {
        before: statsBefore,
        after: statsAfter,
        deletedCount
      }
    });
    
  } catch (error) {
    console.error('Error during cleanup:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor durante la limpieza' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/cleanup-exports
 * Get export statistics without performing cleanup
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const stats = await getExportStats();
    
    return NextResponse.json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error('Error getting export stats:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}