'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, Settings } from 'lucide-react';
import { useMaintenanceControl } from '@/hooks/useMaintenance';

interface MaintenanceBannerProps {
    userRole?: string;
}

export default function MaintenanceBanner({ userRole }: MaintenanceBannerProps) {
    const [dismissed, setDismissed] = useState(false);

    const {
        maintenanceState,
        loading,
        toggling,
        toggle,
        utils,
    } = useMaintenanceControl();

    // Reset dismissed state if maintenance status changes
    useEffect(() => {
        if (!maintenanceState.isActive) {
            setDismissed(false);
        }
    }, [maintenanceState.isActive]);

    const handleQuickToggle = async () => {
        if (!userRole || userRole !== 'admin') {
            console.warn('Non-admin user attempted to use quick toggle', {
                userRole,
                timestamp: new Date().toISOString()
            });
            return;
        }

        try {
            console.log('Attempting quick toggle to deactivate maintenance', {
                userRole,
                timestamp: new Date().toISOString()
            });

            await toggle({ isActive: false });

            console.log('Quick toggle completed successfully');
        } catch (error) {
            console.error('Error in quick toggle:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userRole,
                timestamp: new Date().toISOString()
            });

            // Show user feedback for quick toggle errors
            if (error instanceof Error) {
                if (error.message.includes('Authentication')) {
                    alert('Error de autenticación. Por favor, recarga la página e intenta nuevamente.');
                } else if (error.message.includes('timeout')) {
                    alert('La operación tardó demasiado. Por favor, intenta nuevamente.');
                } else {
                    alert('Error al desactivar el modo mantenimiento. Intenta desde el panel de administración.');
                }
            }
        }
    };

    // Don't show banner if:
    // - Still loading
    // - Maintenance is not active
    // - User is not admin
    // - Banner has been dismissed
    if (loading || !maintenanceState.isActive || userRole !== 'admin' || dismissed) {
        return null;
    }

    return (
        <div className="bg-orange-600 text-white shadow-lg border-b border-orange-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3 flex-1">
                        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold">Modo Mantenimiento Activo</span>
                                <span className="text-orange-100">•</span>
                                <span className="text-orange-100 text-sm">
                                    Solo los administradores pueden acceder al sistema
                                </span>
                            </div>

                            {(maintenanceState.message || maintenanceState.estimatedDuration) && (
                                <div className="mt-1 text-sm text-orange-100">
                                    {maintenanceState.message && (
                                        <span>"{maintenanceState.message}"</span>
                                    )}
                                    {maintenanceState.message && maintenanceState.estimatedDuration && (
                                        <span className="mx-2">•</span>
                                    )}
                                    {maintenanceState.estimatedDuration && (
                                        <span>Duración estimada: {utils.formatDuration(maintenanceState.estimatedDuration)}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                        <button
                            onClick={handleQuickToggle}
                            disabled={toggling}
                            className="flex items-center gap-2 px-3 py-1.5 bg-orange-700 hover:bg-orange-800 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {toggling ? (
                                <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                    Desactivando...
                                </>
                            ) : (
                                <>
                                    <Settings className="h-3 w-3" />
                                    Desactivar
                                </>
                            )}
                        </button>

                        <button
                            onClick={() => setDismissed(true)}
                            className="p-1 hover:bg-orange-700 rounded-md transition-colors"
                            title="Ocultar banner"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}