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
  title: 'Primeros Pasos - Centro de Ayuda | Broslunas Links',
  description:
    'Aprende los conceptos básicos para comenzar a usar Broslunas Links y crear tus primeros enlaces cortos.',
  keywords: 'primeros pasos, tutorial, guía básica, comenzar, Broslunas Links',
};

export default function GettingStartedPage() {
  const category = helpCategories.find(cat => cat.id === 'getting-started');
  const faqs = getFAQByCategory('getting-started');
  const guides = getGuidesByCategory('getting-started');

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
          {/* Quick Start Guide */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              🚀 Guía de Inicio Rápido
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Pasos Básicos
                </h3>
                <ol className="space-y-3 text-gray-600 dark:text-gray-300">
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                      1
                    </span>
                    <span>Crea tu cuenta gratuita en Broslunas Links</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                      2
                    </span>
                    <span>Accede al dashboard y pega tu enlace largo</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                      3
                    </span>
                    <span>Personaliza tu enlace corto (opcional)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                      4
                    </span>
                    <span>
                      ¡Comparte tu enlace y monitorea las estadísticas!
                    </span>
                  </li>
                </ol>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Consejos Útiles
                </h3>
                <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-3 mt-1">✓</span>
                    <span>Usa nombres descriptivos para tus enlaces</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-3 mt-1">✓</span>
                    <span>Revisa las estadísticas regularmente</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-3 mt-1">✓</span>
                    <span>Organiza tus enlaces con etiquetas</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-3 mt-1">✓</span>
                    <span>Prueba tus enlaces antes de compartir</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-8 text-center">
              <Link href="/dashboard">
                <Button size="lg">Comenzar Ahora</Button>
              </Link>
            </div>
          </div>

          {/* Guides Section */}
          {guides.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                📚 Guías Paso a Paso
              </h2>
              <div className="grid gap-6 md:grid-cols-2">
                {guides.map(guide => (
                  <Link key={guide.id} href={`/help/guide/${guide.slug}`}>
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow cursor-pointer">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {guide.title}
                        </h3>
                        <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded-full">
                          {guide.difficulty}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                        {guide.description}
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>⏱️ {guide.estimatedTime}</span>
                        <span className="text-blue-600 dark:text-blue-400 hover:underline">
                          Ver guía →
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
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
