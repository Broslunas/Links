'use client';

import React, { useState, useEffect } from 'react';
import {
    Trash2,
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Calendar,
    User,
    RefreshCw,
    FileText
} from 'lucide-react';

interface DeleteRequest {
    _id: string;
    reason: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    createdAt: string;
    updatedAt: string;
    expiresAt: string;
    completedAt?: string;
    scheduledDeletionAt?: string;
    admin: {
        name: string;
        email: string;
    };
}

interface DeleteRequestsSectionProps {
    userId: string;
}

export default function DeleteRequestsSection({ userId }: DeleteRequestsSectionProps) {
    const [deleteRequests, setDeleteRequests] = useState<DeleteRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    useEffect(() => {
        fetchDeleteRequests();
    }, [userId]);

    const fetchDeleteRequests = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await fetch('/api/admin/users/delete-requests?userId=' + encodeURIComponent(userId));
            
            if (!response.ok) {
                throw new Error('Error al cargar las solicitudes');
            }
            
            const data = await response.json();
            
            if (data.success) {
                const requests = data.deleteRequests || [];
                const statusOrder: Record<string, number> = {
                    'pending': 1,
                    'confirmed': 2,
                    'cancelled': 3,
                    'completed': 4
                };
                const sortedRequests = requests.sort((a: DeleteRequest, b: DeleteRequest) => {
                    return statusOrder[a.status] - statusOrder[b.status];
                });
                setDeleteRequests(sortedRequests);
            } else {
                throw new Error(data.error && data.error.message ? data.error.message : 'Error desconocido');
            }
        } catch (err) {
            console.error('Error fetching delete requests:', err);
            setError(err instanceof Error ? err.message : 'Error al cargar las solicitudes');
        } finally {
            setLoading(false);
        }
    };

    const cancelDeleteRequest = async (requestId: string) => {
        try {
            setCancellingId(requestId);
            
            const response = await fetch('/api/admin/users/delete-requests', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    requestId,
                    action: 'cancel'
                })
            });
            
            if (!response.ok) {
                throw new Error('Error al cancelar la solicitud');
            }
            
            const data = await response.json();
            
            if (data.success) {
                // Actualizar la lista de solicitudes
                setDeleteRequests(prev => 
                    prev.map(request => 
                        request._id === requestId 
                            ? { ...request, status: 'cancelled', completedAt: data.deleteRequest.completedAt }
                            : request
                    )
                );
            } else {
                throw new Error(data.error?.message || 'Error al cancelar la solicitud');
            }
        } catch (err) {
            console.error('Error cancelling delete request:', err);
            setError(err instanceof Error ? err.message : 'Error al cancelar la solicitud');
        } finally {
            setCancellingId(null);
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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        <Clock className="w-3 h-3 mr-1" />
                        Pendiente
                    </span>
                );
            case 'confirmed':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Programada
                    </span>
                );
            case 'completed':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Completada
                    </span>
                );
            case 'cancelled':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                        <XCircle className="w-3 h-3 mr-1" />
                        Cancelada
                    </span>
                );
            default:
                return null;
        }
    };

    const getStatusDescription = (request: DeleteRequest) => {
        switch (request.status) {
            case 'pending':
                return `Solicitud creada. Expira el ${formatDate(request.expiresAt)}`;
            case 'confirmed':
                return request.scheduledDeletionAt 
                    ? `Eliminación programada para ${formatDate(request.scheduledDeletionAt)}`
                    : 'Eliminación confirmada';
            case 'completed':
                return request.completedAt 
                    ? `Eliminación completada el ${formatDate(request.completedAt)}`
                    : 'Eliminación completada';
            case 'cancelled':
                return request.completedAt 
                    ? `Solicitud cancelada el ${formatDate(request.completedAt)}`
                    : 'Solicitud cancelada';
            default:
                return '';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600 dark:text-gray-400">Cargando solicitudes...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                    <span className="text-red-700 dark:text-red-400">{error}</span>
                </div>
                <button
                    onClick={fetchDeleteRequests}
                    className="mt-2 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                >
                    Intentar de nuevo
                </button>
            </div>
        );
    }

    if (deleteRequests.length === 0) {
        return (
            <div className="text-center py-8">
                <Trash2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No hay solicitudes de eliminación para este usuario</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Solicitudes de Eliminación
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                    {deleteRequests.length} solicitud{deleteRequests.length !== 1 ? 'es' : ''}
                </span>
            </div>

            <div className="space-y-3">
                {deleteRequests.map((request) => (
                    <div
                        key={request._id}
                        className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-2">
                                {getStatusBadge(request.status)}
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {formatDate(request.createdAt)}
                                </span>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                    <User className="w-4 h-4 mr-1" />
                                    {request.admin.name}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-500">
                                    {request.admin.email}
                                </div>
                            </div>
                        </div>

                        <div className="mb-3">
                            <div className="flex items-start space-x-2">
                                <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                        Razón:
                                    </p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        {request.reason}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                <Calendar className="w-3 h-3 mr-1" />
                                {getStatusDescription(request)}
                            </div>
                            
                            {(request.status === 'pending' || request.status === 'confirmed') && (
                                <button
                                    onClick={() => cancelDeleteRequest(request._id)}
                                    disabled={cancellingId === request._id}
                                    className="px-3 py-1 text-xs font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 border border-red-300 hover:border-red-400 dark:border-red-600 dark:hover:border-red-500 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {cancellingId === request._id ? (
                                        <>
                                            <RefreshCw className="w-3 h-3 mr-1 animate-spin inline" />
                                            Cancelando...
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="w-3 h-3 mr-1 inline" />
                                            Cancelar
                                        </>
                                    )}
                                </button>
                            )}
                        </div>

                        {request.status === 'pending' && new Date(request.expiresAt) < new Date() && (
                            <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                                <div className="flex items-center text-sm text-red-700 dark:text-red-400">
                                    <AlertTriangle className="w-4 h-4 mr-1" />
                                    Esta solicitud ha expirado
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}