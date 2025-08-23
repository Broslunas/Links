/**
 * Error logging and monitoring utilities for maintenance system
 */

export interface ErrorLogEntry {
    timestamp: string;
    level: 'error' | 'warn' | 'info';
    component: string;
    operation: string;
    error: string;
    stack?: string;
    context?: Record<string, any>;
    userId?: string;
    userAgent?: string;
    ip?: string;
}

/**
 * Centralized error logging for maintenance operations
 */
export class MaintenanceErrorLogger {
    private static instance: MaintenanceErrorLogger;
    private errorQueue: ErrorLogEntry[] = [];
    private maxQueueSize = 100;

    private constructor() { }

    public static getInstance(): MaintenanceErrorLogger {
        if (!MaintenanceErrorLogger.instance) {
            MaintenanceErrorLogger.instance = new MaintenanceErrorLogger();
        }
        return MaintenanceErrorLogger.instance;
    }

    /**
     * Log an error with context
     */
    public logError(
        component: string,
        operation: string,
        error: Error | string,
        context?: Record<string, any>,
        userId?: string
    ): void {
        const errorEntry: ErrorLogEntry = {
            timestamp: new Date().toISOString(),
            level: 'error',
            component,
            operation,
            error: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : undefined,
            context,
            userId,
            userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
        };

        this.addToQueue(errorEntry);
        this.logToConsole(errorEntry);
    }

    /**
     * Log a warning with context
     */
    public logWarning(
        component: string,
        operation: string,
        message: string,
        context?: Record<string, any>,
        userId?: string
    ): void {
        const errorEntry: ErrorLogEntry = {
            timestamp: new Date().toISOString(),
            level: 'warn',
            component,
            operation,
            error: message,
            context,
            userId,
            userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
        };

        this.addToQueue(errorEntry);
        this.logToConsole(errorEntry);
    }

    /**
     * Log info with context
     */
    public logInfo(
        component: string,
        operation: string,
        message: string,
        context?: Record<string, any>,
        userId?: string
    ): void {
        const errorEntry: ErrorLogEntry = {
            timestamp: new Date().toISOString(),
            level: 'info',
            component,
            operation,
            error: message,
            context,
            userId,
            userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
        };

        this.addToQueue(errorEntry);
        this.logToConsole(errorEntry);
    }

    /**
     * Add entry to queue with size management
     */
    private addToQueue(entry: ErrorLogEntry): void {
        this.errorQueue.push(entry);

        // Keep queue size manageable
        if (this.errorQueue.length > this.maxQueueSize) {
            this.errorQueue.shift();
        }
    }

    /**
     * Log to console with appropriate level
     */
    private logToConsole(entry: ErrorLogEntry): void {
        const logData = {
            component: entry.component,
            operation: entry.operation,
            error: entry.error,
            context: entry.context,
            timestamp: entry.timestamp,
            userId: entry.userId,
        };

        switch (entry.level) {
            case 'error':
                console.error(`[MAINTENANCE ERROR] ${entry.component}:${entry.operation}`, logData);
                if (entry.stack) {
                    console.error('Stack trace:', entry.stack);
                }
                break;
            case 'warn':
                console.warn(`[MAINTENANCE WARNING] ${entry.component}:${entry.operation}`, logData);
                break;
            case 'info':
                console.log(`[MAINTENANCE INFO] ${entry.component}:${entry.operation}`, logData);
                break;
        }
    }

    /**
     * Get recent error logs
     */
    public getRecentLogs(limit = 50): ErrorLogEntry[] {
        return this.errorQueue.slice(-limit);
    }

    /**
     * Get error logs by component
     */
    public getLogsByComponent(component: string, limit = 50): ErrorLogEntry[] {
        return this.errorQueue
            .filter(entry => entry.component === component)
            .slice(-limit);
    }

    /**
     * Get error logs by level
     */
    public getLogsByLevel(level: 'error' | 'warn' | 'info', limit = 50): ErrorLogEntry[] {
        return this.errorQueue
            .filter(entry => entry.level === level)
            .slice(-limit);
    }

    /**
     * Clear error logs
     */
    public clearLogs(): void {
        this.errorQueue = [];
    }

    /**
     * Get error statistics
     */
    public getErrorStats(): {
        total: number;
        byLevel: Record<string, number>;
        byComponent: Record<string, number>;
        recentErrors: number; // Last hour
    } {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

        const stats = {
            total: this.errorQueue.length,
            byLevel: {} as Record<string, number>,
            byComponent: {} as Record<string, number>,
            recentErrors: 0,
        };

        this.errorQueue.forEach(entry => {
            // Count by level
            stats.byLevel[entry.level] = (stats.byLevel[entry.level] || 0) + 1;

            // Count by component
            stats.byComponent[entry.component] = (stats.byComponent[entry.component] || 0) + 1;

            // Count recent errors
            if (entry.timestamp > oneHourAgo) {
                stats.recentErrors++;
            }
        });

        return stats;
    }
}

/**
 * Convenience function to get logger instance
 */
export const maintenanceLogger = MaintenanceErrorLogger.getInstance();

/**
 * Error boundary helper for maintenance components
 */
export function withMaintenanceErrorBoundary<T extends Record<string, any>>(
    Component: React.ComponentType<T>,
    componentName: string
): React.ComponentType<T> {
    return function MaintenanceErrorBoundaryWrapper(props: T) {
        const [hasError, setHasError] = React.useState(false);
        const [error, setError] = React.useState<Error | null>(null);

        React.useEffect(() => {
            const handleError = (event: ErrorEvent) => {
                maintenanceLogger.logError(
                    componentName,
                    'render',
                    event.error || new Error(event.message),
                    {
                        filename: event.filename,
                        lineno: event.lineno,
                        colno: event.colno,
                    }
                );
                setHasError(true);
                setError(event.error || new Error(event.message));
            };

            const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
                maintenanceLogger.logError(
                    componentName,
                    'promise_rejection',
                    event.reason instanceof Error ? event.reason : new Error(String(event.reason))
                );
            };

            window.addEventListener('error', handleError);
            window.addEventListener('unhandledrejection', handleUnhandledRejection);

            return () => {
                window.removeEventListener('error', handleError);
                window.removeEventListener('unhandledrejection', handleUnhandledRejection);
            };
        }, []);

        if (hasError) {
            return (
                <div className= "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4" >
                <div className="flex items-center gap-2 text-red-800 dark:text-red-200 mb-2" >
                    <svg className="h-5 w-5" fill = "currentColor" viewBox = "0 0 20 20" >
                        <path fillRule="evenodd" d = "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule = "evenodd" />
                            </svg>
                            < span className = "font-medium" > Error en { componentName } </span>
                                </div>
                                < p className = "text-sm text-red-700 dark:text-red-300 mb-3" >
                                    Ha ocurrido un error inesperado.Por favor, recarga la página e intenta nuevamente.
                    </p>
                                        < button
            onClick = {() => {
                setHasError(false);
                setError(null);
            }
        }
        className = "text-sm bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 px-3 py-1 rounded hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
            >
            Reintentar
            </button>
            </div>
            );
    }

    try {
        return <Component { ...props } />;
    } catch (renderError) {
        maintenanceLogger.logError(
            componentName,
            'render',
            renderError instanceof Error ? renderError : new Error(String(renderError))
        );
        setHasError(true);
        setError(renderError instanceof Error ? renderError : new Error(String(renderError)));
        return null;
    }
};
}

/**
 * Hook for maintenance error reporting
 */
export function useMaintenanceErrorReporting(componentName: string) {
    const reportError = React.useCallback((
        operation: string,
        error: Error | string,
        context?: Record<string, any>
    ) => {
        maintenanceLogger.logError(componentName, operation, error, context);
    }, [componentName]);

    const reportWarning = React.useCallback((
        operation: string,
        message: string,
        context?: Record<string, any>
    ) => {
        maintenanceLogger.logWarning(componentName, operation, message, context);
    }, [componentName]);

    const reportInfo = React.useCallback((
        operation: string,
        message: string,
        context?: Record<string, any>
    ) => {
        maintenanceLogger.logInfo(componentName, operation, message, context);
    }, [componentName]);

    return {
        reportError,
        reportWarning,
        reportInfo,
    };
}