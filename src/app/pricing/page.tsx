import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Precios
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Planes flexibles para todas tus necesidades de acortamiento de enlaces
            </p>
          </div>

          {/* Coming Soon Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 mb-12">
            <div className="mb-8">
              <div className="w-24 h-24 mx-auto mb-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Planes de Precios Próximamente
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                Estamos diseñando planes de precios competitivos y flexibles para satisfacer todas tus necesidades.
              </p>
            </div>

            {/* Preview Features */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Plan Gratuito</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Perfecto para uso personal</p>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Plan Pro</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Para profesionales y pequeñas empresas</p>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Plan Enterprise</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Soluciones empresariales completas</p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                Por ahora, disfruta de todas nuestras funcionalidades de forma gratuita.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/signin">
                  <Button variant="default" size="lg">
                    Comenzar Gratis
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