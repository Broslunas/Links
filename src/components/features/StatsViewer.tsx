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

interface StatsViewerProps {
  linkId: string;
  linkSlug?: string;
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

export function StatsViewer({
  linkId,
  linkSlug,
  className = '',
}: StatsViewerProps) {
  const [stats, setStats] = useState<LinkStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState(DATE_RANGES[1]); // Default to 30 days
  const [customDateRange, setCustomDateRange] = useState<DateRange | null>(
    null
  );

  const fetchStats = async () => {
    setLoading(true);
    setError(null);

    try {
      let url = `/api/analytics/${linkId}`;
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
      const data: ApiResponse<LinkStats> = await response.json();

      if (data.success && data.data) {
        setStats(data.data);
      } else {
        setError(data.error?.message || 'Error al cargar estadísticas');
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Error al cargar estadísticas');
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

  const handleCustomDateChange = (startDate: string, endDate: string) => {
    if (startDate && endDate) {
      setCustomDateRange({
        startDate: startOfDay(new Date(startDate)),
        endDate: endOfDay(new Date(endDate)),
      });
      setSelectedRange({ label: 'Personalizado', days: null });
    }
  };

  const handleExport = async (exportFormat: 'csv' | 'json') => {
    try {
      const params = new URLSearchParams({
        linkId,
        format: exportFormat,
      });

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

      const response = await fetch(
        `/api/analytics/export?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error('Error al exportar datos');
      }

      // Get filename from response headers
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `analytics_${linkSlug || linkId}_${format(new Date(), 'yyyy-MM-dd')}.${format}`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create blob and download
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
      // You could add a toast notification here
      alert('Error al exportar los datos. Por favor, inténtalo de nuevo.');
    }
  };

  const handleDetailedExport = async (exportFormat: 'csv' | 'json') => {
    try {
      const params = new URLSearchParams({
        linkId,
        format: exportFormat,
        limit: '5000', // Limit to prevent huge downloads
      });

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

      const response = await fetch(
        `/api/analytics/export/detailed?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error('Error al exportar datos detallados');
      }

      // Get filename from response headers
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `detailed_analytics_${linkSlug || linkId}_${format(new Date(), 'yyyy-MM-dd')}.${exportFormat}`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create blob and download
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
      console.error('Error exporting detailed data:', error);
      // You could add a toast notification here
      alert(
        'Error al exportar los datos detallados. Por favor, inténtalo de nuevo.'
      );
    }
  };

  if (loading) {
    return (
      <div
        className={`bg-card rounded-lg border border-border p-6 ${className}`}
      >
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`bg-card rounded-lg border border-border p-6 ${className}`}
      >
        <div className="text-center text-red-500">
          <p className="text-lg font-semibold mb-2">Error</p>
          <p>{error}</p>
          <button
            onClick={fetchStats}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
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
        className={`bg-card rounded-lg border border-border p-6 ${className}`}
      >
        <div className="text-center text-muted-foreground">
          <p>No hay datos disponibles</p>
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
            <h2 className="text-2xl font-bold text-card-foreground">
              Estadísticas {linkSlug && `- /${linkSlug}`}
            </h2>
            <p className="text-muted-foreground">
              Total de clicks:{' '}
              <span className="font-semibold text-card-foreground">
                {stats.totalClicks}
              </span>
            </p>
          </div>

          {/* Date Range Selector and Export Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex flex-wrap gap-2">
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
              </div>
            </div>

            {/* Export Buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex gap-2">
                <button
                  onClick={() => handleExport('csv')}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-1"
                  title="Exportar resumen como CSV"
                >
                  <svg
                    className="w-4 h-4"
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
                  CSV
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1"
                  title="Exportar resumen como JSON"
                >
                  <svg
                    className="w-4 h-4"
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
                  JSON
                </button>
              </div>
              <button
                onClick={() => handleDetailedExport('csv')}
                className="px-3 py-1 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center gap-1"
                title="Exportar datos detallados como CSV"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Detallado
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Clicks Over Time */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">
            Clicks por Día
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.clicksByDay}>
                <defs>
                  <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
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
                <Area
                  type="monotone"
                  dataKey="clicks"
                  stroke="#3B82F6"
                  fillOpacity={1}
                  fill="url(#colorClicks)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Device Distribution */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">
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
                    `${device} ${((percent || 0) * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="clicks"
                  nameKey="device"
                >
                  {stats.clicksByDevice.map((entry, index) => (
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
          </div>
        </div>

        {/* Top Countries */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">
            Países con Más Clicks
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.clicksByCountry.slice(0, 10)}
                layout="horizontal"
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
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
          </div>
        </div>

        {/* Browser Distribution */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">
            Navegadores Más Usados
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.clicksByBrowser.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="browser"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  className="text-xs"
                />
                <YAxis className="text-xs" />
                <Tooltip
                  formatter={(value: number) => [value, 'Clicks']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Bar dataKey="clicks" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Operating Systems */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold text-card-foreground mb-4">
          Sistemas Operativos
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.clicksByOS.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="os"
                angle={-45}
                textAnchor="end"
                height={80}
                className="text-xs"
              />
              <YAxis className="text-xs" />
              <Tooltip
                formatter={(value: number) => [value, 'Clicks']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
              />
              <Bar dataKey="clicks" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold text-card-foreground mb-4">
          Resumen de Estadísticas
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-card-foreground">
              {stats.totalClicks}
            </p>
            <p className="text-sm text-muted-foreground">Total Clicks</p>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-card-foreground">
              {stats.clicksByCountry.length}
            </p>
            <p className="text-sm text-muted-foreground">Países</p>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-card-foreground">
              {stats.clicksByDevice.length}
            </p>
            <p className="text-sm text-muted-foreground">
              Tipos de Dispositivo
            </p>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-card-foreground">
              {stats.clicksByBrowser.length}
            </p>
            <p className="text-sm text-muted-foreground">Navegadores</p>
          </div>
        </div>
      </div>
    </div>
  );
}
