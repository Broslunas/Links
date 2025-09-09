'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Share2,
  Eye,
  BarChart3,
  Edit3,
  Trash2,
  ExternalLink,
  Calendar,
  User,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { LinkEditor } from '@/components/features/LinkEditor';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SharedLink {
  _id: string;
  linkId: {
    _id: string;
    originalUrl: string;
    slug: string;
    title?: string;
    description?: string;
    clickCount: number;
    isActive: boolean;
    createdAt: string;
    userId: {
      _id: string;
      email: string;
      name?: string;
    };
  };
  sharedBy: {
    _id: string;
    email: string;
    name?: string;
  };
  permissions: {
    canView: boolean;
    canEdit: boolean;
    canViewStats: boolean;
    canDelete: boolean;
  };
  sharedAt: string;
}

// Interfaz removida - ahora manejamos la respuesta de la API directamente

export default function SharedLinksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sharedLinks, setSharedLinks] = useState<SharedLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLinks, setTotalLinks] = useState(0);
  const [sortBy, setSortBy] = useState<
    'sharedAt' | 'title' | 'clickCount' | 'createdAt'
  >('sharedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [permissionFilter, setPermissionFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'inactive'
  >('all');
  const [dateFilter, setDateFilter] = useState<
    'all' | 'today' | 'week' | 'month'
  >('all');
  const [isMobile, setIsMobile] = useState(false);
  const [editingLink, setEditingLink] = useState<SharedLink | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/dashboard/shared');
    }
  }, [status, router]);

  // Check if screen is mobile size
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 1100); // md breakpoint
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Force list view on mobile
  useEffect(() => {
    if (isMobile && viewMode === 'cards') {
      setViewMode('list');
    }
  }, [isMobile, viewMode]);

  // Load shared links
  useEffect(() => {
    if (session?.user?.id) {
      loadSharedLinks();
    }
  }, [
    session,
    currentPage,
    searchTerm,
    sortBy,
    sortOrder,
    permissionFilter,
    statusFilter,
    dateFilter,
  ]);

  const loadSharedLinks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search: searchTerm,
        sortBy,
        sortOrder,
        ...(permissionFilter !== 'all' && { permission: permissionFilter }),
      });

      const response = await fetch(`/api/links/shared-with-me?${params}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setSharedLinks(result.data.sharedLinks || []);
          setTotalPages(result.data.pagination?.totalPages || 1);
          setTotalLinks(result.data.pagination?.totalItems || 0);
        } else {
          setSharedLinks([]);
          toast.error('Error al cargar enlaces compartidos');
        }
      } else {
        setSharedLinks([]);
        toast.error('Error al cargar enlaces compartidos');
      }
    } catch (error) {
      console.error('Error loading shared links:', error);
      toast.error('Error al cargar enlaces compartidos');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadSharedLinks();
  };

  const getPermissionBadges = (permissions: SharedLink['permissions']) => {
    const badges = [];
    if (permissions.canView)
      badges.push({
        label: 'Ver',
        icon: Eye,
        color: 'bg-blue-100 text-blue-800',
      });
    if (permissions.canEdit)
      badges.push({
        label: 'Editar',
        icon: Edit3,
        color: 'bg-green-100 text-green-800',
      });
    if (permissions.canViewStats)
      badges.push({
        label: 'Stats',
        icon: BarChart3,
        color: 'bg-purple-100 text-purple-800',
      });
    if (permissions.canDelete)
      badges.push({
        label: 'Eliminar',
        icon: Trash2,
        color: 'bg-red-100 text-red-800',
      });
    return badges;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleLinkClick = (link: SharedLink) => {
    // Abrir el enlace acortado en una nueva pestaña
    window.open(`${window.location.origin}/${link.linkId.slug}`, '_blank');
  };

  const handleEditLink = (sharedLink: SharedLink) => {
    if (sharedLink.permissions.canEdit) {
      setEditingLink(sharedLink);
    } else {
      toast.error('No tienes permisos para editar este enlace');
    }
  };

  const handleLinkUpdated = () => {
    toast.success('Enlace actualizado correctamente');
    setEditingLink(null);
    loadSharedLinks(); // Reload the shared links to reflect changes
  };

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<SharedLink | null>(null);
  const [revokeConfirmOpen, setRevokeConfirmOpen] = useState(false);
  const [linkToRevoke, setLinkToRevoke] = useState<SharedLink | null>(null);

  const handleDeleteLink = async (sharedLink: SharedLink) => {
    if (!sharedLink.permissions.canDelete) {
      toast.error('No tienes permisos para eliminar este enlace');
      return;
    }

    setLinkToDelete(sharedLink);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!linkToDelete) return;

    try {
      const response = await fetch(`/api/links/${linkToDelete.linkId.slug}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Enlace eliminado correctamente');
        loadSharedLinks(); // Reload the shared links to reflect changes
      } else {
        const error = await response.json();
        toast.error(error.error?.message || 'Error al eliminar el enlace');
      }
    } catch (error) {
      console.error('Error deleting link:', error);
      toast.error('Error al eliminar el enlace');
    } finally {
      setDeleteConfirmOpen(false);
      setLinkToDelete(null);
    }
  };

  const handleRevokeAccess = async (sharedLink: SharedLink) => {
    setLinkToRevoke(sharedLink);
    setRevokeConfirmOpen(true);
  };

  const confirmRevokeAccess = async () => {
    if (!linkToRevoke || !session?.user?.id) return;

    try {
      const response = await fetch(
        `/api/links/${linkToRevoke.linkId.slug}/share`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: session.user.id }),
        }
      );

      if (response.ok) {
        toast.success('Acceso revocado correctamente');
        loadSharedLinks(); // Reload the shared links to reflect changes
      } else {
        const error = await response.json();
        toast.error(error.error?.message || 'Error al revocar el acceso');
      }
    } catch (error) {
      console.error('Error revoking access:', error);
      toast.error('Error al revocar el acceso');
    } finally {
      setRevokeConfirmOpen(false);
      setLinkToRevoke(null);
    }
  };

  const handleError = (error: string) => {
    toast.error(error || 'Error al actualizar el enlace');
  };

  // Filter and sort shared links
  const filteredAndSortedLinks = useMemo(() => {
    let filtered = sharedLinks.filter(sharedLink => {
      const link = sharedLink.linkId;

      // Search filter
      const matchesSearch =
        searchTerm === '' ||
        link.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        link.originalUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
        link.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sharedLink.sharedBy.name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        sharedLink.sharedBy.email
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      // Permission filter
      const matchesPermission =
        permissionFilter === 'all' ||
        (permissionFilter === 'canEdit' && sharedLink.permissions.canEdit) ||
        (permissionFilter === 'canViewStats' &&
          sharedLink.permissions.canViewStats) ||
        (permissionFilter === 'canDelete' && sharedLink.permissions.canDelete);

      // Status filter
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && link.isActive) ||
        (statusFilter === 'inactive' && !link.isActive);

      // Date filter
      const matchesDate = (() => {
        if (dateFilter === 'all') return true;
        const sharedDate = new Date(sharedLink.sharedAt);
        const now = new Date();

        switch (dateFilter) {
          case 'today':
            return sharedDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return sharedDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return sharedDate >= monthAgo;
          default:
            return true;
        }
      })();

      return matchesSearch && matchesPermission && matchesStatus && matchesDate;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      const aValue =
        sortBy === 'sharedAt'
          ? new Date(a.sharedAt).getTime()
          : sortBy === 'createdAt'
            ? new Date(a.linkId.createdAt).getTime()
            : sortBy === 'clickCount'
              ? a.linkId.clickCount
              : sortBy === 'title'
                ? (a.linkId.title || '').toLowerCase()
                : 0;

      const bValue =
        sortBy === 'sharedAt'
          ? new Date(b.sharedAt).getTime()
          : sortBy === 'createdAt'
            ? new Date(b.linkId.createdAt).getTime()
            : sortBy === 'clickCount'
              ? b.linkId.clickCount
              : sortBy === 'title'
                ? (b.linkId.title || '').toLowerCase()
                : 0;

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [
    sharedLinks,
    searchTerm,
    permissionFilter,
    sortBy,
    sortOrder,
    statusFilter,
    dateFilter,
  ]);

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Share2 className="h-8 w-8 text-primary" />
              Enlaces Compartidos Conmigo
            </h1>
            <p className="mt-2 text-muted-foreground">
              Enlaces que otros usuarios han compartido contigo
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            {totalLinks} enlace{totalLinks !== 1 ? 's' : ''} compartido
            {totalLinks !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Navigation Bar with Filters */}
      <div className="bg-card rounded-lg border border-border mb-6">
        <div className="p-6 border-b border-border">
          <div className="flex flex-col gap-4">
            {/* Search Bar and View Mode */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar por título, URL, slug o usuario..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-border rounded-md leading-5 bg-background placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>

              {/* View Mode Toggle - Hide on mobile */}
              {!isMobile && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'list'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background text-foreground border border-border hover:bg-accent'
                    }`}
                  >
                    Lista
                  </button>
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'cards'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background text-foreground border border-border hover:bg-accent'
                    }`}
                  >
                    Tarjetas
                  </button>
                </div>
              )}
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap gap-4 items-center">
              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Estado:
                </label>
                <select
                  value={statusFilter}
                  onChange={e =>
                    setStatusFilter(
                      e.target.value as 'all' | 'active' | 'inactive'
                    )
                  }
                  className="px-3 py-1 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="all">Todos</option>
                  <option value="active">Activos</option>
                  <option value="inactive">Inactivos</option>
                </select>
              </div>

              {/* Permission Filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Permisos:
                </label>
                <select
                  value={permissionFilter}
                  onChange={e => {
                    setPermissionFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="all">Todos</option>
                  <option value="canEdit">Puede editar</option>
                  <option value="canViewStats">Ver estadísticas</option>
                  <option value="canDelete">Puede eliminar</option>
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
                  value={`${sortBy}-${sortOrder}`}
                  onChange={e => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field as typeof sortBy);
                    setSortOrder(order as typeof sortOrder);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="sharedAt-desc">Más recientes</option>
                  <option value="sharedAt-asc">Más antiguos</option>
                  <option value="title-asc">Título A-Z</option>
                  <option value="title-desc">Título Z-A</option>
                  <option value="clickCount-desc">Más clics</option>
                  <option value="clickCount-asc">Menos clics</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Links List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Cargando enlaces...</span>
        </div>
      ) : filteredAndSortedLinks.length === 0 ? (
        <Card className="p-12 text-center">
          <Share2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            {sharedLinks.length === 0
              ? 'No tienes enlaces compartidos'
              : 'No se encontraron enlaces'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {sharedLinks.length === 0
              ? 'Aún no tienes enlaces compartidos contigo'
              : 'No se encontraron enlaces con los filtros aplicados'}
          </p>
          {(searchTerm ||
            permissionFilter !== 'all' ||
            statusFilter !== 'all' ||
            dateFilter !== 'all') && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setPermissionFilter('all');
                setStatusFilter('all');
                setDateFilter('all');
                setCurrentPage(1);
              }}
            >
              Limpiar filtros
            </Button>
          )}
        </Card>
      ) : (
        <div
          className={
            viewMode === 'cards'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-3'
          }
        >
          {filteredAndSortedLinks.map(sharedLink => {
            const link = sharedLink.linkId;
            const permissionBadges = getPermissionBadges(
              sharedLink.permissions
            );

            return viewMode === 'cards' ? (
              // Card View
              <Card
                key={sharedLink._id}
                className="p-4 hover:shadow-md transition-all duration-200 hover:border-primary/20 flex flex-col h-full"
              >
                {/* Header with title and status */}
                <div className="mb-3">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-foreground text-sm line-clamp-2 flex-1 mr-2">
                      {link.title || 'Enlace sin título'}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                        link.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}
                    >
                      {link.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>

                {/* URLs */}
                <div className="space-y-2 mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      URL Original:
                    </p>
                    <a
                      href={link.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 break-all"
                    >
                      {link.originalUrl}
                    </a>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Enlace corto:
                    </p>
                    <button
                      onClick={() => handleLinkClick(sharedLink)}
                      className="text-xs text-primary hover:text-primary/80 font-mono break-all text-left"
                    >
                      {window.location.origin}/{link.slug}
                    </button>
                  </div>
                </div>

                {/* Description */}
                {link.description && (
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                    {link.description}
                  </p>
                )}

                {/* Shared by */}
                <div className="mb-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>Compartido por:</span>
                    <span className="font-medium text-foreground">
                      {sharedLink.sharedBy.name || sharedLink.sharedBy.email}
                    </span>
                  </div>
                </div>

                {/* Permissions */}
                <div className="mb-3">
                  <div className="flex flex-wrap gap-1">
                    {permissionBadges.map((badge, index) => {
                      const Icon = badge.icon;
                      return (
                        <span
                          key={index}
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                            badge.color
                          )}
                        >
                          <Icon className="h-2 w-2" />
                          {badge.label}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <BarChart3 className="h-3 w-3" />
                    <span>{link.clickCount} clics</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(sharedLink.sharedAt)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-1 mt-auto">
                  {sharedLink.permissions.canViewStats && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(`/dashboard/links/${link.slug}/analytics`)
                      }
                      className="flex items-center gap-1 text-xs px-2 py-1 h-7 flex-shrink-0"
                    >
                      <BarChart3 className="h-3 w-3" />
                      Stats
                    </Button>
                  )}
                  {sharedLink.permissions.canEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditLink(sharedLink)}
                      className="flex items-center gap-1 text-xs px-2 py-1 h-7 flex-shrink-0"
                    >
                      <Edit3 className="h-3 w-3" />
                      Editar
                    </Button>
                  )}
                  {sharedLink.permissions.canDelete && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteLink(sharedLink)}
                      className="flex items-center gap-1 text-xs px-2 py-1 h-7 flex-shrink-0 text-red-600 hover:text-red-700 hover:border-red-300 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash2 className="h-3 w-3" />
                      Eliminar
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevokeAccess(sharedLink)}
                    className="flex items-center gap-1 text-xs px-2 py-1 h-7 flex-shrink-0 text-orange-600 hover:text-orange-700 hover:border-orange-300 dark:text-orange-400 dark:hover:text-orange-300"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Revocar
                  </Button>
                </div>
              </Card>
            ) : (
              // List View
              <Card
                key={sharedLink._id}
                className="p-4 hover:shadow-sm transition-all duration-200 hover:border-primary/20"
              >
                <div className="flex items-center justify-between">
                  {/* Left side - Link info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      {/* Title and status */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-foreground text-sm truncate">
                            {link.title || 'Enlace sin título'}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              link.isActive
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}
                          >
                            {link.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <button
                            onClick={() => handleLinkClick(sharedLink)}
                            className="text-primary hover:text-primary/80 font-mono"
                          >
                            /{link.slug}
                          </button>
                          <span>→</span>
                          <a
                            href={link.originalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 truncate max-w-md"
                          >
                            {link.originalUrl}
                          </a>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <BarChart3 className="h-3 w-3" />
                          <span>{link.clickCount}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>
                            {sharedLink.sharedBy.name ||
                              sharedLink.sharedBy.email}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(sharedLink.sharedAt)}</span>
                        </div>
                      </div>

                      {/* Permissions */}
                      <div className="flex gap-1">
                        {permissionBadges.slice(0, 2).map((badge, index) => {
                          const Icon = badge.icon;
                          return (
                            <span
                              key={index}
                              className={cn(
                                'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                                badge.color
                              )}
                            >
                              <Icon className="h-2 w-2" />
                              {badge.label}
                            </span>
                          );
                        })}
                        {permissionBadges.length > 2 && (
                          <span className="text-xs text-muted-foreground px-2 py-1">
                            +{permissionBadges.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right side - Actions */}
                  <div className="flex flex-wrap gap-1 ml-4">
                    {sharedLink.permissions.canViewStats && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(`/dashboard/links/${link.slug}/analytics`)
                        }
                        className="flex items-center gap-1 text-xs px-2 py-1 h-7 flex-shrink-0"
                      >
                        <BarChart3 className="h-3 w-3" />
                        Stats
                      </Button>
                    )}
                    {sharedLink.permissions.canEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditLink(sharedLink)}
                        className="flex items-center gap-1 text-xs px-2 py-1 h-7 flex-shrink-0"
                      >
                        <Edit3 className="h-3 w-3" />
                        Editar
                      </Button>
                    )}
                    {sharedLink.permissions.canDelete && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteLink(sharedLink)}
                        className="flex items-center gap-1 text-xs px-2 py-1 h-7 flex-shrink-0 text-red-600 hover:text-red-700 hover:border-red-300 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="h-3 w-3" />
                        Eliminar
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevokeAccess(sharedLink)}
                      className="flex items-center gap-1 text-xs px-2 py-1 h-7 flex-shrink-0 text-orange-600 hover:text-orange-700 hover:border-orange-300 dark:text-orange-400 dark:hover:text-orange-300"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Revocar
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage(prev => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Link Editor Modal */}
      {editingLink && (
        <LinkEditor
          link={{
            id: editingLink.linkId._id,
            originalUrl: editingLink.linkId.originalUrl,
            slug: editingLink.linkId.slug,
            title: editingLink.linkId.title,
            description: editingLink.linkId.description,
            isActive: editingLink.linkId.isActive,
            isPublicStats: false, // Default value, will be fetched from API
            clickCount: editingLink.linkId.clickCount,
            createdAt: editingLink.linkId.createdAt,
            updatedAt: editingLink.linkId.createdAt, // Using createdAt as fallback
            userId: editingLink.linkId.userId
              ? typeof editingLink.linkId.userId === 'string'
                ? editingLink.linkId.userId
                : editingLink.linkId.userId._id
              : '',
            isTemporary: false, // Default value
            expiresAt: undefined, // Default value
            isFavorite: false, // Default value
          }}
          isOpen={!!editingLink}
          onClose={() => setEditingLink(null)}
          onLinkUpdated={handleLinkUpdated}
          onError={handleError}
        />
      )}

      {/* Modal de confirmación de eliminación */}
      <Modal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Confirmar eliminación"
        description={`¿Estás seguro de que quieres eliminar el enlace "${linkToDelete?.linkId.title || linkToDelete?.linkId.slug}"? Esta acción no se puede deshacer.`}
      >
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={confirmDelete}>
            Eliminar
          </Button>
        </div>
      </Modal>

      {/* Modal de confirmación de revocación de acceso */}
      <Modal
        isOpen={revokeConfirmOpen}
        onClose={() => setRevokeConfirmOpen(false)}
        title="Revocar acceso"
        description={`¿Estás seguro de que quieres revocar tu acceso al enlace "${linkToRevoke?.linkId.title || linkToRevoke?.linkId.slug}"? Ya no podrás acceder a este enlace compartido.`}
      >
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setRevokeConfirmOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={confirmRevokeAccess}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            Revocar acceso
          </Button>
        </div>
      </Modal>
    </div>
  );
}
