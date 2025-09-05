'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
    AlertTriangle,
    Shield,
    Eye,
    UserX,
    Filter,
    Download,
    RefreshCw,
    Calendar,
    TrendingUp
} from 'lucide-react';
import { CriticalAlert, clientNotificationService, addTestAlert } from '../../../../lib/client-notification-service';
import { formatDistanceToNow, format } from 'date-fns';

const AlertsPage: React.FC = () => {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [alerts, setAlerts] = useState<CriticalAlert[]>([]);
    const [filteredAlerts, setFilteredAlerts] = useState<CriticalAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        type: 'all',
        severity: 'all',
        timeRange: '24h',
    });
    const [stats, setStats] = useState({
        total: 0,
        critical: 0,
        high: 0,
        last24h: 0,
    });

    useEffect(() => {
        if (status === 'loading') return;

        if (!session?.user || session.user.role !== 'admin') {
            router.push('/dashboard/admin');
            return;
        }

        loadAlerts();
    }, [session, status, router]);

    useEffect(() => {
        applyFilters();
    }, [alerts, filters]);

    const loadAlerts = async () => {
        try {
            setLoading(true);

            // Load alerts from notification service
            await clientNotificationService.loadAlertsFromAPI();
            const recentAlerts = clientNotificationService.getRecentAlerts(100);
            setAlerts(recentAlerts);

            // Calculate stats
            const now = new Date();
            const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

            const newStats = {
                total: recentAlerts.length,
                critical: recentAlerts.filter(a => a.severity === 'critical').length,
                high: recentAlerts.filter(a => a.severity === 'high').length,
                last24h: recentAlerts.filter(a => a.timestamp > last24h).length,
            };

            setStats(newStats);
        } catch (error) {
            console.error('Error loading alerts:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...alerts];

        // Filter by type
        if (filters.type !== 'all') {
            filtered = filtered.filter(alert => alert.type === filters.type);
        }

        // Filter by severity
        if (filters.severity !== 'all') {
            filtered = filtered.filter(alert => alert.severity === filters.severity);
        }

        // Filter by time range
        const now = new Date();
        let timeThreshold: Date;

        switch (filters.timeRange) {
            case '1h':
                timeThreshold = new Date(now.getTime() - 60 * 60 * 1000);
                break;
            case '24h':
                timeThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case '7d':
                timeThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                timeThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                timeThreshold = new Date(0);
        }

        filtered = filtered.filter(alert => alert.timestamp > timeThreshold);

        setFilteredAlerts(filtered);
    };

    const getAlertIcon = (type: CriticalAlert['type']) => {
        switch (type) {
            case 'critical_warning':
                return <AlertTriangle className="w-5 h-5 text-red-500" />;
            case 'warning_threshold':
                return <Shield className="w-5 h-5 text-orange-500" />;
            case 'suspicious_activity':
                return <Eye className="w-5 h-5 text-purple-500" />;
            case 'disabled_access_attempt':
                return <UserX className="w-5 h-5 text-red-600" />;
            default:
                return <AlertTriangle className="w-5 h-5 text-gray-500" />;
        }
    };

    const getAlertTypeLabel = (type: CriticalAlert['type']) => {
        switch (type) {
            case 'critical_warning':
                return 'Critical Warning';
            case 'warning_threshold':
                return 'Warning Threshold';
            case 'suspicious_activity':
                return 'Suspicious Activity';
            case 'disabled_access_attempt':
                return 'Access Attempt';
            default:
                return 'Alert';
        }
    };

    const getSeverityBadge = (severity: 'high' | 'critical') => {
        const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full';
        return severity === 'critical'
            ? `${baseClasses} bg-red-100 text-red-800`
            : `${baseClasses} bg-orange-100 text-orange-800`;
    };

    const exportAlerts = () => {
        const csvContent = [
            ['Timestamp', 'Type', 'Severity', 'User ID', 'Message'],
            ...filteredAlerts.map(alert => [
                alert.timestamp.toISOString(),
                getAlertTypeLabel(alert.type),
                alert.severity,
                alert.userId,
                alert.message,
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `alerts-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (status === 'loading' || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Alertas Críticas</h1>
                            <p className="mt-2 text-gray-600">
                                Monitorea y gestiona alertas críticas del sistema y notificaciones
                            </p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => addTestAlert('critical_warning', 'critical')}
                                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
                            >
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                Generar Alerta de Prueba
                            </button>
                            <button
                                onClick={loadAlerts}
                                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Actualizar
                            </button>
                            <button
                                onClick={exportAlerts}
                                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Exportar
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <TrendingUp className="w-8 h-8 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Total de Alertas</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <AlertTriangle className="w-8 h-8 text-red-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Críticas</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.critical}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Shield className="w-8 h-8 text-orange-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Alta Prioridad</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.high}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Calendar className="w-8 h-8 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Últimas 24h</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.last24h}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow mb-6">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center space-x-4">
                            <Filter className="w-5 h-5 text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">Filtros:</span>

                            <select
                                value={filters.type}
                                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                                className="text-sm border-gray-300 rounded-md"
                            >
                                <option value="all">Todos los Tipos</option>
                                <option value="critical_warning">Advertencia Crítica</option>
                                <option value="warning_threshold">Umbral de Advertencias</option>
                                <option value="suspicious_activity">Actividad Sospechosa</option>
                                <option value="disabled_access_attempt">Intento de Acceso</option>
                            </select>

                            <select
                                value={filters.severity}
                                onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
                                className="text-sm border-gray-300 rounded-md"
                            >
                                <option value="all">Todas las Severidades</option>
                                <option value="critical">Crítica</option>
                                <option value="high">Alta</option>
                            </select>

                            <select
                                value={filters.timeRange}
                                onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value }))}
                                className="text-sm border-gray-300 rounded-md"
                            >
                                <option value="1h">Última Hora</option>
                                <option value="24h">Últimas 24 Horas</option>
                                <option value="7d">Últimos 7 Días</option>
                                <option value="30d">Últimos 30 Días</option>
                                <option value="all">Todo el Tiempo</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Alerts List */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">
                            Alertas ({filteredAlerts.length})
                        </h2>
                    </div>

                    {filteredAlerts.length === 0 ? (
                        <div className="p-12 text-center">
                            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron alertas</h3>
                            <p className="text-gray-500">
                                {alerts.length === 0
                                    ? "Aún no se han generado alertas."
                                    : "No hay alertas que coincidan con los filtros actuales."
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {filteredAlerts.map((alert) => (
                                <div key={alert.id} className="p-6 hover:bg-gray-50">
                                    <div className="flex items-start space-x-4">
                                        <div className="flex-shrink-0 mt-1">
                                            {getAlertIcon(alert.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center space-x-3">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {getAlertTypeLabel(alert.type)}
                                                    </span>
                                                    <span className={getSeverityBadge(alert.severity)}>
                                                        {alert.severity.toUpperCase()}
                                                    </span>
                                                </div>
                                                <span className="text-sm text-gray-500">
                                                    {formatDistanceToNow(alert.timestamp, { addSuffix: true })}
                                                </span>
                                            </div>

                                            <p className="text-gray-900 mb-3">{alert.message}</p>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                                    <span>Usuario: {alert.userId}</span>
                                                    <span>•</span>
                                                    <span>{format(alert.timestamp, 'MMM d, yyyy HH:mm')}</span>
                                                </div>
                                                <a
                                                    href={`/dashboard/admin/users/${alert.userId}`}
                                                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                                                >
                                                    Ver Usuario →
                                                </a>
                                            </div>

                                            {alert.metadata && Object.keys(alert.metadata).length > 0 && (
                                                <div className="mt-3 p-3 bg-gray-50 rounded-md">
                                                    <div className="text-xs text-gray-600 space-y-1">
                                                        {Object.entries(alert.metadata).map(([key, value]) => (
                                                            <div key={key}>
                                                                <span className="font-medium">{key}:</span> {String(value)}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AlertsPage;