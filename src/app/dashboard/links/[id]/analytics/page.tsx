'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { LoadingSpinner, Button } from '../../../../../components/ui';
import { ModernStatsViewer } from '../../../../../components/features';
import { Link, ApiResponse } from '../../../../../types';

export default function LinkAnalyticsPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const linkId = params.id as string;

  const [link, setLink] = useState<Link | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.href =
        '/auth/signin?callbackUrl=' + encodeURIComponent(window.location.href);
    }
  }, [status]);

  const fetchLink = async () => {
    if (!session?.user?.id || !linkId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/links/${linkId}`);
      const data: ApiResponse<Link> = await response.json();

      if (data.success && data.data) {
        setLink(data.data);
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
    if (session?.user?.id) {
      fetchLink();
    }
  }, [session?.user?.id, linkId]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600 dark:text-gray-400 mt-4">
            Cargando analíticas...
          </p>
        </div>
      </div>
    );
  }

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
              <Button
                onClick={() => router.push('/dashboard/links')}
                variant="default"
              >
                Volver a Enlaces
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!link) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="text-center">
            <p className="text-muted-foreground">Enlace no encontrado</p>
            <Button
              onClick={() => router.push('/dashboard/links')}
              variant="default"
              className="mt-4"
            >
              Volver a Enlaces
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button
              onClick={() => router.push('/dashboard/analytics')}
              variant="ghost"
              size="sm"
              className="p-1"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Button>
            <h1 className="text-3xl font-bold text-foreground">
              Analíticas del Enlace
            </h1>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">
              <span className="font-medium">Slug:</span> /{link.slug}
            </p>
            <p className="text-muted-foreground">
              <span className="font-medium">URL:</span>{' '}
              <a
                href={`${window.location.origin}/${link.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
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
              onClick={() => window.open(`/stats/${link.slug}`, '_blank')}
              variant="outline"
            >
              Enlace Público
            </Button>
          )}
          <Button
            onClick={() =>
              navigator.clipboard.writeText(
                `${window.location.origin}/${link.slug}`
              )
            }
            variant="outline"
          >
            Copiar Enlace
          </Button>
        </div>
      </div>

      {/* Stats Viewer with Export Functionality */}
      <ModernStatsViewer linkId={linkId} linkSlug={link.slug} />
    </div>
  );
}
