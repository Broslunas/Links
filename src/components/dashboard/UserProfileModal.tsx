'use client';

import React, { useState, useEffect } from 'react';
import {
    X,
    User,
    FileText,
    AlertTriangle,
    History,
    Calendar,
    Mail,
    Shield,
    ShieldCheck,
    UserCheck,
    UserX,
    ExternalLink,
    Clock,
    Activity,
    Trash2
} from 'lucide-react';
import NotesSection from './NotesSection';
import WarningsSection from './WarningsSection';
import AdminHistoryView from './AdminHistoryView';
import DeleteRequestsSection from './DeleteRequestsSection';

interface AdminUser {
    _id: string;
    email: string;
    name?: string;
    role: 'user' | 'admin';
    isActive: boolean;
    createdAt: string;
    lastLogin?: string;
    linksCount: number;
    totalClicks: number;
    notesCount: number;
    activeWarningsCount: number;
    criticalWarningsCount: number;
    highestWarningSeverity?: 'low' | 'medium' | 'high' | 'critical';
}

interface UserProfileModalProps {
    user: AdminUser;
    onClose: () => void;
}

type TabType = 'overview' | 'notes' | 'warnings' | 'history' | 'delete-requests';

export default function UserProfileModal({ user, onClose }: UserProfileModalProps) {
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [notesCount, setNotesCount] = useState(user.notesCount);
    const [activeWarningsCount, setActiveWarningsCount] = useState(user.activeWarningsCount);
    const [criticalWarningsCount, setCriticalWarningsCount] = useState(user.criticalWarningsCount);

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getRoleBadge = (role: string) => {
        return role === 'admin' ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                <ShieldCheck className="w-4 h-4 mr-2" />
                Administrador
            </span>
        ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                <Shield className="w-4 h-4 mr-2" />
                Usuario
            </span>
        );
    };

    const getStatusBadge = (isActive: boolean) => {
        return isActive ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <UserCheck className="w-4 h-4 mr-2" />
                Activo
            </span>
        ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                <UserX className="w-4 h-4 mr-2" />
                Inactivo
            </span>
        );
    };

    const getWarningSeverityBadge = (severity: 'low' | 'medium' | 'high' | 'critical') => {
        const severityConfig = {
            low: {
                color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
                text: 'Severidad Baja'
            },
            medium: {
                color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
                text: 'Severidad Media'
            },
            high: {
                color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
                text: 'Severidad Alta'
            },
            critical: {
                color: 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100',
                text: 'Severidad Crítica'
            }
        };

        const config = severityConfig[severity];

        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
                <AlertTriangle className="w-4 h-4 mr-2" />
                {config.text}
            </span>
        );
    };

    const tabs = [
        {
            id: 'overview' as TabType,
            name: 'Resumen',
            icon: User,
            count: null
        },
        {
            id: 'notes' as TabType,
            name: 'Notas',
            icon: FileText,
            count: notesCount
        },
        {
            id: 'warnings' as TabType,
            name: 'Warnings',
            icon: AlertTriangle,
            count: activeWarningsCount
        },
        {
            id: 'delete-requests' as TabType,
            name: 'Eliminación',
            icon: Trash2,
            count: null
        },
        {
            id: 'history' as TabType,
            name: 'Historial',
            icon: History,
            count: null
        }
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                    {user.name || 'Sin nombre'}
                                </h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {user.email}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Status badges */}
                    <div className="flex flex-wrap gap-2 mt-4">
                        {getRoleBadge(user.role)}
                        {getStatusBadge(user.isActive)}
                        {user.highestWarningSeverity && getWarningSeverityBadge(user.highestWarningSeverity)}
                        {criticalWarningsCount > 0 && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100 animate-pulse">
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                {criticalWarningsCount} Crítico{criticalWarningsCount !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="flex space-x-8 px-6">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${isActive
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{tab.name}</span>
                                    {tab.count !== null && tab.count > 0 && (
                                        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${isActive
                                            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                            }`}>
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* User Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                        Información del Usuario
                                    </h3>

                                    <div className="space-y-3">
                                        <div className="flex items-center space-x-3">
                                            <Mail className="w-5 h-5 text-gray-400" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">Email</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-3">
                                            <Calendar className="w-5 h-5 text-gray-400" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">Fecha de registro</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(user.createdAt)}</p>
                                            </div>
                                        </div>

                                        {user.lastLogin && (
                                            <div className="flex items-center space-x-3">
                                                <Clock className="w-5 h-5 text-gray-400" />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">Último acceso</p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(user.lastLogin)}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                        Estadísticas de Actividad
                                    </h3>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                            <div className="flex items-center space-x-2">
                                                <ExternalLink className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                                <div>
                                                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                        {user.linksCount.toLocaleString()}
                                                    </p>
                                                    <p className="text-sm text-blue-600 dark:text-blue-400">Enlaces</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                                            <div className="flex items-center space-x-2">
                                                <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
                                                <div>
                                                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                                        {user.totalClicks.toLocaleString()}
                                                    </p>
                                                    <p className="text-sm text-green-600 dark:text-green-400">Clics totales</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                                            <div className="flex items-center space-x-2">
                                                <FileText className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                                                <div>
                                                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                                                        {notesCount}
                                                    </p>
                                                    <p className="text-sm text-yellow-600 dark:text-yellow-400">Notas</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                                            <div className="flex items-center space-x-2">
                                                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                                <div>
                                                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                                                        {activeWarningsCount}
                                                    </p>
                                                    <p className="text-sm text-red-600 dark:text-red-400">Warnings activos</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                    Acciones Rápidas
                                </h3>
                                <div className="flex flex-wrap gap-3">
                                    <button
                                        onClick={() => setActiveTab('notes')}
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                                    >
                                        <FileText className="w-4 h-4 mr-2" />
                                        Ver Notas ({notesCount})
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('warnings')}
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                                    >
                                        <AlertTriangle className="w-4 h-4 mr-2" />
                                        Ver Warnings ({activeWarningsCount})
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('delete-requests')}
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Ver Solicitudes de Eliminación
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('history')}
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                                    >
                                        <History className="w-4 h-4 mr-2" />
                                        Ver Historial
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notes' && (
                        <NotesSection
                            userId={user._id}
                            onNotesCountChange={setNotesCount}
                        />
                    )}

                    {activeTab === 'warnings' && (
                        <WarningsSection
                            userId={user._id}
                            onWarningsCountChange={(activeCount, criticalCount) => {
                                setActiveWarningsCount(activeCount);
                                setCriticalWarningsCount(criticalCount);
                            }}
                        />
                    )}

                    {activeTab === 'delete-requests' && (
                        <DeleteRequestsSection userId={user._id} />
                    )}

                    {activeTab === 'history' && (
                        <AdminHistoryView userId={user._id} />
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                    <div className="flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-500"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}