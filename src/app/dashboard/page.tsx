'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { ToastContainer, ConfirmationModal } from '../../components/ui';
import { LinkCreator, LinkList, LinkEditor } from '../../components/features';
import { useToast } from '../../hooks/useToast';
import { Link, ApiResponse } from '../../types';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const { toasts, success, error } = useToast();

  // All useState hooks must be at the top, before any conditional returns
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [deletingLink, setDeletingLink] = useState<Link | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [stats, setStats] = useState({
    totalLinks: 0,
    totalClicks: 0,
    thisMonth: 0,
  });

  // Debug session in development
  useEffect(() => {}, [session, status]);

  // Handle authentication state
  useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.href =
        '/auth/signin?callbackUrl=' + encodeURIComponent(window.location.href);
    }
  }, [status]);

  // Fetch dashboard stats
  const fetchStats = async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch('/api/links');
      const data: ApiResponse<Link[]> = await response.json();

      if (data.success && data.data) {
        const links = data.data;
        console.log('Links data from API in dashboard:', links);
        console.log('First link:', links[0]);
        const totalLinks = links.length;
        const totalClicks = links.reduce(
          (sum, link) => sum + link.clickCount,
          0
        );

        // Calculate this month's clicks (simplified - would need analytics data for accurate count)
        const thisMonth = totalClicks; // Placeholder - would be calculated from analytics

        setStats({
          totalLinks,
          totalClicks,
          thisMonth,
        });
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [session?.user?.id, refreshTrigger]);

  // Event handlers
  const handleLinkCreated = (link: any) => {
    success(`Enlace creado correctamente! ${link.shortUrl}`, 'Enlace creado');
    setRefreshTrigger(prev => prev + 1);
  };

  const handleError = (errorMessage: string) => {
    error(errorMessage, 'Error');
  };

  const handleEditLink = (link: Link) => {
    setEditingLink(link);
  };

  const handleLinkUpdated = (updatedLink: Link) => {
    success('Enlace editado correctamente!', 'Enlace Editado');
    setRefreshTrigger(prev => prev + 1);
  };

  const handleDeleteLink = (link: Link) => {
    setDeletingLink(link);
  };

  const confirmDelete = async () => {
    if (!deletingLink) return;

    // Verificar que el slug existe
    if (!deletingLink.slug) {
      error('Error: El enlace no tiene un slug válido', 'Error');
      setDeletingLink(null);
      return;
    }

    setDeleteLoading(true);

    try {
      const response = await fetch(`/api/links/${deletingLink.slug}`, {
        method: 'DELETE',
      });

      const data: ApiResponse = await response.json();

      if (data.success) {
        success('El enlace se ha eliminado correctamente!', 'Enlace Eliminado');
        setRefreshTrigger(prev => prev + 1);
        setDeletingLink(null);
      } else {
        error(data.error?.message || 'Error al eliminar el enlace', 'Error');
      }
    } catch (err) {
      console.error('Error al eliminar el enlace:', err);
      error('Error al eliminar el enlace', 'Error');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Show loading state while checking authentication
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

  return (
    <>
      <ToastContainer toasts={toasts} />

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Panel de Control
          </h1>
          <p className="text-muted-foreground">
            Bienvenido a Broslunas Links.{' '}
            <span className="text-blue-500 font-semibold">
              Crea, gestiona y analiza
            </span>{' '}
            tus enlaces.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Quick stats cards */}
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-primary/10 rounded-lg">
                <svg
                  className="h-6 w-6 text-primary"
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
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Links Totales
                </p>
                <p className="text-2xl font-bold text-card-foreground">
                  {stats.totalLinks}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <svg
                  className="h-6 w-6 text-green-500"
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
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Clicks Totales
                </p>
                <p className="text-2xl font-bold text-card-foreground">
                  {stats.totalClicks}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <svg
                  className="h-6 w-6 text-blue-500"
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
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Este mes
                </p>
                <p className="text-2xl font-bold text-card-foreground">
                  {stats.thisMonth}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Link Creator */}
        <LinkCreator onLinkCreated={handleLinkCreated} onError={handleError} />

        {/* Links List */}
        <LinkList
          onEditLink={handleEditLink}
          onDeleteLink={handleDeleteLink}
          refreshTrigger={refreshTrigger}
        />
      </div>

      {/* Link Editor Modal */}
      <LinkEditor
        link={editingLink}
        isOpen={!!editingLink}
        onClose={() => setEditingLink(null)}
        onLinkUpdated={handleLinkUpdated}
        onError={handleError}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deletingLink}
        onClose={() => setDeletingLink(null)}
        onConfirm={confirmDelete}
        title="Eliminar Enlace"
        message={`Estás seguro que desea eliminar "${deletingLink?.title || deletingLink?.slug}"? Esta acción no se puede deshacer y también eliminará todos los datos analíticos asociados..`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        loading={deleteLoading}
      />
    </>
  );
}
