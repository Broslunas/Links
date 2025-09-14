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

    // Obtener estadísticas básicas
     const [totalClicks, totalLinks, totalUsers] = await Promise.all([
       AnalyticsEvent.countDocuments({
         timestamp: {
           $gte: startDate
         }
       }),
       Link.countDocuments(),
       User.countDocuments()
     ]);

    // Clics de hoy
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const clicksToday = await AnalyticsEvent.countDocuments({
       timestamp: {
         $gte: todayStart
       }
     });

    // Clics de esta semana
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const clicksThisWeek = await AnalyticsEvent.countDocuments({
       timestamp: {
         $gte: weekStart
       }
     });

    // Clics de este mes
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const clicksThisMonth = await AnalyticsEvent.countDocuments({
       timestamp: {
         $gte: monthStart
       }
     });

    // Enlaces más populares
    const topLinksAggregation = await AnalyticsEvent.aggregate([
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
        $limit: 10
      }
    ]);

    // Obtener detalles de los enlaces más populares
    const topLinkIds = topLinksAggregation.map(item => item._id);
    const linkDetails = await Link.find({ _id: { $in: topLinkIds } });
    
    const formattedTopLinks = topLinksAggregation.map(item => {
      const link = linkDetails.find(l => (l._id as any).toString() === item._id.toString());
      return {
        id: item._id,
        slug: link?.slug || '',
        title: link?.title || link?.slug || '',
        url: link?.originalUrl || '',
        clicks: item.clicks
      };
    });

    // Clics por día (últimos 7 días para el gráfico)
    const clicksByDay = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const clicks = await AnalyticsEvent.countDocuments({
         timestamp: {
           $gte: date,
           $lt: nextDay
         }
       });
      
      clicksByDay.push({
        date: date.toISOString().split('T')[0],
        clicks
      });
    }

    // Actividad de usuarios (últimos 7 días)
    const userActivity = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const [newUsers, activeUserIds] = await Promise.all([
        User.countDocuments({
          createdAt: {
            $gte: date,
            $lt: nextDay
          }
        }),
        AnalyticsEvent.distinct('linkId', {
           timestamp: {
             $gte: date,
             $lt: nextDay
           }
         })
      ]);
      
      userActivity.push({
        date: date.toISOString().split('T')[0],
        newUsers,
        activeUsers: activeUserIds.length
      });
    }

    // Estadísticas de dispositivos
     const deviceStatsAggregation = await AnalyticsEvent.aggregate([
       {
         $match: {
           timestamp: { $gte: startDate }
         }
       },
       {
         $group: {
           _id: '$device',
           count: { $sum: 1 }
         }
       }
     ]);

     const totalDeviceClicks = deviceStatsAggregation.reduce((sum, item) => sum + item.count, 0);
     const deviceStats = {
       desktop: Math.round(((deviceStatsAggregation.find(d => d._id === 'desktop')?.count || 0) / totalDeviceClicks) * 100) || 0,
       mobile: Math.round(((deviceStatsAggregation.find(d => d._id === 'mobile')?.count || 0) / totalDeviceClicks) * 100) || 0,
       tablet: Math.round(((deviceStatsAggregation.find(d => d._id === 'tablet')?.count || 0) / totalDeviceClicks) * 100) || 0
     };

     // Estadísticas por país
     const countryStatsAggregation = await AnalyticsEvent.aggregate([
       {
         $match: {
           timestamp: { $gte: startDate }
         }
       },
       {
         $group: {
           _id: '$country',
           clicks: { $sum: 1 }
         }
       },
       {
         $sort: { clicks: -1 }
       },
       {
         $limit: 10
       }
     ]);

     const totalCountryClicks = countryStatsAggregation.reduce((sum, item) => sum + item.clicks, 0);
     const countryStats = countryStatsAggregation.map(item => ({
       country: item._id || 'Desconocido',
       clicks: item.clicks,
       percentage: Math.round((item.clicks / totalCountryClicks) * 100)
     }));

    const analyticsData = {
      totalClicks,
      totalLinks,
      totalUsers,
      clicksToday,
      clicksThisWeek,
      clicksThisMonth,
      topLinks: formattedTopLinks,
      clicksByDay,
      userActivity,
      deviceStats,
      countryStats
    };

    return NextResponse.json({
      success: true,
      data: analyticsData
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}