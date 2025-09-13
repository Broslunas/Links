import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db-utils';
import CustomDomain from '@/models/CustomDomain';

// Force Node.js runtime for Mongoose compatibility
export const runtime = 'nodejs';


// POST /api/domains/verify-public - Verificar dominio público (sin autenticación)
export async function POST(request: NextRequest) {
  try {
    const { domain } = await request.json();

    if (!domain || typeof domain !== 'string') {
      return NextResponse.json(
        { error: { message: 'Dominio requerido' } },
        { status: 400 }
      );
    }

    await connectDB();

    const customDomain = await CustomDomain.findOne({
      fullDomain: domain.toLowerCase(),
      isVerified: true,
      isActive: true,
    }).populate('userId', 'name email');

    if (!customDomain) {
      return NextResponse.json(
        { error: { message: 'Dominio no encontrado o no verificado' } },
        { status: 404 }
      );
    }

    // Respuesta pública (sin información sensible)
    const publicDomainInfo = {
      _id: customDomain._id.toString(),
      domain: customDomain.domain,
      subdomain: customDomain.subdomain,
      fullDomain: customDomain.fullDomain,
      isVerified: customDomain.isVerified,
      isActive: customDomain.isActive,
      sslStatus: customDomain.sslStatus,
      createdAt: customDomain.createdAt.toISOString(),
      userId: customDomain.userId ? {
        name: customDomain.userId.name,
        // No incluir email por privacidad
      } : null,
    };

    return NextResponse.json({
      success: true,
      data: publicDomainInfo,
    });
  } catch (error) {
    console.error('Error verifying public domain:', error);
    return NextResponse.json(
      { error: { message: 'Error interno del servidor' } },
      { status: 500 }
    );
  }
}

// GET /api/domains/verify-public?domain=example.com - Verificar dominio público via query
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');

    if (!domain) {
      return NextResponse.json(
        { error: { message: 'Parámetro domain requerido' } },
        { status: 400 }
      );
    }

    await connectDB();

    const customDomain = await CustomDomain.findOne({
      fullDomain: domain.toLowerCase(),
      isVerified: true,
      isActive: true,
    }).populate('userId', 'name');

    if (!customDomain) {
      return NextResponse.json(
        { error: { message: 'Dominio no encontrado o no verificado' } },
        { status: 404 }
      );
    }

    // Respuesta pública (sin información sensible)
    const publicDomainInfo = {
      _id: customDomain._id.toString(),
      domain: customDomain.domain,
      subdomain: customDomain.subdomain,
      fullDomain: customDomain.fullDomain,
      isVerified: customDomain.isVerified,
      isActive: customDomain.isActive,
      sslStatus: customDomain.sslStatus,
      createdAt: customDomain.createdAt.toISOString(),
      userId: customDomain.userId ? {
        name: customDomain.userId.name,
      } : null,
    };

    return NextResponse.json({
      success: true,
      data: publicDomainInfo,
    });
  } catch (error) {
    console.error('Error verifying public domain:', error);
    return NextResponse.json(
      { error: { message: 'Error interno del servidor' } },
      { status: 500 }
    );
  }
}