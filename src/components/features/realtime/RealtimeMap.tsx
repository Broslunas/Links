'use client';

import { useState, useEffect } from 'react';
import { InteractiveMap } from './InteractiveMap';
import { MapLegend } from './MapLegend';

interface CountryData {
    country: string;
    countryCode: string;
    clicks: number;
    percentage: number;
}

interface RealtimeMapProps {
    timeRangeMinutes?: number;
    refreshInterval?: number;
    refreshKey?: number;
}

export function RealtimeMap({
    timeRangeMinutes = 1440,
    refreshInterval = 10,
    refreshKey = 0
}: RealtimeMapProps) {
    const [countryData, setCountryData] = useState<CountryData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalClicks, setTotalClicks] = useState(0);
    const [showMap, setShowMap] = useState(true);

    // Fetch geographic data
    const fetchGeographicData = async () => {
        try {
            const response = await fetch(`/api/analytics/realtime/geographic?timeRange=${timeRangeMinutes}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setCountryData(data.data.countries);
                    setTotalClicks(data.data.total);
                }
            }
        } catch (error) {
            console.error('Error fetching geographic data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Set up polling for real-time updates
    useEffect(() => {
        fetchGeographicData();

        if (refreshInterval > 0) {
            const interval = setInterval(fetchGeographicData, refreshInterval * 1000);
            return () => clearInterval(interval);
        }
    }, [timeRangeMinutes, refreshInterval, refreshKey]);

    const getCountryFlag = (countryCode: string) => {
        // Simple country code to flag emoji mapping
        const countryFlags: { [key: string]: string } = {
            'ES': '🇪🇸',
            'US': '🇺🇸',
            'MX': '🇲🇽',
            'AR': '🇦🇷',
            'CO': '🇨🇴',
            'PE': '🇵🇪',
            'CL': '🇨🇱',
            'VE': '🇻🇪',
            'EC': '🇪🇨',
            'BO': '🇧🇴',
            'PY': '🇵🇾',
            'UY': '🇺🇾',
            'BR': '🇧🇷',
            'FR': '🇫🇷',
            'DE': '🇩🇪',
            'IT': '🇮🇹',
            'GB': '🇬🇧',
            'CA': '🇨🇦',
        };
        return countryFlags[countryCode] || '🌍';
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="animate-pulse">
                    <div className="h-80 bg-muted rounded-lg mb-4"></div>
                    <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <div className="w-6 h-4 bg-muted rounded"></div>
                                    <div className="h-4 bg-muted rounded w-20"></div>
                                </div>
                                <div className="h-4 bg-muted rounded w-12"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (countryData.length === 0) {
        return (
            <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                    <svg className="h-8 w-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <p className="text-muted-foreground">No hay datos geográficos</p>
                <p className="text-sm text-muted-foreground mt-1">
                    Los datos aparecerán cuando haya actividad
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Map Toggle */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setShowMap(true)}
                        className={`px-3 py-1 text-sm rounded-md transition-colors ${showMap
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                    >
                        Mapa
                    </button>
                    <button
                        onClick={() => setShowMap(false)}
                        className={`px-3 py-1 text-sm rounded-md transition-colors ${!showMap
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                    >
                        Lista
                    </button>
                </div>
                <div className="text-sm text-muted-foreground">
                    {totalClicks} clicks totales
                </div>
            </div>

            {/* Interactive Map */}
            {showMap && (
                <div className="space-y-4">
                    <InteractiveMap countryData={countryData} totalClicks={totalClicks} />
                    <MapLegend />
                </div>
            )}

            {/* Country List */}
            {!showMap && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm font-medium text-muted-foreground border-b border-border pb-2">
                        <span>País</span>
                        <span>Clicks</span>
                    </div>

                    <div className="space-y-2 max-h-80 overflow-y-auto">
                        {countryData.map((country) => (
                            <div
                                key={country.countryCode}
                                className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-center space-x-3">
                                    <span className="text-lg">
                                        {getCountryFlag(country.countryCode)}
                                    </span>
                                    <span className="text-sm font-medium text-card-foreground">
                                        {country.country}
                                    </span>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <div className="w-16 bg-muted rounded-full h-2">
                                        <div
                                            className="bg-primary h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${country.percentage}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-sm font-medium text-card-foreground min-w-[2rem] text-right">
                                        {country.clicks}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {totalClicks > 0 && (
                        <div className="text-center pt-2 border-t border-border">
                            <p className="text-sm text-muted-foreground">
                                Total: <span className="font-medium text-card-foreground">{totalClicks}</span> clicks en las últimas 24h
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}