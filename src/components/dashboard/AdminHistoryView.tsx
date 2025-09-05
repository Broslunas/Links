'use client';

import React, { useState, useEffect } from 'react';
import {
    History,
    Filter,
    Download,
    Search,
    Calendar,
    User,
    AlertTriangle,
    FileText,
    Shield,
    ExternalLink,
    ChevronLeft,
    ChevronRight,
    Clock,
    Eye,
    MoreVertical,
    RefreshCw
} from 'lucide-react';

interface AdminActionItem {
    _id: string;
    adminId: string;
    adminName?: string;
    adminEmail?: string;
    targetType: 'user' | 'link';
    targetId: string;
    targetName?: string;
    targetEmail?: string;
    actionType: string;
    reason?: string;
    duration?: number;
    previousState?: any;
    newState?: any;
    metadata?: {
        warningId?: string;
        noteId?: string;
        previousRole?: string;
        newRole?: string;
        severity?: string;
        category?: string;
    };
    createdAt: string;
}

interface AdminHistoryViewProps {
    userId?: string; // If provided, shows history for specific user
}

export default function AdminHistoryView({ userId }: AdminHistoryViewProps) {
    const [actions, setActions] = useState<AdminActionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalActions, setTotalActions] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    // Filters
    const [filters, setFilters] = useState({
        actionType: '',
        targetType: '',
        adminId: '',
        startDate: '',
        endDate: '',
        search: ''
    });

    // UI State
    const [showFilters, setShowFilters] = useState(false);
    const [selectedAction, setSelectedAction] = useState<AdminActionItem | null>(null);
    const [exporting, setExporting] = useState(false);

    // Fetch actions
    const fetchActions = async () => {
        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: itemsPerPage.toString(),
                sortBy: 'createdAt',
                sortOrder: 'desc'
            });

            // Add filters
            if (filters.actionType) params.append('actionType', filters.actionType);
            if (filters.targetType) params.append('targetType', filters.targetType);
            if (filters.adminId) params.append('adminId', filters.adminId);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);

            const endpoint = userId
                ? `/api/admin/users/${userId}/actions?${params}`
                : `/api/admin/actions?${params}`;

            const response = await fetch(endpoint);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || 'Failed to fetch actions');
            }

            if (data.success) {
                setActions(data.data.actions);
                setTotalPages(data.data.totalPages);
                setTotalActions(data.data.totalActions);
            } else {
                throw new Error(data.error?.message || 'Failed to fetch actions');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    // Effect to fetch actions when dependencies change
    useEffect(() => {
        fetchActions();
    }, [currentPage, itemsPerPage, filters, userId]);

    // Handle filter changes
    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setCurrentPage(1); // Reset to first page when filtering
    };

    // Clear all filters
    const clearFilters = () => {
        setFilters({
            actionType: '',
            targetType: '',
            adminId: '',
            startDate: '',
            endDate: '',
            search: ''
        });
        setCurrentPage(1);
    };

    // Export functionality
    const handleExport = async () => {
        try {
            setExporting(true);

            // Fetch all actions for export (without pagination)
            const params = new URLSearchParams({
                limit: '10000', // Large limit to get all results
                sortBy: 'createdAt',
                sortOrder: 'desc'
            });

            // Add current filters
            if (filters.actionType) params.append('actionType', filters.actionType);
            if (filters.targetType) params.append('targetType', filters.targetType);
            if (filters.adminId) params.append('adminId', filters.adminId);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);

            const endpoint = userId
                ? `/api/admin/users/${userId}/actions?${params}`
                : `/api/admin/actions?${params}`;

            const response = await fetch(endpoint);
            const data = await response.json();

            if (data.success) {
                // Convert to CSV
                const csvContent = convertToCSV(data.data.actions);
                downloadCSV(csvContent, `admin-history-${new Date().toISOString().split('T')[0]}.csv`);
            }
        } catch (err) {
            console.error('Export failed:', err);
        } finally {
            setExporting(false);
        }
    };

    // Convert actions to CSV
    const convertToCSV = (actions: AdminActionItem[]) => {
        const headers = [
            'Fecha',
            'Administrador',
            'Email Admin',
            'Tipo Acción',
            'Tipo Objetivo',
            'Objetivo',
            'Email Objetivo',
            'Razón',
            'Duración',
            'Severidad',
            'Categoría'
        ];

        const rows = actions.map(action => [
            new Date(action.createdAt).toLocaleString('es-ES'),
            action.adminName || 'N/A',
            action.adminEmail || 'N/A',
            getActionTypeLabel(action.actionType),
            action.targetType === 'user' ? 'Usuario' : 'Enlace',
            action.targetName || action.targetId,
            action.targetEmail || 'N/A',
            action.reason || 'N/A',
            action.duration ? `${action.duration} días` : 'N/A',
            action.metadata?.severity || 'N/A',
            action.metadata?.category || 'N/A'
        ]);

        return [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');
    };

    // Download CSV file
    const downloadCSV = (content: string, filename: string) => {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Get action type label in Spanish
    const getActionTypeLabel = (actionType: string) => {
        const labels: { [key: string]: string } = {
            'disable_user': 'Deshabilitar Usuario',
            'enable_user': 'Habilitar Usuario',
            'disable_link': 'Deshabilitar Enlace',
            'enable_link': 'Habilitar Enlace',
            'change_role': 'Cambiar Rol',
            'add_note': 'Agregar Nota',
            'add_warning': 'Agregar Warning',
            'resolve_warning': 'Resolver Warning',
            'edit_note': 'Editar Nota',
            'delete_note': 'Eliminar Nota',
            'edit_warning': 'Editar Warning',
            'delete_warning': 'Eliminar Warning'
        };
        return labels[actionType] || actionType;
    };

    // Get action icon
    const getActionIcon = (actionType: string) => {
        if (actionType.includes('user')) return User;
        if (actionType.includes('link')) return ExternalLink;
        if (actionType.includes('warning')) return AlertTriangle;
        if (actionType.includes('note')) return FileText;
        if (actionType.includes('role')) return Shield;
        return History;
    };

    // Get action color
    const getActionColor = (actionType: string) => {
        if (actionType.includes('disable') || actionType.includes('delete')) {
            return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
        }
        if (actionType.includes('enable') || actionType.includes('resolve')) {
            return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
        }
        if (actionType.includes('warning') || actionType === 'change_role') {
            return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/20';
        }
        return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20';
    };

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading && actions.length === 0) {
        return (
            <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400 mr-2" />
                <span className="text-gray-600 dark:text-gray-400">Cargando historial...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <History className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {userId ? 'Historial del Usuario' : 'Historial Administrativo'}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {totalActions} acciones registradas
                        </p>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium ${showFilters
                                ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-600'
                                : 'text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600'
                            }`}
                    >
                        <Filter className="w-4 h-4 mr-2" />
                        Filtros
                    </button>

                    <button
                        onClick={handleExport}
                        disabled={exporting || actions.length === 0}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        {exporting ? 'Exportando...' : 'Exportar CSV'}
                    </button>

                    <button
                        onClick={fetchActions}
                        disabled={loading}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Actualizar
                    </button>
                </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Tipo de Acción
                            </label>
                            <select
                                value={filters.actionType}
                                onChange={(e) => handleFilterChange('actionType', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                                <option value="">Todos los tipos</option>
                                <option value="disable_user">Deshabilitar Usuario</option>
                                <option value="enable_user">Habilitar Usuario</option>
                                <option value="change_role">Cambiar Rol</option>
                                <option value="add_note">Agregar Nota</option>
                                <option value="add_warning">Agregar Warning</option>
                                <option value="resolve_warning">Resolver Warning</option>
                                <option value="edit_note">Editar Nota</option>
                                <option value="delete_note">Eliminar Nota</option>
                                <option value="edit_warning">Editar Warning</option>
                                <option value="delete_warning">Eliminar Warning</option>
                            </select>
                        </div>

                        {!userId && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Tipo de Objetivo
                                </label>
                                <select
                                    value={filters.targetType}
                                    onChange={(e) => handleFilterChange('targetType', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                    <option value="">Todos los objetivos</option>
                                    <option value="user">Usuario</option>
                                    <option value="link">Enlace</option>
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Fecha Inicio
                            </label>
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Fecha Fin
                            </label>
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={clearFilters}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-center">
                        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
                        <span className="text-red-800 dark:text-red-200">{error}</span>
                    </div>
                </div>
            )}

            {/* Actions List */}
            {actions.length === 0 && !loading ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No se encontraron acciones administrativas</p>
                    {Object.values(filters).some(f => f) && (
                        <button
                            onClick={clearFilters}
                            className="mt-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                        >
                            Limpiar filtros
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {actions.map((action) => {
                        const ActionIcon = getActionIcon(action.actionType);
                        const actionColor = getActionColor(action.actionType);

                        return (
                            <div
                                key={action._id}
                                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-3 flex-1">
                                        <div className={`p-2 rounded-lg ${actionColor}`}>
                                            <ActionIcon className="w-4 h-4" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {getActionTypeLabel(action.actionType)}
                                                </span>
                                                {action.metadata?.severity && (
                                                    <span className={`px-2 py-1 text-xs rounded-full ${action.metadata.severity === 'critical'
                                                            ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                                            : action.metadata.severity === 'high'
                                                                ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
                                                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                                        }`}>
                                                        {action.metadata.severity}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                                <div className="flex items-center space-x-4">
                                                    <span>
                                                        <strong>Admin:</strong> {action.adminName || action.adminEmail}
                                                    </span>
                                                    <span>
                                                        <strong>Objetivo:</strong> {action.targetName || action.targetEmail || action.targetId}
                                                    </span>
                                                </div>

                                                {action.reason && (
                                                    <div>
                                                        <strong>Razón:</strong> {action.reason}
                                                    </div>
                                                )}

                                                {action.duration && (
                                                    <div>
                                                        <strong>Duración:</strong> {action.duration} días
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                                        <Clock className="w-4 h-4" />
                                        <span>{formatDate(action.createdAt)}</span>
                                        <button
                                            onClick={() => setSelectedAction(action)}
                                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalActions)} de {totalActions}
                        </span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value={10}>10 por página</option>
                            <option value={20}>20 por página</option>
                            <option value={50}>50 por página</option>
                        </select>
                    </div>

                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="p-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        <span className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                            Página {currentPage} de {totalPages}
                        </span>

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="p-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Action Detail Modal */}
            {selectedAction && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                    Detalles de la Acción
                                </h3>
                                <button
                                    onClick={() => setSelectedAction(null)}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Tipo de Acción
                                        </label>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {getActionTypeLabel(selectedAction.actionType)}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Fecha
                                        </label>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {formatDate(selectedAction.createdAt)}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Administrador
                                        </label>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {selectedAction.adminName || selectedAction.adminEmail}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Objetivo
                                        </label>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {selectedAction.targetName || selectedAction.targetEmail || selectedAction.targetId}
                                        </p>
                                    </div>
                                </div>

                                {selectedAction.reason && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Razón
                                        </label>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {selectedAction.reason}
                                        </p>
                                    </div>
                                )}

                                {selectedAction.metadata && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Metadatos
                                        </label>
                                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                                            <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                                                {JSON.stringify(selectedAction.metadata, null, 2)}
                                            </pre>
                                        </div>
                                    </div>
                                )}

                                {(selectedAction.previousState || selectedAction.newState) && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {selectedAction.previousState && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Estado Anterior
                                                </label>
                                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                                                    <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                                                        {JSON.stringify(selectedAction.previousState, null, 2)}
                                                    </pre>
                                                </div>
                                            </div>
                                        )}

                                        {selectedAction.newState && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Estado Nuevo
                                                </label>
                                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                                                    <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                                                        {JSON.stringify(selectedAction.newState, null, 2)}
                                                    </pre>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setSelectedAction(null)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-500"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}