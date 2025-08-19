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
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { LoadingSpinner } from '../ui';
import { Button } from '../ui/Button';
import { CountryDataModal, ReferrerDataModal } from '../ui/DataModal';
import { LinkStats, ApiResponse } from '../../types';

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

interface ModernPublicStatsViewerProps {
  linkId: string;
  linkInfo?: {
    slug: string;
    title?: string;
    description?: string;
  };
  className?: string;
}

interface DateRange {
  startDate: Date;
  endDate: Date;
}

const MODERN_COLORS = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
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

export function ModernPublicStatsViewer({
  linkId,
  linkInfo,
  className = '',
}: ModernPublicStatsViewerProps) {
  const [stats, setStats] = useState<Partial<LinkStats> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState(DATE_RANGES[1]);
  const [customDateRange, setCustomDateRange] = useState<DateRange | null>(
    null
  );
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showReferrerModal, setShowReferrerModal] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);

    try {
      let url = `/api/stats/${linkId}`;
      const params = new URLSearchParams();

      if (customDateRange) {
        params.append('startDate', customDateRange.startDate.toISOString());
        params.append('endDate', customDateRange.endDate.toISOString());
      } else if (selectedRange.days) {
        const endDate = endOfDay(new Date());
        const startDate = startOfDay(subDays(endDate, selectedRange.days));
        params.append('startDate', startDate.toISOString());
        params.append('endDate', endDate.toISOString());
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      const data: ApiResponse<{ stats: Partial<LinkStats>; link: any }> =
        await response.json();

      if (data.success && data.data) {
        setStats(data.data.stats);
      } else {
        setError(
          data.error?.message || 'Error al cargar estadísticas públicas'
        );
      }
    } catch (err) {
      console.error('Error fetching public stats:', err);
      setError('Error al cargar estadísticas públicas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [linkId, selectedRange, customDateRange]);

  const handleDateRangeChange = (range: (typeof DATE_RANGES)[0]) => {
    setSelectedRange(range);
    setCustomDateRange(null);
  };

  // Chart configurations
  const getLineChartData = () => {
    if (!stats?.clicksByDay) return { labels: [], datasets: [] };

    return {
      labels: stats.clicksByDay.map(item =>
        format(new Date(item.date), 'MMM dd')
      ),
      datasets: [
        {
          label: 'Clicks',
          data: stats.clicksByDay.map(item => item.clicks),
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
        displayColors: true,
        padding: 12,
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

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
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
        padding: 12,
      },
    },
    cutout: '60%',
  };

  if (loading) {
    return (
      <div
        className={`bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 ${className}`}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="text-slate-600 dark:text-slate-400 mt-4 font-medium">
              Cargando estadísticas públicas...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl border border-red-200 dark:border-red-800 p-8 ${className}`}
      >
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600 dark:text-red-400"
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
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
            Error
          </h3>
          <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
          <button
            onClick={fetchStats}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div
        className={`bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 ${className}`}
      >
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-slate-400"
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
          <p className="text-slate-600 dark:text-slate-400 font-medium">
            No hay datos disponibles
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Modern Header */}
      <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-xl p-8 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">
              Estadísticas Públicas
              {linkInfo?.title && (
                <span className="text-blue-100"> - {linkInfo.title}</span>
              )}
            </h2>
            {linkInfo?.slug && (
              <p className="text-blue-100 text-lg mb-2">/{linkInfo.slug}</p>
            )}
            {linkInfo?.description && (
              <p className="text-blue-100 mb-4">{linkInfo.description}</p>
            )}
            <p className="text-blue-100 text-lg">
              Total de clicks:{' '}
              <span className="font-bold text-white text-2xl">
                {stats.totalClicks?.toLocaleString() || '0'}
              </span>
            </p>
          </div>

          {/* Date Range Selector */}
          <div className="flex flex-wrap gap-2">
            {DATE_RANGES.map(range => (
              <button
                key={range.label}
                onClick={() => handleDateRangeChange(range)}
                className={`px-4 py-2 text-sm rounded-lg font-medium transition-all duration-200 ${
                  selectedRange.label === range.label
                    ? 'bg-white text-indigo-600 shadow-lg'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 dark:text-blue-400 text-sm font-medium mb-1">
                Total de clicks
              </p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                {stats.totalClicks?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 dark:text-green-400 text-sm font-medium mb-1">
                Países
              </p>
              <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                {stats.clicksByCountry?.length || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 dark:text-purple-400 text-sm font-medium mb-1">
                Dispositivos
              </p>
              <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                {stats.clicksByDevice?.length || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-6 border border-orange-200 dark:border-orange-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 dark:text-orange-400 text-sm font-medium mb-1">
                Navegadores
              </p>
              <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                {stats.clicksByBrowser?.length || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      {stats.clicksByDay && stats.clicksByDay.length > 0 && (
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Clicks Over Time */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
              Clicks por Día
            </h3>
            <div className="h-80">
              <Line data={getLineChartData()} options={chartOptions} />
            </div>
          </div>

          {/* Peak Hours Activity */}
          {stats.peakHours && stats.peakHours.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
                <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                Actividad por Horas
              </h3>
              <div className="h-80">
                <Bar
                  data={getBarChartData(
                    stats.peakHours,
                    'hour',
                    'clicks',
                    MODERN_COLORS.info
                  )}
                  options={chartOptions}
                />
              </div>
            </div>
          )}

          {/* Device Distribution */}
          {stats.clicksByDevice && stats.clicksByDevice.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                Distribución por Dispositivo
              </h3>
              <div className="h-80">
                <Doughnut
                  data={getDoughnutChartData(
                    stats.clicksByDevice,
                    'device',
                    'clicks'
                  )}
                  options={doughnutOptions}
                />
              </div>
            </div>
          )}

          {/* Top Countries */}
          {stats.clicksByCountry && stats.clicksByCountry.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Países con Más Clicks
                </h3>
                {stats.clicksByCountry.length > 10 && (
                  <Button
                    onClick={() => setShowCountryModal(true)}
                    variant="outline"
                    size="sm"
                  >
                    Mostrar más
                  </Button>
                )}
              </div>
              <div className="h-80">
                <Bar
                  data={getBarChartData(
                    stats.clicksByCountry,
                    'country',
                    'clicks',
                    MODERN_COLORS.success
                  )}
                  options={chartOptions}
                />
              </div>
            </div>
          )}

          {/* Top Referrers */}
          {stats.clicksByReferrer && stats.clicksByReferrer.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  Principales Referentes
                </h3>
                {stats.clicksByReferrer.length > 10 && (
                  <Button
                    onClick={() => setShowReferrerModal(true)}
                    variant="outline"
                    size="sm"
                  >
                    Mostrar más
                  </Button>
                )}
              </div>
              <div className="h-80">
                <Bar
                  data={getBarChartData(
                    stats.clicksByReferrer,
                    'referrer',
                    'clicks',
                    MODERN_COLORS.danger
                  )}
                  options={chartOptions}
                />
              </div>
            </div>
          )}

          {/* Browser Distribution */}
          {stats.clicksByBrowser && stats.clicksByBrowser.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                Navegadores Más Usados
              </h3>
              <div className="h-80">
                <Bar
                  data={getBarChartData(
                    stats.clicksByBrowser,
                    'browser',
                    'clicks',
                    MODERN_COLORS.warning
                  )}
                  options={chartOptions}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Operating Systems */}
      {stats.clicksByOS && stats.clicksByOS.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
            <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
            Sistemas Operativos
          </h3>
          <div className="h-80">
            <Bar
              data={getBarChartData(
                stats.clicksByOS,
                'os',
                'clicks',
                MODERN_COLORS.info
              )}
              options={chartOptions}
            />
          </div>
        </div>
      )}

      {/* Country Modal */}
      <CountryDataModal
        isOpen={showCountryModal}
        onClose={() => setShowCountryModal(false)}
        countries={
          stats.clicksByCountry?.map(item => ({
            country: item.country,
            totalClicks: item.clicks,
            links: [], // Public stats don't show individual links
          })) || []
        }
      />

      {/* Referrer Modal */}
      <ReferrerDataModal
        isOpen={showReferrerModal}
        onClose={() => setShowReferrerModal(false)}
        referrers={stats.clicksByReferrer || []}
        totalClicks={stats.totalClicks || 0}
      />
    </div>
  );
}
