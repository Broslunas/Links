'use client';

import React, { useEffect, useState } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { Button } from './Button';
import { cn } from '@/lib/utils';

interface RedirectPageProps {
    destinationUrl: string;
    title?: string;
    redirectDelay?: number;
    className?: string;
}

const RedirectPage: React.FC<RedirectPageProps> = ({
    destinationUrl,
    title,
    redirectDelay = 3000, // Default 3 seconds
    className
}) => {
    const [countdown, setCountdown] = useState(Math.ceil(redirectDelay / 1000));
    const [hasRedirected, setHasRedirected] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    // Function to truncate long URLs for display with responsive breakpoints
    const truncateUrl = (url: string, maxLength: number = 60): string => {
        if (url.length <= maxLength) return url;

        // Try to keep the domain and show the end of the path
        try {
            const urlObj = new URL(url);
            const domain = urlObj.hostname;
            const path = urlObj.pathname + urlObj.search + urlObj.hash;

            if (domain.length + 10 >= maxLength) {
                // If domain is too long, just truncate normally
                return url.substring(0, maxLength - 3) + '...';
            }

            const availableLength = maxLength - domain.length - 6; // 6 for "..." and "/"
            if (path.length <= availableLength) {
                return url;
            }

            const truncatedPath = '...' + path.substring(path.length - availableLength);
            return `${urlObj.protocol}//${domain}${truncatedPath}`;
        } catch {
            // If URL parsing fails, just truncate normally
            return url.substring(0, maxLength - 3) + '...';
        }
    };

    // Trigger fade-in animation on mount
    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 100);
        return () => clearTimeout(timer);
    }, []);

    // Handle automatic redirection
    useEffect(() => {
        if (hasRedirected) return;

        const timer = setTimeout(() => {
            setHasRedirected(true);
            window.location.assign(destinationUrl);
        }, redirectDelay);

        return () => clearTimeout(timer);
    }, [destinationUrl, redirectDelay, hasRedirected]);

    // Handle countdown display
    useEffect(() => {
        if (hasRedirected) return;

        const interval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [hasRedirected]);

    // Manual redirect handler
    const handleManualRedirect = () => {
        if (!hasRedirected) {
            setHasRedirected(true);
            window.location.assign(destinationUrl);
        }
    };

    // Responsive URL truncation
    const getDisplayUrl = () => {
        if (typeof window !== 'undefined') {
            const width = window.innerWidth;
            if (width < 640) return truncateUrl(destinationUrl, 35); // Mobile
            if (width < 1024) return truncateUrl(destinationUrl, 50); // Tablet
            return truncateUrl(destinationUrl, 70); // Desktop
        }
        return truncateUrl(destinationUrl, 60); // Default
    };

    const displayUrl = getDisplayUrl();

    return (
        <div className={cn(
            // Base layout with responsive padding and max-width
            'flex flex-col items-center justify-center min-h-screen px-4 py-8',
            // Responsive spacing and sizing
            'space-y-6 sm:space-y-8 lg:space-y-10',
            'max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl mx-auto',
            // Smooth fade-in animation
            'transition-all duration-700 ease-out',
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
            className
        )}>
            {/* Loading Spinner with enhanced animation */}
            <div className={cn(
                'transition-all duration-500 ease-out',
                isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            )}>
                <LoadingSpinner
                    size="lg"
                    text="Redirigiendo..."
                    className="text-primary"
                />
            </div>

            {/* Redirect Message with staggered animation */}
            <div className={cn(
                'space-y-4 sm:space-y-5 text-center',
                'transition-all duration-700 ease-out delay-200',
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}>
                {/* Main heading with responsive typography */}
                <h1 className={cn(
                    'font-semibold text-foreground leading-tight',
                    'text-xl sm:text-2xl lg:text-3xl',
                    // Enhanced contrast for accessibility
                    'contrast-more:font-bold'
                )}>
                    {title || 'Estás siendo redirigido'}
                </h1>

                {/* Subtitle with improved spacing */}
                <p className={cn(
                    'text-muted-foreground leading-relaxed',
                    'text-sm sm:text-base lg:text-lg',
                    // Enhanced contrast for accessibility
                    'contrast-more:text-foreground contrast-more:font-medium'
                )}>
                    Serás redirigido a:
                </p>

                {/* Destination URL with enhanced styling */}
                <div className={cn(
                    // Responsive padding and border radius
                    'bg-muted/50 rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-5',
                    'border border-border/50',
                    // Subtle shadow and hover effects
                    'shadow-sm hover:shadow-md transition-shadow duration-300',
                    // Enhanced contrast for accessibility
                    'contrast-more:bg-muted contrast-more:border-border'
                )}>
                    <p
                        className={cn(
                            'font-mono text-foreground break-all leading-relaxed',
                            'text-xs sm:text-sm lg:text-base',
                            // Enhanced contrast for accessibility
                            'contrast-more:font-semibold'
                        )}
                        title={destinationUrl}
                        aria-label={`Destino: ${destinationUrl}`}
                    >
                        {displayUrl}
                    </p>
                </div>
            </div>

            {/* Countdown and Manual Redirect with staggered animation */}
            <div className={cn(
                'space-y-4 sm:space-y-5 w-full',
                'transition-all duration-700 ease-out delay-400',
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}>
                {/* Countdown with smooth number transitions */}
                {countdown > 0 && !hasRedirected && (
                    <div className={cn(
                        'transition-all duration-300 ease-in-out',
                        'transform hover:scale-105'
                    )}>
                        <p className={cn(
                            'text-muted-foreground leading-relaxed',
                            'text-sm sm:text-base',
                            // Enhanced contrast for accessibility
                            'contrast-more:text-foreground contrast-more:font-medium'
                        )}>
                            Redirigiendo automáticamente en{' '}
                            <span className={cn(
                                'font-semibold text-primary tabular-nums',
                                'transition-all duration-300 ease-in-out',
                                // Enhanced contrast for accessibility
                                'contrast-more:text-foreground'
                            )}>
                                {countdown}
                            </span>{' '}
                            segundo{countdown !== 1 ? 's' : ''}...
                        </p>
                    </div>
                )}

                {/* Manual redirect button with enhanced styling */}
                <div className="flex justify-center">
                    <Button
                        onClick={handleManualRedirect}
                        disabled={hasRedirected}
                        size="lg"
                        className={cn(
                            // Responsive button sizing
                            'min-w-[180px] sm:min-w-[200px] lg:min-w-[220px]',
                            'px-6 sm:px-8 lg:px-10',
                            'text-sm sm:text-base lg:text-lg',
                            // Enhanced animations
                            'transition-all duration-300 ease-out',
                            'hover:scale-105 active:scale-95',
                            'shadow-lg hover:shadow-xl',
                            // Enhanced contrast for accessibility
                            'contrast-more:border-2 contrast-more:border-primary-foreground',
                            // Loading state styling
                            hasRedirected && 'animate-pulse'
                        )}
                        aria-label="Ir ahora al destino"
                        loading={hasRedirected}
                    >
                        {hasRedirected ? 'Redirigiendo...' : 'Ir ahora'}
                    </Button>
                </div>

                {/* Fallback message for JavaScript disabled */}
                <noscript>
                    <div className={cn(
                        'mt-6 p-4 rounded-lg border',
                        'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
                        // Enhanced contrast for accessibility
                        'contrast-more:bg-yellow-100 contrast-more:border-yellow-400',
                        'contrast-more:dark:bg-yellow-900/40 contrast-more:dark:border-yellow-600'
                    )}>
                        <p className={cn(
                            'text-yellow-800 dark:text-yellow-200 leading-relaxed',
                            'text-sm sm:text-base',
                            // Enhanced contrast for accessibility
                            'contrast-more:text-yellow-900 contrast-more:font-medium',
                            'contrast-more:dark:text-yellow-100'
                        )}>
                            JavaScript está deshabilitado.
                            <a
                                href={destinationUrl}
                                className={cn(
                                    'underline font-medium ml-1',
                                    'hover:no-underline transition-all duration-200',
                                    'focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2',
                                    'rounded px-1',
                                    // Enhanced contrast for accessibility
                                    'contrast-more:font-bold contrast-more:text-yellow-900',
                                    'contrast-more:dark:text-yellow-100'
                                )}
                                rel="noopener noreferrer"
                            >
                                Haz clic aquí para continuar
                            </a>
                        </p>
                    </div>
                </noscript>
            </div>
        </div>
    );
};

export { RedirectPage };