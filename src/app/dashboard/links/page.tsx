'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { DashboardLayout } from '../../../components/layout';
import { ToastContainer, ConfirmationModal } from '../../../components/ui';
import { LinkList, LinkEditor } from '../../../components/features';
import { useToast } from '../../../hooks/useToast';
import { Link, ApiResponse } from '../../../types';

export default function LinksPage() {
    const { data: session, status } = useSession();
    const { toasts, success, error } = useToast();

    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [editingLink, setEditingLink] = useState<Link | null>(null);
    const [deletingLink, setDeletingLink] = useState<Link | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Handle authentication state
    useEffect(() => {
        if (status === 'unauthenticated') {
            window.location.href =
                '/auth/signin?callbackUrl=' + encodeURIComponent(window.location.href);
        }
    }, [status]);

    // Event handlers
    const handleLinkCreated = (link: any) => {
        success(
            `Short link created successfully! ${link.shortUrl}`,
            'Link Created'
        );
        setRefreshTrigger(prev => prev + 1);
    };

    const handleError = (errorMessage: string) => {
        error(errorMessage, 'Error');
    };

    const handleEditLink = (link: Link) => {
        setEditingLink(link);
    };

    const handleLinkUpdated = (updatedLink: Link) => {
        success('Link updated successfully!', 'Link Updated');
        setRefreshTrigger(prev => prev + 1);
    };

    const handleDeleteLink = (link: Link) => {
        setDeletingLink(link);
    };

    const confirmDelete = async () => {
        if (!deletingLink) return;

        setDeleteLoading(true);

        try {
            const response = await fetch(`/api/links/${deletingLink.id}`, {
                method: 'DELETE',
            });

            const data: ApiResponse = await response.json();

            if (data.success) {
                success('Link deleted successfully!', 'Link Deleted');
                setRefreshTrigger(prev => prev + 1);
                setDeletingLink(null);
            } else {
                error(data.error?.message || 'Failed to delete link', 'Error');
            }
        } catch (err) {
            console.error('Error deleting link:', err);
            error('Failed to delete link', 'Error');
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
        <DashboardLayout>
            <ToastContainer toasts={toasts} />

            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">
                        Mis Enlaces
                    </h1>
                    <p className="text-muted-foreground">
                        Gestiona todos tus enlaces cortos en un solo lugar.{' '}
                        <span className="text-blue-500 font-semibold">
                            Crea, edita y analiza
                        </span>{' '}
                        el rendimiento de tus enlaces.
                    </p>
                </div>

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
                message={`¿Estás seguro que deseas eliminar "${deletingLink?.title || deletingLink?.slug}"? Esta acción no se puede deshacer y también eliminará todos los datos analíticos asociados.`}
                confirmText="Eliminar"
                cancelText="Cancelar"
                variant="danger"
                loading={deleteLoading}
            />
        </DashboardLayout>
    );
}