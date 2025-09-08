'use client';

import React, { useState, useEffect } from 'react';
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
  const [sortBy, setSortBy] = useState<'sharedAt' | 'title' | 'clickCount'>(
    'sharedAt'
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [permissionFilter, setPermissionFilter] = useState<string>('all');
  const [editingLink, setEditingLink] = useState<SharedLink | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/dashboard/shared');
    }
  }, [status, router]);

  // Load shared links
  useEffect(() => {
    if (session?.user?.id) {
      loadSharedLinks();
    }
  }, [session, currentPage, searchTerm, sortBy, sortOrder, permissionFilter]);

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
    if (link.permissions.canViewStats) {
      router.push(`/stats/${link.linkId.slug}`);
    } else {
      window.open(link.linkId.originalUrl, '_blank');
    }
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

  const handleError = (error: string) => {
    toast.error(error || 'Error al actualizar el enlace');
  };

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

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
          <Input
            type="text"
            placeholder="Buscar enlaces..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        <div className="flex gap-2 items-center">
          <select
            value={permissionFilter}
            onChange={e => {
              setPermissionFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-input rounded-md bg-background text-sm"
          >
            <option value="all">Todos los permisos</option>
            <option value="canView">Solo ver</option>
            <option value="canEdit">Puede editar</option>
            <option value="canViewStats">Puede ver stats</option>
            <option value="canDelete">Puede eliminar</option>
          </select>

          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={e => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field as typeof sortBy);
              setSortOrder(order as typeof sortOrder);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-input rounded-md bg-background text-sm"
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

      {/* Links List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Cargando enlaces...</span>
        </div>
      ) : sharedLinks.length === 0 ? (
        <Card className="p-12 text-center">
          <Share2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No tienes enlaces compartidos
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || permissionFilter !== 'all'
              ? 'No se encontraron enlaces con los filtros aplicados'
              : 'Aún no tienes enlaces compartidos contigo'}
          </p>
          {(searchTerm || permissionFilter !== 'all') && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setPermissionFilter('all');
                setCurrentPage(1);
              }}
            >
              Limpiar filtros
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {sharedLinks.map(sharedLink => {
            const link = sharedLink.linkId;
            const permissionBadges = getPermissionBadges(
              sharedLink.permissions
            );

            return (
              <Card
                key={sharedLink._id}
                className="p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Link Title and URL */}
                    <div className="mb-3">
                      <h3 className="text-lg font-medium text-foreground mb-1 truncate">
                        {link.title || `Enlace /${link.slug}`}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-mono bg-muted px-2 py-1 rounded">
                          /{link.slug}
                        </span>
                        <span>→</span>
                        <span className="truncate max-w-md">
                          {link.originalUrl}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            window.open(link.originalUrl, '_blank')
                          }
                          className="h-6 w-6"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Description */}
                    {link.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {link.description}
                      </p>
                    )}

                    {/* Shared by and permissions */}
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>Compartido por:</span>
                        <span className="font-medium text-foreground">
                          {sharedLink.sharedBy.name ||
                            sharedLink.sharedBy.email}
                        </span>
                      </div>
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
                              <Icon className="h-3 w-3" />
                              {badge.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Stats and dates */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <BarChart3 className="h-4 w-4" />
                        <span>{link.clickCount} clics</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Compartido: {formatDate(sharedLink.sharedAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Creado: {formatDate(link.createdAt)}</span>
                      </div>
                      {!link.isActive && (
                        <div className="flex items-center gap-1 text-orange-600">
                          <AlertCircle className="h-4 w-4" />
                          <span>Inactivo</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 ml-4">
                    {sharedLink.permissions.canViewStats && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(`/dashboard/links/${link.slug}/analytics`)
                        }
                        className="flex items-center gap-2"
                      >
                        <BarChart3 className="h-4 w-4" />
                        Ver Stats
                      </Button>
                    )}
                    {sharedLink.permissions.canEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditLink(sharedLink)}
                        className="flex items-center gap-2"
                      >
                        <Edit3 className="h-4 w-4" />
                        Editar
                      </Button>
                    )}
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
    </div>
  );
}
