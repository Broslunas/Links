import { useState, useEffect, useCallback, useRef } from 'react';
import { MaintenanceState, MaintenanceToggleRequest } from '@/types';
import {
    getCachedMaintenanceStatus,
    toggleMaintenanceMode,
    invalidateMaintenanceCache,
    formatMaintenanceDuration,
    calculateMaintenanceEndTime,
    isMaintenanceOverdue,
    getRemainingMaintenanceTime,
} from '@/utils/maintenance';

export interface UseMaintenanceOptions {
    /**
     * Polling interval in milliseconds (default: 30000 - 30 seconds)
     */
    pollingInterval?: number;

    /**
     * Whether to start polling immediately (default: true)
     */
    autoStart?: boolean;

    /**
     * Whether to poll for updates (default: true)
     */
    enablePolling?: boolean;

    /**
     * Callback when maintenance status changes
     */
    onStatusChange?: (status: MaintenanceState) => void;

    /**
     * Callback when an error occurs
     */
    onError?: (error: Error) => void;
}

export interface UseMaintenanceReturn {
    /**
     * Current maintenance state
     */
    maintenanceState: MaintenanceState;

    /**
     * Whether the hook is currently loading data
     */
    loading: boolean;

    /**
     * Whether a toggle operation is in progress
     */
    toggling: boolean;

    /**
     * Last error that occurred
     */
    error: Error | null;

    /**
     * Manually refresh the maintenance status
     */
    refresh: () => Promise<void>;

    /**
     * Toggle maintenance mode
     */
    toggle: (request: MaintenanceToggleRequest) => Promise<void>;

    /**
     * Start polling for status updates
     */
    startPolling: () => void;

    /**
     * Stop polling for status updates
     */
    stopPolling: () => void;

    /**
     * Whether polling is currently active
     */
    isPolling: boolean;

    /**
     * Utility functions for maintenance state
     */
    utils: {
        formatDuration: (minutes?: number) => string;
        calculateEndTime: (activatedAt?: string, estimatedDuration?: number) => Date | null;
        isOverdue: (activatedAt?: string, estimatedDuration?: number) => boolean;
        getRemainingTime: (activatedAt?: string, estimatedDuration?: number) => number | null;
    };
}

/**
 * React hook for managing maintenance status with caching and polling
 */
export function useMaintenance(options: UseMaintenanceOptions = {}): UseMaintenanceReturn {
    const {
        pollingInterval = 30000, // 30 seconds
        autoStart = true,
        enablePolling = true,
        onStatusChange,
        onError,
    } = options;

    // State
    const [maintenanceState, setMaintenanceState] = useState<MaintenanceState>({
        isActive: false,
    });
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [isPolling, setIsPolling] = useState(false);

    // Refs
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const mountedRef = useRef(true);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            mountedRef.current = false;
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    /**
     * Fetches maintenance status and updates state
     */
    const fetchStatus = useCallback(async (forceRefresh = false) => {
        console.log('🔄 fetchStatus called', {
            forceRefresh,
            mountedRef: mountedRef.current,
            timestamp: new Date().toISOString()
        });

        try {
            setError(null);

            console.log('📡 Calling getCachedMaintenanceStatus...');
            const status = await getCachedMaintenanceStatus(forceRefresh);

            console.log('✅ getCachedMaintenanceStatus returned:', status);

            if (!mountedRef.current) {
                console.log('⚠️ Component unmounted during fetch, skipping state update');
                return;
            }

            // Validate status data
            if (typeof status.isActive !== 'boolean') {
                throw new Error('Invalid maintenance status: isActive must be boolean');
            }

            console.log('🔄 Setting maintenance state:', status);
            setMaintenanceState(status);

            // Call status change callback if provided
            if (onStatusChange) {
                try {
                    onStatusChange(status);
                } catch (callbackError) {
                    console.error('❌ Error in onStatusChange callback:', {
                        error: callbackError instanceof Error ? callbackError.message : 'Unknown error',
                        timestamp: new Date().toISOString()
                    });
                    // Don't throw callback errors, just log them
                }
            }
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to fetch maintenance status');

            console.error('❌ Error in fetchStatus:', {
                error: error.message,
                stack: error.stack,
                forceRefresh,
                timestamp: new Date().toISOString()
            });

            if (!mountedRef.current) {
                console.log('⚠️ Component unmounted during error handling, skipping state update');
                return;
            }

            setError(error);

            if (onError) {
                try {
                    onError(error);
                } catch (callbackError) {
                    console.error('❌ Error in onError callback:', {
                        originalError: error.message,
                        callbackError: callbackError instanceof Error ? callbackError.message : 'Unknown error',
                        timestamp: new Date().toISOString()
                    });
                }
            }
        } finally {
            if (mountedRef.current) {
                console.log('✅ Setting loading to false');
                setLoading(false);
            } else {
                console.log('⚠️ Component unmounted, not setting loading to false');
            }
        }
    }, [onStatusChange, onError]);

    /**
     * Starts polling for status updates
     */
    const startPolling = useCallback(() => {
        if (!enablePolling || intervalRef.current) return;

        setIsPolling(true);
        intervalRef.current = setInterval(() => {
            fetchStatus(false); // Use cache when polling
        }, pollingInterval);
    }, [enablePolling, pollingInterval, fetchStatus]);

    /**
     * Stops polling for status updates
     */
    const stopPolling = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setIsPolling(false);
    }, []);

    /**
     * Manually refresh the maintenance status
     */
    const refresh = useCallback(async () => {
        setLoading(true);
        await fetchStatus(true); // Force refresh
    }, [fetchStatus]);

    /**
     * Toggle maintenance mode
     */
    const toggle = useCallback(async (request: MaintenanceToggleRequest) => {
        // Validate request before starting
        if (typeof request.isActive !== 'boolean') {
            const error = new Error('isActive must be a boolean');
            setError(error);
            if (onError) {
                try {
                    onError(error);
                } catch (callbackError) {
                    console.error('Error in onError callback during validation:', callbackError);
                }
            }
            throw error;
        }

        setToggling(true);
        setError(null);

        console.log('Starting maintenance mode toggle', {
            isActive: request.isActive,
            hasMessage: !!request.message,
            hasEstimatedDuration: !!request.estimatedDuration,
            timestamp: new Date().toISOString()
        });

        try {
            const newStatus = await toggleMaintenanceMode(request);

            if (!mountedRef.current) {
                console.log('Component unmounted during toggle, skipping state update');
                return;
            }

            // Validate response
            if (typeof newStatus.isActive !== 'boolean') {
                throw new Error('Invalid response from toggle operation');
            }

            console.log('Maintenance mode toggle successful', {
                newStatus: {
                    isActive: newStatus.isActive,
                    hasMessage: !!newStatus.message,
                    hasEstimatedDuration: !!newStatus.estimatedDuration
                },
                timestamp: new Date().toISOString()
            });

            setMaintenanceState(newStatus);

            if (onStatusChange) {
                try {
                    onStatusChange(newStatus);
                } catch (callbackError) {
                    console.error('Error in onStatusChange callback during toggle:', {
                        error: callbackError instanceof Error ? callbackError.message : 'Unknown error',
                        timestamp: new Date().toISOString()
                    });
                    // Don't throw callback errors
                }
            }
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to toggle maintenance mode');

            console.error('Error in toggle operation:', {
                error: error.message,
                stack: error.stack,
                request: { ...request, message: request.message ? '[REDACTED]' : undefined },
                timestamp: new Date().toISOString()
            });

            if (!mountedRef.current) {
                console.log('Component unmounted during error handling, skipping state update');
                return;
            }

            setError(error);

            if (onError) {
                try {
                    onError(error);
                } catch (callbackError) {
                    console.error('Error in onError callback during toggle:', {
                        originalError: error.message,
                        callbackError: callbackError instanceof Error ? callbackError.message : 'Unknown error',
                        timestamp: new Date().toISOString()
                    });
                }
            }

            throw error; // Re-throw so caller can handle it
        } finally {
            if (mountedRef.current) {
                setToggling(false);
            }
        }
    }, [onStatusChange, onError]);

    // Initial load and polling setup
    useEffect(() => {
        if (autoStart) {
            fetchStatus(true); // Force refresh on initial load

            if (enablePolling) {
                startPolling();
            }
        }

        return () => {
            stopPolling();
        };
    }, []); // Empty dependency array to run only once on mount

    // Utility functions
    const utils = {
        formatDuration: formatMaintenanceDuration,
        calculateEndTime: calculateMaintenanceEndTime,
        isOverdue: isMaintenanceOverdue,
        getRemainingTime: getRemainingMaintenanceTime,
    };

    return {
        maintenanceState,
        loading,
        toggling,
        error,
        refresh,
        toggle,
        startPolling,
        stopPolling,
        isPolling,
        utils,
    };
}

/**
 * Simplified hook for just checking maintenance status (read-only)
 */
export function useMaintenanceStatus(options: Omit<UseMaintenanceOptions, 'onStatusChange'> = {}) {
    const {
        maintenanceState,
        loading,
        error,
        refresh,
        utils,
    } = useMaintenance(options);

    return {
        maintenanceState,
        loading,
        error,
        refresh,
        utils,
    };
}

/**
 * Hook for admin maintenance controls (includes toggle functionality)
 */
export function useMaintenanceControl(options: UseMaintenanceOptions = {}) {
    return useMaintenance(options);
}