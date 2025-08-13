import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Contacto
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              ¿Tienes preguntas? Nos encantaría escucharte
            </p>
          </div>

          {/* Coming Soon Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 mb-12">
            <div className="mb-8">
              <div className="w-24 h-24 mx-auto mb-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Formulario de Contacto Próximamente
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                Estamos preparando un sistema de contacto completo para brindarte el mejor soporte.
              </p>
            </div>

            {/* Contact Methods */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="text-center p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Email</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                  Envíanos un correo y te responderemos pronto
                </p>
                <p className="text-blue-600 dark:text-blue-400 font-medium">
                  support@brllinks.com
                </p>
              </div>
              
              <div className="text-center p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="w-12 h-12 mx-auto mb-4 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Chat en Vivo</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                  Soporte instantáneo próximamente
                </p>
                <p className="text-gray-500 dark:text-gray-400 font-medium">
                  Próximamente disponible
                </p>
              </div>
            </div>

            {/* Temporary Contact Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Mientras tanto...</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Si tienes alguna pregunta urgente o necesitas soporte, puedes contactarnos temporalmente a través de nuestro email de soporte.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="default" size="lg">
                  Enviar Email
                </Button>
                <Link href="/help">
                  <Button variant="outline" size="lg">
                    Ver Centro de Ayuda
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