'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface RealtimeEvent {
    id: string;
    linkId: string;
    linkTitle: string;
    linkSlug: string;
    timestamp: string;
    country: string;
    city: string;
    device: 'mobile' | 'tablet' | 'desktop';
    browser: string;
    os: string;
}

export function RealtimeEvents() {
    const [events, setEvents] = useState<RealtimeEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch recent events
    const fetchEvents = async () => {
        try {
            const response = await fetch('/api/analytics/realtime/events');
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setEvents(data.data);
                }
            }
        } catch (error) {
            console.error('Error fetching realtime events:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Set up polling for real-time updates
    useEffect(() => {
        fetchEvents();

        const interval = setInterval(fetchEvents, 3000); // Update every 3 seconds

        return () => clearInterval(interval);
    }, []);

    const getDeviceIcon = (device: string) => {
        switch (device) {
            case 'mobile':
                return (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a1 1 0 001-1V4a1 1 0 00-1-1H8a1 1 0 00-1 1v16a1 1 0 001 1z" />
                    </svg>
                );
            case 'tablet':
                return (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                );
            default:
                return (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                );
        }
    };

    const getCountryFlag = (country: string) => {
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
        return countryFlags[country] || '🌍';
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-muted rounded-full"></div>
                            <div className="flex-1">
                                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                                <div className="h-3 bg-muted rounded w-1/2"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (events.length === 0) {
        return (
            <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                    <svg className="h-8 w-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <p className="text-muted-foreground">No hay eventos recientes</p>
                <p className="text-sm text-muted-foreground mt-1">
                    Los nuevos clicks aparecerán aquí en tiempo real
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4 max-h-96 overflow-y-auto">
            {events.map((event) => (
                <div
                    key={event.id}
                    className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                >
                    {/* Country Flag */}
                    <div className="text-lg">
                        {getCountryFlag(event.country)}
                    </div>

                    {/* Event Details */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-card-foreground truncate">
                                {event.linkTitle || event.linkSlug}
                            </p>
                            <div className="flex items-center space-x-1 text-muted-foreground">
                                {getDeviceIcon(event.device)}
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <span>{event.city}, {event.country}</span>
                            <span>•</span>
                            <span>{event.browser}</span>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(event.timestamp), { addSuffix: true, locale: es })}</span>
                        </div>
                    </div>

                    {/* Live indicator */}
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
            ))}
        </div>
    );
}