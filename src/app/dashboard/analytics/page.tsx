'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { LoadingSpinner, Button } from '../../../components/ui';
import { ErrorBoundary } from '../../../components/ui/ErrorBoundary';
import { AnalyticsSummaryModal } from '../../../components/features/AnalyticsSummaryModal';
import { Link, ApiResponse } from '../../../types';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const DATE_RANGES = [
  { label: 'Últimos 7 días', days: 7 },
  { label: 'Últimos 30 días', days: 30 },
  { label: 'Últimos 90 días', days: 90 },
];

interface AnalyticsData {
  totalLinks: number;
  totalClicks: number;
  topLinks: Array<{
    linkId: string;
    slug: string;
    clicks: number;
    title?: string;
  }>;
  clicksByDay: Array<{ date: string; clicks: number }>;
  clicksByCountry: Array<{ country: string; clicks: number }>;
  clicksByDevice: Array<{ device: string; clicks: number }>;
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState(DATE_RANGES[1]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [links, setLinks] = useState<Link[]>([]);
  const [showAllPopular, setShowAllPopular] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.href =
        '/auth/signin?callbackUrl=' + encodeURIComponent(window.location.href);
    }
  }, [status]);

  const fetchAnalytics = async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const linksResponse = await fetch('/api/links');
      const linksData: ApiResponse<Link[]> = await linksResponse.json();

      if (!linksData.success || !linksData.data) {
        setError('Error al cargar los enlaces');
        return;
      }

      setLinks(linksData.data);

      const endDate = endOfDay(new Date());
      const startDate = startOfDay(subDays(endDate, selectedRange.days));

      const analyticsPromises = linksData.data.map(async link => {
        try {
          const url = `/api/analytics/${link.slug}?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
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

      let totalClicks = 0;
      const topLinks: Array<{
        linkId: string;
        slug: string;
        clicks: number;
        title?: string;
      }> = [];
      const clicksByDayMap = new Map<string, number>();
      const clicksByCountryMap = new Map<string, number>();
      const clicksByDeviceMap = new Map<string, number>();

      validResults.forEach(result => {
        if (!result) return;

        const { stats, linkId, slug, title } = result;
        totalClicks += stats.totalClicks;

        if (stats.totalClicks > 0) {
          topLinks.push({ linkId, slug, title, clicks: stats.totalClicks });
        }

        stats.clicksByDay.forEach((dayData: any) => {
          const existing = clicksByDayMap.get(dayData.date) || 0;
          clicksByDayMap.set(dayData.date, existing + dayData.clicks);
        });

        stats.clicksByCountry.forEach((countryData: any) => {
          const existing = clicksByCountryMap.get(countryData.country) || 0;
          clicksByCountryMap.set(
            countryData.country,
            existing + countryData.clicks
          );
        });

        stats.clicksByDevice.forEach((deviceData: any) => {
          const existing = clicksByDeviceMap.get(deviceData.device) || 0;
          clicksByDeviceMap.set(
            deviceData.device,
            existing + deviceData.clicks
          );
        });
      });

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

      setAnalyticsData({
        totalLinks: linksData.data.length,
        totalClicks,
        topLinks: sortedTopLinks,
        clicksByDay,
        clicksByCountry,
        clicksByDevice,
      });
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Error al cargar las analíticas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchAnalytics();
    }
  }, [session?.user?.id, selectedRange]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600 dark:text-gray-400 mt-4">
            Cargando analíticas...
          </p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Redirigiendo a la página de inicio de sesión...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-lg border border-border p-6">
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
              <Button onClick={fetchAnalytics} variant="outline">
                Reintentar
              </Button>
            </div>
          </div>
        </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Analíticas Generales
            </h1>
            <p className="text-muted-foreground">
              Resumen completo del rendimiento de todos tus enlaces cortos.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowSummaryModal(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              🤖 Resumen IA
            </Button>
            {DATE_RANGES.map(range => (
              <button
                key={range.label}
                onClick={() => setSelectedRange(range)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  selectedRange.label === range.label
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
                  {analyticsData?.totalLinks || 0}
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
                  {analyticsData?.totalClicks || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <svg
                  className="h-6 w-6 text-blue-500"
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
                  {analyticsData?.totalLinks
                    ? Math.round(
                        (analyticsData.totalClicks || 0) /
                          analyticsData.totalLinks
                      )
                    : 0}
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
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Enlaces Activos
                </p>
                <p className="text-2xl font-bold text-card-foreground">
                  {links.filter(link => link.isActive).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {analyticsData && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-4">
                Clicks por Día
              </h3>
              <div className="h-64">
                <ErrorBoundary fallback={() => <div className="flex items-center justify-center h-full text-muted-foreground">Error al cargar el gráfico</div>}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analyticsData.clicksByDay}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="opacity-30"
                      />
                      <XAxis
                        dataKey="date"
                        tickFormatter={value => format(new Date(value), 'MMM dd')}
                        className="text-xs"
                      />
                      <YAxis className="text-xs" />
                      <Tooltip
                        labelFormatter={value =>
                          format(new Date(value), 'dd MMM yyyy')
                        }
                        formatter={(value: number) => [value, 'Clicks']}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="clicks"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ErrorBoundary>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-4">
                Distribución por Dispositivo
              </h3>
              <div className="h-64">
                <ErrorBoundary fallback={() => <div className="flex items-center justify-center h-full text-muted-foreground">Error al cargar el gráfico</div>}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData.clicksByDevice}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ device, percent }) =>
                          `${device} ${((percent || 0) * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="clicks"
                        nameKey="device"
                      >
                        {analyticsData.clicksByDevice.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string) => [value, name]}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </ErrorBoundary>
              </div>
            </div>
          </div>
        )}

        {analyticsData && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-4">
                Enlaces Más Populares
              </h3>
              <div className="space-y-3">
                {analyticsData.topLinks.length > 0 ? (
                  (showAllPopular
                    ? analyticsData.topLinks
                    : analyticsData.topLinks.slice(0, 5)
                  ).map((link, index) => (
                    <a
                      href={`/dashboard/links/${link.slug}/analytics/`}
                      key={link.linkId}
                      className="block my-3"
                    >
                      <div
                        key={link.linkId}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-card-foreground">
                              {link.title || `/${link.slug}`}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              /{link.slug}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-card-foreground">
                            {link.clicks}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            clicks
                          </p>
                        </div>
                      </div>
                    </a>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No hay datos de clicks disponibles
                  </p>
                )}
                {analyticsData.topLinks.length > 5 && (
                  <div className="flex justify-center mt-4">
                    <button
                      className="px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/80 transition"
                      onClick={e => {
                        e.preventDefault();
                        setShowAllPopular(v => !v);
                      }}
                    >
                      {showAllPopular ? 'Mostrar menos' : 'Mostrar más'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-4">
                Países con Más Clicks
              </h3>
              <div className="h-64">
                <ErrorBoundary fallback={() => <div className="flex items-center justify-center h-full text-muted-foreground">Error al cargar el gráfico</div>}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analyticsData.clicksByCountry}
                      layout="horizontal"
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="opacity-30"
                      />
                      <XAxis type="number" className="text-xs" />
                      <YAxis
                        dataKey="country"
                        type="category"
                        width={60}
                        className="text-xs"
                      />
                      <Tooltip
                        formatter={(value: number) => [value, 'Clicks']}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px',
                        }}
                      />
                      <Bar dataKey="clicks" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                </ErrorBoundary>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Summary Modal */}
        <AnalyticsSummaryModal
          isOpen={showSummaryModal}
          onClose={() => setShowSummaryModal(false)}
          selectedDays={selectedRange.days}
        />
    </div>
  );
}
