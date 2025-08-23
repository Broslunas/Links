import { MaintenanceState, MaintenanceToggleRequest, MaintenanceApiResponse } from '@/types';

/**
 * Cache configuration for maintenance status
 */
const CACHE_KEY = 'maintenance_status';
const CACHE_DURATION = 30 * 1000; // 30 seconds in milliseconds

interface CachedMaintenanceState {
    data: MaintenanceState;
    timestamp: number;
}

/**
 * In-memory cache for maintenance status
 */
let maintenanceCache: CachedMaintenanceState | null = null;

/**
 * Fetches the current maintenance status from the API
 * @returns Promise<MaintenanceState>
 */
export async function fetchMaintenanceStatus(): Promise<MaintenanceState> {
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 1000;
    const timeout = 10000; // 10 seconds

    while (retryCount <= maxRetries) {
        try {
            // Create abort controller for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const response = await fetch('/api/maintenance/status', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unknown error');
                throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
            }

            const data: MaintenanceState = await response.json();

            // Validate response data
            if (typeof data.isActive !== 'boolean') {
                throw new Error('Invalid response: isActive must be a boolean');
            }

            console.log('Successfully fetched maintenance status', {
                isActive: data.isActive,
                hasMessage: !!data.message,
                hasEstimatedDuration: !!data.estimatedDuration,
                timestamp: new Date().toISOString(),
                retryCount
            });

            return data;
        } catch (error) {
            retryCount++;

            console.error(`Error fetching maintenance status (attempt ${retryCount}/${maxRetries + 1}):`, {
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
                retryCount
            });

            // Don't retry on certain error types
            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    console.error('Request timeout while fetching maintenance status');
                } else if (error.message.includes('HTTP 4')) {
                    // Don't retry client errors (4xx)
                    throw error;
                }
            }

            if (retryCount > maxRetries) {
                console.error('Failed to fetch maintenance status after all retries', {
                    totalAttempts: maxRetries + 1,
                    finalError: error instanceof Error ? error.message : 'Unknown error',
                    timestamp: new Date().toISOString()
                });
                throw new Error(`Failed to fetch maintenance status: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }

            // Exponential backoff
            const delay = retryDelay * Math.pow(2, retryCount - 1);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw new Error('Unexpected error in fetchMaintenanceStatus');
}

/**
 * Toggles maintenance mode via API
 * @param request - The maintenance toggle request
 * @returns Promise<MaintenanceState>
 */
export async function toggleMaintenanceMode(request: MaintenanceToggleRequest): Promise<MaintenanceState> {
    // Validate request data
    if (typeof request.isActive !== 'boolean') {
        throw new Error('isActive must be a boolean');
    }

    if (request.message !== undefined) {
        if (typeof request.message !== 'string') {
            throw new Error('message must be a string');
        }
        if (request.message.length > 500) {
            throw new Error('message cannot exceed 500 characters');
        }
    }

    if (request.estimatedDuration !== undefined) {
        if (typeof request.estimatedDuration !== 'number' || request.estimatedDuration < 0) {
            throw new Error('estimatedDuration must be a positive number');
        }
    }

    let retryCount = 0;
    const maxRetries = 2; // Fewer retries for toggle operations to avoid duplicate state changes
    const retryDelay = 2000;
    const timeout = 15000; // 15 seconds for toggle operations

    while (retryCount <= maxRetries) {
        try {
            console.log('Attempting to toggle maintenance mode', {
                isActive: request.isActive,
                hasMessage: !!request.message,
                hasEstimatedDuration: !!request.estimatedDuration,
                timestamp: new Date().toISOString(),
                retryCount
            });

            // Create abort controller for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const response = await fetch('/api/maintenance/toggle', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            let responseData: any;
            try {
                responseData = await response.json();
            } catch (parseError) {
                throw new Error(`Invalid JSON response: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`);
            }

            if (!response.ok) {
                const errorMessage = responseData?.error || response.statusText || 'Unknown error';

                // Log specific error types
                if (response.status === 401) {
                    console.error('Authentication failed during maintenance toggle');
                    throw new Error(`Authentication required: ${errorMessage}`);
                } else if (response.status === 403) {
                    console.error('Authorization failed during maintenance toggle');
                    throw new Error(`Admin access required: ${errorMessage}`);
                } else if (response.status === 400) {
                    console.error('Invalid request data for maintenance toggle');
                    throw new Error(`Invalid request: ${errorMessage}`);
                } else {
                    throw new Error(`HTTP ${response.status}: ${errorMessage}`);
                }
            }

            const data: MaintenanceApiResponse = responseData;

            if (!data.success) {
                throw new Error(data.error || 'Failed to toggle maintenance mode');
            }

            // Validate response data
            if (!data.data || typeof data.data.isActive !== 'boolean') {
                throw new Error('Invalid response data from server');
            }

            console.log('Successfully toggled maintenance mode', {
                isActive: data.data.isActive,
                timestamp: new Date().toISOString()
            });

            // Invalidate cache when state changes
            invalidateMaintenanceCache();

            return data.data;
        } catch (error) {
            retryCount++;

            console.error(`Error toggling maintenance mode (attempt ${retryCount}/${maxRetries + 1}):`, {
                error: error instanceof Error ? error.message : 'Unknown error',
                request: { ...request, message: request.message ? '[REDACTED]' : undefined },
                timestamp: new Date().toISOString(),
                retryCount
            });

            // Don't retry on certain error types
            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    console.error('Request timeout while toggling maintenance mode');
                } else if (error.message.includes('Authentication') ||
                    error.message.includes('Admin access') ||
                    error.message.includes('Invalid request')) {
                    // Don't retry auth/validation errors
                    throw error;
                }
            }

            if (retryCount > maxRetries) {
                console.error('Failed to toggle maintenance mode after all retries', {
                    totalAttempts: maxRetries + 1,
                    finalError: error instanceof Error ? error.message : 'Unknown error',
                    timestamp: new Date().toISOString()
                });
                throw new Error(`Failed to toggle maintenance mode: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }

            // Linear backoff for toggle operations (don't want exponential delay)
            await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
    }

    throw new Error('Unexpected error in toggleMaintenanceMode');
}

/**
 * Gets maintenance status with client-side caching
 * @param forceRefresh - Whether to bypass cache and fetch fresh data
 * @returns Promise<MaintenanceState>
 */
export async function getCachedMaintenanceStatus(forceRefresh = false): Promise<MaintenanceState> {
    const now = Date.now();

    // Check if we have valid cached data and don't need to force refresh
    if (!forceRefresh && maintenanceCache && (now - maintenanceCache.timestamp) < CACHE_DURATION) {
        console.log('Using cached maintenance status', {
            cacheAge: now - maintenanceCache.timestamp,
            isActive: maintenanceCache.data.isActive,
            timestamp: new Date().toISOString()
        });
        return maintenanceCache.data;
    }

    try {
        console.log('Fetching fresh maintenance status', {
            forceRefresh,
            hasCachedData: !!maintenanceCache,
            cacheAge: maintenanceCache ? now - maintenanceCache.timestamp : null,
            timestamp: new Date().toISOString()
        });

        // Fetch fresh data
        const data = await fetchMaintenanceStatus();

        // Validate fetched data
        if (typeof data.isActive !== 'boolean') {
            throw new Error('Invalid maintenance status data: isActive must be boolean');
        }

        // Update cache
        maintenanceCache = {
            data,
            timestamp: now,
        };

        console.log('Updated maintenance status cache', {
            isActive: data.isActive,
            timestamp: new Date().toISOString()
        });

        return data;
    } catch (error) {
        console.error('Error fetching fresh maintenance status:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            hasCachedData: !!maintenanceCache,
            cacheAge: maintenanceCache ? now - maintenanceCache.timestamp : null,
            timestamp: new Date().toISOString()
        });

        // If we have cached data and the request fails, return cached data
        if (maintenanceCache) {
            const cacheAge = now - maintenanceCache.timestamp;
            const maxStaleAge = CACHE_DURATION * 5; // Allow stale data up to 5x cache duration in emergencies

            if (cacheAge < maxStaleAge) {
                console.warn('Using stale cached maintenance status due to fetch failure', {
                    cacheAge,
                    maxStaleAge,
                    isActive: maintenanceCache.data.isActive,
                    timestamp: new Date().toISOString()
                });
                return maintenanceCache.data;
            } else {
                console.error('Cached data too stale, cannot use as fallback', {
                    cacheAge,
                    maxStaleAge,
                    timestamp: new Date().toISOString()
                });
            }
        }

        // If no cached data or cache too stale, implement final fallback
        console.error('No usable cached data available, implementing emergency fallback', {
            timestamp: new Date().toISOString()
        });

        // Return safe default state
        const fallbackState: MaintenanceState = {
            isActive: false, // Default to allowing access
            message: undefined,
            estimatedDuration: undefined
        };

        // Cache the fallback state temporarily to avoid repeated failures
        maintenanceCache = {
            data: fallbackState,
            timestamp: now,
        };

        return fallbackState;
    }
}

/**
 * Invalidates the maintenance status cache
 */
export function invalidateMaintenanceCache(): void {
    maintenanceCache = null;
}

/**
 * Checks if the cache is valid (not expired)
 * @returns boolean
 */
export function isMaintenanceCacheValid(): boolean {
    if (!maintenanceCache) return false;

    const now = Date.now();
    return (now - maintenanceCache.timestamp) < CACHE_DURATION;
}

/**
 * Gets the cached maintenance status without making API calls
 * @returns MaintenanceState | null
 */
export function getCachedMaintenanceStatusSync(): MaintenanceState | null {
    if (!maintenanceCache || !isMaintenanceCacheValid()) {
        return null;
    }

    return maintenanceCache.data;
}

/**
 * Formats duration in minutes to a human-readable string
 * @param minutes - Duration in minutes
 * @returns Formatted duration string
 */
export function formatMaintenanceDuration(minutes?: number): string {
    if (!minutes || minutes <= 0) {
        return 'No especificado';
    }

    if (minutes < 60) {
        return `${minutes} minuto${minutes !== 1 ? 's' : ''}`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
        return `${hours} hora${hours !== 1 ? 's' : ''}`;
    }

    return `${hours} hora${hours !== 1 ? 's' : ''} y ${remainingMinutes} minuto${remainingMinutes !== 1 ? 's' : ''}`;
}

/**
 * Calculates the estimated end time for maintenance
 * @param activatedAt - When maintenance was activated
 * @param estimatedDuration - Duration in minutes
 * @returns Date | null
 */
export function calculateMaintenanceEndTime(activatedAt?: string, estimatedDuration?: number): Date | null {
    if (!activatedAt || !estimatedDuration) {
        return null;
    }

    const startTime = new Date(activatedAt);
    const endTime = new Date(startTime.getTime() + (estimatedDuration * 60 * 1000));

    return endTime;
}

/**
 * Checks if maintenance is currently overdue based on estimated duration
 * @param activatedAt - When maintenance was activated
 * @param estimatedDuration - Duration in minutes
 * @returns boolean
 */
export function isMaintenanceOverdue(activatedAt?: string, estimatedDuration?: number): boolean {
    const endTime = calculateMaintenanceEndTime(activatedAt, estimatedDuration);

    if (!endTime) {
        return false;
    }

    return new Date() > endTime;
}

/**
 * Gets the remaining time for maintenance in minutes
 * @param activatedAt - When maintenance was activated
 * @param estimatedDuration - Duration in minutes
 * @returns number | null - Remaining minutes, or null if no duration specified
 */
export function getRemainingMaintenanceTime(activatedAt?: string, estimatedDuration?: number): number | null {
    const endTime = calculateMaintenanceEndTime(activatedAt, estimatedDuration);

    if (!endTime) {
        return null;
    }

    const now = new Date();
    const remainingMs = endTime.getTime() - now.getTime();

    if (remainingMs <= 0) {
        return 0;
    }

    return Math.ceil(remainingMs / (60 * 1000)); // Convert to minutes and round up
}