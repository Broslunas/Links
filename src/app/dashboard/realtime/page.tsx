'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/Card';
import { RealtimeEvents } from '@/components/features/realtime/RealtimeEvents';
import { RealtimeStats } from '@/components/features/realtime/RealtimeStats';
import { RealtimeMap } from '@/components/features/realtime/RealtimeMap';
import { TimeRangeFilter, TimeRange } from '@/components/features/realtime/TimeRangeFilter';
import { RefreshSettings, RefreshInterval } from '@/components/features/realtime/RefreshSettings';

export default function RealtimePage() {
    const { data: session, status } = useSession();
    const [isConnected, setIsConnected] = useState(false);
    const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('1h');
    const [timeRangeMinutes, setTimeRangeMinutes] = useState(60);
    const [refreshInterval, setRefreshInterval] = useState<RefreshInterval>(3);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    // Handle time range changes
    const handleTimeRangeChange = useCallback((range: TimeRange, minutes: number) => {
        setSelectedTimeRange(range);
        setTimeRangeMinutes(minutes);
        setRefreshKey(prev => prev + 1); // Force refresh components
    }, []);

    // Handle refresh interval changes
    const handleRefreshIntervalChange = useCallback((interval: RefreshInterval) => {
        setRefreshInterval(interval);
    }, []);

    // Manual refresh function
    const handleManualRefresh = useCallback(() => {
        setIsRefreshing(true);
        setRefreshKey(prev => prev + 1);

        // Reset refreshing state after a short delay
        setTimeout(() => {
            setIsRefreshing(false);
        }, 1000);
    }, []);

    // Handle authentication state
    useEffect(() => {
        if (status === 'unauthenticated') {
            window.location.href =
                '/auth/signin?callbackUrl=' + encodeURIComponent(window.location.href);
        }
    }, [status]);

    // Show loading state while checking authentication
    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
                </div>
            </div>
        );
    }

    // Show message if not authenticated
    if (status === 'unauthenticated') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <p className="text-gray-600 dark:text-gray-400">
                        Redirigiendo a la página de inicio de sesión...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">
                        Monitor en Tiempo Real
                    </h1>
                    <p className="text-muted-foreground">
                        Observa la actividad de tus enlaces en tiempo real
                    </p>
                </div>

                {/* Connection Status & Controls */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm text-muted-foreground">
                            {isConnected ? 'Conectado' : 'Desconectado'}
                        </span>
                    </div>

                    <RefreshSettings
                        selectedInterval={refreshInterval}
                        onIntervalChange={handleRefreshIntervalChange}
                        onManualRefresh={handleManualRefresh}
                        isRefreshing={isRefreshing}
                    />
                </div>
            </div>

            {/* Time Range Filter */}
            <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-card-foreground">
                        Filtros de Tiempo
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Personaliza el rango de datos</span>
                    </div>
                </div>

                <TimeRangeFilter
                    selectedRange={selectedTimeRange}
                    onRangeChange={handleTimeRangeChange}
                    customMinutes={timeRangeMinutes}
                />
            </Card>

            {/* Real-time Stats Cards */}
            <RealtimeStats
                onConnectionChange={setIsConnected}
                timeRangeMinutes={timeRangeMinutes}
                refreshInterval={refreshInterval}
                refreshKey={refreshKey}
            />

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent Events */}
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-card-foreground">
                            Eventos Recientes
                        </h2>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-sm text-muted-foreground">En vivo</span>
                        </div>
                    </div>
                    <RealtimeEvents
                        timeRangeMinutes={timeRangeMinutes}
                        refreshInterval={refreshInterval}
                        refreshKey={refreshKey}
                    />
                </Card>

                {/* Geographic Map */}
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-card-foreground">
                            Actividad Geográfica
                        </h2>
                        <div className="text-sm text-muted-foreground">
                            {selectedTimeRange === 'custom'
                                ? `Últimos ${timeRangeMinutes < 60 ? `${timeRangeMinutes}m` : `${Math.floor(timeRangeMinutes / 60)}h`}`
                                : selectedTimeRange === '24h' ? 'Últimas 24 horas' : `Últimos ${selectedTimeRange}`
                            }
                        </div>
                    </div>
                    <RealtimeMap
                        timeRangeMinutes={timeRangeMinutes}
                        refreshInterval={refreshInterval}
                        refreshKey={refreshKey}
                    />
                </Card>
            </div>
        </div>
    );
}