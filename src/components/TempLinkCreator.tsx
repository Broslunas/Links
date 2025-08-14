'use client';

import { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { CreateTempLinkResponse } from '@/types';
import { toast } from 'sonner';

export function TempLinkCreator() {
    const [url, setUrl] = useState('');
    const [slug, setSlug] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<CreateTempLinkResponse | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!url.trim()) {
            toast.error('Por favor ingresa una URL');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/temp-links', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    originalUrl: url.trim(),
                    slug: slug.trim() || undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || 'Error creating temporary link');
            }

            if (data.success && data.data) {
                setResult(data.data);
                setUrl('');
                setSlug('');
                toast.success('¡Enlace temporal creado exitosamente!');
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error('Error creating temp link:', error);
            toast.error(error instanceof Error ? error.message : 'Error creating temporary link');
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success('¡Enlace copiado al portapapeles!');
        } catch (error) {
            toast.error('Error al copiar el enlace');
        }
    };

    const formatExpirationTime = (expiresAt: Date) => {
        const now = new Date();
        const expiration = new Date(expiresAt);
        const diffMs = expiration.getTime() - now.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        if (diffHours > 0) {
            return `${diffHours}h ${diffMinutes}m`;
        }
        return `${diffMinutes}m`;
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Crear Enlace Temporal (24h)
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">
                Crea un enlace corto que expira automáticamente en 24 horas. No requiere registro.
            </p>

            {!result ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="temp-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            URL a acortar *
                        </label>
                        <Input
                            id="temp-url"
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://ejemplo.com/mi-enlace-largo"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <label htmlFor="temp-slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Slug personalizado (opcional)
                        </label>
                        <Input
                            id="temp-slug"
                            type="text"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            placeholder="mi-enlace"
                            disabled={isLoading}
                            pattern="[a-z0-9-_]+"
                            title="Solo letras minúsculas, números, guiones y guiones bajos"
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full"
                    >
                        {isLoading ? 'Creando...' : 'Crear Enlace Temporal'}
                    </Button>
                </form>
            ) : (
                <div className="space-y-4">
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                            ¡Enlace creado exitosamente!
                        </h4>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-green-700 dark:text-green-300 mb-1">
                                    Enlace corto:
                                </label>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 bg-white dark:bg-gray-800 px-3 py-2 rounded border text-sm">
                                        {result.shortUrl}
                                    </code>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => copyToClipboard(result.shortUrl)}
                                    >
                                        Copiar
                                    </Button>
                                </div>
                            </div>

                            <div className="text-xs text-green-600 dark:text-green-400">
                                <p>
                                    <strong>Expira en:</strong> {formatExpirationTime(result.expiresAt)}
                                </p>
                                <p>
                                    <strong>Token:</strong> {result.token.substring(0, 8)}...
                                </p>
                            </div>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        onClick={() => {
                            setResult(null);
                            setUrl('');
                            setSlug('');
                        }}
                        className="w-full"
                    >
                        Crear Otro Enlace
                    </Button>
                </div>
            )}

            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                <p>• Los enlaces temporales expiran automáticamente en 24 horas</p>
                <p>• Límite: 5 enlaces por hora por IP</p>
                <p>• No se requiere registro</p>
            </div>
        </div>
    );
}