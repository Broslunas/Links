import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { exportId: string } }
) {
  try {
    const { exportId } = params;
    
    // Get the export data from cache
    global.exportCache = global.exportCache || new Map();
    const exportEntry = global.exportCache.get(exportId);
    
    if (!exportEntry) {
      return NextResponse.json(
        { error: 'Enlace de exportación no encontrado o expirado' },
        { status: 404 }
      );
    }
    
    // Check if export is older than 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (exportEntry.createdAt < oneHourAgo) {
      global.exportCache.delete(exportId);
      return NextResponse.json(
        { error: 'Enlace de exportación expirado' },
        { status: 410 }
      );
    }
    
    const fileName = `brl-links-export-${new Date().toISOString().split('T')[0]}.json`;
    
    // Return the file as a download
    return new NextResponse(JSON.stringify(exportEntry.data, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error) {
    console.error('Error serving export:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}