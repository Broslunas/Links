import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import { connectDB } from '@/lib/db-utils';
import CustomDomain from '@/models/CustomDomain';
import User from '@/models/User';
import { v4 as uuidv4 } from 'uuid';
import { ApiResponse } from '@/types';
import { sendDomainNotification } from '@/lib/domain-notification-service';

// Función para crear dominio en Vercel
async function createVercelDomain(
  domain: string
): Promise<{
  success: boolean;
  domainId?: string;
  configId?: string;
  error?: string;
}> {
  try {
    const vercelToken = process.env.VERCEL_TOKEN;
    const vercelTeamId = process.env.VERCEL_TEAM_ID;

    if (!vercelToken) {
      throw new Error('VERCEL_TOKEN no está configurado');
    }

    // Crear el dominio en Vercel
    const createDomainResponse = await fetch(
      `https://api.vercel.com/v9/projects/${process.env.VERCEL_PROJECT_ID}/domains`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${vercelToken}`,
          'Content-Type': 'application/json',
          ...(vercelTeamId && { 'X-Vercel-Team-Id': vercelTeamId }),
        },
        body: JSON.stringify({
          name: domain,
        }),
      }
    );

    if (!createDomainResponse.ok) {
      const errorData = await createDomainResponse.json();
      throw new Error(
        errorData.error?.message || 'Error creando dominio en Vercel'
      );
    }

    const domainData = await createDomainResponse.json();

    return {
      success: true,
      domainId: domainData.name,
      configId: domainData.configId,
    };
  } catch (error) {
    console.error('Error creating Vercel domain:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

export interface CreateDomainRequest {
  domain: string;
  subdomain?: string;
}

export interface CustomDomainResponse {
  _id: string;
  domain: string;
  subdomain?: string;
  fullDomain: string;
  isVerified: boolean;
  isActive: boolean;
  verificationToken: string;
  dnsRecords: {
    type: 'CNAME' | 'A';
    name: string;
    value: string;
    ttl?: number;
  }[];
  sslStatus: 'pending' | 'active' | 'error';
  sslError?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// GET /api/domains - Obtener dominios del usuario
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { message: 'No autorizado' } },
        { status: 401 }
      );
    }

    await connectDB();

    const domains = await CustomDomain.find({
      userId: session.user.id,
    }).sort({ createdAt: -1 });

    const domainsResponse: CustomDomainResponse[] = domains.map(domain => ({
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
    }));

    return NextResponse.json({
      success: true,
      data: domainsResponse,
    });
  } catch (error) {
    console.error('Error fetching domains:', error);
    return NextResponse.json(
      { error: { message: 'Error interno del servidor' } },
      { status: 500 }
    );
  }
}

// POST /api/domains - Crear nuevo dominio personalizado
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { message: 'No autorizado' } },
        { status: 401 }
      );
    }

    const body: CreateDomainRequest = await request.json();
    const { domain, subdomain } = body;

    if (!domain) {
      return NextResponse.json(
        { error: { message: 'El dominio es requerido' } },
        { status: 400 }
      );
    }

    await connectDB();

    // Construir el dominio completo
    const fullDomain = subdomain ? `${subdomain}.${domain}` : domain;

    // Verificar si el dominio ya existe
    const existingDomain = await CustomDomain.findOne({ fullDomain });
    if (existingDomain) {
      return NextResponse.json(
        { error: { message: 'Este dominio ya está en uso' } },
        { status: 409 }
      );
    }

    // Verificar límite de dominios por usuario (máximo 5)
    const userDomainsCount = await CustomDomain.countDocuments({
      userId: session.user.id,
    });
    if (userDomainsCount >= 5) {
      return NextResponse.json(
        {
          error: {
            message:
              'Has alcanzado el límite máximo de 5 dominios personalizados',
          },
        },
        { status: 400 }
      );
    }

    // Generar token de verificación
    const verificationToken = uuidv4();

    // Generar registros DNS requeridos
    const dnsRecords = [
      {
        type: 'CNAME' as const,
        name: subdomain || '@',
        value: 'dns.broslunas.link',
        ttl: 3600,
      },
    ];

    // Crear el dominio en Vercel inmediatamente
    const vercelResult = await createVercelDomain(fullDomain);

    // Crear el dominio en la base de datos
    const newDomain = new CustomDomain({
      userId: session.user.id,
      domain,
      subdomain,
      fullDomain,
      verificationToken,
      dnsRecords,
      isDefault: userDomainsCount === 0, // Primer dominio es por defecto
      vercelDomainId: vercelResult.success ? vercelResult.domainId : undefined,
      vercelConfigurationId: vercelResult.success
        ? vercelResult.configId
        : undefined,
    });

    await newDomain.save();

    // Obtener información del usuario para la notificación
    try {
      const user = await User.findById(session.user.id);
      if (user && user.email && user.name) {
        // Enviar notificación por email de dominio añadido
        await sendDomainNotification({
          userEmail: user.email,
          userName: user.name,
          domainId: newDomain._id.toString(),
          domain: newDomain.fullDomain,
          status: 'added',
        });
        console.log('Domain creation notification sent successfully');
      } else {
        console.warn('User not found or missing email/name for notification:', {
          userId: session.user.id,
          userFound: !!user,
          hasEmail: user?.email ? true : false,
          hasName: user?.name ? true : false,
        });
      }
    } catch (notificationError) {
      console.error(
        'Error sending domain creation notification:',
        notificationError
      );
      // No lanzamos el error para que no afecte el flujo principal
    }

    const domainResponse: CustomDomainResponse = {
      _id: newDomain._id.toString(),
      domain: newDomain.domain,
      subdomain: newDomain.subdomain,
      fullDomain: newDomain.fullDomain,
      isVerified: newDomain.isVerified,
      isActive: newDomain.isActive,
      verificationToken: newDomain.verificationToken,
      dnsRecords: newDomain.dnsRecords,
      sslStatus: newDomain.sslStatus,
      sslError: newDomain.sslError,
      isDefault: newDomain.isDefault,
      createdAt: newDomain.createdAt.toISOString(),
      updatedAt: newDomain.updatedAt.toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        data: domainResponse,
        message:
          'Dominio creado exitosamente. Configura los registros DNS para verificarlo.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating domain:', error);
    return NextResponse.json(
      { error: { message: 'Error interno del servidor' } },
      { status: 500 }
    );
  }
}
