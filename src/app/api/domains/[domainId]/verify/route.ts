import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import { connectDB } from '@/lib/db-utils';
import CustomDomain from '@/models/CustomDomain';
import User from '@/models/User';
import mongoose from 'mongoose';
import { VercelIntegration } from '@/lib/vercel-integration';
import { CustomDomainResponse } from '../../route';
import { sendDomainNotification } from '@/lib/domain-notification-service';

// Función para verificar DNS usando una API externa o método nativo
async function verifyDNSRecord(
  domain: string,
  expectedValue: string
): Promise<boolean> {
  try {
    console.log(
      `Verificando DNS para dominio: ${domain}, valor esperado: ${expectedValue}`
    );

    // Ejemplo usando fetch a una API de DNS pública
    const response = await fetch(
      `https://dns.google/resolve?name=${domain}&type=CNAME`,
      {
        headers: {
          Accept: 'application/dns-json',
        },
      }
    );

    if (!response.ok) {
      console.log(
        `Error en respuesta DNS: ${response.status} ${response.statusText}`
      );
      return false;
    }

    const data = await response.json();
    console.log('Respuesta DNS:', JSON.stringify(data, null, 2));

    // Verificar si alguna respuesta coincide con el valor esperado
    if (data.Answer) {
      const found = data.Answer.some((answer: any) => {
        const answerData = answer.data;
        console.log(`Comparando: ${answerData} con ${expectedValue}`);
        return (
          answerData &&
          answerData.toLowerCase().includes(expectedValue.toLowerCase())
        );
      });
      console.log(`DNS verificado: ${found}`);
      return found;
    }

    // Si no hay respuestas CNAME, verificar si el dominio apunta directamente a Vercel
    if (data.Status === 0 && !data.Answer) {
      console.log(
        'No se encontraron registros CNAME, verificando registros A...'
      );

      // Intentar verificar registros A
      const aResponse = await fetch(
        `https://dns.google/resolve?name=${domain}&type=A`,
        {
          headers: {
            Accept: 'application/dns-json',
          },
        }
      );

      if (aResponse.ok) {
        const aData = await aResponse.json();
        console.log('Respuesta DNS A:', JSON.stringify(aData, null, 2));

        // Vercel IPs conocidas (esto puede cambiar, es mejor usar CNAME)
        const vercelIPs = ['76.76.19.61', '76.76.19.62'];
        if (aData.Answer) {
          const hasVercelIP = aData.Answer.some((answer: any) =>
            vercelIPs.includes(answer.data)
          );
          if (hasVercelIP) {
            console.log('Dominio apunta a IP de Vercel');
            return true;
          }
        }
      }
    }

    console.log('DNS no verificado - no se encontraron registros válidos');
    return false;
  } catch (error) {
    console.error('Error verifying DNS:', error);
    return false;
  }
}

// Función para verificar dominio en Vercel
async function verifyVercelDomain(
  domain: string
): Promise<{ success: boolean; verified: boolean; error?: string }> {
  try {
    const vercelToken = process.env.VERCEL_TOKEN;
    const vercelTeamId = process.env.VERCEL_TEAM_ID;

    if (!vercelToken) {
      throw new Error('VERCEL_TOKEN no está configurado');
    }

    // Verificar el estado del dominio en Vercel
    const verifyDomainResponse = await fetch(
      `https://api.vercel.com/v9/projects/${process.env.VERCEL_PROJECT_ID}/domains/${domain}/verify`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${vercelToken}`,
          'Content-Type': 'application/json',
          ...(vercelTeamId && { 'X-Vercel-Team-Id': vercelTeamId }),
        },
      }
    );

    if (!verifyDomainResponse.ok) {
      const errorData = await verifyDomainResponse.json();
      return {
        success: false,
        verified: false,
        error:
          errorData.error?.message || 'Error verificando dominio en Vercel',
      };
    }

    const verificationData = await verifyDomainResponse.json();

    return {
      success: true,
      verified: verificationData.verified || false,
    };
  } catch (error) {
    console.error('Error verifying Vercel domain:', error);
    return {
      success: false,
      verified: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

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

      // Si el dominio ya existe, no es un error fatal
      if (
        errorData.error?.code === 'domain_already_in_use' ||
        errorData.error?.message?.includes('already in use')
      ) {
        console.log(
          `Dominio ${domain} ya existe en Vercel, continuando con verificación`
        );
        return {
          success: true,
          domainId: domain,
          configId: undefined,
        };
      }

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

// POST /api/domains/[domainId]/verify - Verificar dominio
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

    if (domain.isVerified) {
      return NextResponse.json(
        { error: { message: 'El dominio ya está verificado' } },
        { status: 400 }
      );
    }

    // Verificar si se han alcanzado los intentos máximos
    if (domain.verificationAttempts >= domain.maxVerificationAttempts) {
      return NextResponse.json(
        {
          error: {
            message:
              'Se han agotado los intentos de verificación. Contacta con soporte.',
          },
        },
        { status: 400 }
      );
    }

    // Incrementar intentos de verificación
    domain.verificationAttempts += 1;
    domain.lastVerificationCheck = new Date();

    console.log(`Iniciando verificación para dominio: ${domain.fullDomain}`);
    console.log(`Registros DNS configurados:`, domain.dnsRecords);

    // Crear dominio en Vercel si no existe
    let vercelResult: {
      success: boolean;
      domainId?: string;
      configId?: string;
      error?: string;
    } = {
      success: true,
      domainId: domain.vercelDomainId || undefined,
      configId: domain.vercelConfigurationId || undefined,
    };

    if (!domain.vercelDomainId) {
      console.log(`Creando dominio en Vercel: ${domain.fullDomain}`);
      vercelResult = await createVercelDomain(domain.fullDomain);

      if (!vercelResult.success) {
        await domain.save();
        return NextResponse.json(
          {
            error: {
              message: `Error configurando dominio en Vercel: ${vercelResult.error}`,
            },
          },
          { status: 500 }
        );
      }

      // Actualizar los IDs de Vercel en el dominio
      domain.vercelDomainId = vercelResult.domainId;
      domain.vercelConfigurationId = vercelResult.configId;
      console.log(`Dominio creado en Vercel con ID: ${vercelResult.domainId}`);
    }

    // Verificar dominio en Vercel
    console.log(`Verificando dominio en Vercel: ${domain.fullDomain}`);
    const vercelVerification = await verifyVercelDomain(domain.fullDomain);

    if (!vercelVerification.success) {
      await domain.save();
      return NextResponse.json(
        {
          error: {
            message: `Error verificando dominio en Vercel: ${vercelVerification.error}`,
            details: {
              domain: domain.fullDomain,
              verificationAttempts: domain.verificationAttempts,
              maxAttempts: domain.maxVerificationAttempts,
            },
          },
        },
        { status: 500 }
      );
    }

    if (!vercelVerification.verified) {
      await domain.save();

      const expectedValue = domain.dnsRecords[0]?.value || 'dns.broslunas.link';
      const dnsInstructions = domain.subdomain
        ? `Configura un registro CNAME para "${domain.subdomain}" apuntando a "${expectedValue}"`
        : `Configura un registro CNAME para "@" o "${domain.domain}" apuntando a "${expectedValue}"`;

      return NextResponse.json(
        {
          error: {
            message:
              'El dominio aún no está verificado en Vercel. Asegúrate de que los registros DNS estén configurados correctamente.',
            details: {
              domain: domain.fullDomain,
              expectedCNAME: expectedValue,
              instructions: dnsInstructions,
              note: 'Los cambios DNS pueden tomar hasta 48 horas en propagarse. Intenta nuevamente en unos minutos.',
              debugInfo: {
                verificationAttempts: domain.verificationAttempts,
                maxAttempts: domain.maxVerificationAttempts,
                lastCheck: domain.lastVerificationCheck,
              },
            },
          },
        },
        { status: 400 }
      );
    }

    // Actualizar dominio como verificado
    domain.isVerified = true;
    domain.vercelDomainId = vercelResult.domainId;
    domain.vercelConfigurationId = vercelResult.configId;
    domain.sslStatus = 'pending'; // SSL se configurará automáticamente

    await domain.save();

    // Obtener información del usuario para la notificación
    try {
      const user = await User.findById(session.user.id);
      if (user && user.email && user.name) {
        // Enviar notificación por email de dominio verificado
        await sendDomainNotification({
          userEmail: user.email,
          userName: user.name,
          domainId: domain._id.toString(),
          domain: domain.fullDomain,
          status: 'verified',
        });
        console.log('Domain verification notification sent successfully');
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
        'Error sending domain verification notification:',
        notificationError
      );
      // No lanzamos el error para que no afecte el flujo principal
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
      message:
        'Dominio verificado exitosamente. El SSL se configurará automáticamente en unos minutos.',
    });
  } catch (error) {
    console.error('Error verifying domain:', error);
    return NextResponse.json(
      { error: { message: 'Error interno del servidor' } },
      { status: 500 }
    );
  }
}

// GET /api/domains/[domainId]/verify - Verificar estado SSL
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

    if (!domain.isVerified || !domain.vercelDomainId) {
      return NextResponse.json(
        { error: { message: 'El dominio no está verificado' } },
        { status: 400 }
      );
    }

    // Verificar estado SSL en Vercel
    try {
      const vercelToken = process.env.VERCEL_TOKEN;
      const vercelTeamId = process.env.VERCEL_TEAM_ID;

      if (!vercelToken) {
        throw new Error('VERCEL_TOKEN no está configurado');
      }

      const response = await fetch(
        `https://api.vercel.com/v9/projects/${process.env.VERCEL_PROJECT_ID}/domains/${domain.vercelDomainId}`,
        {
          headers: {
            Authorization: `Bearer ${vercelToken}`,
            ...(vercelTeamId && { 'X-Vercel-Team-Id': vercelTeamId }),
          },
        }
      );

      if (response.ok) {
        const domainInfo = await response.json();

        // Actualizar estado SSL
        if (
          domainInfo.verified &&
          !domainInfo.verification?.some((v: any) => v.reason)
        ) {
          domain.sslStatus = 'active';
          domain.sslError = undefined;
        } else if (domainInfo.verification?.some((v: any) => v.reason)) {
          domain.sslStatus = 'error';
          domain.sslError = domainInfo.verification.find(
            (v: any) => v.reason
          )?.reason;
        }

        await domain.save();
      }
    } catch (error) {
      console.error('Error checking SSL status:', error);
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
    console.error('Error checking domain status:', error);
    return NextResponse.json(
      { error: { message: 'Error interno del servidor' } },
      { status: 500 }
    );
  }
}
