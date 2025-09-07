import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Términos de Servicio',
  description:
    'Términos y condiciones de uso de Broslunas Links. Conoce las normas, derechos y responsabilidades al usar nuestro acortador de URLs.',
  keywords: [
    'términos de servicio',
    'condiciones de uso',
    'normas',
    'legal',
    'acortador urls',
    'responsabilidades',
  ],
  openGraph: {
    title: 'Términos de Servicio - Broslunas Links',
    description:
      'Términos y condiciones de uso del servicio. Información legal sobre derechos y responsabilidades.',
  },
  twitter: {
    title: 'Términos de Servicio - Broslunas Links',
    description:
      'Términos y condiciones de uso del servicio. Información legal sobre derechos y responsabilidades.',
  },
  robots: {
    index: true,
    follow: false,
  },
};

const TermsAndServices: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
    {/* Hero Section */}
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 py-24">
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative z-10 max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
          Términos de
          <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
            Servicio
          </span>
        </h1>
        <p className="text-xl text-white/90 max-w-2xl mx-auto">
          Conoce las normas, derechos y responsabilidades al usar nuestro
          acortador de URLs
        </p>
      </div>
    </div>

    {/* Content Section */}
    <main className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 md:p-12">
        <div className="space-y-12">
          <section className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              1. Descripción del Servicio
            </h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              Broslunas Link (
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-purple-600 font-semibold underline underline-offset-2 transition-colors duration-300"
              >
                broslunas.link
              </a>
              ) es un acortador de enlaces con analíticas avanzadas y amplias
              configuraciones. El uso del servicio implica la aceptación de
              estos términos.
            </p>
          </section>

          <section className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-2xl p-8">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              2. Registro y Cuentas
            </h2>
            <ul className="space-y-4 text-lg text-gray-700 dark:text-gray-300">
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-2 h-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mt-3"></span>
                <span>El registro es obligatorio para usar el servicio.</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-2 h-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mt-3"></span>
                <span>
                  Se puede iniciar sesión mediante Google, Discord, GitHub y
                  otros proveedores que se añadan en el futuro.
                </span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-2 h-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mt-3"></span>
                <span>
                  El usuario debe proporcionar correo electrónico y nombre de
                  usuario mediante OAuth.
                </span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-2 h-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mt-3"></span>
                <span>
                  El usuario es responsable de la seguridad de su cuenta.
                </span>
              </li>
            </ul>
          </section>

          <section className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-8">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              3. Uso Permitido
            </h2>
            <ul className="space-y-4 text-lg text-gray-700 dark:text-gray-300">
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mt-3"></span>
                <span>
                  El servicio solo puede usarse para compartir enlaces lícitos.
                </span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mt-3"></span>
                <span>
                  No se permite contenido ilegal, malicioso o que viole derechos
                  de terceros.
                </span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mt-3"></span>
                <span>
                  Podemos suspender cuentas que incumplan estas normas.
                </span>
              </li>
            </ul>
          </section>

          <section className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl p-8">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              4. Edad Mínima
            </h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              Recomendamos que los usuarios tengan al menos 14 años. No se
              publica contenido explícito ni anuncios.
            </p>
          </section>

          <section className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-2xl p-8">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
              5. Contenido de Usuario
            </h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              Los enlaces creados por los usuarios siguen siendo suyos, pero
              conceden a Broslunas el derecho a almacenarlos y analizarlos para
              estadísticas. No nos responsabilizamos del contenido de dichos
              enlaces.
            </p>
          </section>

          <section className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-2xl p-8">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
              6. Limitación de Responsabilidad
            </h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              Broslunas Link se ofrece "tal cual", sin garantías de
              disponibilidad o ausencia de errores. No somos responsables de
              pérdidas o daños derivados del uso del servicio.
            </p>
          </section>

          <section className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-2xl p-8">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              7. Jurisdicción
            </h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              Estos términos se rigen por las leyes de España. Cualquier disputa
              será resuelta en los tribunales de Santa Cruz de Tenerife, España.
            </p>
          </section>

          <section className="bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-2xl p-8">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
              8. Contacto
            </h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              Para consultas legales:{' '}
              <a
                href="mailto:pablo@broslunas.com"
                className="text-blue-600 hover:text-purple-600 font-semibold underline underline-offset-2 transition-colors duration-300"
              >
                pablo@broslunas.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </main>
  </div>
);

export default TermsAndServices;
