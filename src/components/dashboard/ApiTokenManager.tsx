'use client';

import { useState, useEffect } from 'react';
import { Button, LoadingSpinner, ConfirmationModal } from '../ui';
import { useToast } from '../../hooks/useToast';

interface TokenInfo {
    hasToken: boolean;
    createdAt?: string;
    lastUsedAt?: string;
    tokenPreview?: string;
}

interface ApiTokenManagerProps {
    className?: string;
}

export function ApiTokenManager({ className }: ApiTokenManagerProps) {
    const { success, error } = useToast();
    const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [revoking, setRevoking] = useState(false);
    const [showConfirmRevoke, setShowConfirmRevoke] = useState(false);
    const [showConfirmRegenerate, setShowConfirmRegenerate] = useState(false);
    const [newToken, setNewToken] = useState<string | null>(null);
    const [showNewToken, setShowNewToken] = useState(false);

    // Load token information on component mount
    useEffect(() => {
        loadTokenInfo();
    }, []);

    const loadTokenInfo = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/user/token');
            const data = await response.json();

            if (data.success) {
                setTokenInfo(data.data);
            } else {
                console.error('Error loading token info:', data.error);
                error('Error al cargar información del token', 'Error');
            }
        } catch (err) {
            console.error('Error loading token info:', err);
            error('Error al cargar información del token', 'Error');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateToken = async () => {
        try {
            setGenerating(true);
            const response = await fetch('/api/user/token', {
                method: 'POST',
            });
            const data = await response.json();

            if (data.success) {
                setNewToken(data.data.token);
                setShowNewToken(true);
                await loadTokenInfo(); // Refresh token info
                success(data.data.message, 'Token API');
            } else {
                console.error('Error generating token:', data.error);
                error(data.error.message || 'Error al generar el token', 'Error');
            }
        } catch (err) {
            console.error('Error generating token:', err);
            error('Error al generar el token', 'Error');
        } finally {
            setGenerating(false);
            setShowConfirmRegenerate(false);
        }
    };

    const handleRevokeToken = async () => {
        try {
            setRevoking(true);
            const response = await fetch('/api/user/token', {
                method: 'DELETE',
            });
            const data = await response.json();

            if (data.success) {
                await loadTokenInfo(); // Refresh token info
                success(data.data.message, 'Token API');
            } else {
                console.error('Error revoking token:', data.error);
                error(data.error.message || 'Error al revocar el token', 'Error');
            }
        } catch (err) {
            console.error('Error revoking token:', err);
            error('Error al revocar el token', 'Error');
        } finally {
            setRevoking(false);
            setShowConfirmRevoke(false);
        }
    };

    const copyTokenToClipboard = async () => {
        if (newToken) {
            try {
                await navigator.clipboard.writeText(newToken);
                success('Token copiado al portapapeles', 'Copiado');
            } catch (err) {
                console.error('Error copying to clipboard:', err);
                error('Error al copiar al portapapeles', 'Error');
            }
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Nunca';
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className={`bg-card rounded-lg border border-border p-6 ${className}`}>
                <div className="flex items-center justify-center py-8">
                    <LoadingSpinner size="lg" />
                </div>
            </div>
        );
    }

    return (
        <>
            <div className={`bg-card rounded-lg border border-border p-6 ${className}`}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-card-foreground">
                        Token de API
                    </h2>
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                            API v1
                        </span>
                    </div>
                </div>

                <p className="text-sm text-muted-foreground mb-6">
                    Utiliza tu token de API para acceder a los endpoints públicos de la API.
                    Mantén tu token seguro y no lo compartas públicamente.
                </p>

                {tokenInfo?.hasToken ? (
                    <div className="space-y-4">
                        {/* Token Preview */}
                        <div className="p-4 bg-muted rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-card-foreground">
                                    Token Actual
                                </label>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowConfirmRegenerate(true)}
                                        disabled={generating || revoking}
                                    >
                                        Regenerar
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => setShowConfirmRevoke(true)}
                                        disabled={generating || revoking}
                                    >
                                        {revoking ? (
                                            <>
                                                <LoadingSpinner size="sm" className="mr-2" />
                                                Revocando...
                                            </>
                                        ) : (
                                            'Revocar'
                                        )}
                                    </Button>
                                </div>
                            </div>
                            <div className="font-mono text-sm bg-background border rounded px-3 py-2">
                                {tokenInfo.tokenPreview}
                            </div>
                        </div>

                        {/* Token Information */}
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="text-sm font-medium text-card-foreground">
                                    Creado
                                </label>
                                <p className="text-sm text-muted-foreground">
                                    {formatDate(tokenInfo.createdAt)}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-card-foreground">
                                    Último Uso
                                </label>
                                <p className="text-sm text-muted-foreground">
                                    {formatDate(tokenInfo.lastUsedAt)}
                                </p>
                            </div>
                        </div>

                        {/* Usage Instructions */}
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                                Cómo usar tu token
                            </h3>
                            <p className="text-sm text-blue-700 dark:text-blue-200 mb-3">
                                Incluye tu token en el header Authorization de tus peticiones:
                            </p>
                            <div className="bg-blue-100 dark:bg-blue-900/40 rounded p-2 font-mono text-xs text-blue-800 dark:text-blue-200">
                                Authorization: Bearer tu_token_aquí
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                            <svg
                                className="h-6 w-6 text-gray-600 dark:text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                                />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-card-foreground mb-2">
                            No tienes un token de API
                        </h3>
                        <p className="text-sm text-muted-foreground mb-6">
                            Genera un token para comenzar a usar la API pública.
                        </p>
                        <Button
                            onClick={handleGenerateToken}
                            disabled={generating}
                            className="min-w-[140px]"
                        >
                            {generating ? (
                                <>
                                    <LoadingSpinner size="sm" className="mr-2" />
                                    Generando...
                                </>
                            ) : (
                                'Generar Token'
                            )}
                        </Button>
                    </div>
                )}
            </div>

            {/* New Token Modal */}
            {showNewToken && newToken && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-card rounded-lg border border-border p-6 max-w-md w-full">
                        <div className="text-center mb-4">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
                                <svg
                                    className="h-6 w-6 text-green-600 dark:text-green-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-card-foreground mb-2">
                                ¡Token Generado!
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Copia tu token ahora. No podrás verlo completo nuevamente por seguridad.
                            </p>
                        </div>

                        <div className="mb-4">
                            <label className="text-sm font-medium text-card-foreground mb-2 block">
                                Tu nuevo token:
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newToken}
                                    readOnly
                                    className="flex-1 font-mono text-sm bg-muted border rounded px-3 py-2 break-all"
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={copyTokenToClipboard}
                                    className="shrink-0"
                                >
                                    Copiar
                                </Button>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button
                                onClick={() => {
                                    setShowNewToken(false);
                                    setNewToken(null);
                                }}
                            >
                                Entendido
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modals */}
            <ConfirmationModal
                isOpen={showConfirmRevoke}
                onClose={() => setShowConfirmRevoke(false)}
                onConfirm={handleRevokeToken}
                title="Revocar Token de API"
                message="¿Estás seguro de que quieres revocar tu token de API? Todas las aplicaciones que lo usen dejarán de funcionar inmediatamente."
                confirmText="Revocar Token"
                cancelText="Cancelar"
                variant="danger"
                loading={revoking}
            />

            <ConfirmationModal
                isOpen={showConfirmRegenerate}
                onClose={() => setShowConfirmRegenerate(false)}
                onConfirm={handleGenerateToken}
                title="Regenerar Token de API"
                message="¿Estás seguro de que quieres regenerar tu token de API? El token actual dejará de funcionar y necesitarás actualizar todas tus aplicaciones con el nuevo token."
                confirmText="Regenerar Token"
                cancelText="Cancelar"
                variant="warning"
                loading={generating}
            />
        </>
    );
}