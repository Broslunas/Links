'use client';

import React, { useState, useEffect } from 'react';
import { Settings, AlertTriangle, CheckCircle, Clock, X } from 'lucide-react';
import { useMaintenanceControl } from '@/hooks/useMaintenance';

interface MaintenanceControlProps {
    onClose?: () => void;
}

export default function MaintenanceControl({ onClose }: MaintenanceControlProps) {
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [formData, setFormData] = useState({
        message: '',
        estimatedDuration: ''
    });

    const {
        maintenanceState,
        loading,
        toggling,
        error,
        toggle,
        utils,
    } = useMaintenanceControl({
        onError: (error) => {
            console.error('Error in maintenance control:', {
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });

            // Show user-friendly error messages based on error type
            let userMessage = 'Error al cambiar el estado de mantenimiento';

            if (error.message.includes('Authentication')) {
                userMessage = 'Error de autenticación. Por favor, inicia sesión nuevamente.';
            } else if (error.message.includes('Admin access')) {
                userMessage = 'No tienes permisos de administrador para esta acción.';
            } else if (error.message.includes('timeout')) {
                userMessage = 'La operación tardó demasiado. Por favor, intenta nuevamente.';
            } else if (error.message.includes('connection')) {
                userMessage = 'Error de conexión. Verifica tu conexión a internet e intenta nuevamente.';
            }

            alert(userMessage);
        },
        onStatusChange: (status) => {
            console.log('Maintenance status changed in control component:', {
                isActive: status.isActive,
                hasMessage: !!status.message,
                hasEstimatedDuration: !!status.estimatedDuration,
                timestamp: new Date().toISOString()
            });
        }
    });

    console.log('Hook returned:', {
        loading,
        error: error?.message,
        maintenanceState: maintenanceState?.isActive
    });

    // Update form data when maintenance state changes
    useEffect(() => {
        setFormData({
            message: maintenanceState.message || '',
            estimatedDuration: maintenanceState.estimatedDuration ? maintenanceState.estimatedDuration.toString() : ''
        });
    }, [maintenanceState.message, maintenanceState.estimatedDuration]);

    const handleToggleMaintenance = async () => {
        try {
            // Validate form data before submitting
            const estimatedDurationNum = formData.estimatedDuration ? parseInt(formData.estimatedDuration) : undefined;

            if (estimatedDurationNum !== undefined && (isNaN(estimatedDurationNum) || estimatedDurationNum < 0)) {
                alert('La duración estimada debe ser un número positivo');
                return;
            }

            if (formData.message && formData.message.length > 500) {
                alert('El mensaje no puede exceder 500 caracteres');
                return;
            }

            console.log('Submitting maintenance toggle request', {
                isActive: !maintenanceState.isActive,
                hasMessage: !!formData.message,
                hasEstimatedDuration: !!estimatedDurationNum,
                timestamp: new Date().toISOString()
            });

            await toggle({
                isActive: !maintenanceState.isActive,
                message: formData.message || undefined,
                estimatedDuration: estimatedDurationNum
            });

            setShowConfirmDialog(false);
            console.log('Maintenance toggle completed successfully');
        } catch (error) {
            console.error('Error in handleToggleMaintenance:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
            // Error is already handled by the hook's onError callback
            // But we can add additional UI feedback here if needed
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setShowConfirmDialog(true);
    };

    console.log('MaintenanceControl state:', { loading, error: error?.message, isActive: maintenanceState.isActive });

    if (loading) {
        console.log('MaintenanceControl is still loading...');
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-6">
                    <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-6"></div>
                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Control de Mantenimiento
                        </h3>
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="p-6">
                    {/* Current Status */}
                    <div className="mb-6">
                        <div className="flex items-center gap-3 mb-2">
                            {maintenanceState.isActive ? (
                                <AlertTriangle className="h-5 w-5 text-orange-500" />
                            ) : (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                            )}
                            <span className="font-medium text-gray-900 dark:text-white">
                                Estado actual: {maintenanceState.isActive ? 'Modo Mantenimiento ACTIVO' : 'Sistema Operativo'}
                            </span>
                        </div>

                        {maintenanceState.isActive && (
                            <div className="ml-8 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                {maintenanceState.activatedBy && (
                                    <p>Activado por: {maintenanceState.activatedBy}</p>
                                )}
                                {maintenanceState.activatedAt && (
                                    <p>Desde: {new Date(maintenanceState.activatedAt).toLocaleString('es-ES')}</p>
                                )}
                                {maintenanceState.message && (
                                    <p>Mensaje: "{maintenanceState.message}"</p>
                                )}
                                {maintenanceState.estimatedDuration && (
                                    <p>Duración estimada: {utils.formatDuration(maintenanceState.estimatedDuration)}</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Control Form */}
                    <form onSubmit={handleFormSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Mensaje personalizado (opcional)
                            </label>
                            <textarea
                                id="message"
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                placeholder="Ej: Estamos realizando mejoras en el sistema. Volveremos pronto."
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                rows={3}
                                maxLength={500}
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {formData.message.length}/500 caracteres
                            </p>
                        </div>

                        <div>
                            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Duración estimada (minutos, opcional)
                            </label>
                            <input
                                type="number"
                                id="duration"
                                value={formData.estimatedDuration}
                                onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
                                placeholder="Ej: 30"
                                min="0"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={toggling}
                            className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${maintenanceState.isActive
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-orange-600 hover:bg-orange-700 text-white'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {toggling ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Actualizando...
                                </>
                            ) : (
                                <>
                                    {maintenanceState.isActive ? (
                                        <>
                                            <CheckCircle className="h-4 w-4" />
                                            Desactivar Modo Mantenimiento
                                        </>
                                    ) : (
                                        <>
                                            <AlertTriangle className="h-4 w-4" />
                                            Activar Modo Mantenimiento
                                        </>
                                    )}
                                </>
                            )}
                        </button>
                    </form>

                    {/* Warning */}
                    <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-yellow-800 dark:text-yellow-200">
                                <p className="font-medium mb-1">Importante:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>El modo mantenimiento bloqueará el acceso a todos los usuarios excepto administradores</li>
                                    <li>Los usuarios verán una página de mantenimiento con el mensaje personalizado</li>
                                    <li>Solo los administradores pueden activar/desactivar este modo</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Dialog */}
            {showConfirmDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <AlertTriangle className="h-6 w-6 text-orange-500" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Confirmar Cambio
                                </h3>
                            </div>

                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                {maintenanceState.isActive
                                    ? '¿Estás seguro de que quieres desactivar el modo mantenimiento? Los usuarios podrán acceder al sistema nuevamente.'
                                    : '¿Estás seguro de que quieres activar el modo mantenimiento? Esto bloqueará el acceso a todos los usuarios excepto administradores.'
                                }
                            </p>

                            {!maintenanceState.isActive && (formData.message || formData.estimatedDuration) && (
                                <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Configuración:</p>
                                    {formData.message && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Mensaje: "{formData.message}"
                                        </p>
                                    )}
                                    {formData.estimatedDuration && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Duración: {utils.formatDuration(parseInt(formData.estimatedDuration))}
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowConfirmDialog(false)}
                                    className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleToggleMaintenance}
                                    disabled={toggling}
                                    className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${maintenanceState.isActive
                                        ? 'bg-green-600 hover:bg-green-700 text-white'
                                        : 'bg-orange-600 hover:bg-orange-700 text-white'
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {toggling ? 'Actualizando...' : 'Confirmar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}