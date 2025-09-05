'use client';

import React, { useState, useEffect } from 'react';
import { Bell, X, AlertTriangle, Shield, Eye, UserX } from 'lucide-react';
import { CriticalAlert, clientNotificationService } from '../../lib/client-notification-service';
import { formatDistanceToNow } from 'date-fns';

interface NotificationCenterProps {
    className?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ className = '' }) => {
    const [alerts, setAlerts] = useState<CriticalAlert[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        // Load initial alerts
        clientNotificationService.loadAlertsFromAPI();
        const initialAlerts = clientNotificationService.getRecentAlerts(20);
        setAlerts(initialAlerts);
        setUnreadCount(initialAlerts.length);

        // Subscribe to new alerts
        const unsubscribe = clientNotificationService.subscribe((newAlert) => {
            setAlerts(prev => [newAlert, ...prev.slice(0, 19)]);
            setUnreadCount(prev => prev + 1);
        });

        return unsubscribe;
    }, []);

    const handleToggle = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            setUnreadCount(0);
        }
    };

    const handleClearAll = () => {
        setAlerts([]);
        setUnreadCount(0);
    };

    const getAlertIcon = (type: CriticalAlert['type']) => {
        switch (type) {
            case 'critical_warning':
                return <AlertTriangle className="w-5 h-5 text-red-500" />;
            case 'warning_threshold':
                return <Shield className="w-5 h-5 text-orange-500" />;
            case 'suspicious_activity':
                return <Eye className="w-5 h-5 text-purple-500" />;
            case 'disabled_access_attempt':
                return <UserX className="w-5 h-5 text-red-600" />;
            default:
                return <Bell className="w-5 h-5 text-gray-500" />;
        }
    };

    const getAlertColor = (severity: 'high' | 'critical') => {
        return severity === 'critical'
            ? 'border-l-red-500 bg-red-50'
            : 'border-l-orange-500 bg-orange-50';
    };

    const getAlertTypeLabel = (type: CriticalAlert['type']) => {
        switch (type) {
            case 'critical_warning':
                return 'Critical Warning';
            case 'warning_threshold':
                return 'Warning Threshold';
            case 'suspicious_activity':
                return 'Suspicious Activity';
            case 'disabled_access_attempt':
                return 'Access Attempt';
            default:
                return 'Alert';
        }
    };

    return (
        <div className={`relative ${className}`}>
            {/* Notification Bell */}
            <button
                onClick={handleToggle}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Notifications"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Panel */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Critical Alerts
                        </h3>
                        <div className="flex items-center space-x-2">
                            {alerts.length > 0 && (
                                <button
                                    onClick={handleClearAll}
                                    className="text-sm text-gray-500 hover:text-gray-700"
                                >
                                    Clear All
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Alerts List */}
                    <div className="max-h-96 overflow-y-auto">
                        {alerts.length === 0 ? (
                            <div className="p-6 text-center text-gray-500">
                                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p>No critical alerts</p>
                                <p className="text-sm">You're all caught up!</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {alerts.map((alert) => (
                                    <div
                                        key={alert.id}
                                        className={`p-4 border-l-4 ${getAlertColor(alert.severity)} hover:bg-gray-50 transition-colors`}
                                    >
                                        <div className="flex items-start space-x-3">
                                            <div className="flex-shrink-0 mt-1">
                                                {getAlertIcon(alert.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                                                        {getAlertTypeLabel(alert.type)}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {formatDistanceToNow(alert.timestamp, { addSuffix: true })}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-900 mb-1">
                                                    {alert.message}
                                                </p>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-600">
                                                        User: {alert.userId}
                                                    </span>
                                                    <a
                                                        href={`/admin/users/${alert.userId}`}
                                                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                                    >
                                                        View User →
                                                    </a>
                                                </div>
                                                {alert.metadata && (
                                                    <div className="mt-2 text-xs text-gray-500">
                                                        {alert.metadata.warningId && (
                                                            <span className="mr-3">
                                                                Warning: {alert.metadata.warningId}
                                                            </span>
                                                        )}
                                                        {alert.metadata.category && (
                                                            <span className="mr-3">
                                                                Category: {alert.metadata.category}
                                                            </span>
                                                        )}
                                                        {alert.metadata.totalCount && (
                                                            <span className="mr-3">
                                                                Total Warnings: {alert.metadata.totalCount}
                                                            </span>
                                                        )}
                                                        {alert.metadata.activityType && (
                                                            <span className="mr-3">
                                                                Activity: {alert.metadata.activityType}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {alerts.length > 0 && (
                        <div className="p-3 border-t border-gray-200 bg-gray-50">
                            <div className="text-center">
                                <a
                                    href="/admin/alerts"
                                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    View All Alerts
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
};

export default NotificationCenter;