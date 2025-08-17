import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth-simple';
import { connectDB } from '../../../../lib/db-utils';
import { aggregateLinkStats } from '../../../../lib/analytics-aggregation';
import Link from '../../../../models/Link';
import { ApiResponse } from '../../../../types';
import { subDays, startOfDay, endOfDay } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        timestamp: new Date().toISOString(),
      }, { status: 401 });
    }

    const { days = 30 } = await request.json();

    await connectDB();

    // Get user's links
    const links = await Link.find({ userId: session.user.id, isActive: true });
    
    if (links.length === 0) {
      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          summary: 'No tienes enlaces activos para analizar. Crea tu primer enlace para comenzar a ver estadísticas.',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Calculate date range
    const endDate = endOfDay(new Date());
    const startDate = startOfDay(subDays(endDate, days));

    // Fetch analytics for all links
    const analyticsPromises = links.map(async (link) => {
      try {
        const stats = await aggregateLinkStats(link._id.toString(), {
          startDate,
          endDate,
        });
        return {
          slug: link.slug,
          title: link.title,
          stats,
        };
      } catch (error) {
        console.error(`Error fetching stats for link ${link.slug}:`, error);
        return null;
      }
    });

    const analyticsResults = await Promise.all(analyticsPromises);
    const validResults = analyticsResults.filter(result => result !== null);

    // Aggregate data
    let totalClicks = 0;
    let totalLinks = validResults.length;
    const topLinks: Array<{ slug: string; title?: string; clicks: number }> = [];
    const countriesMap = new Map<string, number>();
    const devicesMap = new Map<string, number>();
    const browsersMap = new Map<string, number>();

    validResults.forEach(result => {
      if (!result) return;
      
      const { stats, slug, title } = result;
      totalClicks += stats.totalClicks;
      
      if (stats.totalClicks > 0) {
        topLinks.push({ slug, title, clicks: stats.totalClicks });
      }

      // Aggregate countries
      stats.clicksByCountry.forEach((country: any) => {
        const current = countriesMap.get(country.country) || 0;
        countriesMap.set(country.country, current + country.clicks);
      });

      // Aggregate devices
      stats.clicksByDevice.forEach((device: any) => {
        const current = devicesMap.get(device.device) || 0;
        devicesMap.set(device.device, current + device.clicks);
      });

      // Aggregate browsers
      stats.clicksByBrowser.forEach((browser: any) => {
        const current = browsersMap.get(browser.browser) || 0;
        browsersMap.set(browser.browser, current + browser.clicks);
      });
    });

    // Sort and get top items
    const sortedTopLinks = topLinks.sort((a, b) => b.clicks - a.clicks).slice(0, 5);
    const topCountries = Array.from(countriesMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([country, clicks]) => ({ country, clicks }));
    const topDevices = Array.from(devicesMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([device, clicks]) => ({ device, clicks }));
    const topBrowsers = Array.from(browsersMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([browser, clicks]) => ({ browser, clicks }));

    // Generate AI-like summary
    const avgClicksPerLink = totalLinks > 0 ? Math.round(totalClicks / totalLinks) : 0;
    const bestPerformingLink = sortedTopLinks[0];
    const topCountry = topCountries[0];
    const topDevice = topDevices[0];
    const topBrowser = topBrowsers[0];

    let summary = `📊 **Resumen de tus analíticas (últimos ${days} días)**\n\n`;
    
    // Overall performance
    summary += `🎯 **Rendimiento General:**\n`;
    summary += `• Tienes **${totalLinks} enlaces activos** que han generado **${totalClicks.toLocaleString()} clicks** en total\n`;
    summary += `• Promedio de **${avgClicksPerLink} clicks por enlace**\n\n`;

    // Best performing content
    if (bestPerformingLink) {
      summary += `🏆 **Mejor Rendimiento:**\n`;
      summary += `• Tu enlace más exitoso es "**${bestPerformingLink.title || bestPerformingLink.slug}**" con **${bestPerformingLink.clicks} clicks**\n`;
      
      if (sortedTopLinks.length > 1) {
        summary += `• Otros enlaces destacados: ${sortedTopLinks.slice(1, 3).map(link => `"${link.title || link.slug}" (${link.clicks})`).join(', ')}\n`;
      }
      summary += `\n`;
    }

    // Geographic insights
    if (topCountry) {
      summary += `🌍 **Alcance Geográfico:**\n`;
      summary += `• Tu audiencia principal está en **${topCountry.country}** (${topCountry.clicks} clicks)\n`;
      if (topCountries.length > 1) {
        summary += `• También tienes buena presencia en: ${topCountries.slice(1).map(c => `${c.country} (${c.clicks})`).join(', ')}\n`;
      }
      summary += `\n`;
    }

    // Technical insights
    if (topDevice) {
      summary += `📱 **Preferencias Técnicas:**\n`;
      summary += `• La mayoría de tus usuarios acceden desde **${topDevice.device}** (${topDevice.clicks} clicks)\n`;
      if (topBrowser) {
        summary += `• Navegador más usado: **${topBrowser.browser}** (${topBrowser.clicks} clicks)\n`;
      }
      summary += `\n`;
    }

    // Recommendations
    summary += `💡 **Recomendaciones:**\n`;
    if (avgClicksPerLink < 10) {
      summary += `• Considera optimizar tus títulos y descripciones para aumentar el engagement\n`;
      summary += `• Comparte tus enlaces en más plataformas para aumentar la visibilidad\n`;
    } else if (avgClicksPerLink < 50) {
      summary += `• ¡Buen trabajo! Tus enlaces tienen un rendimiento sólido\n`;
      summary += `• Analiza qué hace exitoso a "${bestPerformingLink?.title || bestPerformingLink?.slug}" y aplícalo a otros enlaces\n`;
    } else {
      summary += `• ¡Excelente rendimiento! Tus enlaces están generando gran engagement\n`;
      summary += `• Considera crear más contenido similar a tus enlaces más exitosos\n`;
    }
    
    if (topCountries.length > 2) {
      summary += `• Tu contenido tiene alcance internacional - considera crear contenido específico para diferentes regiones\n`;
    }
    
    if (topDevice.device === 'mobile' && topDevice.clicks > totalClicks * 0.7) {
      summary += `• La mayoría de tu audiencia es móvil - asegúrate de que tus páginas de destino estén optimizadas para móviles\n`;
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        summary,
        stats: {
          totalLinks,
          totalClicks,
          avgClicksPerLink,
          topLinks: sortedTopLinks,
          topCountries,
          topDevices,
          topBrowsers,
        },
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error generating analytics summary:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to generate analytics summary',
      },
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}