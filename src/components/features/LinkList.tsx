'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button, LoadingSpinner } from '../ui';
import { Link, ApiResponse } from '../../types';
import { formatDistanceToNow } from 'date-fns';

interface LinkListProps {
  onEditLink: (link: Link) => void;
  onDeleteLink: (link: Link) => void;
  refreshTrigger?: number; // Used to trigger refresh from parent
}

export function LinkList({
  onEditLink,
  onDeleteLink,
  refreshTrigger,
}: LinkListProps) {
  const { data: session } = useSession();
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLinks = async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/links', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data: ApiResponse<Link[]> = await response.json();

      if (data.success && data.data) {
        setLinks(data.data);
      } else {
        setError(data.error?.message || 'Error al cargar los enlaces');
      }
    } catch (err) {
      console.error('Error al cargar los enlaces:', err);
      setError('Error al cargar los enlaces');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, [session?.user?.id, refreshTrigger]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Error al copiar al portapapeles:', err);
    }
  };

  const getShortUrl = (slug: string) => {
    return `${window.location.origin}/${slug}`;
  };

  if (loading) {
    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="text-center py-8">
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
          <p className="text-red-500 font-medium mb-2">
            Error al cargar los enlaces
          </p>
          <p className="text-muted-foreground text-sm mb-4">{error}</p>
          <Button onClick={fetchLinks} variant="outline" size="sm">
            Volver a intentar
          </Button>
        </div>
      </div>
    );
  }

  if (links.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="text-center py-8">
          <svg
            className="h-12 w-12 text-muted-foreground mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
          <p className="text-muted-foreground font-medium mb-2">
            No hay enlaces aún
          </p>
          <p className="text-muted-foreground text-sm">
            Crea tu primer enlace corto para comenzar
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border">
      <div className="p-6 border-b border-border">
        <h2 className="text-xl font-semibold text-card-foreground">
          Your Links
        </h2>
        <p className="text-muted-foreground text-sm">
          Manage and track your shortened URLs
        </p>
      </div>

      <div className="divide-y divide-border">
        {links.map(link => (
          <div
            key={link.id}
            className="p-6 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-medium text-card-foreground truncate">
                    {link.title || 'Untitled Link'}
                  </h3>
                  {!link.isActive && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                      Inactivo
                    </span>
                  )}
                  {link.isPublicStats && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                      Estadísticas públicas
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Enlace corto:
                    </span>
                    <button
                      onClick={() => copyToClipboard(getShortUrl(link.slug))}
                      className="text-sm text-primary hover:text-primary/80 font-mono bg-muted px-2 py-1 rounded transition-colors"
                      title="Click to copy"
                    >
                      {getShortUrl(link.slug)}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Destino:
                    </span>
                    <a
                      href={link.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:text-primary/80 truncate max-w-md"
                      title={link.originalUrl}
                    >
                      {link.originalUrl}
                    </a>
                  </div>

                  {link.description && (
                    <div className="flex items-start gap-2">
                      <span className="text-sm text-muted-foreground">
                        Descripción:
                      </span>
                      <p className="text-sm text-card-foreground">
                        {link.description}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
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
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    {link.clickCount} clicks
                  </span>
                  <span className="flex items-center gap-1">
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
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Creado{' '}
                    {formatDistanceToNow(new Date(link.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <Button
                  onClick={() => onEditLink(link)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
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
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Editar
                </Button>

                <Button
                  onClick={() => onDeleteLink(link)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:border-red-300 dark:text-red-400 dark:hover:text-red-300"
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Eliminar
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
