import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '../lib/auth';
import { Button } from '@/components/ui/Button';
import { TempLinkCreator } from '@/components/TempLinkCreator';
import { GlobalStats } from './api/stats/global/route';
import { ApiResponse } from '@/types';

// Function to fetch global stats
async function getGlobalStats(): Promise<GlobalStats> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/stats/global`, {
      cache: 'no-store', // Always fetch fresh data
    });

    if (!response.ok) {
      throw new Error('Failed to fetch stats');
    }

    const data: ApiResponse<GlobalStats> = await response.json();

    if (data.success && data.data) {
      return data.data;
    }

    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Error fetching global stats:', error);
    // Return fallback stats if API fails
    return {
      totalLinks: 0,
      totalClicks: 0,
      activeUsers: 0,
      uptime: '99.9%',
    };
  }
}

export default async function Home() {
  const session = await getServerSession(authOptions);
  const globalStats = await getGlobalStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 dark:from-blue-400/5 dark:to-purple-400/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
              Broslunas Links
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              El acortador de URLs más avanzado con análisis en tiempo real, QR
              codes y gestión profesional de enlaces
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {session ? (
                <Link href="/dashboard">
                  <Button size="lg" className="text-lg px-8 py-4">
                    Ir al Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth/signin">
                    <Button size="lg" className="text-lg px-8 py-4">
                      Comenzar Gratis
                    </Button>
                  </Link>
                  <Link
                    href="/docs"
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                  >
                    Ver Documentación API →
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Características Principales
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Todo lo que necesitas para gestionar tus enlaces de forma
              profesional
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-6">
                <svg
                  className="w-6 h-6 text-blue-600 dark:text-blue-400"
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
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Acortamiento Inteligente
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                URLs personalizables con dominios propios y aliases únicos para
                una mejor marca personal
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-6">
                <svg
                  className="w-6 h-6 text-green-600 dark:text-green-400"
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
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Análisis Avanzado
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Estadísticas detalladas con geolocalización, dispositivos,
                referrers y análisis temporal
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-6">
                <svg
                  className="w-6 h-6 text-purple-600 dark:text-purple-400"
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
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Códigos QR Dinámicos
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Genera códigos QR personalizables que se actualizan
                automáticamente con tus enlaces
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Estadísticas de la Plataforma
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Números que demuestran la confianza de nuestros usuarios
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {globalStats.totalLinks > 0
                  ? `${globalStats.totalLinks.toLocaleString()}+`
                  : '0'}
              </div>
              <div className="text-gray-600 dark:text-gray-300">
                Enlaces Creados
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                {globalStats.totalClicks > 0
                  ? `${globalStats.totalClicks.toLocaleString()}+`
                  : '0'}
              </div>
              <div className="text-gray-600 dark:text-gray-300">
                Clics Registrados
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                {globalStats.activeUsers > 0
                  ? `${globalStats.activeUsers.toLocaleString()}+`
                  : '0'}
              </div>
              <div className="text-gray-600 dark:text-gray-300">
                Usuarios Activos
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                {globalStats.uptime}
              </div>
              <div className="text-gray-600 dark:text-gray-300">
                Tiempo Activo
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Try It Now Section */}
      {!session && (
        <section className="py-20 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Pruébalo Ahora
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Crea tu primer enlace temporal sin necesidad de registro
              </p>
            </div>

            <div className="max-w-md mx-auto">
              <TempLinkCreator />
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
            ¿Listo para optimizar tus enlaces?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Únete a miles de usuarios que ya confían en Broslunas Links para
            gestionar sus URLs de forma profesional
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {!session && (
              <>
                <Link href="/auth/signin">
                  <Button size="lg" className="text-lg px-8 py-4">
                    Crear Cuenta Gratis
                  </Button>
                </Link>
                <Link
                  href="/docs"
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                >
                  Explorar API →
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
