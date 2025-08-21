import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-simple';
import dbConnect from '@/lib/mongodb';
import Link from '@/models/Link';
import User from '@/models/User';
import AnalyticsEvent from '@/models/AnalyticsEvent';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Conectar a la base de datos
    await dbConnect();

    // Verificar que el usuario sea admin
    const user = await User.findOne({ email: session.user.email });
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Acceso denegado. Se requieren permisos de administrador.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';

    // Calcular fechas según el período
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Obtener datos para el reporte
    const [topLinksAggregation, analyticsEvents, users] = await Promise.all([
      // Enlaces más populares
      AnalyticsEvent.aggregate([
        {
          $match: {
            timestamp: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$linkId',
            clicks: { $sum: 1 }
          }
        },
        {
          $sort: { clicks: -1 }
        },
        {
          $limit: 100
        }
      ]),
      
      // Eventos de analytics detallados
      AnalyticsEvent.find({
        timestamp: { $gte: startDate }
      })
      .populate('linkId', 'slug title originalUrl')
      .sort({ timestamp: -1 })
      .limit(1000)
      .lean(),
      
      // Nuevos usuarios
      User.find({
        createdAt: { $gte: startDate }
      })
      .select('email name createdAt')
      .sort({ createdAt: -1 })
      .lean()
    ]);

    // Obtener detalles de los enlaces más populares
    const topLinkIds = topLinksAggregation.map(item => item._id);
    const linkDetails = await Link.find({ _id: { $in: topLinkIds } }).lean();
    
    const links = topLinksAggregation.map(item => {
      const link = linkDetails.find(l => (l._id as any).toString() === item._id.toString());
      return {
        slug: link?.slug || '',
        title: link?.title || link?.slug || '',
        url: link?.originalUrl || '',
        createdAt: link?.createdAt || new Date(),
        isActive: link?.isActive || false,
        isDisabledByAdmin: link?.isDisabledByAdmin || false,
        user: {
          name: link?.userId?.name || '',
          email: link?.userId?.email || ''
        },
        _count: {
          clicks: item.clicks
        }
      };
    });

    // Obtener conteo de enlaces por usuario
    const userLinkCounts = await Link.aggregate([
      {
        $group: {
          _id: '$userId',
          linkCount: { $sum: 1 }
        }
      }
    ]);

    // Agregar conteo de enlaces a los usuarios
    const usersWithCounts = users.map(user => {
      const linkCount = userLinkCounts.find(uc => uc._id.toString() === (user._id as any).toString());
      return {
        ...user,
        _count: {
          links: linkCount?.linkCount || 0
        }
      };
    });

    // Mapear eventos de analytics a formato de clicks
    const clicks = analyticsEvents.map(event => ({
      id: event._id,
      createdAt: event.timestamp,
      userAgent: event.userAgent || '',
      referer: event.referer || '',
      link: {
        slug: event.linkId?.slug || '',
        title: event.linkId?.title || '',
        user: {
          name: '',
          email: ''
        }
      }
    }));

    // Generar CSV
    let csvContent = '';
    
    // Sección de resumen
    csvContent += 'REPORTE DE ANALÍTICAS\n';
    csvContent += `Período: ${period}\n`;
    csvContent += `Fecha de generación: ${new Date().toLocaleString('es-ES')}\n\n`;
    
    // Enlaces más populares
    csvContent += 'ENLACES MÁS POPULARES\n';
    csvContent += 'Posición,Slug,Título,URL,Propietario,Clics,Estado,Fecha de creación\n';
    
    links.forEach((link, index) => {
      const status = link.isDisabledByAdmin ? 'Deshabilitado por admin' : 
                    link.isActive ? 'Activo' : 'Inactivo';
      csvContent += `${index + 1},"${link.slug}","${link.title || ''}","${link.url}","${link.user?.name || link.user?.email || 'N/A'}",${link._count.clicks},"${status}","${link.createdAt.toLocaleString('es-ES')}"\n`;
    });
    
    csvContent += '\n';
    
    // Clics detallados
    csvContent += 'CLICS DETALLADOS\n';
    csvContent += 'ID,Fecha,Enlace,Título,Propietario,User Agent,Referer\n';
    
    clicks.forEach(click => {
      csvContent += `"${click.id}","${click.createdAt.toLocaleString('es-ES')}","${click.link.slug}","${click.link.title || ''}","${click.link.user?.name || click.link.user?.email || 'N/A'}","${click.userAgent || ''}","${click.referer || ''}"\n`;
    });
    
    csvContent += '\n';
    
    // Usuarios nuevos
    csvContent += 'USUARIOS NUEVOS\n';
    csvContent += 'ID,Nombre,Email,Rol,Enlaces creados,Fecha de registro\n';
    
    usersWithCounts.forEach(user => {
       const userData = user as any;
       csvContent += `"${userData._id}","${userData.name || ''}","${userData.email}","${userData.role || 'user'}",${userData._count.links},"${userData.createdAt.toLocaleString('es-ES')}"\n`;
     });

    // Configurar headers para descarga de archivo CSV
    const headers = new Headers();
    headers.set('Content-Type', 'text/csv; charset=utf-8');
    headers.set('Content-Disposition', `attachment; filename="analytics-report-${period}-${new Date().toISOString().split('T')[0]}.csv"`);
    
    // Agregar BOM para UTF-8 para que Excel lo reconozca correctamente
    const bom = '\uFEFF';
    const csvWithBom = bom + csvContent;
    
    return new NextResponse(csvWithBom, {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Error exporting analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}