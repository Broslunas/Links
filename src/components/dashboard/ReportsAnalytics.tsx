'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Link,
  Calendar,
  Download,
  Filter,
  X,
  Activity,
  Clock,
  Globe,
  MousePointer
} from 'lucide-react';

interface AnalyticsData {
  totalClicks: number;
  totalLinks: number;
  totalUsers: number;
  clicksToday: number;
  clicksThisWeek: number;
  clicksThisMonth: number;
  topLinks: Array<{
    id: string;
    slug: string;
    title: string;
    clicks: number;
    url: string;
  }>;
  clicksByDay: Array<{
    date: string;
    clicks: number;
  }>;
  userActivity: Array<{
    date: string;
    newUsers: number;
    activeUsers: number;
  }>;
  deviceStats: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  countryStats: Array<{
    country: string;
    clicks: number;
    percentage: number;
  }>;
}

interface ReportsAnalyticsProps {
  onClose: () => void;
}

export default function ReportsAnalytics({ onClose }: ReportsAnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [activeTab, setActiveTab] = useState<'overview' | 'links' | 'users' | 'geography'>('overview');

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics?period=${selectedPeriod}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAnalyticsData(data.data);
        } else {
          console.error('Error loading analytics:', data.error);
          // Datos de ejemplo para desarrollo
          setAnalyticsData({
            totalClicks: 15420,
            totalLinks: 234,
            totalUsers: 89,
            clicksToday: 156,
            clicksThisWeek: 1240,
            clicksThisMonth: 4680,
            topLinks: [
              { id: '1', slug: 'github-profile', title: 'Mi Perfil de GitHub', clicks: 2340, url: 'https://github.com/usuario' },
              { id: '2', slug: 'portfolio', title: 'Mi Portfolio', clicks: 1890, url: 'https://miportfolio.com' },
              { id: '3', slug: 'linkedin', title: 'LinkedIn', clicks: 1560, url: 'https://linkedin.com/in/usuario' },
              { id: '4', slug: 'blog', title: 'Mi Blog Personal', clicks: 1230, url: 'https://miblog.com' },
              { id: '5', slug: 'youtube', title: 'Canal de YouTube', clicks: 980, url: 'https://youtube.com/c/usuario' }
            ],
            clicksByDay: [
              { date: '2024-01-01', clicks: 120 },
              { date: '2024-01-02', clicks: 145 },
              { date: '2024-01-03', clicks: 167 },
              { date: '2024-01-04', clicks: 134 },
              { date: '2024-01-05', clicks: 189 },
              { date: '2024-01-06', clicks: 156 },
              { date: '2024-01-07', clicks: 178 }
            ],
            userActivity: [
              { date: '2024-01-01', newUsers: 5, activeUsers: 23 },
              { date: '2024-01-02', newUsers: 8, activeUsers: 31 },
              { date: '2024-01-03', newUsers: 3, activeUsers: 28 },
              { date: '2024-01-04', newUsers: 12, activeUsers: 35 },
              { date: '2024-01-05', newUsers: 7, activeUsers: 29 },
              { date: '2024-01-06', newUsers: 9, activeUsers: 33 },
              { date: '2024-01-07', newUsers: 6, activeUsers: 27 }
            ],
            deviceStats: {
              desktop: 45,
              mobile: 42,
              tablet: 13
            },
            countryStats: [
              { country: 'España', clicks: 6840, percentage: 44.3 },
              { country: 'México', clicks: 2310, percentage: 15.0 },
              { country: 'Argentina', clicks: 1850, percentage: 12.0 },
              { country: 'Colombia', clicks: 1540, percentage: 10.0 },
              { country: 'Chile', clicks: 920, percentage: 6.0 },
              { country: 'Otros', clicks: 1960, percentage: 12.7 }
            ]
          });
        }
      } else {
        console.error('Error fetching analytics:', response.statusText);
      }
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async () => {
    try {
      const response = await fetch(`/api/admin/analytics/export?period=${selectedPeriod}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-report-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-ES').format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-purple-500" />
              Reportes y Analíticas
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando datos de analíticas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-purple-500" />
            Reportes y Analíticas
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Period Selector */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="7d">Últimos 7 días</option>
                <option value="30d">Últimos 30 días</option>
                <option value="90d">Últimos 90 días</option>
                <option value="1y">Último año</option>
              </select>
            </div>

            {/* Tab Navigation */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Resumen
              </button>
              <button
                onClick={() => setActiveTab('links')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  activeTab === 'links'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Enlaces
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  activeTab === 'users'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Usuarios
              </button>
              <button
                onClick={() => setActiveTab('geography')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  activeTab === 'geography'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Geografía
              </button>
            </div>
          </div>

          <button
            onClick={exportReport}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
          >
            <Download className="h-4 w-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-lg text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Total Clics</p>
                    <p className="text-2xl font-bold">{formatNumber(analyticsData?.totalClicks || 0)}</p>
                  </div>
                  <MousePointer className="h-8 w-8 text-blue-200" />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-lg text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Clics Hoy</p>
                    <p className="text-2xl font-bold">{formatNumber(analyticsData?.clicksToday || 0)}</p>
                  </div>
                  <Clock className="h-8 w-8 text-green-200" />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 rounded-lg text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Esta Semana</p>
                    <p className="text-2xl font-bold">{formatNumber(analyticsData?.clicksThisWeek || 0)}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-200" />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 rounded-lg text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Este Mes</p>
                    <p className="text-2xl font-bold">{formatNumber(analyticsData?.clicksThisMonth || 0)}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-orange-200" />
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Clicks Chart */}
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Clics por Día</h3>
                <div className="h-64 flex items-end justify-between gap-2">
                  {analyticsData?.clicksByDay.map((day, index) => {
                    const maxClicks = Math.max(...(analyticsData?.clicksByDay.map(d => d.clicks) || [1]));
                    const height = (day.clicks / maxClicks) * 100;
                    return (
                      <div key={index} className="flex flex-col items-center flex-1">
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">{day.clicks}</div>
                        <div 
                          className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                          style={{ height: `${height}%`, minHeight: '4px' }}
                        ></div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          {formatDate(day.date)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Device Stats */}
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Dispositivos</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Escritorio</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${analyticsData?.deviceStats.desktop || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white w-10 text-right">
                        {analyticsData?.deviceStats.desktop || 0}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Móvil</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${analyticsData?.deviceStats.mobile || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white w-10 text-right">
                        {analyticsData?.deviceStats.mobile || 0}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Tablet</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${analyticsData?.deviceStats.tablet || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white w-10 text-right">
                        {analyticsData?.deviceStats.tablet || 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'links' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Enlaces Más Populares</h3>
            <div className="space-y-3">
              {analyticsData?.topLinks.map((link, index) => (
                <div key={link.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{link.title}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">/{link.slug}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-xs">{link.url}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatNumber(link.clicks)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">clics</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Actividad de Usuarios</h3>
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
              <div className="h-64 flex items-end justify-between gap-2">
                {analyticsData?.userActivity.map((day, index) => {
                  const maxUsers = Math.max(...(analyticsData?.userActivity.map(d => Math.max(d.newUsers, d.activeUsers)) || [1]));
                  const newUsersHeight = (day.newUsers / maxUsers) * 100;
                  const activeUsersHeight = (day.activeUsers / maxUsers) * 100;
                  return (
                    <div key={index} className="flex flex-col items-center flex-1">
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        {day.activeUsers}/{day.newUsers}
                      </div>
                      <div className="w-full flex gap-1">
                        <div 
                          className="flex-1 bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                          style={{ height: `${activeUsersHeight}%`, minHeight: '4px' }}
                          title={`Usuarios activos: ${day.activeUsers}`}
                        ></div>
                        <div 
                          className="flex-1 bg-green-500 rounded-t transition-all duration-300 hover:bg-green-600"
                          style={{ height: `${newUsersHeight}%`, minHeight: '4px' }}
                          title={`Nuevos usuarios: ${day.newUsers}`}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {formatDate(day.date)}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Usuarios Activos</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Nuevos Usuarios</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'geography' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Clics por País</h3>
            <div className="space-y-3">
              {analyticsData?.countryStats.map((country, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <Globe className="h-5 w-5 text-gray-500" />
                    <span className="font-medium text-gray-900 dark:text-white">{country.country}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${country.percentage}%` }}
                      ></div>
                    </div>
                    <div className="text-right min-w-[80px]">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatNumber(country.clicks)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {country.percentage}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}