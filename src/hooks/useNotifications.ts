'use client';

import { useState, useEffect, useCallback } from 'react';
import { CriticalAlert, clientNotificationService } from '../lib/client-notification-service';

export interface UseNotificationsReturn {
    alerts: CriticalAlert[];
    unreadCount: number;
    loading: boolean;
    error: string | null;
    markAsRead: () => void;
    clearAll: () => void;
    refresh: () => void;
    getAlertsByType: (type: CriticalAlert['type']) => CriticalAlert[];
    getAlertsBySeverity: (severity: 'high' | 'critical') => CriticalAlert[];
}

export const useNotifications = (limit: number = 50): UseNotificationsReturn => {
    const [alerts, setAlerts] = useState<CriticalAlert[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load initial alerts
    const loadAlerts = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            await clientNotificationService.loadAlertsFromAPI();
            const recentAlerts = clientNotificationService.getRecentAlerts(limit);
            setAlerts(recentAlerts);
            setUnreadCount(recentAlerts.length);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load notifications');
        } finally {
            setLoading(false);
        }
    }, [limit]);

    // Subscribe to new alerts
    useEffect(() => {
        loadAlerts();

        const unsubscribe = clientNotificationService.subscribe((newAlert) => {
            setAlerts(prev => [newAlert, ...prev.slice(0, limit - 1)]);
            setUnreadCount(prev => prev + 1);
        });

        return unsubscribe;
    }, [loadAlerts, limit]);

    // Mark all alerts as read
    const markAsRead = useCallback(() => {
        setUnreadCount(0);
    }, []);

    // Clear all alerts
    const clearAll = useCallback(() => {
        setAlerts([]);
        setUnreadCount(0);
    }, []);

    // Refresh alerts
    const refresh = useCallback(() => {
        loadAlerts();
    }, [loadAlerts]);

    // Get alerts by type
    const getAlertsByType = useCallback((type: CriticalAlert['type']) => {
        return alerts.filter(alert => alert.type === type);
    }, [alerts]);

    // Get alerts by severity
    const getAlertsBySeverity = useCallback((severity: 'high' | 'critical') => {
        return alerts.filter(alert => alert.severity === severity);
    }, [alerts]);

    return {
        alerts,
        unreadCount,
        loading,
        error,
        markAsRead,
        clearAll,
        refresh,
        getAlertsByType,
        getAlertsBySeverity,
    };
};

export default useNotifications;