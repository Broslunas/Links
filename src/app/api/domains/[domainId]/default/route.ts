import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import { connectDB } from '@/lib/db-utils';
import CustomDomain from '@/models/CustomDomain';
import mongoose from 'mongoose';
import { CustomDomainResponse } from '../../route';

// POST /api/domains/[domainId]/default - Establecer dominio como predeterminado
export async function POST(
  request: NextRequest,
  { params }: { params: { domainId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { message: 'No autorizado' } },
        { status: 401 }
      );
    }

    const { domainId } = params;

    if (!mongoose.Types.ObjectId.isValid(domainId)) {
      return NextResponse.json(
        { error: { message: 'ID de dominio inválido' } },
        { status: 400 }
      );
    }

    await connectDB();

    const domain = await CustomDomain.findOne({
      _id: domainId,
      userId: session.user.id,
    });

    if (!domain) {
      return NextResponse.json(
        { error: { message: 'Dominio no encontrado' } },
        { status: 404 }
      );
    }

    if (!domain.isVerified) {
      return NextResponse.json(
        { error: { message: 'El dominio debe estar verificado para establecerlo como predeterminado' } },
        { status: 400 }
      );
    }

    if (!domain.isActive) {
      return NextResponse.json(
        { error: { message: 'El dominio debe estar activo para establecerlo como predeterminado' } },
        { status: 400 }
      );
    }

    if (domain.isDefault) {
      return NextResponse.json(
        { error: { message: 'Este dominio ya es el predeterminado' } },
        { status: 400 }
      );
    }

    // Usar transacción para asegurar consistencia
    const session_db = await mongoose.startSession();
    
    try {
      await session_db.withTransaction(async () => {
        // Remover el estado predeterminado de todos los dominios del usuario
        await CustomDomain.updateMany(
          { userId: session.user.id, isDefault: true },
          { $set: { isDefault: false } },
          { session: session_db }
        );

        // Establecer el nuevo dominio como predeterminado
        await CustomDomain.updateOne(
          { _id: domainId },
          { $set: { isDefault: true } },
          { session: session_db }
        );
      });
    } finally {
      await session_db.endSession();
    }

    // Obtener el dominio actualizado
    const updatedDomain = await CustomDomain.findById(domainId);
    
    if (!updatedDomain) {
      return NextResponse.json(
        { error: { message: 'Error actualizando dominio' } },
        { status: 500 }
      );
    }

    const domainResponse: CustomDomainResponse = {
      _id: updatedDomain._id.toString(),
      domain: updatedDomain.domain,
      subdomain: updatedDomain.subdomain,
      fullDomain: updatedDomain.fullDomain,
      isVerified: updatedDomain.isVerified,
      isActive: updatedDomain.isActive,
      verificationToken: updatedDomain.verificationToken,
      dnsRecords: updatedDomain.dnsRecords,
      sslStatus: updatedDomain.sslStatus,
      sslError: updatedDomain.sslError,
      isDefault: updatedDomain.isDefault,
      createdAt: updatedDomain.createdAt.toISOString(),
      updatedAt: updatedDomain.updatedAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: domainResponse,
      message: 'Dominio establecido como predeterminado exitosamente',
    });
  } catch (error) {
    console.error('Error setting default domain:', error);
    return NextResponse.json(
      { error: { message: 'Error interno del servidor' } },
      { status: 500 }
    );
  }
}

// DELETE /api/domains/[domainId]/default - Remover dominio como predeterminado
export async function DELETE(
  request: NextRequest,
  { params }: { params: { domainId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { message: 'No autorizado' } },
        { status: 401 }
      );
    }

    const { domainId } = params;

    if (!mongoose.Types.ObjectId.isValid(domainId)) {
      return NextResponse.json(
        { error: { message: 'ID de dominio inválido' } },
        { status: 400 }
      );
    }

    await connectDB();

    const domain = await CustomDomain.findOne({
      _id: domainId,
      userId: session.user.id,
    });

    if (!domain) {
      return NextResponse.json(
        { error: { message: 'Dominio no encontrado' } },
        { status: 404 }
      );
    }

    if (!domain.isDefault) {
      return NextResponse.json(
        { error: { message: 'Este dominio no es el predeterminado' } },
        { status: 400 }
      );
    }

    // Remover el estado predeterminado
    domain.isDefault = false;
    await domain.save();

    const domainResponse: CustomDomainResponse = {
      _id: domain._id.toString(),
      domain: domain.domain,
      subdomain: domain.subdomain,
      fullDomain: domain.fullDomain,
      isVerified: domain.isVerified,
      isActive: domain.isActive,
      verificationToken: domain.verificationToken,
      dnsRecords: domain.dnsRecords,
      sslStatus: domain.sslStatus,
      sslError: domain.sslError,
      isDefault: domain.isDefault,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: domainResponse,
      message: 'Dominio removido como predeterminado exitosamente',
    });
  } catch (error) {
    console.error('Error removing default domain:', error);
    return NextResponse.json(
      { error: { message: 'Error interno del servidor' } },
      { status: 500 }
    );
  }
}