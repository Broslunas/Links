'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  AlertTriangle,
  FileText,
  Activity,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  PieChart,
  LineChart
} from 'lucide-react';

interface DashboardStats {
  overview: {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    adminUsers: number;
    totalNotes: number;
    totalWarnings: number;
    activeWarnings: number;
    resolvedWarnings: number;
    criticalWarnings: number;
    totalAdminActions: number;
  };
  warningSeverityDistribution: Record<string, number>;
  notesCategoryDistribution: Record<string, number>;
  adminActivity: Array<{
    adminId: string;
    actionType: string;
    count: number;
    adminName: string;
    adminEmail: string;
  }>;
  recentActions: Array<{
    _id: string;
    actionType: string;
    targetType: string;
    reason: string;
    createdAt: string;
    admin: {
      name: string;
      email: string;
    } | null;
  }>;
  dailyTrends: Array<{
    date: string;
    actions: number;
    uniqueAdmins: number;
  }>;
  dateRange: {
    from: string | null;
    to: string | null;
  };
}

interface ReportsAnalyticsProps {
  onClose?: () => void;
}

export default function ReportsAnalytics({ onClose }: ReportsAnalyticsProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'export'>('overview');

  useEffect(() => {
    fetchDashboardStats();
  }, [dateFrom, dateTo]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        type: 'dashboard',
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo })
      });

      const response = await fetch(`/api/admin/reports?${params}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats(data.data);
        } else {
          setError(data.error?.message || 'Error loading dashboard stats');
        }
      } else {
        setError('Error connecting to server');
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setError('Unexpected error loading dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (reportType: 'notes' | 'warnings' | 'actions', format: 'csv' | 'json') => {
    try {
      const params = new URLSearchParams({
        type: reportType,
        format,
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo })
      });

      const response = await fetch(`/api/admin/reports/export?${params}`);

      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionTypeLabel = (actionType: string) => {
    const labels: Record<string, string> = {
      'add_note': 'Nota añadida',
      'edit_note': 'Nota editada',
      'delete_note': 'Nota eliminada',
      'add_warning': 'Warning añadido',
      'edit_warning': 'Warning editado',
      'resolve_warning': 'Warning resuelto',
      'delete_warning': 'Warning eliminado',
      'disable_user': 'Usuario deshabilitado',
      'enable_user': 'Usuario habilitado',
      'change_role': 'Rol cambiado'
    };
    return labels[actionType] || actionType;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600 dark:text-gray-300">Cargando estadísticas...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="text-center text-red-600 dark:text-red-400">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
          <p>{error}</p>
          <button
            onClick={fetchDashboardStats}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Reportes y Analíticas
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchDashboardStats}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
              title="Actualizar datos"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Rango de fechas:</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white"
              placeholder="Desde"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white"
              placeholder="Hasta"
            />
            {(dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setDateFrom('');
                  setDateTo('');
                }}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 py-2 border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-2 text-sm font-medium rounded-lg ${activeTab === 'overview'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
          >
            <PieChart className="w-4 h-4 inline mr-1" />
            Resumen
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`px-3 py-2 text-sm font-medium rounded-lg ${activeTab === 'trends'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
          >
            <LineChart className="w-4 h-4 inline mr-1" />
            Tendencias
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`px-3 py-2 text-sm font-medium rounded-lg ${activeTab === 'export'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
          >
            <Download className="w-4 h-4 inline mr-1" />
            Exportar
          </button>
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex items-center">
                  <Users className="w-8 h-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Usuarios</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.overview.totalUsers}</p>
                  </div>
                </div>
                <div className="mt-2 text-xs text-blue-700 dark:text-blue-300">
                  {stats.overview.activeUsers} activos, {stats.overview.inactiveUsers} inactivos
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="w-8 h-8 text-yellow-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Warnings</p>
                    <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{stats.overview.activeWarnings}</p>
                  </div>
                </div>
                <div className="mt-2 text-xs text-yellow-700 dark:text-yellow-300">
                  {stats.overview.criticalWarnings} críticos
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="flex items-center">
                  <FileText className="w-8 h-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">Notas</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.overview.totalNotes}</p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <div className="flex items-center">
                  <Activity className="w-8 h-8 text-purple-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Acciones Admin</p>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.overview.totalAdminActions}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Warning Severity Distribution */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Distribución de Severidad de Warnings
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(stats.warningSeverityDistribution).map(([severity, count]) => (
                  <div key={severity} className="text-center">
                    <div className={`text-2xl font-bold ${severity === 'critical' ? 'text-red-600' :
                        severity === 'high' ? 'text-orange-600' :
                          severity === 'medium' ? 'text-yellow-600' :
                            'text-blue-600'
                      }`}>
                      {count}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {severity === 'critical' ? 'Crítico' :
                        severity === 'high' ? 'Alto' :
                          severity === 'medium' ? 'Medio' :
                            'Bajo'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Admin Actions */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Acciones Administrativas Recientes
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {stats.recentActions.map((action) => (
                  <div key={action._id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-600 rounded">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {getActionTypeLabel(action.actionType)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {action.reason}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {action.admin?.name || 'Admin'}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        {formatDate(action.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="space-y-6">
            {/* Daily Activity Trends */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Tendencias de Actividad Diaria (Últimos 30 días)
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {stats.dailyTrends.map((trend) => (
                  <div key={trend.date} className="flex items-center justify-between p-2 bg-white dark:bg-gray-600 rounded">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(trend.date).toLocaleDateString('es-ES')}
                    </div>
                    <div className="flex space-x-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>{trend.actions} acciones</span>
                      <span>{trend.uniqueAdmins} admins activos</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Admin Activity Summary */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Resumen de Actividad por Admin
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {stats.adminActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-600 rounded">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.adminName || activity.adminEmail}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {getActionTypeLabel(activity.actionType)}
                      </div>
                    </div>
                    <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {activity.count} acciones
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'export' && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Exportar Reportes
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Descarga reportes detallados en formato CSV o JSON
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Notes Export */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div className="text-center mb-4">
                  <FileText className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">Reporte de Notas</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Todas las notas de usuarios con detalles
                  </p>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => handleExport('notes', 'csv')}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar CSV
                  </button>
                  <button
                    onClick={() => handleExport('notes', 'json')}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center justify-center"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar JSON
                  </button>
                </div>
              </div>

              {/* Warnings Export */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div className="text-center mb-4">
                  <AlertTriangle className="w-12 h-12 text-yellow-600 mx-auto mb-2" />
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">Reporte de Warnings</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Todos los warnings con estado y severidad
                  </p>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => handleExport('warnings', 'csv')}
                    className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center justify-center"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar CSV
                  </button>
                  <button
                    onClick={() => handleExport('warnings', 'json')}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center justify-center"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar JSON
                  </button>
                </div>
              </div>

              {/* Admin Actions Export */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div className="text-center mb-4">
                  <Activity className="w-12 h-12 text-purple-600 mx-auto mb-2" />
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">Reporte de Acciones</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Historial completo de acciones administrativas
                  </p>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => handleExport('actions', 'csv')}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar CSV
                  </button>
                  <button
                    onClick={() => handleExport('actions', 'json')}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center justify-center"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar JSON
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}