import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Estado del Sistema',
  description: 'Monitoreo en tiempo real del estado de los servicios de Broslunas Links. Verifica el uptime, rendimiento y disponibilidad de nuestros sistemas.',
  keywords: ['estado', 'sistema', 'uptime', 'monitoreo', 'disponibilidad', 'rendimiento', 'servicios'],
  openGraph: {
    title: 'Estado del Sistema - Broslunas Links',
    description: 'Monitoreo en tiempo real del estado de nuestros servicios. Verifica la disponibilidad y rendimiento.',
  },
  twitter: {
    title: 'Estado del Sistema - Broslunas Links',
    description: 'Monitoreo en tiempo real del estado de nuestros servicios. Verifica la disponibilidad y rendimiento.',
  },
};

export default function StatusPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Estado del Sistema
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Monitoreo en tiempo real del estado de nuestros servicios
            </p>
          </div>

          {/* Current Status */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="w-4 h-4 bg-green-500 rounded-full mr-3 animate-pulse"></div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Todos los Sistemas Operativos
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Todos nuestros servicios están funcionando correctamente
            </p>

            {/* Services Status */}
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="font-medium text-gray-900 dark:text-white">API Principal</span>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-green-600 dark:text-green-400">Operativo</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="font-medium text-gray-900 dark:text-white">Base de Datos</span>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-green-600 dark:text-green-400">Operativo</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="font-medium text-gray-900 dark:text-white">Redirección de Enlaces</span>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-green-600 dark:text-green-400">Operativo</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="font-medium text-gray-900 dark:text-white">Análisis y Estadísticas</span>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-green-600 dark:text-green-400">Operativo</span>
                </div>
              </div>
            </div>
          </div>

          {/* Coming Soon Features */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 mb-12">
            <div className="mb-8">
              <div className="w-24 h-24 mx-auto mb-6 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Monitoreo Avanzado Próximamente
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                Estamos desarrollando un sistema de monitoreo más detallado que incluirá:
              </p>
            </div>

            {/* Future Features */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Métricas Detalladas</h3>
                <ul className="text-gray-600 dark:text-gray-300 space-y-1 text-sm">
                  <li>• Tiempo de respuesta en tiempo real</li>
                  <li>• Historial de incidentes</li>
                  <li>• Métricas de rendimiento</li>
                  <li>• Alertas automáticas</li>
                </ul>
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Notificaciones</h3>
                <ul className="text-gray-600 dark:text-gray-300 space-y-1 text-sm">
                  <li>• Suscripciones por email</li>
                  <li>• Webhooks para integraciones</li>
                  <li>• Feed RSS de estado</li>
                  <li>• Notificaciones push</li>
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                ¿Quieres recibir notificaciones sobre el estado del sistema?
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="default" size="lg">
                  Suscribirse a Actualizaciones
                </Button>
                <Link href="https://broslunas.com/contacto">
                  <Button variant="outline" size="lg">
                    Reportar Problema
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Back to Home */}
          <Link href="/">
            <Button variant="outline">
              ← Volver al Inicio
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}