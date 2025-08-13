'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '../../../../components/layout';
import { StatsViewer } from '../../../../components/features';
import { LoadingSpinner, Button } from '../../../../components/ui';
import { Link, ApiResponse } from '../../../../types';

interface StatsPageProps {
    params: {
        linkId: string;
    };
}

export default function StatsPage({ params }: StatsPageProps) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [link, setLink] = useState<Link | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Handle authentication state
    useEffect(() => {
        if (status === 'unauthenticated') {
            window.location.href =
                '/auth/signin?callbackUrl=' + encodeURIComponent(window.location.href);
        }
    }, [status]);

    // Fetch link details
    const fetchLink = async () => {
        if (!session?.user?.id) return;

        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/links');
            const data: ApiResponse<Link[]> = await response.json();

            if (data.success && data.data) {
                const foundLink = data.data.find(l => l.id === params.linkId);
                if (foundLink) {
                    setLink(foundLink);
                } else {
                    setError('Enlace no encontrado');
                }
            } else {
                setError(data.error?.message || 'Error al cargar el enlace');
            }
        } catch (err) {
            console.error('Error fetching link:', err);
            setError('Error al cargar el enlace');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLink();
    }, [session?.user?.id, params.linkId]);

    // Show loading state while checking authentication
    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="text-gray-600 dark:text-gray-400 mt-4">Cargando estadísticas...</p>
                </div>
            </div>
        );
    }

    // Show message if not authenticated
    if (status === 'unauthenticated') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <p className="text-gray-600 dark:text-gray-400">
                        Redirigiendo a la página de inicio de sesión...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="max-w-4xl mx-auto">
                    <div className="bg-card rounded-lg border border-border p-6">
                        <div className="text-center">
                            <div className="text-red-500 mb-4">
                                <svg
                                    className="h-12 w-12 mx-auto"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                            <p className="text-red-500 font-medium mb-2">Error</p>
                            <p className="text-muted-foreground text-sm mb-4">{error}</p>
                            <div className="flex gap-2 justify-center">
                                <Button onClick={fetchLink} variant="outline">
                                    Reintentar
                                </Button>
                                <Button onClick={() => router.push('/dashboard')} variant="default">
                                    Volver al Dashboard
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (!link) {
        return (
            <DashboardLayout>
                <div className="max-w-4xl mx-auto">
                    <div className="bg-card rounded-lg border border-border p-6">
                        <div className="text-center">
                            <p className="text-muted-foreground">Enlace no encontrado</p>
                            <Button
                                onClick={() => router.push('/dashboard')}
                                variant="default"
                                className="mt-4"
                            >
                                Volver al Dashboard
                            </Button>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <Button
                            onClick={() => router.push('/dashboard')}
                            variant="outline"
                            className="mb-4"
                        >
                            ← Volver al Dashboard
                        </Button>
                        <h1 className="text-3xl font-bold text-foreground">
                            Estadísticas del Enlace
                        </h1>
                        <div className="mt-2 space-y-1">
                            <p className="text-muted-foreground">
                                <span className="font-medium">Enlace corto:</span>{' '}
                                <code className="bg-muted px-2 py-1 rounded text-sm">
                                    {window.location.origin}/{link.slug}
                                </code>
                            </p>
                            <p className="text-muted-foreground">
                                <span className="font-medium">Destino:</span>{' '}
                                <a
                                    href={link.originalUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:text-primary/80 underline"
                                >
                                    {link.originalUrl}
                                </a>
                            </p>
                            {link.title && (
                                <p className="text-muted-foreground">
                                    <span className="font-medium">Título:</span> {link.title}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-2">
                        {link.isPublicStats && (
                            <Button
                                onClick={() => window.open(`/stats/${link.id}`, '_blank')}
                                variant="outline"
                            >
                                Ver Estadísticas Públicas
                            </Button>
                        )}
                        <Button
                            onClick={() => navigator.clipboard.writeText(`${window.location.origin}/${link.slug}`)}
                            variant="outline"
                        >
                            Copiar Enlace
                        </Button>
                    </div>
                </div>

                {/* Stats Viewer */}
                <StatsViewer linkId={link.id} linkSlug={link.slug} />
            </div>
        </DashboardLayout>
    );
}