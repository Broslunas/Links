import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-simple';
import { connectDB } from '@/lib/mongodb';
import CustomDomain from '@/models/CustomDomain';
import { isValidObjectId } from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Verificar autenticación y permisos de admin
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: { message: 'No autenticado' } },
        { status: 401 }
      );
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: { message: 'Acceso denegado. Se requieren permisos de administrador.' } },
        { status: 403 }
      );
    }

    const { userId } = params;

    // Validar que el userId sea un ObjectId válido
    if (!isValidObjectId(userId)) {
      return NextResponse.json(
        { error: { message: 'ID de usuario inválido' } },
        { status: 400 }
      );
    }

    // Conectar a la base de datos
    await connectDB();

    // Obtener todos los dominios del usuario
    const domains = await CustomDomain.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    // Formatear la respuesta
    const formattedDomains = domains.map(domain => ({
      _id: domain._id?.toString() || '',
      domain: domain.domain,
      subdomain: domain.subdomain,
      fullDomain: domain.fullDomain,
      isVerified: domain.isVerified,
      isActive: domain.isActive,
      sslStatus: domain.sslStatus,
      sslError: domain.sslError,
      isDefault: domain.isDefault,
      createdAt: domain.createdAt instanceof Date ? domain.createdAt.toISOString() : new Date(domain.createdAt).toISOString(),
      updatedAt: domain.updatedAt instanceof Date ? domain.updatedAt.toISOString() : new Date(domain.updatedAt).toISOString(),
      verificationAttempts: domain.verificationAttempts,
      maxVerificationAttempts: domain.maxVerificationAttempts,
      vercelDomainId: domain.vercelDomainId,
      vercelConfigurationId: domain.vercelConfigurationId,
      lastVerificationCheck: domain.lastVerificationCheck ? 
        (domain.lastVerificationCheck instanceof Date ? 
          domain.lastVerificationCheck.toISOString() : 
          new Date(domain.lastVerificationCheck).toISOString()) : 
        undefined
    }));

    // Calcular estadísticas
    const stats = {
      total: domains.length,
      verified: domains.filter(d => d.isVerified).length,
      active: domains.filter(d => d.isActive && d.isVerified && d.sslStatus === 'active').length,
      pending: domains.filter(d => !d.isVerified).length,
      sslPending: domains.filter(d => d.isVerified && d.sslStatus === 'pending').length,
      sslError: domains.filter(d => d.sslStatus === 'error').length,
      hasDefault: domains.some(d => d.isDefault)
    };

    return NextResponse.json({
      success: true,
      domains: formattedDomains,
      stats,
      message: `Se encontraron ${domains.length} dominios para el usuario`
    });

  } catch (error) {
    console.error('Error fetching user domains:', error);
    return NextResponse.json(
      { 
        error: { 
          message: 'Error interno del servidor al obtener los dominios del usuario',
          details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
        } 
      },
      { status: 500 }
    );
  }
}

// Endpoint para obtener estadísticas rápidas de dominios (opcional)
export async function HEAD(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return new NextResponse(null, { status: 403 });
    }

    const { userId } = params;

    if (!isValidObjectId(userId)) {
      return new NextResponse(null, { status: 400 });
    }

    await connectDB();

    const domainCount = await CustomDomain.countDocuments({ userId });
    const verifiedCount = await CustomDomain.countDocuments({ 
      userId, 
      isVerified: true 
    });
    const activeCount = await CustomDomain.countDocuments({ 
      userId, 
      isVerified: true, 
      isActive: true, 
      sslStatus: 'active' 
    });

    return new NextResponse(null, {
      status: 200,
      headers: {
        'X-Domain-Count': domainCount.toString(),
        'X-Verified-Count': verifiedCount.toString(),
        'X-Active-Count': activeCount.toString()
      }
    });

  } catch (error) {
    console.error('Error getting domain stats:', error);
    return new NextResponse(null, { status: 500 });
  }
}