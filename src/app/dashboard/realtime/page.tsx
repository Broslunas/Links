'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import { RealtimeEvents } from '@/components/features/realtime/RealtimeEvents';
import { RealtimeStats } from '@/components/features/realtime/RealtimeStats';
import { RealtimeMap } from '@/components/features/realtime/RealtimeMap';

export default function RealtimePage() {
    const { data: session, status } = useSession();
    const [isConnected, setIsConnected] = useState(false);

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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">
                        Monitor en Tiempo Real
                    </h1>
                    <p className="text-muted-foreground">
                        Observa la actividad de tus enlaces en tiempo real
                    </p>
                </div>

                {/* Connection Status */}
                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm text-muted-foreground">
                        {isConnected ? 'Conectado' : 'Desconectado'}
                    </span>
                </div>
            </div>

            {/* Real-time Stats Cards */}
            <RealtimeStats onConnectionChange={setIsConnected} />

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
                    <RealtimeEvents />
                </Card>

                {/* Geographic Map */}
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-card-foreground">
                            Actividad Geográfica
                        </h2>
                        <div className="text-sm text-muted-foreground">
                            Últimas 24 horas
                        </div>
                    </div>
                    <RealtimeMap />
                </Card>
            </div>
        </div>
    );
}