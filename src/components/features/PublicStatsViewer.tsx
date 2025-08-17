'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { LoadingSpinner } from '../ui';
import { LinkStats, ApiResponse } from '../../types';

interface PublicStatsViewerProps {
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

const COLORS = [
  '#3B82F6', // blue-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#EF4444', // red-500
  '#8B5CF6', // violet-500
  '#06B6D4', // cyan-500
  '#84CC16', // lime-500
  '#F97316', // orange-500
];

const DATE_RANGES = [
  { label: 'Últimos 7 días', days: 7 },
  { label: 'Últimos 30 días', days: 30 },
  { label: 'Últimos 90 días', days: 90 },
  { label: 'Todo el tiempo', days: null },
];

export function PublicStatsViewer({
  linkId,
  linkInfo,
  className = '',
}: PublicStatsViewerProps) {
  const [stats, setStats] = useState<Partial<LinkStats> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState(DATE_RANGES[1]); // Default to 30 days
  const [customDateRange, setCustomDateRange] = useState<DateRange | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);

    try {
      let url = `/api/stats/${linkId}`;
      const params = new URLSearchParams();

      // Add date range parameters
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
      const data: ApiResponse<{ stats: Partial<LinkStats>; link: any }> = await response.json();

      if (data.success && data.data) {
        setStats(data.data.stats);
      } else {
        setError(data.error?.message || 'Error al cargar estadísticas públicas');
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

  const handleDateRangeChange = (range: typeof DATE_RANGES[0]) => {
    setSelectedRange(range);
    setCustomDateRange(null);
  };

  if (loading) {
    return (
      <div className={`bg-card rounded-lg border border-border p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="text-muted-foreground mt-4">
              Cargando estadísticas públicas...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-card rounded-lg border border-border p-6 ${className}`}>
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
          <button
            onClick={fetchStats}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={`bg-card rounded-lg border border-border p-6 ${className}`}>
        <div className="text-center">
          <p className="text-muted-foreground">No hay datos disponibles</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Estadísticas Públicas
              {linkInfo?.title && (
                <span className="text-muted-foreground"> - {linkInfo.title}</span>
              )}
            </h2>
            {linkInfo?.slug && (
              <p className="text-muted-foreground mt-1">/{linkInfo.slug}</p>
            )}
            {linkInfo?.description && (
              <p className="text-sm text-muted-foreground mt-2">
                {linkInfo.description}
              </p>
            )}
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="mt-6">
          <div className="flex flex-wrap gap-2">
            {DATE_RANGES.map((range) => (
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
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total de clicks:
              </p>
              <p className="text-2xl font-bold text-foreground">
                {stats.totalClicks?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <svg
                className="h-4 w-4 text-blue-600 dark:text-blue-400"
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

        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total de clicks:
              </p>
              <p className="text-2xl font-bold text-foreground">
                {stats.totalClicks?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="h-8 w-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <svg
                className="h-4 w-4 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clicks by Date */}
        {stats.clicksByDay && stats.clicksByDay.length > 0 && (
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Clicks por Día
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.clicksByDay}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <Tooltip
                    labelFormatter={(value) =>
                      format(new Date(value), 'MMM dd, yyyy')
                    }
                    formatter={(value: number) => [value, 'Clicks']}
                  />
                  <Area
                    type="monotone"
                    dataKey="clicks"
                    stroke={COLORS[0]}
                    fill={COLORS[0]}
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Clicks by Device */}
        {stats.clicksByDevice && stats.clicksByDevice.length > 0 && (
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Distribución por Dispositivo
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.clicksByDevice}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ device, percent }) =>
                      `${device} ${percent ? (percent * 100).toFixed(0) : '0'}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="clicks"
                  >
                    {stats.clicksByDevice.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [value, 'Clicks']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Clicks by Country */}
        {stats.clicksByCountry && stats.clicksByCountry.length > 0 && (
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Países con Más Clicks
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.clicksByCountry.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="country" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip formatter={(value: number) => [value, 'Clicks']} />
                  <Bar dataKey="clicks" fill={COLORS[1]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Clicks by Browser */}
        {stats.clicksByBrowser && stats.clicksByBrowser.length > 0 && (
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Navegadores Más Usados
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.clicksByBrowser.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="browser" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip formatter={(value: number) => [value, 'Clicks']} />
                  <Bar dataKey="clicks" fill={COLORS[2]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Clicks by OS */}
        {stats.clicksByOS && stats.clicksByOS.length > 0 && (
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Sistemas Operativos
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.clicksByOS}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ os, percent }) =>
                      `${os} ${percent ? (percent * 100).toFixed(0) : '0'}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="clicks"
                  >
                    {stats.clicksByOS.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [value, 'Clicks']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}