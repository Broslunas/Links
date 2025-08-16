'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { Button } from './Button';
import { cn } from '@/lib/utils';

interface RedirectPageProps {
    destinationUrl: string;
    title?: string;
    redirectDelay?: number;
    className?: string;
}

type RedirectState = 'waiting' | 'redirecting' | 'failed' | 'manual';

const RedirectPage: React.FC<RedirectPageProps> = ({
    destinationUrl,
    title,
    redirectDelay = 3000, // Default 3 seconds
    className
}) => {
    const [countdown, setCountdown] = useState(Math.ceil(redirectDelay / 1000));
    const [redirectState, setRedirectState] = useState<RedirectState>('waiting');
    const [isVisible, setIsVisible] = useState(false);
    const [redirectAttempts, setRedirectAttempts] = useState(0);
    const [isJavaScriptEnabled, setIsJavaScriptEnabled] = useState(true);

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

    // Validate destination URL
    const isValidUrl = useCallback((url: string): boolean => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }, []);

    // Enhanced redirect function with error handling
    const performRedirect = useCallback(async (url: string, attempt: number = 1): Promise<boolean> => {
        if (!isValidUrl(url)) {
            console.error('Invalid destination URL:', url);
            setRedirectState('failed');
            return false;
        }

        try {
            setRedirectState('redirecting');

            // Try different redirect methods based on attempt
            switch (attempt) {
                case 1:
                    // First attempt: window.location.assign (allows back navigation)
                    window.location.assign(url);
                    break;
                case 2:
                    // Second attempt: window.location.href (more compatible)
                    window.location.href = url;
                    break;
                case 3:
                    // Third attempt: window.open with _self (fallback)
                    window.open(url, '_self');
                    break;
                default:
                    // Final fallback: create and click a link
                    const link = document.createElement('a');
                    link.href = url;
                    link.target = '_self';
                    link.rel = 'noopener noreferrer';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    break;
            }

            // If we reach here after a short delay, the redirect might have failed
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Check if we're still on the same page (redirect failed)
            if (window.location.href.includes(window.location.pathname)) {
                throw new Error('Redirect did not occur');
            }

            return true;
        } catch (error) {
            console.error(`Redirect attempt ${attempt} failed:`, error);

            if (attempt < 4) {
                // Try next method
                setRedirectAttempts(attempt);
                return performRedirect(url, attempt + 1);
            } else {
                // All attempts failed
                setRedirectState('failed');
                return false;
            }
        }
    }, [isValidUrl]);

    // Trigger fade-in animation on mount
    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 100);
        return () => clearTimeout(timer);
    }, []);

    // Check if JavaScript is enabled (this will run, proving JS is enabled)
    useEffect(() => {
        setIsJavaScriptEnabled(true);
    }, []);

    // Handle automatic redirection with enhanced error handling
    useEffect(() => {
        if (redirectState !== 'waiting') return;

        const timer = setTimeout(async () => {
            const success = await performRedirect(destinationUrl);
            if (!success) {
                console.error('Automatic redirect failed, user can try manual redirect');
            }
        }, redirectDelay);

        return () => clearTimeout(timer);
    }, [destinationUrl, redirectDelay, redirectState, performRedirect]);

    // Handle countdown display with enhanced state management
    useEffect(() => {
        if (redirectState !== 'waiting') return;

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
    }, [redirectState]);

    // Manual redirect handler with enhanced error handling
    const handleManualRedirect = useCallback(async () => {
        if (redirectState === 'redirecting') return;

        setRedirectState('manual');
        const success = await performRedirect(destinationUrl);

        if (!success) {
            // If manual redirect also fails, show error state
            console.error('Manual redirect failed');
        }
    }, [redirectState, performRedirect, destinationUrl]);

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
            {/* Loading Spinner with enhanced animation and state-aware text */}
            <div className={cn(
                'transition-all duration-500 ease-out',
                isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            )}>
                <LoadingSpinner
                    size="lg"
                    text={
                        redirectState === 'redirecting' ? 'Redirigiendo...' :
                            redirectState === 'manual' ? 'Redirigiendo...' :
                                redirectState === 'failed' ? 'Error de redirección' :
                                    redirectAttempts > 0 ? `Reintentando... (${redirectAttempts}/4)` :
                                        'Redirigiendo...'
                    }
                    className={cn(
                        'text-primary',
                        redirectState === 'failed' && 'text-destructive'
                    )}
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
                {/* Countdown with smooth number transitions and enhanced state handling */}
                {countdown > 0 && redirectState === 'waiting' && (
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

                {/* Redirect attempt status */}
                {redirectAttempts > 0 && redirectState === 'redirecting' && (
                    <div className={cn(
                        'transition-all duration-300 ease-in-out',
                        'p-3 rounded-lg bg-yellow-50 border border-yellow-200',
                        'dark:bg-yellow-900/20 dark:border-yellow-800'
                    )}>
                        <p className={cn(
                            'text-yellow-800 dark:text-yellow-200 leading-relaxed',
                            'text-sm sm:text-base',
                            'contrast-more:text-yellow-900 contrast-more:font-medium'
                        )}>
                            Reintentando redirección... (Intento {redirectAttempts} de 4)
                        </p>
                    </div>
                )}

                {/* Failed redirect message */}
                {redirectState === 'failed' && (
                    <div className={cn(
                        'transition-all duration-300 ease-in-out',
                        'p-4 rounded-lg bg-red-50 border border-red-200',
                        'dark:bg-red-900/20 dark:border-red-800'
                    )}>
                        <p className={cn(
                            'text-red-800 dark:text-red-200 leading-relaxed',
                            'text-sm sm:text-base font-medium',
                            'contrast-more:text-red-900 contrast-more:font-semibold'
                        )}>
                            La redirección automática falló. Por favor, usa el botón "Ir ahora" o el enlace directo abajo.
                        </p>
                    </div>
                )}

                {/* Manual redirect button with enhanced styling and state management */}
                <div className="flex flex-col items-center space-y-3">
                    <Button
                        onClick={handleManualRedirect}
                        disabled={redirectState === 'redirecting' || redirectState === 'manual'}
                        size="lg"
                        variant={redirectState === 'failed' ? 'default' : 'default'}
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
                            (redirectState === 'redirecting' || redirectState === 'manual') && 'animate-pulse',
                            // Failed state styling
                            redirectState === 'failed' && 'bg-primary hover:bg-primary/90'
                        )}
                        aria-label="Ir ahora al destino"
                        loading={redirectState === 'redirecting' || redirectState === 'manual'}
                    >
                        {redirectState === 'redirecting' || redirectState === 'manual' ? 'Redirigiendo...' :
                            redirectState === 'failed' ? 'Intentar de nuevo' : 'Ir ahora'}
                    </Button>

                    {/* Direct link fallback for failed redirects */}
                    {redirectState === 'failed' && (
                        <div className="text-center">
                            <p className={cn(
                                'text-muted-foreground text-sm mb-2',
                                'contrast-more:text-foreground'
                            )}>
                                O usa este enlace directo:
                            </p>
                            <a
                                href={destinationUrl}
                                target="_self"
                                rel="noopener noreferrer"
                                className={cn(
                                    'inline-flex items-center px-3 py-2 rounded-md',
                                    'text-sm font-medium text-primary hover:text-primary/80',
                                    'bg-primary/10 hover:bg-primary/20',
                                    'border border-primary/20 hover:border-primary/30',
                                    'transition-all duration-200',
                                    'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                                    'contrast-more:border-primary contrast-more:text-primary'
                                )}
                                aria-label={`Enlace directo a ${destinationUrl}`}
                            >
                                <span className="truncate max-w-[200px] sm:max-w-[300px]">
                                    {getDisplayUrl()}
                                </span>
                                <svg
                                    className="ml-2 h-4 w-4 flex-shrink-0"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                    />
                                </svg>
                            </a>
                        </div>
                    )}
                </div>

                {/* Enhanced fallback message for JavaScript disabled */}
                <noscript>
                    <div className={cn(
                        'mt-6 p-4 rounded-lg border',
                        'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
                        // Enhanced contrast for accessibility
                        'contrast-more:bg-yellow-100 contrast-more:border-yellow-400',
                        'contrast-more:dark:bg-yellow-900/40 contrast-more:dark:border-yellow-600'
                    )}>
                        <div className="space-y-3">
                            <p className={cn(
                                'text-yellow-800 dark:text-yellow-200 leading-relaxed font-medium',
                                'text-sm sm:text-base',
                                // Enhanced contrast for accessibility
                                'contrast-more:text-yellow-900 contrast-more:font-semibold',
                                'contrast-more:dark:text-yellow-100'
                            )}>
                                JavaScript está deshabilitado. La redirección automática no funcionará.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <a
                                    href={destinationUrl}
                                    className={cn(
                                        'inline-flex items-center justify-center px-4 py-2 rounded-md',
                                        'bg-yellow-600 hover:bg-yellow-700 text-white font-medium',
                                        'transition-colors duration-200',
                                        'focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2',
                                        'text-sm sm:text-base',
                                        // Enhanced contrast for accessibility
                                        'contrast-more:bg-yellow-800 contrast-more:border-2 contrast-more:border-yellow-900'
                                    )}
                                    rel="noopener noreferrer"
                                >
                                    Continuar al destino
                                    <svg
                                        className="ml-2 h-4 w-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                        />
                                    </svg>
                                </a>
                            </div>
                            <p className={cn(
                                'text-yellow-700 dark:text-yellow-300 text-xs',
                                'contrast-more:text-yellow-800 contrast-more:dark:text-yellow-200'
                            )}>
                                Para una mejor experiencia, considera habilitar JavaScript en tu navegador.
                            </p>
                        </div>
                    </div>
                </noscript>
            </div>
        </div>
    );
};

export { RedirectPage };