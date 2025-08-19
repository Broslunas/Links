import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db-utils';
import TempExport from '../../../../models/TempExport';

export async function GET(
  request: NextRequest,
  { params }: { params: { exportId: string } }
) {
  try {
    const { exportId } = params;

    // Connect to database
    await connectDB();

    // Get the export data from database
    const exportEntry = await TempExport.findOne({ exportId });

    if (!exportEntry) {
      return NextResponse.json(
        { error: 'Enlace de exportación no encontrado o expirado' },
        { status: 404 }
      );
    }

    // Check if export is expired
    if (exportEntry.expiresAt < new Date()) {
      // Clean up expired export
      await TempExport.deleteOne({ exportId });
      return NextResponse.json(
        { error: 'Enlace de exportación expirado' },
        { status: 410 }
      );
    }

    const fileName = `broslunas-link-export-${new Date().toISOString().split('T')[0]}.json`;

    // Return the file as a download
    return new NextResponse(JSON.stringify(exportEntry.data, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    console.error('Error serving export:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
