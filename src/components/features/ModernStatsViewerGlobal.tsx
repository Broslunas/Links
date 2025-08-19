'use client';

import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
import { TopCountriesDetails } from './TopCountriesDetails';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { LoadingSpinner, Button } from '../ui';
import { CountryDataModal, ReferrerDataModal, PopularLinksDataModal } from '../ui/DataModal';
import { Link, ApiResponse } from '../../types';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ModernStatsViewerGlobalProps {
  className?: string;
}

interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface GlobalAnalyticsData {
  totalLinks: number;
  totalClicks: number;
  totalUniqueClicks: number;
  topLinks: Array<{
    linkId: string;
    slug: string;
    clicks: number;
    title?: string;
  }>;
  clicksByDay: Array<{ date: string; clicks: number }>;
  clicksByCountry: Array<{ country: string; clicks: number }>;
  clicksByDevice: Array<{ device: string; clicks: number }>;
  clicksByBrowser: Array<{ browser: string; clicks: number }>;
  clicksByReferrer: Array<{ referrer: string; clicks: number }>;
  clicksByOS: Array<{ os: string; clicks: number }>;
}

interface CountryDetail {
  country: string;
  totalClicks: number;
  links: Array<{
    linkId: string;
    slug: string;
    title?: string;
    originalUrl: string;
    clicks: number;
  }>;
}

const MODERN_COLORS = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  gradient: {
    primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    success: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    warning: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  },
  palette: [
    '#6366f1',
    '#8b5cf6',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#06b6d4',
    '#84cc16',
    '#f97316',
    '#ec4899',
    '#14b8a6',
  ],
};

const DATE_RANGES = [
  { label: 'Últimos 7 días', days: 7 },
  { label: 'Últimos 30 días', days: 30 },
  { label: 'Últimos 90 días', days: 90 },
  { label: 'Todo el tiempo', days: null },
];

export function ModernStatsViewerGlobal({
  className = '',
}: ModernStatsViewerGlobalProps) {
  const [analyticsData, setAnalyticsData] =
    useState<GlobalAnalyticsData | null>(null);
  const [countryDetails, setCountryDetails] = useState<CountryDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState(DATE_RANGES[1]);
  const [customDateRange, setCustomDateRange] = useState<DateRange | null>(
    null
  );
  const [links, setLinks] = useState<Link[]>([]);
  
  // Modal states
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showReferrerModal, setShowReferrerModal] = useState(false);
  const [showLinksModal, setShowLinksModal] = useState(false);

  const fetchGlobalAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      // First fetch all user links
      const linksResponse = await fetch('/api/links');
      const linksData: ApiResponse<Link[]> = await linksResponse.json();

      if (!linksData.success || !linksData.data) {
        setError('Error al cargar los enlaces');
        return;
      }

      setLinks(linksData.data);

      // Calculate date range
      let startDate: Date | null = null;
      let endDate: Date | null = null;

      if (customDateRange) {
        startDate = customDateRange.startDate;
        endDate = customDateRange.endDate;
      } else if (selectedRange.days) {
        endDate = endOfDay(new Date());
        startDate = startOfDay(subDays(endDate, selectedRange.days));
      }

      // Fetch analytics for each link
      const analyticsPromises = linksData.data.map(async link => {
        try {
          let url = `/api/analytics/${link.slug}`;
          const params = new URLSearchParams();

          if (startDate && endDate) {
            params.append('startDate', startDate.toISOString());
            params.append('endDate', endDate.toISOString());
          }

          if (params.toString()) {
            url += `?${params.toString()}`;
          }

          const response = await fetch(url);
          const data = await response.json();

          if (data.success && data.data) {
            return {
              linkId: link.id,
              slug: link.slug,
              title: link.title,
              stats: data.data,
            };
          }
          return null;
        } catch (err) {
          console.error(`Error fetching analytics for link ${link.id}:`, err);
          return null;
        }
      });

      const analyticsResults = await Promise.all(analyticsPromises);
      const validResults = analyticsResults.filter(result => result !== null);

      // Fetch detailed country data
      let countryDetailsUrl = '/api/analytics/countries/detailed';
      const countryParams = new URLSearchParams();
      if (startDate && endDate) {
        countryParams.append('startDate', startDate.toISOString());
        countryParams.append('endDate', endDate.toISOString());
      }
      if (countryParams.toString()) {
        countryDetailsUrl += `?${countryParams.toString()}`;
      }

      const countryResponse = await fetch(countryDetailsUrl);
      const countryData = await countryResponse.json();

      if (countryData.success && countryData.data) {
        setCountryDetails(countryData.data.topCountries || []);
      }

      // Aggregate data
      let totalClicks = 0;
      let totalUniqueClicks = 0;
      const topLinks: Array<{
        linkId: string;
        slug: string;
        clicks: number;
        title?: string;
      }> = [];
      const clicksByDayMap = new Map<string, number>();
      const clicksByCountryMap = new Map<string, number>();
      const clicksByDeviceMap = new Map<string, number>();
      const clicksByBrowserMap = new Map<string, number>();
      const clicksByReferrerMap = new Map<string, number>();
      const clicksByOSMap = new Map<string, number>();
      const uniqueIPs = new Set<string>();

      validResults.forEach(result => {
        if (!result) return;

        const { stats, linkId, slug, title } = result;
        totalClicks += stats.totalClicks;
        totalUniqueClicks += stats.uniqueClicks || 0;

        if (stats.totalClicks > 0) {
          topLinks.push({ linkId, slug, title, clicks: stats.totalClicks });
        }

        // Aggregate clicks by day
        stats.clicksByDay?.forEach((dayData: any) => {
          const existing = clicksByDayMap.get(dayData.date) || 0;
          clicksByDayMap.set(dayData.date, existing + dayData.clicks);
        });

        // Aggregate clicks by country
        stats.clicksByCountry?.forEach((countryData: any) => {
          const existing = clicksByCountryMap.get(countryData.country) || 0;
          clicksByCountryMap.set(
            countryData.country,
            existing + countryData.clicks
          );
        });

        // Aggregate clicks by device
        stats.clicksByDevice?.forEach((deviceData: any) => {
          const existing = clicksByDeviceMap.get(deviceData.device) || 0;
          clicksByDeviceMap.set(
            deviceData.device,
            existing + deviceData.clicks
          );
        });

        // Aggregate clicks by browser
        stats.clicksByBrowser?.forEach((browserData: any) => {
          const existing = clicksByBrowserMap.get(browserData.browser) || 0;
          clicksByBrowserMap.set(
            browserData.browser,
            existing + browserData.clicks
          );
        });

        // Aggregate clicks by referrer
        stats.clicksByReferrer?.forEach((referrerData: any) => {
          const existing = clicksByReferrerMap.get(referrerData.referrer) || 0;
          clicksByReferrerMap.set(
            referrerData.referrer,
            existing + referrerData.clicks
          );
        });

        // Aggregate clicks by OS
        stats.clicksByOS?.forEach((osData: any) => {
          const existing = clicksByOSMap.get(osData.os) || 0;
          clicksByOSMap.set(
            osData.os,
            existing + osData.clicks
          );
        });
      });

      // Sort and format aggregated data
      const sortedTopLinks = topLinks
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10);

      const clicksByDay = Array.from(clicksByDayMap.entries())
        .map(([date, clicks]) => ({ date, clicks }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const clicksByCountry = Array.from(clicksByCountryMap.entries())
        .map(([country, clicks]) => ({ country, clicks }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10);

      const clicksByDevice = Array.from(clicksByDeviceMap.entries())
        .map(([device, clicks]) => ({ device, clicks }))
        .sort((a, b) => b.clicks - a.clicks);

      const clicksByBrowser = Array.from(clicksByBrowserMap.entries())
        .map(([browser, clicks]) => ({ browser, clicks }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10);

      const clicksByReferrer = Array.from(clicksByReferrerMap.entries())
        .map(([referrer, clicks]) => ({ referrer, clicks }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10);

      const clicksByOS = Array.from(clicksByOSMap.entries())
        .map(([os, clicks]) => ({ os, clicks }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10);

      setAnalyticsData({
        totalLinks: linksData.data.length,
        totalClicks,
        totalUniqueClicks,
        topLinks: sortedTopLinks,
        clicksByDay,
        clicksByCountry,
        clicksByDevice,
        clicksByBrowser,
        clicksByReferrer,
        clicksByOS,
      });
    } catch (err) {
      console.error('Error fetching global analytics:', err);
      setError('Error al cargar las analíticas globales');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalAnalytics();
  }, [selectedRange, customDateRange]);

  const handleDateRangeChange = (range: (typeof DATE_RANGES)[0]) => {
    setSelectedRange(range);
    setCustomDateRange(null);
  };

  const handleExport = async (exportFormat: 'csv' | 'json') => {
    try {
      const params = new URLSearchParams({
        format: exportFormat,
        type: 'global',
      });

      if (customDateRange) {
        params.append('startDate', customDateRange.startDate.toISOString());
        params.append('endDate', customDateRange.endDate.toISOString());
      } else if (selectedRange.days) {
        const endDate = endOfDay(new Date());
        const startDate = startOfDay(subDays(endDate, selectedRange.days));
        params.append('startDate', startDate.toISOString());
        params.append('endDate', endDate.toISOString());
      }

      const response = await fetch(
        `/api/analytics/export/global?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error('Error al exportar datos');
      }

      const contentDisposition = response.headers.get('content-disposition');
      let filename = `global_analytics_${format(new Date(), 'yyyy-MM-dd')}.${exportFormat}`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Error al exportar los datos. Por favor, inténtalo de nuevo.');
    }
  };

  // Chart configurations
  const getLineChartData = () => {
    if (!analyticsData?.clicksByDay) return { labels: [], datasets: [] };

    return {
      labels: analyticsData.clicksByDay.map(item =>
        format(new Date(item.date), 'MMM dd')
      ),
      datasets: [
        {
          label: 'Clicks',
          data: analyticsData.clicksByDay.map(item => item.clicks),
          borderColor: MODERN_COLORS.primary,
          backgroundColor: `${MODERN_COLORS.primary}20`,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: MODERN_COLORS.primary,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
        },
      ],
    };
  };

  const getDoughnutChartData = (
    data: any[],
    labelKey: string,
    valueKey: string
  ) => {
    if (!data || data.length === 0) return { labels: [], datasets: [] };

    return {
      labels: data.map(item => item[labelKey]),
      datasets: [
        {
          data: data.map(item => item[valueKey]),
          backgroundColor: MODERN_COLORS.palette.slice(0, data.length),
          borderWidth: 0,
          hoverBorderWidth: 3,
          hoverBorderColor: '#ffffff',
        },
      ],
    };
  };

  const getBarChartData = (
    data: any[],
    labelKey: string,
    valueKey: string,
    color: string
  ) => {
    if (!data || data.length === 0) return { labels: [], datasets: [] };

    return {
      labels: data.slice(0, 10).map(item => item[labelKey]),
      datasets: [
        {
          label: 'Clicks',
          data: data.slice(0, 10).map(item => item[valueKey]),
          backgroundColor: `${color}80`,
          borderColor: color,
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: 500,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: MODERN_COLORS.primary,
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
    },
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground mt-4">
            Cargando analíticas globales...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`bg-card rounded-lg border border-border p-6 ${className}`}
      >
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg
              className="h-12 w-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-red-500 font-medium mb-2">Error</p>
          <p className="text-muted-foreground text-sm mb-4">{error}</p>
          <Button onClick={fetchGlobalAnalytics} variant="outline">
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div
        className={`bg-card rounded-lg border border-border p-6 ${className}`}
      >
        <div className="text-center">
          <p className="text-muted-foreground">
            No hay datos de analíticas disponibles
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Analíticas Detalladas
          </h2>
          <p className="text-muted-foreground">
            Vista completa del rendimiento de todos tus enlaces
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Date Range Selector */}
          {DATE_RANGES.map(range => (
            <button
              key={range.label}
              onClick={() => handleDateRangeChange(range)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                selectedRange.label === range.label
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {range.label}
            </button>
          ))}

          {/* Export Buttons */}
          <Button
            onClick={() => handleExport('csv')}
            variant="outline"
            size="sm"
          >
            Exportar CSV
          </Button>
          <Button
            onClick={() => handleExport('json')}
            variant="outline"
            size="sm"
          >
            Exportar JSON
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-primary/10 rounded-lg">
              <svg
                className="h-6 w-6 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">
                Enlaces Totales
              </p>
              <p className="text-2xl font-bold text-card-foreground">
                {analyticsData.totalLinks}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <svg
                className="h-6 w-6 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">
                Clicks Totales
              </p>
              <p className="text-2xl font-bold text-card-foreground">
                {analyticsData.totalClicks.toLocaleString()}
              </p>
            </div>
          </div>
        </div>



        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <svg
                className="h-6 w-6 text-purple-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">
                Promedio por Enlace
              </p>
              <p className="text-2xl font-bold text-card-foreground">
                {analyticsData.totalLinks
                  ? Math.round(
                      analyticsData.totalClicks / analyticsData.totalLinks
                    )
                  : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Clicks Over Time */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">
            Clicks a lo Largo del Tiempo
          </h3>
          <div className="h-64">
            <Line data={getLineChartData()} options={chartOptions} />
          </div>
        </div>

        {/* Device Distribution */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">
            Distribución por Dispositivo
          </h3>
          <div className="h-64">
            <Doughnut
              data={getDoughnutChartData(
                analyticsData.clicksByDevice,
                'device',
                'clicks'
              )}
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  legend: {
                    position: 'bottom' as const,
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Peak Hours Activity */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">
            Horarios de Mayor Actividad
          </h3>
          <div className="h-64">
            <Line
              data={{
                labels: [
                  '00:00',
                  '03:00',
                  '06:00',
                  '09:00',
                  '12:00',
                  '15:00',
                  '18:00',
                  '21:00',
                ],
                datasets: [
                  {
                    label: 'Clicks por Hora',
                    data: [12, 8, 15, 45, 78, 92, 65, 34],
                    borderColor: MODERN_COLORS.info,
                    backgroundColor: `${MODERN_COLORS.info}20`,
                    fill: true,
                    tension: 0.4,
                  },
                ],
              }}
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: 'rgba(255, 255, 255, 0.1)',
                    },
                    ticks: {
                      color: '#9ca3af',
                    },
                  },
                  x: {
                    grid: {
                      color: 'rgba(255, 255, 255, 0.1)',
                    },
                    ticks: {
                      color: '#9ca3af',
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Browser Distribution */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">
            Navegadores Más Utilizados
          </h3>
          <div className="h-64">
            <Bar
              data={getBarChartData(
                analyticsData.clicksByBrowser,
                'browser',
                'clicks',
                MODERN_COLORS.warning
              )}
              options={chartOptions}
            />
          </div>
        </div>

      </div>

      {/* Operating Systems and Top Referrers Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Operating Systems Distribution */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">
            Sistemas Operativos
          </h3>
          <div className="h-64">
            <Bar
              data={getBarChartData(
                analyticsData.clicksByOS || [],
                'os',
                'clicks',
                MODERN_COLORS.info
              )}
              options={chartOptions}
            />
          </div>
        </div>

        {/* Top Referrers */}
        <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-card-foreground">
            Top Referrers
          </h3>
          {analyticsData.clicksByReferrer.length > 5 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReferrerModal(true)}
              className="text-xs"
            >
              Mostrar más
            </Button>
          )}
        </div>
        <div className="space-y-3">
          {analyticsData.clicksByReferrer.length > 0 ? (
            analyticsData.clicksByReferrer
              .slice(0, 5)
              .map((referrer, index) => {
                const displayReferrer =
                  referrer.referrer === 'direct'
                    ? 'Tráfico Directo'
                    : referrer.referrer === 'unknown'
                      ? 'Desconocido'
                      : referrer.referrer;

                const percentage =
                  analyticsData.totalClicks > 0
                    ? (
                        (referrer.clicks / analyticsData.totalClicks) *
                        100
                      ).toFixed(1)
                    : '0';

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex items-center justify-center w-6 h-6 bg-info text-white rounded-full text-xs font-bold">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className="font-medium text-card-foreground truncate"
                          title={displayReferrer}
                        >
                          {displayReferrer}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {percentage}% del tráfico total
                        </p>
                      </div>
                    </div>
                    <div className="text-right ml-2 flex-shrink-0">
                      <p className="font-bold text-card-foreground">
                        {referrer.clicks.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">clicks</p>
                    </div>
                  </div>
                );
              })
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No hay datos de referrers disponibles
            </p>
          )}
        </div>
        </div>
      </div>

      {/* Enlaces Populares y Países - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Links Table */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-card-foreground">
              Enlaces Más Populares
            </h3>
            {analyticsData.topLinks.length > 5 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLinksModal(true)}
                className="text-xs"
              >
                Mostrar más
              </Button>
            )}
          </div>
          <div className="space-y-3">
            {analyticsData.topLinks.length > 0 ? (
              analyticsData.topLinks.slice(0, 5).map((link, index) => (
                <a
                  href={`/dashboard/links/${link.slug}/analytics`}
                  key={link.linkId}
                  className="block"
                >
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs font-bold">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-card-foreground truncate">
                          {link.title || `/${link.slug}`}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          /{link.slug}
                        </p>
                      </div>
                    </div>
                    <div className="text-right ml-2 flex-shrink-0">
                      <p className="font-bold text-card-foreground">
                        {link.clicks.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">clicks</p>
                    </div>
                  </div>
                </a>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No hay datos de clicks disponibles
              </p>
            )}
          </div>
        </div>

        {/* Top Countries */}
        <TopCountriesDetails 
          countries={countryDetails} 
          onShowMore={() => setShowCountryModal(true)}
        />
      </div>
      
      {/* Modals */}
      <CountryDataModal
        isOpen={showCountryModal}
        onClose={() => setShowCountryModal(false)}
        countries={countryDetails}
      />
      
      <ReferrerDataModal
        isOpen={showReferrerModal}
        onClose={() => setShowReferrerModal(false)}
        referrers={analyticsData?.clicksByReferrer || []}
        totalClicks={analyticsData?.totalClicks || 0}
      />
      
      <PopularLinksDataModal
        isOpen={showLinksModal}
        onClose={() => setShowLinksModal(false)}
        links={analyticsData?.topLinks || []}
      />
    </div>
  );
}
