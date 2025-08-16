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
  title: 'Gestión de Enlaces - Centro de Ayuda | Broslunas Links',
  description:
    'Aprende a crear, editar, organizar y gestionar tus enlaces cortos de manera eficiente.',
  keywords:
    'gestión enlaces, crear enlaces, editar enlaces, organizar, Broslunas Links',
};

export default function LinkManagementPage() {
  const category = helpCategories.find(cat => cat.id === 'link-management');
  const faqs = getFAQByCategory('link-management');
  const guides = getGuidesByCategory('link-management');

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
          {/* Features Overview */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              🔗 Funciones de Gestión
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
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
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Crear Enlaces
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Convierte URLs largas en enlaces cortos personalizados
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="w-12 h-12 mx-auto mb-4 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
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
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Editar Enlaces
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Modifica destinos, nombres y configuraciones
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="w-12 h-12 mx-auto mb-4 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
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
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Organizar
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Usa etiquetas y carpetas para mantener orden
                </p>
              </div>
            </div>
          </div>

          {/* Best Practices */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              💡 Mejores Prácticas
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <span className="text-green-500 mr-2">✅</span>
                  Recomendaciones
                </h3>
                <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-3 mt-1">•</span>
                    <span>Usa nombres descriptivos y memorables</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-3 mt-1">•</span>
                    <span>Verifica que el enlace destino funcione</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-3 mt-1">•</span>
                    <span>Organiza con etiquetas desde el inicio</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-3 mt-1">•</span>
                    <span>Revisa y actualiza enlaces periódicamente</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <span className="text-red-500 mr-2">❌</span>
                  Evita Estos Errores
                </h3>
                <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                  <li className="flex items-start">
                    <span className="text-red-500 mr-3 mt-1">•</span>
                    <span>Nombres genéricos como 'link1', 'test'</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 mr-3 mt-1">•</span>
                    <span>Enlaces que redirigen a páginas rotas</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 mr-3 mt-1">•</span>
                    <span>Acumular enlaces sin organización</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 mr-3 mt-1">•</span>
                    <span>No hacer copias de seguridad importantes</span>
                  </li>
                </ul>
              </div>
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
