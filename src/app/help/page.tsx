import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Centro de Ayuda
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Encuentra respuestas a tus preguntas y aprende a usar BRL Links
            </p>
          </div>

          {/* Coming Soon Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 mb-12">
            <div className="mb-8">
              <div className="w-24 h-24 mx-auto mb-6 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Centro de Ayuda en Construcción
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                Estamos creando una base de conocimientos completa con guías, tutoriales y preguntas frecuentes.
              </p>
            </div>

            {/* Quick Help */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="text-left p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">¿Necesitas ayuda ahora?</h3>
                <ul className="text-gray-600 dark:text-gray-300 space-y-1 text-sm">
                  <li>• Crea una cuenta para comenzar</li>
                  <li>• Pega tu enlace largo en el dashboard</li>
                  <li>• Personaliza tu enlace corto</li>
                  <li>• Comparte y monitorea estadísticas</li>
                </ul>
              </div>
              <div className="text-left p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Próximamente disponible</h3>
                <ul className="text-gray-600 dark:text-gray-300 space-y-1 text-sm">
                  <li>• Guías paso a paso</li>
                  <li>• Videos tutoriales</li>
                  <li>• Preguntas frecuentes</li>
                  <li>• Soporte en vivo</li>
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                ¿Tienes una pregunta específica? No dudes en contactarnos.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contact">
                  <Button variant="default" size="lg">
                    Contactar Soporte
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" size="lg">
                    Ir al Dashboard
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