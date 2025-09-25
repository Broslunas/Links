import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db-utils';
import CustomDomain from '@/models/CustomDomain';

// Force Node.js runtime for Mongoose compatibility
export const runtime = 'nodejs';

// GET /api/domains/verify-domain?domain=example.com
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');

    if (!domain) {
      return NextResponse.json(
        { success: false, error: 'Dominio requerido' },
        { status: 400 }
      );
    }

    await connectDB();

    const customDomain = await CustomDomain.findOne({
      fullDomain: domain.toLowerCase(),
      isVerified: true,
      isActive: true,
      isBlocked: { $ne: true },
    });

    return NextResponse.json({
      success: true,
      exists: !!customDomain,
    });
  } catch (error) {
    console.error('Error verificando dominio:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
