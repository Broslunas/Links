'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Button, LoadingSpinner } from '../ui';
import { Link, ApiResponse } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { QRCodeModal } from './QRCodeModal';

type FilterStatus = 'all' | 'active' | 'inactive';
type FilterStats = 'all' | 'public' | 'private';
type SortOption = 'newest' | 'oldest' | 'most_clicks';

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
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedLinkUrl, setSelectedLinkUrl] = useState('');

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterStats, setFilterStats] = useState<FilterStats>('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');

  // Tags states
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [filterByTag, setFilterByTag] = useState<string>('');

  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [dateFilter, setDateFilter] = useState<
    'all' | 'today' | 'week' | 'month'
  >('all');

  const addTagToLink = async (linkId: string, tag: string) => {
    try {
      const link = links.find(l => l.id === linkId);

      await fetch(`/api/links/${linkId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });

      fetchLinks();
    } catch (error) {
      console.error('Error adding tag:', error);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not typing in input fields
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Escape: Clear search
      if (event.key === 'Escape') {
        if (searchTerm) {
          setSearchTerm('');
        }
      }

      // Ctrl/Cmd + F: Focus search
      if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        event.preventDefault();
        const searchInput = document.querySelector(
          'input[placeholder*="Buscar"]'
        ) as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }

      // V: Toggle view mode
      if (event.key === 'v' || event.key === 'V') {
        event.preventDefault();
        setViewMode(viewMode === 'cards' ? 'table' : 'cards');
      }

      // Number keys 1-4: Quick date filters
      if (event.key >= '1' && event.key <= '4') {
        event.preventDefault();
        const dateFilters = ['all', 'today', 'week', 'month'] as const;
        setDateFilter(dateFilters[parseInt(event.key) - 1]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchTerm, viewMode]);

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

  // Filter and sort links
  const filteredAndSortedLinks = useMemo(() => {
    let filtered = links.filter(link => {
      // Search filter
      const matchesSearch =
        searchTerm === '' ||
        link.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        link.originalUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
        link.slug.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && link.isActive) ||
        (filterStatus === 'inactive' && !link.isActive);

      // Stats filter
      const matchesStats =
        filterStats === 'all' ||
        (filterStats === 'public' && link.isPublicStats) ||
        (filterStats === 'private' && !link.isPublicStats);

      // Date filter
      const matchesDate = (() => {
        if (dateFilter === 'all') return true;
        const linkDate = new Date(link.createdAt);
        const now = new Date();

        switch (dateFilter) {
          case 'today':
            return linkDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return linkDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return linkDate >= monthAgo;
          default:
            return true;
        }
      })();

      return matchesSearch && matchesStatus && matchesStats && matchesDate;
    });

    // Sort links
    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'oldest':
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case 'most_clicks':
          return b.clickCount - a.clickCount;
        case 'newest':
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });

    return filtered;
  }, [
    links,
    searchTerm,
    filterStatus,
    filterStats,
    sortOption,
    filterByTag,
    dateFilter,
  ]);

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

  const renderEmptyState = () => {
    if (links.length === 0) {
      return (
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
      );
    }

    if (filteredAndSortedLinks.length === 0) {
      return (
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
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <p className="text-muted-foreground font-medium mb-2">
            No se encontraron enlaces
          </p>
          <p className="text-muted-foreground text-sm">
            Intenta ajustar los filtros de búsqueda
          </p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="bg-card rounded-lg border border-border">
      {/* Navigation Bar with Filters */}
      <div className="p-6 border-b border-border">
        <div className="flex flex-col gap-4">
          {/* Search Bar and View Mode */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Buscar por título, URL o slug..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-border rounded-md leading-5 bg-background placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background text-foreground border border-border hover:bg-accent'
                }`}
              >
                Lista
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'table'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background text-foreground border border-border hover:bg-accent'
                }`}
              >
                Tarjeta
              </button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap gap-4 items-center">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-muted-foreground">
                Estado:
              </label>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as FilterStatus)}
                className="px-3 py-1 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </div>

            {/* Stats Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-muted-foreground">
                Estadísticas:
              </label>
              <select
                value={filterStats}
                onChange={e => setFilterStats(e.target.value as FilterStats)}
                className="px-3 py-1 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="all">Todas</option>
                <option value="public">Públicas</option>
                <option value="private">Privadas</option>
              </select>
            </div>

            {/* Date Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-muted-foreground">
                Fecha:
              </label>
              <select
                value={dateFilter}
                onChange={e =>
                  setDateFilter(
                    e.target.value as 'all' | 'today' | 'week' | 'month'
                  )
                }
                className="px-3 py-1 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="all">Todas</option>
                <option value="today">Hoy</option>
                <option value="week">Esta semana</option>
                <option value="month">Este mes</option>
              </select>
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-muted-foreground">
                Ordenar:
              </label>
              <select
                value={sortOption}
                onChange={e => setSortOption(e.target.value as SortOption)}
                className="px-3 py-1 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="newest">Más recientes</option>
                <option value="oldest">Más antiguos</option>
                <option value="most_clicks">Más clicks</option>
              </select>
            </div>

            {/* Keyboard shortcuts help */}
            <div className="relative group">
              <button
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                title="Atajos de teclado"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>
              <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Atajos de teclado
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ctrl/Cmd + F</span>
                    <span className="text-gray-900">Buscar</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Escape</span>
                    <span className="text-gray-900">Cancelar/Limpiar</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delete</span>
                    <span className="text-gray-900">
                      Eliminar seleccionados
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">S</span>
                    <span className="text-gray-900">Modo selección</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">V</span>
                    <span className="text-gray-900">Cambiar vista</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">1-4</span>
                    <span className="text-gray-900">Filtros de fecha</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Counter */}
            <div className="ml-auto text-sm text-muted-foreground">
              {filteredAndSortedLinks.length} de {links.length} enlaces
            </div>
          </div>
        </div>
      </div>

      {/* Selection Actions Bar */}

      {/* Links List or Empty State */}
      {renderEmptyState() ||
        (viewMode === 'cards' ? (
          /* Cards View */
          <div className="divide-y divide-border">
            {filteredAndSortedLinks.map(link => (
              <div
                key={link.id}
                className="p-6 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-card-foreground truncate">
                          {link.title || 'Untitled Link'}
                        </h3>

                        {link.isDisabledByAdmin && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
                            Deshabilitado por Admin
                          </span>
                        )}
                        {!link.isActive && !link.isDisabledByAdmin && (
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
                            onClick={() =>
                              copyToClipboard(getShortUrl(link.slug))
                            }
                            className="text-sm text-primary hover:text-primary/80 font-mono bg-muted px-2 py-1 rounded transition-colors"
                            title="Click to copy"
                          >
                            <a target="_blank" href={getShortUrl(link.slug)}>
                              {getShortUrl(link.slug)}
                            </a>
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            Destino:
                          </span>
                          <a
                            href={getShortUrl(link.slug)}
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
                            locale: es,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 ml-4 max-w-fit">
                    <Button
                      onClick={() =>
                        (window.location.href = `/dashboard/links/${link.slug}/analytics`)
                      }
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
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                      Estadísticas
                    </Button>

                    <Button
                      onClick={() => {
                        setSelectedLinkUrl(getShortUrl(link.slug));
                        setQrModalOpen(true);
                      }}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      disabled={link.isDisabledByAdmin}
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
                          d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                        />
                      </svg>
                      Código QR
                    </Button>

                    {link.isPublicStats && (
                      <Button
                        onClick={() => {
                          const publicStatsUrl = `${window.location.origin}/stats/${link.slug}`;
                          window.open(publicStatsUrl, '_blank');
                        }}
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
                            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                          />
                        </svg>
                        Compartir Stats
                      </Button>
                    )}

                    <Button
                      onClick={() => onEditLink(link)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      disabled={link.isDisabledByAdmin}
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
                      disabled={link.isDisabledByAdmin}
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
        ) : (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAndSortedLinks.map(link => (
              <div
                key={link.id}
                className="bg-card rounded-lg border border-border p-4 hover:shadow-md transition-all duration-200 hover:border-primary/20 flex flex-col h-full"
              >
                {/* Header with title and status */}
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-foreground text-sm line-clamp-2 flex-1 mr-2">
                    {link.title}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      link.isDisabledByAdmin
                        ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                        : link.isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}
                  >
                    {link.isDisabledByAdmin ? 'Deshabilitado por Admin' : link.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                {/* URLs */}
                <div className="space-y-2 mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      URL Original:
                    </p>
                    <a
                      href={getShortUrl(link.slug)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-xs block truncate"
                      title={link.originalUrl}
                    >
                      {link.originalUrl}
                    </a>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Enlace corto:
                    </p>
                    <a
                      href={getShortUrl(link.slug)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-xs font-mono"
                    >
                      {link.slug}
                    </a>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between mb-3 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Clicks:</span>
                    <span className="font-semibold text-foreground">
                      {link.clickCount}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(link.createdAt), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap justify-center gap-1 mt-auto">
                  <Button
                    onClick={() =>
                      (window.location.href = `/dashboard/links/${link.slug}/analytics`)
                    }
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
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </Button>

                  <Button
                    onClick={() => {
                      setSelectedLinkUrl(getShortUrl(link.slug));
                      setQrModalOpen(true);
                    }}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    disabled={link.isDisabledByAdmin}
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
                        d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                      />
                    </svg>
                  </Button>

                  {link.isPublicStats && (
                    <Button
                      onClick={() => {
                        const publicStatsUrl = `${window.location.origin}/stats/${link.slug}`;
                        window.open(publicStatsUrl, '_blank');
                      }}
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
                          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                        />
                      </svg>
                    </Button>
                  )}

                  <Button
                    onClick={() => onEditLink(link)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    disabled={link.isDisabledByAdmin}
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
                  </Button>

                  <Button
                    onClick={() => onDeleteLink(link)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:border-red-300 dark:text-red-400 dark:hover:text-red-300"
                    disabled={link.isDisabledByAdmin}
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
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ))}
      <QRCodeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        url={selectedLinkUrl}
        title="Código QR del enlace"
      />
    </div>
  );
}
