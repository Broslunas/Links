import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import { connectDB } from '@/lib/db-utils';
import CustomDomain from '@/models/CustomDomain';
import Link from '@/models/Link';
import mongoose from 'mongoose';
import { CustomDomainResponse } from '../route';
import { VercelIntegration } from '@/lib/vercel-integration';

// Force Node.js runtime for Mongoose compatibility
export const runtime = 'nodejs';


export interface UpdateDomainRequest {
  isActive?: boolean;
  isDefault?: boolean;
}

// GET /api/domains/[domainId] - Obtener dominio específico
export async function GET(
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
    });
  } catch (error) {
    console.error('Error fetching domain:', error);
    return NextResponse.json(
      { error: { message: 'Error interno del servidor' } },
      { status: 500 }
    );
  }
}

// PUT /api/domains/[domainId] - Actualizar dominio
export async function PUT(
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
    const body: UpdateDomainRequest = await request.json();

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

    // Actualizar campos permitidos
    if (typeof body.isActive === 'boolean') {
      domain.isActive = body.isActive;
    }

    if (typeof body.isDefault === 'boolean') {
      domain.isDefault = body.isDefault;
    }

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
      message: 'Dominio actualizado exitosamente',
    });
  } catch (error) {
    console.error('Error updating domain:', error);
    return NextResponse.json(
      { error: { message: 'Error interno del servidor' } },
      { status: 500 }
    );
  }
}

// DELETE /api/domains/[domainId] - Eliminar dominio
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

    // Verificar si hay enlaces usando este dominio
    const linksUsingDomain = await Link.countDocuments({
      customDomain: domainId,
    });

    if (linksUsingDomain > 0) {
      return NextResponse.json(
        { 
          error: { 
            message: `No se puede eliminar el dominio porque ${linksUsingDomain} enlaces lo están usando. Primero cambia esos enlaces a otro dominio.` 
          } 
        },
        { status: 400 }
      );
    }

    // Si era el dominio por defecto, asignar otro como por defecto
    if (domain.isDefault) {
      const otherDomain = await CustomDomain.findOne({
        userId: session.user.id,
        _id: { $ne: domainId },
        isVerified: true,
        isActive: true,
      });

      if (otherDomain) {
        otherDomain.isDefault = true;
        await otherDomain.save();
      }
    }

    // Eliminar dominio de Vercel si está verificado
    if (domain.isVerified && domain.fullDomain) {
      try {
        console.log(`Eliminando dominio ${domain.fullDomain} de Vercel...`);
        const vercel = new VercelIntegration();
        const vercelResponse = await vercel.removeDomain(domain.fullDomain);
        
        if (vercelResponse.data) {
          console.log(`Dominio ${domain.fullDomain} eliminado exitosamente de Vercel`);
        } else {
          console.warn(`Error eliminando dominio de Vercel: ${vercelResponse.error?.message}`);
          // Continuar con la eliminación de la base de datos aunque falle Vercel
        }
      } catch (vercelError) {
        console.error('Error eliminando dominio de Vercel:', vercelError);
        // Continuar con la eliminación de la base de datos aunque falle Vercel
      }
    }

    await CustomDomain.findByIdAndDelete(domainId);

    return NextResponse.json({
      success: true,
      message: 'Dominio eliminado exitosamente',
    });
  } catch (error) {
    console.error('Error deleting domain:', error);
    return NextResponse.json(
      { error: { message: 'Error interno del servidor' } },
      { status: 500 }
    );
  }
}