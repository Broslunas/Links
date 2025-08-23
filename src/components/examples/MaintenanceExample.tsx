/**
 * Example component demonstrating how to use the maintenance utilities and hooks
 * This file is for documentation purposes and shows various usage patterns
 */

'use client';

import React from 'react';
import { useMaintenance, useMaintenanceStatus, useMaintenanceControl } from '@/hooks/useMaintenance';
import {
    getCachedMaintenanceStatus,
    toggleMaintenanceMode,
    formatMaintenanceDuration,
    calculateMaintenanceEndTime,
    isMaintenanceOverdue,
    getRemainingMaintenanceTime,
} from '@/utils/maintenance';
import { MaintenanceState } from '@/types';

// Example 1: Basic maintenance status checking (read-only)
export function BasicMaintenanceStatus() {
    const { maintenanceState, loading, error, refresh } = useMaintenanceStatus();

    if (loading) return <div>Loading maintenance status...</div>;
    if (error) return <div>Error: {error.message}</div>;

    return (
        <div>
            <h3>Maintenance Status</h3>
            <p>Active: {maintenanceState.isActive ? 'Yes' : 'No'}</p>
            {maintenanceState.message && <p>Message: {maintenanceState.message}</p>}
            {maintenanceState.estimatedDuration && (
                <p>Duration: {formatMaintenanceDuration(maintenanceState.estimatedDuration)}</p>
            )}
            <button onClick={refresh}>Refresh Status</button>
        </div>
    );
}

// Example 2: Admin maintenance control with toggle functionality
export function AdminMaintenanceControl() {
    const {
        maintenanceState,
        loading,
        toggling,
        error,
        toggle,
        utils,
    } = useMaintenanceControl({
        onStatusChange: (status) => {
            console.log('Maintenance status changed:', status);
        },
        onError: (error) => {
            console.error('Maintenance error:', error);
        },
    });

    const handleActivate = async () => {
        try {
            await toggle({
                isActive: true,
                message: 'System maintenance in progress',
                estimatedDuration: 60, // 1 hour
            });
        } catch (error) {
            console.error('Failed to activate maintenance:', error);
        }
    };

    const handleDeactivate = async () => {
        try {
            await toggle({ isActive: false });
        } catch (error) {
            console.error('Failed to deactivate maintenance:', error);
        }
    };

    return (
        <div>
            <h3>Admin Maintenance Control</h3>
            <p>Status: {maintenanceState.isActive ? 'Active' : 'Inactive'}</p>

            {maintenanceState.isActive && (
                <div>
                    <p>Message: {maintenanceState.message}</p>
                    <p>Duration: {utils.formatDuration(maintenanceState.estimatedDuration)}</p>
                    {utils.isOverdue(maintenanceState.activatedAt, maintenanceState.estimatedDuration) && (
                        <p style={{ color: 'red' }}>⚠️ Maintenance is overdue!</p>
                    )}
                    {utils.getRemainingTime(maintenanceState.activatedAt, maintenanceState.estimatedDuration) && (
                        <p>Remaining: {utils.formatDuration(utils.getRemainingTime(maintenanceState.activatedAt, maintenanceState.estimatedDuration)!)}</p>
                    )}
                </div>
            )}

            <div>
                <button
                    onClick={handleActivate}
                    disabled={toggling || maintenanceState.isActive}
                >
                    {toggling ? 'Activating...' : 'Activate Maintenance'}
                </button>
                <button
                    onClick={handleDeactivate}
                    disabled={toggling || !maintenanceState.isActive}
                >
                    {toggling ? 'Deactivating...' : 'Deactivate Maintenance'}
                </button>
            </div>

            {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
        </div>
    );
}

// Example 3: Custom polling configuration
export function CustomPollingMaintenance() {
    const { maintenanceState, isPolling, startPolling, stopPolling } = useMaintenance({
        pollingInterval: 10000, // Poll every 10 seconds
        autoStart: false, // Don't start polling automatically
        enablePolling: true,
        onStatusChange: (status) => {
            if (status.isActive) {
                console.log('Maintenance activated!');
            } else {
                console.log('Maintenance deactivated!');
            }
        },
    });

    return (
        <div>
            <h3>Custom Polling Example</h3>
            <p>Status: {maintenanceState.isActive ? 'Active' : 'Inactive'}</p>
            <p>Polling: {isPolling ? 'Active' : 'Stopped'}</p>

            <div>
                <button onClick={startPolling} disabled={isPolling}>
                    Start Polling
                </button>
                <button onClick={stopPolling} disabled={!isPolling}>
                    Stop Polling
                </button>
            </div>
        </div>
    );
}

// Example 4: Using utility functions directly
export function UtilityFunctionsExample() {
    const [status, setStatus] = React.useState<MaintenanceState | null>(null);
    const [loading, setLoading] = React.useState(false);

    const fetchStatus = async () => {
        setLoading(true);
        try {
            // Use cached status (will use cache if available and valid)
            const maintenanceStatus = await getCachedMaintenanceStatus();
            setStatus(maintenanceStatus);
        } catch (error) {
            console.error('Error fetching status:', error);
        } finally {
            setLoading(false);
        }
    };

    const forceRefresh = async () => {
        setLoading(true);
        try {
            // Force refresh (bypass cache)
            const maintenanceStatus = await getCachedMaintenanceStatus(true);
            setStatus(maintenanceStatus);
        } catch (error) {
            console.error('Error fetching status:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h3>Utility Functions Example</h3>

            <div>
                <button onClick={fetchStatus} disabled={loading}>
                    {loading ? 'Loading...' : 'Fetch Status (Cached)'}
                </button>
                <button onClick={forceRefresh} disabled={loading}>
                    {loading ? 'Loading...' : 'Force Refresh'}
                </button>
            </div>

            {status && (
                <div>
                    <h4>Status Details:</h4>
                    <p>Active: {status.isActive ? 'Yes' : 'No'}</p>
                    <p>Message: {status.message || 'None'}</p>
                    <p>Duration: {formatMaintenanceDuration(status.estimatedDuration)}</p>

                    {status.activatedAt && status.estimatedDuration && (
                        <div>
                            <p>End Time: {calculateMaintenanceEndTime(status.activatedAt, status.estimatedDuration)?.toLocaleString()}</p>
                            <p>Overdue: {isMaintenanceOverdue(status.activatedAt, status.estimatedDuration) ? 'Yes' : 'No'}</p>
                            <p>Remaining: {formatMaintenanceDuration(getRemainingMaintenanceTime(status.activatedAt, status.estimatedDuration) || undefined)}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// Example 5: Error handling patterns
export function ErrorHandlingExample() {
    const {
        maintenanceState,
        loading,
        error,
        refresh,
    } = useMaintenanceStatus({
        onError: (error) => {
            // Custom error handling
            console.error('Maintenance hook error:', error);

            // You could send to error tracking service
            // errorTracker.captureException(error);

            // Or show user-friendly notifications
            // toast.error('Failed to check maintenance status');
        },
    });

    return (
        <div>
            <h3>Error Handling Example</h3>

            {loading && <p>Loading...</p>}

            {error && (
                <div style={{ color: 'red', padding: '10px', border: '1px solid red' }}>
                    <h4>Error occurred:</h4>
                    <p>{error.message}</p>
                    <button onClick={refresh}>Retry</button>
                </div>
            )}

            {!loading && !error && (
                <div>
                    <p>Status: {maintenanceState.isActive ? 'Active' : 'Inactive'}</p>
                    <button onClick={refresh}>Refresh</button>
                </div>
            )}
        </div>
    );
}