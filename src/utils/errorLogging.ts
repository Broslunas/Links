/**
 * Error logging and monitoring utilities for maintenance system
 */
import React from 'react';

export interface ErrorLogEntry {
    timestamp: string;
    level: 'error' | 'warn' | 'info';
    component: string;
    operation: string;
    error: string;
    stack?: string;
    context?: Record<string, any>;
    userAgent?: string;
    url?: string;
}

/**
 * Maintenance Error Logger
 */
export class MaintenanceErrorLogger {
    private static instance: MaintenanceErrorLogger;
    private logs: ErrorLogEntry[] = [];
    private maxLogs = 100;

    private constructor() { }

    static getInstance(): MaintenanceErrorLogger {
        if (!MaintenanceErrorLogger.instance) {
            MaintenanceErrorLogger.instance = new MaintenanceErrorLogger();
        }
        return MaintenanceErrorLogger.instance;
    }

    /**
     * Log an error with context
     */
    logError(
        component: string,
        operation: string,
        error: Error,
        context?: Record<string, any>
    ): void {
        const entry: ErrorLogEntry = {
            timestamp: new Date().toISOString(),
            level: 'error',
            component,
            operation,
            error: error.message,
            stack: error.stack,
            context,
            userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
            url: typeof window !== 'undefined' ? window.location.href : undefined,
        };

        this.addLog(entry);
        console.error(`[${component}:${operation}]`, error, context);
    }

    /**
     * Log a warning
     */
    logWarning(
        component: string,
        operation: string,
        message: string,
        context?: Record<string, any>
    ): void {
        const entry: ErrorLogEntry = {
            timestamp: new Date().toISOString(),
            level: 'warn',
            component,
            operation,
            error: message,
            context,
            userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
            url: typeof window !== 'undefined' ? window.location.href : undefined,
        };

        this.addLog(entry);
        console.warn(`[${component}:${operation}]`, message, context);
    }

    /**
     * Log info message
     */
    logInfo(
        component: string,
        operation: string,
        message: string,
        context?: Record<string, any>
    ): void {
        const entry: ErrorLogEntry = {
            timestamp: new Date().toISOString(),
            level: 'info',
            component,
            operation,
            error: message,
            context,
            userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
            url: typeof window !== 'undefined' ? window.location.href : undefined,
        };

        this.addLog(entry);
        console.info(`[${component}:${operation}]`, message, context);
    }

    /**
     * Add log entry to internal storage
     */
    private addLog(entry: ErrorLogEntry): void {
        this.logs.push(entry);

        // Keep only the most recent logs
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }
    }

    /**
     * Get all logs
     */
    getLogs(): ErrorLogEntry[] {
        return [...this.logs];
    }

    /**
     * Get logs by component
     */
    getLogsByComponent(component: string): ErrorLogEntry[] {
        return this.logs.filter(log => log.component === component);
    }

    /**
     * Get logs by level
     */
    getLogsByLevel(level: 'error' | 'warn' | 'info'): ErrorLogEntry[] {
        return this.logs.filter(log => log.level === level);
    }

    /**
     * Clear all logs
     */
    clearLogs(): void {
        this.logs = [];
    }

    /**
     * Export logs as JSON
     */
    exportLogs(): string {
        return JSON.stringify(this.logs, null, 2);
    }

    /**
     * Get error statistics
     */
    getErrorStats(): {
        total: number;
        byLevel: Record<string, number>;
        byComponent: Record<string, number>;
        recent: ErrorLogEntry[];
    } {
        const byLevel: Record<string, number> = {};
        const byComponent: Record<string, number> = {};

        this.logs.forEach(log => {
            byLevel[log.level] = (byLevel[log.level] || 0) + 1;
            byComponent[log.component] = (byComponent[log.component] || 0) + 1;
        });

        // Get recent errors (last 10)
        const recent = this.logs
            .filter(log => log.level === 'error')
            .slice(-10);

        return {
            total: this.logs.length,
            byLevel,
            byComponent,
            recent,
        };
    }
}

/**
 * Convenience function to get logger instance
 */
export const maintenanceLogger = MaintenanceErrorLogger.getInstance();

/**
 * Error boundary helper for maintenance components
 * Note: This should be implemented in a .tsx file for proper JSX support
 */
export function logComponentError(componentName: string, operation: string, error: Error, context?: Record<string, any>) {
    maintenanceLogger.logError(componentName, operation, error, context);
}

/**
 * Hook for error logging in React components
 */
export function useMaintenanceErrorLogger(componentName: string) {
    return {
        logError: (operation: string, error: Error, context?: Record<string, any>) => {
            maintenanceLogger.logError(componentName, operation, error, context);
        },
        logWarning: (operation: string, message: string, context?: Record<string, any>) => {
            maintenanceLogger.logWarning(componentName, operation, message, context);
        },
        logInfo: (operation: string, message: string, context?: Record<string, any>) => {
            maintenanceLogger.logInfo(componentName, operation, message, context);
        },
    };
}

/**
 * Global error handler setup
 */
export function setupGlobalErrorHandling(): void {
    if (typeof window === 'undefined') return;

    // Handle unhandled errors
    window.addEventListener('error', (event) => {
        maintenanceLogger.logError(
            'global',
            'unhandled_error',
            event.error || new Error(event.message),
            {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
            }
        );
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        maintenanceLogger.logError(
            'global',
            'unhandled_promise_rejection',
            event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
            {
                reason: event.reason,
            }
        );
    });
}