'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Users,
  Link,
  BarChart3,
  Settings,
  Shield,
  Activity,
  TrendingUp,
  Database,
  Globe,
} from 'lucide-react';
import UserManagement from '@/components/dashboard/UserManagement';
import LinkManagement from '@/components/dashboard/LinkManagement';
import ReportsAnalytics from '@/components/dashboard/ReportsAnalytics';
import DomainManagement from '@/components/admin/DomainManagement';

interface AdminStats {
  totalUsers: number;
  totalLinks: number;
  totalClicks: number;
  activeUsers: number;
}

interface RecentActivity {
  id: string;
  type: 'user_registered' | 'link_created' | 'link_clicked';
  description: string;
  timestamp: string;
  user?: string;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showDomainManagement, setShowDomainManagement] = useState(false);
  const [showLinkManagement, setShowLinkManagement] = useState(false);
  const [showReportsAnalytics, setShowReportsAnalytics] = useState(false);

  // Delete user confirmation states
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteUserData, setDeleteUserData] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin?callbackUrl=/dashboard/admin');
      return;
    }

    // Verificar rol del usuario
    const checkUserRole = async () => {
      try {
        // Primero intentar obtener el rol de la sesión
        if (session?.user?.role) {
          setUserRole(session.user.role);
          if (session.user.role !== 'admin') {
            router.push('/dashboard');
            return;
          }
        } else {
          // Fallback: obtener rol del API
          const response = await fetch('/api/user/role');
          if (response.ok) {
            const data = await response.json();
            setUserRole(data.role);
            if (data.role !== 'admin') {
              router.push('/dashboard');
              return;
            }
          } else {
            router.push('/dashboard');
            return;
          }
        }

        // Si llegamos aquí, el usuario es admin
        await loadAdminData();
      } catch (error) {
        console.error('Error checking user role:', error);
        router.push('/dashboard');
      }
    };

    checkUserRole();
  }, [session, status, router]);

  // Check for delete user parameters
  useEffect(() => {
    const deleteUserId = searchParams.get('deleteUser');
    const cancelDeletionUserId = searchParams.get('cancelDeletionUser');
    const token = searchParams.get('token');

    if (deleteUserId && token && userRole === 'admin') {
      handleDeleteUserConfirmation(deleteUserId, token);
    } else if (cancelDeletionUserId && token && userRole === 'admin') {
      handleCancelDeletion(cancelDeletionUserId, token);
    }
  }, [searchParams, userRole]);

  const loadAdminData = async () => {
    try {
      // Cargar estadísticas reales desde la API
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats({
            totalUsers: data.data.totalUsers,
            totalLinks: data.data.totalLinks,
            totalClicks: data.data.totalClicks,
            activeUsers: data.data.activeUsers,
          });
          setRecentActivity(data.data.recentActivity);
        } else {
          console.error('Error en la respuesta de la API:', data.error);
          // Fallback a datos de ejemplo en caso de error
          setStats({
            totalUsers: 0,
            totalLinks: 0,
            totalClicks: 0,
            activeUsers: 0,
          });
          setRecentActivity([]);
        }
      } else {
        console.error('Error al obtener estadísticas:', response.statusText);
        // Fallback a datos de ejemplo en caso de error
        setStats({
          totalUsers: 0,
          totalLinks: 0,
          totalClicks: 0,
          activeUsers: 0,
        });
        setRecentActivity([]);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
      // Fallback a datos de ejemplo en caso de error
      setStats({
        totalUsers: 0,
        totalLinks: 0,
        totalClicks: 0,
        activeUsers: 0,
      });
      setRecentActivity([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUserConfirmation = async (
    userId: string,
    token: string
  ) => {
    try {
      const response = await fetch(
        `/api/admin/users/delete?userId=${userId}&token=${token}`
      );
      const data = await response.json();

      if (data.success) {
        setDeleteUserData({
          userId,
          token,
          user: data.user,
          deleteRequest: data.deleteRequest,
        });
        setShowDeleteConfirmation(true);
      } else {
        alert('Enlace de eliminación no válido o expirado.');
        // Limpiar parámetros de la URL
        router.replace('/dashboard/admin');
      }
    } catch (error) {
      console.error('Error verificando eliminación:', error);
      alert('Error al verificar la solicitud de eliminación.');
      router.replace('/dashboard/admin');
    }
  };

  const handleConfirmDeletion = async () => {
    if (!deleteUserData) return;

    setIsDeleting(true);
    try {
      const response = await fetch('/api/admin/users/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: deleteUserData.userId,
          token: deleteUserData.token,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Solicitud confirmada.');
        setShowDeleteConfirmation(false);
        setDeleteUserData(null);
        router.replace('/dashboard/admin');
        // Recargar datos del admin
        await loadAdminData();
      } else {
        alert(data.error?.message || 'Error al eliminar usuario');
      }
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      alert('Error inesperado al eliminar usuario');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDeletion = async (userId: string, token: string) => {
    try {
      const response = await fetch('/api/admin/users/cancel-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          token,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Solicitud de eliminación cancelada correctamente.');
        router.replace('/dashboard/admin');
        // Recargar datos del admin
        await loadAdminData();
      } else {
        alert(
          data.error?.message || 'Error al cancelar la solicitud de eliminación'
        );
        router.replace('/dashboard/admin');
      }
    } catch (error) {
      console.error('Error cancelando eliminación:', error);
      alert('Error inesperado al cancelar la solicitud de eliminación.');
      router.replace('/dashboard/admin');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'user_registered':
        return <Users className="h-4 w-4 text-green-500" />;
      case 'link_created':
        return <Link className="h-4 w-4 text-blue-500" />;
      case 'link_clicked':
        return <TrendingUp className="h-4 w-4 text-purple-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  // Loading state
  if (status === 'loading' || loading || userRole !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {status === 'loading'
              ? 'Verificando autenticación...'
              : 'Cargando panel de administración...'}
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Shield className="h-8 w-8 text-red-500" />
              Panel de Administración
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Gestiona usuarios, enlaces y configuraciones del sistema
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 rounded-full text-sm font-medium">
            <Shield className="h-4 w-4" />
            Administrador
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Usuarios
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats?.totalUsers.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Enlaces
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats?.totalLinks.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
              <Link className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Clics
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats?.totalClicks.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
              <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Usuarios Activos
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats?.activeUsers.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
              <Activity className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Admin Tools */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Herramientas de Administración
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <button
              onClick={() => setShowUserManagement(true)}
              className="w-full flex items-center gap-3 p-4 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Gestión de Usuarios
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Ver, editar y gestionar cuentas de usuario
                </p>
              </div>
            </button>

            <button
              onClick={() => setShowDomainManagement(true)}
              className="w-full flex items-center gap-3 p-4 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Globe className="h-5 w-5 text-indigo-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Gestión de Dominios
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Ver, bloquear y gestionar dominios personalizados
                </p>
              </div>
            </button>

            <button
              onClick={() => setShowLinkManagement(true)}
              className="w-full flex items-center gap-3 p-4 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Link className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Gestión de Enlaces
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Supervisar y moderar enlaces del sistema
                </p>
              </div>
            </button>

            <button
              onClick={() => setShowReportsAnalytics(true)}
              className="w-full flex items-center gap-3 p-4 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <BarChart3 className="h-5 w-5 text-purple-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Reportes y Analíticas
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Generar reportes detallados del sistema
                </p>
              </div>
            </button>

            <button className="w-full flex items-center gap-3 p-4 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <Database className="h-5 w-5 text-red-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Configuración del Sistema
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Ajustar configuraciones globales
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Actividad Reciente
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivity.map(activity => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                >
                  {getActivityIcon(activity.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatDate(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">
              Ver toda la actividad →
            </button>
          </div>
        </div>
      </div>

      {/* User Management Modal */}
      {showUserManagement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-7xl max-h-[90vh] overflow-auto">
            <UserManagement onClose={() => setShowUserManagement(false)} />
          </div>
        </div>
      )}

      {/* Domain Management Modal */}
      {showDomainManagement && (
        <DomainManagement onClose={() => setShowDomainManagement(false)} />
      )}

      {/* Link Management Modal */}
      {showLinkManagement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-7xl max-h-[90vh] overflow-auto">
            <LinkManagement onClose={() => setShowLinkManagement(false)} />
          </div>
        </div>
      )}

      {/* Reports Analytics Modal */}
      {showReportsAnalytics && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-7xl max-h-[90vh] overflow-auto">
            <ReportsAnalytics onClose={() => setShowReportsAnalytics(false)} />
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {showDeleteConfirmation && deleteUserData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
              ⚠️ Confirmación de Eliminación
            </h3>

            <div className="mb-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                Estás a punto de eliminar permanentemente al usuario:
              </p>
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg mb-3">
                <p className="font-medium text-gray-900 dark:text-white">
                  {deleteUserData.user.email}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {deleteUserData.user.name}
                </p>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Razón:</strong> {deleteUserData.deleteRequest.reason}
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                  Solicitado el:{' '}
                  {formatDate(deleteUserData.deleteRequest.createdAt)}
                </p>
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-800 dark:text-red-200">
                <strong>¡ATENCIÓN!</strong> Esta acción eliminará
                permanentemente:
              </p>
              <ul className="text-xs text-red-700 dark:text-red-300 mt-1 ml-4 list-disc">
                <li>Todos los enlaces del usuario</li>
                <li>Todas las notas administrativas</li>
                <li>Todas las advertencias</li>
                <li>Sesiones y cuentas vinculadas</li>
                <li>La cuenta del usuario</li>
              </ul>
              <p className="text-xs text-red-700 dark:text-red-300 mt-2 font-medium">
                Esta acción NO se puede deshacer.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirmation(false);
                  setDeleteUserData(null);
                  router.replace('/dashboard/admin');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDeletion}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Eliminando...' : 'Confirmar Eliminación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
