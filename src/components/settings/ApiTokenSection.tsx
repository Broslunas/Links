'use client';

import { useState, useEffect } from 'react';
import { Button, LoadingSpinner } from '../ui';
import { useToast } from '../../hooks/useToast';
import { FiCopy, FiEye, FiEyeOff, FiKey, FiTrash2, FiExternalLink } from 'react-icons/fi';

interface ApiTokenData {
    hasToken: boolean;
    tokenCreatedAt: string | null;
}

interface ApiTokenSectionProps {
    onSuccess?: (message: string) => void;
    onError?: (message: string) => void;
}

export function ApiTokenSection({ onSuccess, onError }: ApiTokenSectionProps) {
    const [tokenData, setTokenData] = useState<ApiTokenData | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [revoking, setRevoking] = useState(false);
    const [newToken, setNewToken] = useState<string | null>(null);
    const [showToken, setShowToken] = useState(false);
    const [copied, setCopied] = useState(false);

    // Load token status on component mount
    useEffect(() => {
        loadTokenStatus();
    }, []);

    const loadTokenStatus = async () => {
        try {
            const response = await fetch('/api/user/token');
            if (!response.ok) {
                throw new Error('Failed to load token status');
            }
            const result = await response.json();
            setTokenData(result.data);
        } catch (error) {
            console.error('Error loading token status:', error);
            onError?.('Error al cargar el estado del token');
        } finally {
            setLoading(false);
        }
    };

    const generateToken = async () => {
        setGenerating(true);
        try {
            const response = await fetch('/api/user/token', {
                method: 'POST',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Failed to generate token');
            }

            const result = await response.json();
            setNewToken(result.data.token);
            setTokenData({
                hasToken: true,
                tokenCreatedAt: result.data.createdAt,
            });
            onSuccess?.('Token de API generado correctamente');
        } catch (error) {
            console.error('Error generating token:', error);
            onError?.(error instanceof Error ? error.message : 'Error al generar el token');
        } finally {
            setGenerating(false);
        }
    };

    const revokeToken = async () => {
        if (!confirm('¿Estás seguro de que quieres revocar tu token de API? Esto invalidará todas las aplicaciones que lo usen.')) {
            return;
        }

        setRevoking(true);
        try {
            const response = await fetch('/api/user/token', {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Failed to revoke token');
            }

            setTokenData({
                hasToken: false,
                tokenCreatedAt: null,
            });
            setNewToken(null);
            onSuccess?.('Token de API revocado correctamente');
        } catch (error) {
            console.error('Error revoking token:', error);
            onError?.(error instanceof Error ? error.message : 'Error al revocar el token');
        } finally {
            setRevoking(false);
        }
    };

    const copyToken = async () => {
        if (!newToken) return;

        try {
            await navigator.clipboard.writeText(newToken);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            onSuccess?.('Token copiado al portapapeles');
        } catch (error) {
            onError?.('Error al copiar el token');
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="bg-card rounded-lg border border-border p-6">
                <div className="flex items-center justify-center py-8">
                    <LoadingSpinner size="md" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
                <FiKey className="text-xl text-primary" />
                <h2 className="text-xl font-semibold text-card-foreground">
                    Token de API
                </h2>
            </div>

            <p className="text-muted-foreground mb-6">
                Usa tu token de API para acceder a nuestros endpoints públicos y crear enlaces programáticamente.
            </p>

            {/* API Documentation Link */}
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                            Documentación de la API
                        </h3>
                        <p className="text-sm text-blue-700 dark:text-blue-200">
                            Aprende cómo usar la API con ejemplos y especificaciones completas.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-200 dark:hover:bg-blue-800"
                        onClick={() => window.open('/docs', '_blank')}
                    >
                        <FiExternalLink className="mr-2" />
                        Ver Docs
                    </Button>
                </div>
            </div>

            {/* Token Status */}
            <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                        <h3 className="text-sm font-medium text-card-foreground">
                            Estado del Token
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {tokenData?.hasToken ? (
                                <>
                                    Token activo desde {formatDate(tokenData.tokenCreatedAt)}
                                </>
                            ) : (
                                'No tienes un token de API activo'
                            )}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${tokenData?.hasToken ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <span className="text-sm font-medium">
                            {tokenData?.hasToken ? 'Activo' : 'Inactivo'}
                        </span>
                    </div>
                </div>

                {/* New Token Display */}
                {newToken && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <h3 className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
                            ¡Token generado exitosamente!
                        </h3>
                        <p className="text-sm text-green-700 dark:text-green-200 mb-3">
                            Guarda este token de forma segura. No se mostrará nuevamente por razones de seguridad.
                        </p>

                        <div className="flex items-center gap-2 mb-3">
                            <div className="flex-1 font-mono text-sm bg-white dark:bg-gray-800 p-3 rounded border">
                                {showToken ? newToken : '•'.repeat(newToken.length)}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowToken(!showToken)}
                                className="px-3"
                            >
                                {showToken ? <FiEyeOff /> : <FiEye />}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={copyToken}
                                className="px-3"
                                disabled={copied}
                            >
                                <FiCopy />
                            </Button>
                        </div>

                        {copied && (
                            <p className="text-xs text-green-600 dark:text-green-400">
                                ✓ Token copiado al portapapeles
                            </p>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                    {!tokenData?.hasToken ? (
                        <Button
                            onClick={generateToken}
                            disabled={generating}
                            className="flex-1"
                        >
                            {generating ? (
                                <>
                                    <LoadingSpinner size="sm" className="mr-2" />
                                    Generando...
                                </>
                            ) : (
                                <>
                                    <FiKey className="mr-2" />
                                    Generar Token
                                </>
                            )}
                        </Button>
                    ) : (
                        <>
                            <Button
                                onClick={generateToken}
                                disabled={generating}
                                variant="outline"
                                className="flex-1"
                            >
                                {generating ? (
                                    <>
                                        <LoadingSpinner size="sm" className="mr-2" />
                                        Regenerando...
                                    </>
                                ) : (
                                    <>
                                        <FiKey className="mr-2" />
                                        Regenerar Token
                                    </>
                                )}
                            </Button>
                            <Button
                                onClick={revokeToken}
                                disabled={revoking}
                                variant="destructive"
                                className="flex-1"
                            >
                                {revoking ? (
                                    <>
                                        <LoadingSpinner size="sm" className="mr-2" />
                                        Revocando...
                                    </>
                                ) : (
                                    <>
                                        <FiTrash2 className="mr-2" />
                                        Revocar Token
                                    </>
                                )}
                            </Button>
                        </>
                    )}
                </div>

                {/* Usage Information */}
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <h3 className="text-sm font-medium text-card-foreground mb-2">
                        Cómo usar tu token
                    </h3>
                    <div className="space-y-2 text-sm text-muted-foreground">
                        <p>• Incluye el token en el header Authorization: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">Bearer tu_token_aquí</code></p>
                        <p>• Límite de velocidad: 50 creaciones de enlaces por hora, 100 consultas por hora</p>
                        <p>• Endpoints disponibles: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">/api/v1/links</code> y <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">/api/v1/links/[id]/stats</code></p>
                    </div>
                </div>
            </div>
        </div>
    );
}