import { IUserWarning } from '../models/UserWarning';
import UserWarning from '../models/UserWarning';
import AdminAction from '../models/AdminAction';
import User from '../models/User';
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

class NotificationService {
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
            showErrorToast(alert.message, `User ID: ${alert.userId}`);
        } else {
            showWarningToast(alert.message, `User ID: ${alert.userId}`);
        }
    }

    // Check for critical warning creation
    async onWarningCreated(warning: IUserWarning) {
        if (warning.severity === 'critical') {
            const alert: CriticalAlert = {
                id: `critical_${warning._id}_${Date.now()}`,
                type: 'critical_warning',
                userId: warning.userId.toString(),
                message: `Critical warning issued: ${warning.title}`,
                severity: 'critical',
                timestamp: new Date(),
                metadata: {
                    warningId: warning._id,
                    category: warning.category,
                    title: warning.title,
                },
            };

            this.emitAlert(alert);

            // Check for warning accumulation
            await this.checkWarningThreshold(warning.userId.toString());
        }
    }

    // Check warning accumulation thresholds
    async checkWarningThreshold(userId: string) {
        try {
            const activeWarnings = await UserWarning.find({
                userId,
                isActive: true,
                isDeleted: false,
            });

            const criticalCount = activeWarnings.filter(w => w.severity === 'critical').length;
            const highCount = activeWarnings.filter(w => w.severity === 'high').length;
            const totalCount = activeWarnings.length;

            if (criticalCount >= 2) {
                const alert: CriticalAlert = {
                    id: `threshold_critical_${userId}_${Date.now()}`,
                    type: 'warning_threshold',
                    userId,
                    message: `User has ${criticalCount} critical warnings - immediate attention required`,
                    severity: 'critical',
                    timestamp: new Date(),
                    metadata: {
                        criticalCount,
                        totalCount,
                        threshold: 'critical',
                    },
                };
                this.emitAlert(alert);
            } else if (totalCount >= this.config.criticalWarningThreshold) {
                const alert: CriticalAlert = {
                    id: `threshold_high_${userId}_${Date.now()}`,
                    type: 'warning_threshold',
                    userId,
                    message: `User has ${totalCount} active warnings - review recommended`,
                    severity: 'high',
                    timestamp: new Date(),
                    metadata: {
                        totalCount,
                        highCount,
                        threshold: 'high',
                    },
                };
                this.emitAlert(alert);
            }
        } catch (error) {
            console.error('Error checking warning threshold:', error);
        }
    }

    // Detect suspicious activity from warned users
    async detectSuspiciousActivity(userId: string, activityType: string, metadata?: any) {
        try {
            const user = await User.findById(userId);
            if (!user) return;

            // Check if user has active warnings
            const activeWarnings = await UserWarning.find({
                userId,
                isActive: true,
                isDeleted: false,
            });

            if (activeWarnings.length === 0) return;

            // Check recent admin actions for this user
            const recentActions = await AdminAction.find({
                targetId: userId,
                createdAt: {
                    $gte: new Date(Date.now() - this.config.suspiciousActivityWindow * 60 * 60 * 1000),
                },
            });

            const hasCriticalWarnings = activeWarnings.some(w => w.severity === 'critical');
            const hasRecentActions = recentActions.length > 0;

            if (hasCriticalWarnings || (activeWarnings.length >= 2 && hasRecentActions)) {
                const alert: CriticalAlert = {
                    id: `suspicious_${userId}_${Date.now()}`,
                    type: 'suspicious_activity',
                    userId,
                    message: `Suspicious activity detected from warned user: ${activityType}`,
                    severity: hasCriticalWarnings ? 'critical' : 'high',
                    timestamp: new Date(),
                    metadata: {
                        activityType,
                        warningCount: activeWarnings.length,
                        criticalWarnings: activeWarnings.filter(w => w.severity === 'critical').length,
                        recentActions: recentActions.length,
                        ...metadata,
                    },
                };
                this.emitAlert(alert);
            }
        } catch (error) {
            console.error('Error detecting suspicious activity:', error);
        }
    }

    // Handle disabled user access attempts
    async onDisabledUserAccessAttempt(userId: string, attemptType: string, metadata?: any) {
        try {
            const user = await User.findById(userId);
            if (!user || user.isActive) return;

            const alert: CriticalAlert = {
                id: `disabled_access_${userId}_${Date.now()}`,
                type: 'disabled_access_attempt',
                userId,
                message: `Disabled user attempted access: ${attemptType}`,
                severity: 'high',
                timestamp: new Date(),
                metadata: {
                    attemptType,
                    userEmail: user.email,
                    ...metadata,
                },
            };

            this.emitAlert(alert);
        } catch (error) {
            console.error('Error handling disabled user access attempt:', error);
        }
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

    // Update configuration
    updateConfig(newConfig: Partial<NotificationConfig>) {
        this.config = { ...this.config, ...newConfig };
    }

    // Get current configuration
    getConfig(): NotificationConfig {
        return { ...this.config };
    }
}

// Singleton instance
export const notificationService = new NotificationService();

// Helper functions for common use cases
export const checkUserWarnings = async (userId: string) => {
    await notificationService.checkWarningThreshold(userId);
};

export const reportSuspiciousActivity = async (
    userId: string,
    activityType: string,
    metadata?: any
) => {
    await notificationService.detectSuspiciousActivity(userId, activityType, metadata);
};

export const reportDisabledUserAccess = async (
    userId: string,
    attemptType: string,
    metadata?: any
) => {
    await notificationService.onDisabledUserAccessAttempt(userId, attemptType, metadata);
};

export default NotificationService;