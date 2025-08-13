import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Documentación de API
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Accede a nuestra potente API para integrar BRL Links en tus
              aplicaciones
            </p>
          </div>

          {/* Coming Soon Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 mb-12">
            <div className="mb-8">
              <div className="w-24 h-24 mx-auto mb-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-blue-600 dark:text-blue-400"
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
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Próximamente Disponible
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                Estamos trabajando en una documentación completa de nuestra API
                REST que incluirá:
              </p>
            </div>

            {/* Features List */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Endpoints Disponibles
                </h3>
                <ul className="text-gray-600 dark:text-gray-300 space-y-1">
                  <li>• Crear y gestionar enlaces</li>
                  <li>• Obtener estadísticas detalladas</li>
                  <li>• Gestión de usuarios</li>
                  <li>• Análisis en tiempo real</li>
                </ul>
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Recursos Incluidos
                </h3>
                <ul className="text-gray-600 dark:text-gray-300 space-y-1">
                  <li>• Ejemplos de código</li>
                  <li>• Guías de integración</li>
                  <li>• Referencia completa</li>
                  <li>• SDKs para múltiples lenguajes</li>
                </ul>
              </div>
            </div>

            {/* CTA */}
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                ¿Necesitas acceso anticipado a la API?
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="default" size="lg">
                  Solicitar Acceso Beta
                </Button>
                <Link href="https://broslunas.com/contacto">
                  <Button variant="outline" size="lg">
                    Contactar Soporte
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Back to Home */}
          <Link href="/">
            <Button variant="outline">← Volver al Inicio</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
