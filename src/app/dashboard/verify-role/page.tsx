'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface UserRoleData {
  role: 'user' | 'admin';
  email: string;
}

const VerifyRolePage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userRole, setUserRole] = useState<UserRoleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

      const fetchUserRole = async () => {
      try {
        // Primero intentar obtener el rol de la sesión
        const sessionRole = session?.user?.role;
        if (sessionRole) {
          setUserRole({
            role: sessionRole,
            email: session.user?.email || 'No disponible'
          });
          setLoading(false);
          return;
        }
        
        // Si no está en la sesión, obtenerlo del endpoint
        const response = await fetch('/api/user/role');
        if (response.ok) {
          const data = await response.json();
          setUserRole({
            role: data.role,
            email: session.user?.email || 'No disponible'
          });
        } else {
          setError('Error al obtener el rol del usuario');
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setError('Error de conexión');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [session, status, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando rol...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Verificación de Rol
              </h1>
              <p className="text-gray-600">
                Información sobre tu cuenta y permisos
              </p>
            </div>

            <div className="space-y-6">
              {/* Información de la sesión */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Información de la Sesión
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <p className="text-gray-900 bg-white p-2 rounded border">
                      {userRole?.email}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre
                    </label>
                    <p className="text-gray-900 bg-white p-2 rounded border">
                      {session?.user?.name || 'No disponible'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Información del rol */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Rol y Permisos
                </h2>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rol Actual
                    </label>
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        userRole?.role === 'admin' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {userRole?.role === 'admin' ? '👑 Administrador' : '👤 Usuario'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      {userRole?.role === 'admin' 
                        ? 'Tienes acceso completo al sistema' 
                        : 'Acceso estándar de usuario'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Permisos específicos */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Permisos Disponibles
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Crear y gestionar enlaces</span>
                    <span className="text-green-600">✓ Permitido</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Ver estadísticas personales</span>
                    <span className="text-green-600">✓ Permitido</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Acceso al panel de administración</span>
                    <span className={userRole?.role === 'admin' ? 'text-green-600' : 'text-red-600'}>
                      {userRole?.role === 'admin' ? '✓ Permitido' : '✗ Denegado'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Gestionar usuarios del sistema</span>
                    <span className={userRole?.role === 'admin' ? 'text-green-600' : 'text-red-600'}>
                      {userRole?.role === 'admin' ? '✓ Permitido' : '✗ Denegado'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  Volver al Dashboard
                </button>
                {userRole?.role === 'admin' && (
                  <button
                    onClick={() => router.push('/dashboard/admin')}
                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors font-medium"
                  >
                    Ir a Administración
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyRolePage;