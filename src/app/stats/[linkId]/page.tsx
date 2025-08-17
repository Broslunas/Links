'use client';

import { useState, useEffect } from 'react';
import { PublicStatsViewer } from '../../../components/features';
import { LoadingSpinner, Button } from '../../../components/ui';
import { Link, ApiResponse } from '../../../types';

interface PublicStatsPageProps {
  params: {
    linkId: string;
  };
}

export default function PublicStatsPage({ params }: PublicStatsPageProps) {
  const [link, setLink] = useState<Link | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch link details to verify public stats are enabled
  const fetchLinkInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to fetch public stats - the API will handle permission checking
      const response = await fetch(`/api/stats/${params.linkId}`);
      const data: ApiResponse = await response.json();

      if (data.success && data.data) {
        // Create link object with the returned data
        setLink({
          id: params.linkId,
          slug: data.data.link.slug,
          title: data.data.link.title,
          description: data.data.link.description,
          isPublicStats: true,
        } as Link);
      } else {
        if (response.status === 403) {
          setError('Las estadísticas de este enlace son privadas.');
        } else if (response.status === 404) {
          setError('Enlace no encontrado.');
        } else {
          setError(data.error?.message || 'Error al cargar las estadísticas');
        }
      }
    } catch (err) {
      console.error('Error fetching link info:', err);
      setError('Error al cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinkInfo();
  }, [params.linkId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <LoadingSpinner size="lg" />
                  <p className="text-muted-foreground mt-4">
                    Cargando estadísticas públicas...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
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
                <p className="text-red-500 font-medium mb-2">Acceso Denegado</p>
                <p className="text-muted-foreground text-sm mb-4">{error}</p>
                <Button
                  onClick={() => (window.location.href = '/')}
                  variant="default"
                >
                  Ir al Inicio
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!link) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="text-center">
                <p className="text-muted-foreground">Enlace no encontrado</p>
                <Button
                  onClick={() => (window.location.href = '/')}
                  variant="default"
                  className="mt-4"
                >
                  Ir al Inicio
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Estadísticas Públicas
              </h1>
              <p className="text-muted-foreground">
                Estas estadísticas son públicas y han sido compartidas por el
                propietario del enlace.
              </p>
              <div className="mt-4">
                <Button
                  onClick={() => (window.location.href = '/auth/signin')}
                  variant="outline"
                >
                  Crear tu propio enlace corto
                </Button>
              </div>
            </div>
          </div>

          {/* Public Stats Viewer */}
          <PublicStatsViewer
            linkId={params.linkId}
            linkInfo={{
              slug: link.slug,
              title: link.title,
              description: link.description,
            }}
          />

          {/* Footer */}
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="text-center text-sm text-muted-foreground">
              <p>
                Estas estadísticas son generadas por{' '}
                <a
                  href="/"
                  className="text-primary hover:text-primary/80 font-medium"
                >
                  Broslunas Links
                </a>{' '}
                - Crea tus propios enlaces cortos con estadísticas detalladas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
