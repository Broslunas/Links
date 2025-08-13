import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Características y Funcionalidades',
  description: 'Descubre todas las características avanzadas de Broslunas Links: acortador de URLs, análisis detallados, dominios personalizados, códigos QR y más.',
  keywords: ['características', 'funcionalidades', 'acortador urls', 'análisis', 'dominios personalizados', 'códigos qr'],
  openGraph: {
    title: 'Características - Broslunas Links',
    description: 'Descubre todas las características avanzadas de nuestro acortador de URLs con análisis detallados y funcionalidades premium.',
  },
  twitter: {
    title: 'Características - Broslunas Links',
    description: 'Descubre todas las características avanzadas de nuestro acortador de URLs con análisis detallados y funcionalidades premium.',
  },
};

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Características
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Descubre todas las funcionalidades que BRL Links tiene para ofrecer
            </p>
          </div>

          {/* Coming Soon Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 mb-12">
            <div className="mb-8">
              <div className="w-24 h-24 mx-auto mb-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Página en Desarrollo
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                Estamos preparando una página detallada con todas nuestras características y funcionalidades.
              </p>
            </div>

            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                Mientras tanto, puedes explorar nuestras funcionalidades principales en el dashboard.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/dashboard">
                  <Button variant="default" size="lg">
                    Ir al Dashboard
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" size="lg">
                    Volver al Inicio
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}