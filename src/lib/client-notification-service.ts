'use client';

import { showWarningToast, showErrorToast } from './client-error-handler';

export interface NotificationConfig {
    criticalWarningThreshold: number;
    highWarningThreshold: number;
    suspiciousActivityWindow: number; // hours
    emailNotificationsEnabled: boolean;
    adminEmails: string[];
}

export interface CriticalAlert {
    id: string;
    type: 'critical_warning' | 'warning_threshold' | 'suspicious_activity' | 'disabled_access_attempt';
    userId: string;
    message: string;
    severity: 'high' | 'critical';
    timestamp: Date;
    metadata?: any;
}

class ClientNotificationService {
    private config: NotificationConfig = {
        criticalWarningThreshold: 3,
        highWarningThreshold: 5,
        suspiciousActivityWindow: 24,
        emailNotificationsEnabled: true,
        adminEmails: [],
    };

    private alerts: CriticalAlert[] = [];
    private subscribers: ((alert: CriticalAlert) => void)[] = [];

    constructor(config?: Partial<NotificationConfig>) {
        if (config) {
            this.config = { ...this.config, ...config };
        }

        // Initialize with some demo data for testing
        this.initializeDemoData();
    }

    // Initialize with demo data for testing
    private initializeDemoData() {
        const demoAlerts: CriticalAlert[] = [
            {
                id: 'demo_1',
                type: 'critical_warning',
                userId: 'user_123',
                message: 'Usuario reportado por comportamiento abusivo',
                severity: 'critical',
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
                metadata: {
                    warningId: 'warning_456',
                    category: 'abuse',
                    title: 'Comportamiento abusivo'
                }
            },
            {
                id: 'demo_2',
                type: 'warning_threshold',
                userId: 'user_789',
                message: 'Usuario tiene 4 advertencias activas - revisión recomendada',
                severity: 'high',
                timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
                metadata: {
                    totalCount: 4,
                    highCount: 2,
                    threshold: 'high'
                }
            },
            {
                id: 'demo_3',
                type: 'suspicious_activity',
                userId: 'user_456',
                message: 'Actividad sospechosa detectada de usuario con advertencias: bulk_operations',
                severity: 'high',
                timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
                metadata: {
                    activityType: 'bulk_operations',
                    warningCount: 2,
                    criticalWarnings: 0
                }
            },
            {
                id: 'demo_4',
                type: 'disabled_access_attempt',
                userId: 'user_disabled',
                message: 'Usuario deshabilitado intentó acceder: login_attempt',
                severity: 'high',
                timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
                metadata: {
                    attemptType: 'login_attempt',
                    userEmail: 'disabled@example.com'
                }
            }
        ];

        this.alerts = demoAlerts;
    }

    // Subscribe to real-time alerts
    subscribe(callback: (alert: CriticalAlert) => void) {
        this.subscribers.push(callback);
        return () => {
            this.subscribers = this.subscribers.filter(sub => sub !== callback);
        };
    }

    // Emit alert to all subscribers
    private emitAlert(alert: CriticalAlert) {
        this.alerts.unshift(alert);
        // Keep only last 100 alerts in memory
        if (this.alerts.length > 100) {
            this.alerts = this.alerts.slice(0, 100);
        }

        this.subscribers.forEach(callback => callback(alert));

        // Show toast notification for critical alerts
        if (alert.severity === 'critical') {
            showErrorToast(alert.message, `Usuario ID: ${alert.userId}`);
        } else {
            showWarningToast(alert.message, `Usuario ID: ${alert.userId}`);
        }
    }

    // Add a new alert (for testing purposes)
    addAlert(alert: Omit<CriticalAlert, 'id' | 'timestamp'>) {
        const newAlert: CriticalAlert = {
            ...alert,
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(),
        };

        this.emitAlert(newAlert);
    }

    // Get recent alerts
    getRecentAlerts(limit: number = 50): CriticalAlert[] {
        return this.alerts.slice(0, limit);
    }

    // Get alerts by type
    getAlertsByType(type: CriticalAlert['type'], limit: number = 20): CriticalAlert[] {
        return this.alerts.filter(alert => alert.type === type).slice(0, limit);
    }

    // Get alerts by severity
    getAlertsBySeverity(severity: 'high' | 'critical', limit: number = 20): CriticalAlert[] {
        return this.alerts.filter(alert => alert.severity === severity).slice(0, limit);
    }

    // Clear old alerts
    clearOldAlerts(olderThanHours: number = 72) {
        const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
        this.alerts = this.alerts.filter(alert => alert.timestamp > cutoff);
    }

    // Clear all alerts
    clearAllAlerts() {
        this.alerts = [];
    }

    // Update configuration
    updateConfig(newConfig: Partial<NotificationConfig>) {
        this.config = { ...this.config, ...newConfig };
    }

    // Get current configuration
    getConfig(): NotificationConfig {
        return { ...this.config };
    }

    // Simulate receiving alerts from API
    async fetchAlertsFromAPI(): Promise<CriticalAlert[]> {
        try {
            const response = await fetch('/api/admin/notifications');
            if (response.ok) {
                const data = await response.json();
                return data.data || [];
            }
        } catch (error) {
            console.error('Error fetching alerts from API:', error);
        }
        return [];
    }

    // Load alerts from API and merge with local alerts
    async loadAlertsFromAPI() {
        try {
            const apiAlerts = await this.fetchAlertsFromAPI();
            // Merge API alerts with existing alerts, avoiding duplicates
            const existingIds = new Set(this.alerts.map(alert => alert.id));
            const newAlerts = apiAlerts.filter(alert => !existingIds.has(alert.id));

            this.alerts = [...newAlerts, ...this.alerts].slice(0, 100);
        } catch (error) {
            console.error('Error loading alerts from API:', error);
        }
    }
}

// Singleton instance
export const clientNotificationService = new ClientNotificationService();

// Helper functions for common use cases
export const addTestAlert = (type: CriticalAlert['type'], severity: 'high' | 'critical' = 'high') => {
    const messages = {
        critical_warning: 'Nueva advertencia crítica emitida',
        warning_threshold: 'Usuario excedió el umbral de advertencias',
        suspicious_activity: 'Actividad sospechosa detectada',
        disabled_access_attempt: 'Usuario deshabilitado intentó acceder'
    };

    clientNotificationService.addAlert({
        type,
        userId: `user_${Math.random().toString(36).substr(2, 6)}`,
        message: messages[type],
        severity,
        metadata: {
            testAlert: true,
            timestamp: new Date().toISOString()
        }
    });
};

export default ClientNotificationService;