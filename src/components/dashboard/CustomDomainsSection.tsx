'use client';

import React, { useState, useEffect } from 'react';
import {
    Globe,
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    ExternalLink,
    Star,
    Shield,
    Loader2,
    RefreshCw
} from 'lucide-react';

interface CustomDomain {
    _id: string;
    domain: string;
    subdomain?: string;
    fullDomain: string;
    isVerified: boolean;
    isActive: boolean;
    sslStatus: 'pending' | 'active' | 'error';
    sslError?: string;
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
    verificationAttempts: number;
    maxVerificationAttempts: number;
}

interface CustomDomainsSectionProps {
    userId: string;
}

export default function CustomDomainsSection({ userId }: CustomDomainsSectionProps) {
    const [domains, setDomains] = useState<CustomDomain[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchDomains = async () => {
        try {
            setError(null);
            const response = await fetch(`/api/admin/users/${userId}/domains`);
            
            if (!response.ok) {
                throw new Error('Error al cargar los dominios');
            }
            
            const data = await response.json();
            setDomains(data.domains || []);
        } catch (err) {
            console.error('Error fetching domains:', err);
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDomains();
    }, [userId]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchDomains();
    };

    const getStatusIcon = (domain: CustomDomain) => {
        if (!domain.isVerified) {
            return <Clock className="w-5 h-5 text-yellow-500" />;
        }
        
        if (!domain.isActive) {
            return <XCircle className="w-5 h-5 text-red-500" />;
        }
        
        if (domain.sslStatus === 'error') {
            return <AlertTriangle className="w-5 h-5 text-red-500" />;
        }
        
        if (domain.sslStatus === 'pending') {
            return <Clock className="w-5 h-5 text-yellow-500" />;
        }
        
        return <CheckCircle className="w-5 h-5 text-green-500" />;
    };

    const getStatusText = (domain: CustomDomain) => {
        if (!domain.isVerified) {
            return `Pendiente de verificación (${domain.verificationAttempts}/${domain.maxVerificationAttempts} intentos)`;
        }
        
        if (!domain.isActive) {
            return 'Dominio inactivo';
        }
        
        if (domain.sslStatus === 'error') {
            return `Error SSL: ${domain.sslError || 'Error desconocido'}`;
        }
        
        if (domain.sslStatus === 'pending') {
            return 'SSL pendiente';
        }
        
        return 'Activo y funcionando';
    };

    const getStatusBadge = (domain: CustomDomain) => {
        if (!domain.isVerified) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    <Clock className="w-3 h-3 mr-1" />
                    Verificando
                </span>
            );
        }
        
        if (!domain.isActive) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    <XCircle className="w-3 h-3 mr-1" />
                    Inactivo
                </span>
            );
        }
        
        if (domain.sslStatus === 'error') {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Error SSL
                </span>
            );
        }
        
        if (domain.sslStatus === 'pending') {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    <Shield className="w-3 h-3 mr-1" />
                    SSL Pendiente
                </span>
            );
        }
        
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Activo
            </span>
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600 dark:text-gray-400">Cargando dominios...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                    <div>
                        <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                            Error al cargar dominios
                        </h3>
                        <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                            {error}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleRefresh}
                    className="mt-3 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 flex items-center"
                >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Globe className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Dominios Personalizados
                    </h3>
                    <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
                        {domains.length}
                    </span>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                    title="Actualizar dominios"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Domains List */}
            {domains.length === 0 ? (
                <div className="text-center py-8">
                    <Globe className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        Sin dominios personalizados
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Este usuario no ha configurado ningún dominio personalizado
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {domains.map((domain) => (
                        <div
                            key={domain._id}
                            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-sm transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3">
                                    {getStatusIcon(domain)}
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                                {domain.fullDomain}
                                            </h4>
                                            {domain.isDefault && (
                                                <div title="Dominio predeterminado">
                                                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                                </div>
                                            )}
                                            {domain.isVerified && domain.isActive && (
                                                <a
                                                    href={`https://${domain.fullDomain}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                                                    title="Visitar dominio"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {getStatusText(domain)}
                                        </p>
                                        <div className="flex items-center space-x-2 mt-2">
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                Creado: {formatDate(domain.createdAt)}
                                            </span>
                                            {domain.updatedAt !== domain.createdAt && (
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    • Actualizado: {formatDate(domain.updatedAt)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end space-y-2">
                                    {getStatusBadge(domain)}
                                    {domain.subdomain && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                            Subdominio: {domain.subdomain}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Summary */}
            {domains.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mt-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Resumen de dominios
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <span className="text-gray-500 dark:text-gray-400">Total:</span>
                            <span className="ml-1 font-medium text-gray-900 dark:text-white">
                                {domains.length}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-500 dark:text-gray-400">Verificados:</span>
                            <span className="ml-1 font-medium text-green-600 dark:text-green-400">
                                {domains.filter(d => d.isVerified).length}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-500 dark:text-gray-400">Activos:</span>
                            <span className="ml-1 font-medium text-blue-600 dark:text-blue-400">
                                {domains.filter(d => d.isActive && d.isVerified && d.sslStatus === 'active').length}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-500 dark:text-gray-400">Predeterminado:</span>
                            <span className="ml-1 font-medium text-yellow-600 dark:text-yellow-400">
                                {domains.filter(d => d.isDefault).length > 0 ? '1' : '0'}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}