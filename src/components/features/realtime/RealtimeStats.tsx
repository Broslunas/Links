'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';

interface RealtimeStatsProps {
    onConnectionChange: (connected: boolean) => void;
    timeRangeMinutes?: number;
    refreshInterval?: number;
    refreshKey?: number;
}

interface Stats {
    activeUsers: number;
    clicksInRange: number;
    clicksToday: number;
    topLink: {
        title: string;
        clicks: number;
    } | null;
}

export function RealtimeStats({
    onConnectionChange,
    timeRangeMinutes = 60,
    refreshInterval = 5,
    refreshKey = 0
}: RealtimeStatsProps) {
    const [stats, setStats] = useState<Stats>({
        activeUsers: 0,
        clicksInRange: 0,
        clicksToday: 0,
        topLink: null,
    });
    const [isLoading, setIsLoading] = useState(true);

    // Fetch initial stats
    const fetchStats = async () => {
        try {
            const response = await fetch(`/api/analytics/realtime/stats?timeRange=${timeRangeMinutes}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setStats(data.data);
                    onConnectionChange(true);
                }
            }
        } catch (error) {
            console.error('Error fetching realtime stats:', error);
            onConnectionChange(false);
        } finally {
            setIsLoading(false);
        }
    };

    // Set up polling for real-time updates
    useEffect(() => {
        fetchStats();

        if (refreshInterval > 0) {
            const interval = setInterval(fetchStats, refreshInterval * 1000);
            return () => clearInterval(interval);
        }
    }, [timeRangeMinutes, refreshInterval, refreshKey]);

    // Get time range label
    const getTimeRangeLabel = () => {
        if (timeRangeMinutes < 60) {
            return `${timeRangeMinutes} min`;
        } else if (timeRangeMinutes < 1440) {
            const hours = Math.floor(timeRangeMinutes / 60);
            const mins = timeRangeMinutes % 60;
            return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
        } else {
            const days = Math.floor(timeRangeMinutes / 1440);
            const hours = Math.floor((timeRangeMinutes % 1440) / 60);
            return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
        }
    };

    if (isLoading) {
        return (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="p-6">
                        <div className="animate-pulse">
                            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                            <div className="h-8 bg-muted rounded w-1/2"></div>
                        </div>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Active Users */}
            <Card className="p-6">
                <div className="flex items-center">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                        <svg
                            className="h-6 w-6 text-green-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                            />
                        </svg>
                    </div>
                    <div className="ml-4">
                        <p className="text-sm font-medium text-muted-foreground">
                            Usuarios Activos
                        </p>
                        <p className="text-2xl font-bold text-card-foreground">
                            {stats.activeUsers}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Últimos 5 min
                        </p>
                    </div>
                </div>
            </Card>

            {/* Clicks in Range */}
            <Card className="p-6">
                <div className="flex items-center">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                        <svg
                            className="h-6 w-6 text-blue-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>
                    <div className="ml-4">
                        <p className="text-sm font-medium text-muted-foreground">
                            Clicks en Rango
                        </p>
                        <p className="text-2xl font-bold text-card-foreground">
                            {stats.clicksInRange}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Últimos {getTimeRangeLabel()}
                        </p>
                    </div>
                </div>
            </Card>

            {/* Clicks Today */}
            <Card className="p-6">
                <div className="flex items-center">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                        <svg
                            className="h-6 w-6 text-purple-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                        </svg>
                    </div>
                    <div className="ml-4">
                        <p className="text-sm font-medium text-muted-foreground">
                            Hoy
                        </p>
                        <p className="text-2xl font-bold text-card-foreground">
                            {stats.clicksToday}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Total del día
                        </p>
                    </div>
                </div>
            </Card>

            {/* Top Link */}
            <Card className="p-6">
                <div className="flex items-center">
                    <div className="p-2 bg-orange-500/10 rounded-lg">
                        <svg
                            className="h-6 w-6 text-orange-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                            />
                        </svg>
                    </div>
                    <div className="ml-4">
                        <p className="text-sm font-medium text-muted-foreground">
                            Enlace Popular
                        </p>
                        {stats.topLink ? (
                            <div>
                                <p className="text-lg font-bold text-card-foreground truncate">
                                    {stats.topLink.title || 'Sin título'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {stats.topLink.clicks} clicks
                                </p>
                            </div>
                        ) : (
                            <p className="text-lg font-bold text-card-foreground">
                                Sin datos
                            </p>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
}