import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import {
  FAQList,
  GuideList,
  getFAQByCategory,
  getGuidesByCategory,
  helpCategories,
} from '@/components/help-center';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Solución de Problemas - Centro de Ayuda | Broslunas Links',
  description:
    'Encuentra soluciones a problemas comunes y obtén ayuda técnica para Broslunas Links.',
  keywords:
    'problemas, errores, soluciones, ayuda técnica, soporte, Broslunas Links',
};

export default function TroubleshootingPage() {
  const category = helpCategories.find(cat => cat.id === 'troubleshooting');
  const faqs = getFAQByCategory('troubleshooting');
  const guides = getGuidesByCategory('troubleshooting');

  if (!category) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Categoría no encontrada
            </h1>
            <Link href="/help">
              <Button variant="outline">← Volver al Centro de Ayuda</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-12">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
            <Link
              href="/help"
              className="hover:text-gray-700 dark:hover:text-gray-200"
            >
              Centro de Ayuda
            </Link>
            <span>/</span>
            <span className="text-gray-900 dark:text-white">
              {category.title}
            </span>
          </nav>

          {/* Category Header */}
          <div className="text-center">
            <div
              className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center"
              style={{ backgroundColor: category.color + '20' }}
            >
              <span className="text-2xl">{category.icon}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              {category.title}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {category.description}
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Quick Diagnostics */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              🔍 Diagnóstico Rápido
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <span className="text-red-500 mr-2">🚨</span>
                  Problemas Comunes
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <h4 className="font-medium text-red-800 dark:text-red-200 mb-1">
                      El enlace no funciona
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Verifica que la URL original sea válida y esté accesible
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                      Estadísticas no actualizan
                    </h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      Las estadísticas pueden tardar hasta 5 minutos en
                      actualizarse
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                      No puedo crear enlaces
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Revisa si has alcanzado el límite de tu plan actual
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <span className="text-green-500 mr-2">✅</span>
                  Verificaciones Básicas
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer">
                    <input type="checkbox" className="mr-3 rounded" />
                    <span className="text-gray-700 dark:text-gray-300">
                      ¿Tienes conexión a internet estable?
                    </span>
                  </label>
                  <label className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer">
                    <input type="checkbox" className="mr-3 rounded" />
                    <span className="text-gray-700 dark:text-gray-300">
                      ¿Has intentado refrescar la página?
                    </span>
                  </label>
                  <label className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer">
                    <input type="checkbox" className="mr-3 rounded" />
                    <span className="text-gray-700 dark:text-gray-300">
                      ¿Estás usando un navegador actualizado?
                    </span>
                  </label>
                  <label className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer">
                    <input type="checkbox" className="mr-3 rounded" />
                    <span className="text-gray-700 dark:text-gray-300">
                      ¿Has limpiado la caché del navegador?
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Error Codes */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              📋 Códigos de Error
            </h2>
            <div className="space-y-4">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <code className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded text-sm font-mono">
                    ERROR_404
                  </code>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Enlace no encontrado
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                  El enlace corto que intentas acceder no existe o ha sido
                  eliminado.
                </p>
                <p className="text-blue-600 dark:text-blue-400 text-sm">
                  <strong>Solución:</strong> Verifica que la URL sea correcta o
                  contacta al creador del enlace.
                </p>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <code className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded text-sm font-mono">
                    ERROR_429
                  </code>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Demasiadas peticiones
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                  Has excedido el límite de peticiones permitidas por minuto.
                </p>
                <p className="text-blue-600 dark:text-blue-400 text-sm">
                  <strong>Solución:</strong> Espera unos minutos antes de
                  intentar nuevamente.
                </p>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <code className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded text-sm font-mono">
                    ERROR_401
                  </code>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    No autorizado
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                  Tu sesión ha expirado o no tienes permisos para realizar esta
                  acción.
                </p>
                <p className="text-blue-600 dark:text-blue-400 text-sm">
                  <strong>Solución:</strong> Inicia sesión nuevamente o verifica
                  tus permisos.
                </p>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <code className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-2 py-1 rounded text-sm font-mono">
                    ERROR_500
                  </code>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Error del servidor
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                  Error interno del servidor. Nuestro equipo ha sido notificado
                  automáticamente.
                </p>
                <p className="text-blue-600 dark:text-blue-400 text-sm">
                  <strong>Solución:</strong> Intenta nuevamente en unos minutos.
                  Si persiste, contacta soporte.
                </p>
              </div>
            </div>
          </div>

          {/* Browser Issues */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              🌐 Problemas del Navegador
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Navegadores Compatibles
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <svg
                      className="w-5 h-5 text-green-500 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-green-800 dark:text-green-200">
                      Chrome 90+
                    </span>
                  </div>
                  <div className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <svg
                      className="w-5 h-5 text-green-500 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-green-800 dark:text-green-200">
                      Firefox 88+
                    </span>
                  </div>
                  <div className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <svg
                      className="w-5 h-5 text-green-500 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-green-800 dark:text-green-200">
                      Safari 14+
                    </span>
                  </div>
                  <div className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <svg
                      className="w-5 h-5 text-green-500 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-green-800 dark:text-green-200">
                      Edge 90+
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Soluciones Comunes
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Limpiar Caché y Cookies
                    </h4>
                    <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                      <p>
                        <strong>Chrome:</strong> Ctrl+Shift+Delete
                      </p>
                      <p>
                        <strong>Firefox:</strong> Ctrl+Shift+Delete
                      </p>
                      <p>
                        <strong>Safari:</strong> Cmd+Option+E
                      </p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Modo Incógnito/Privado
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Prueba acceder en modo incógnito para descartar problemas
                      de extensiones o caché.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Deshabilitar Extensiones
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Algunas extensiones pueden interferir con el
                      funcionamiento de Broslunas Links.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Issues */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              ⚡ Problemas de Rendimiento
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="w-12 h-12 mx-auto mb-3 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-red-600 dark:text-red-400"
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
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Carga Lenta
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Verifica tu conexión a internet y prueba desde otra red
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="w-12 h-12 mx-auto mb-3 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-yellow-600 dark:text-yellow-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Timeouts
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Reduce el número de peticiones simultáneas o usa paginación
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
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
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Sincronización
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Los datos pueden tardar hasta 5 minutos en sincronizarse
                </p>
              </div>
            </div>
          </div>

          {/* Contact Support */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-xl p-8 mb-12 text-white">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-white/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-4">¿Aún necesitas ayuda?</h2>
              <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                Si no has encontrado la solución a tu problema, nuestro equipo
                de soporte está aquí para ayudarte.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contacto">
                  <Button className="bg-white text-blue-600 hover:bg-gray-100">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    Contactar Soporte
                  </Button>
                </Link>
                <Link href="/help">
                  <Button
                    variant="outline"
                    className="border-white text-white hover:bg-white/10"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Ver Más Ayuda
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              📊 Estado del Sistema
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-4 border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                <h3 className="font-semibold text-green-800 dark:text-green-200 mb-1">
                  API
                </h3>
                <p className="text-sm text-green-600 dark:text-green-300">
                  Operativo
                </p>
              </div>
              <div className="text-center p-4 border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                <h3 className="font-semibold text-green-800 dark:text-green-200 mb-1">
                  Dashboard
                </h3>
                <p className="text-sm text-green-600 dark:text-green-300">
                  Operativo
                </p>
              </div>
              <div className="text-center p-4 border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                <h3 className="font-semibold text-green-800 dark:text-green-200 mb-1">
                  Redirecciones
                </h3>
                <p className="text-sm text-green-600 dark:text-green-300">
                  Operativo
                </p>
              </div>
            </div>
            <div className="mt-6 text-center">
              <Link
                href="https://status.brl.link"
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
              >
                Ver página de estado completa →
              </Link>
            </div>
          </div>

          {/* Guides Section */}
          {guides.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                📚 Guías Paso a Paso
              </h2>
              <GuideList guides={guides} />
            </div>
          )}

          {/* FAQ Section */}
          {faqs.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                ❓ Preguntas Frecuentes
              </h2>
              <FAQList faqs={faqs} showCategory={false} />
            </div>
          )}

          {/* No Content */}
          {faqs.length === 0 && guides.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Contenido en desarrollo
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Estamos trabajando en más contenido para esta categoría.
              </p>
            </div>
          )}

          {/* Back Navigation */}
          <div className="text-center">
            <Link href="/help">
              <Button variant="outline">← Volver al Centro de Ayuda</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
