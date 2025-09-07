import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Cookies - Broslunas Link',
  description:
    'Información sobre el uso de cookies en Broslunas Link. Conoce qué cookies utilizamos y cómo gestionarlas.',
  keywords: 'cookies, política de cookies, gestión de cookies, Broslunas Link',
};

const CookiesPolicy: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-gray-900 dark:via-orange-900/20 dark:to-yellow-900/20">
    {/* Hero Section */}
    <section className="relative overflow-hidden bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 text-white">
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-orange-100 bg-clip-text text-transparent">
            Política de Cookies
          </h1>
          <p className="text-xl md:text-2xl text-orange-100 max-w-3xl mx-auto leading-relaxed">
            Información transparente sobre cómo utilizamos las cookies para
            mejorar tu experiencia.
          </p>
        </div>
      </div>
    </section>

    <main className="max-w-6xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-12">
        <div className="space-y-12 text-gray-900 dark:text-gray-100">
          <section>
            <h2 className="text-3xl font-bold mb-6 text-orange-600 dark:text-orange-400">
              1. ¿Qué son las cookies?
            </h2>
            <p className="text-lg leading-relaxed">
              Las cookies son pequeños archivos de texto que se almacenan en tu
              dispositivo cuando visitas un sitio web. Nos ayudan a mejorar tu
              experiencia de usuario y a proporcionar funcionalidades esenciales
              del servicio.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6 text-orange-600 dark:text-orange-400">
              2. Tipos de cookies que utilizamos
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 p-6 rounded-2xl border border-orange-200 dark:border-orange-700">
                <h3 className="text-xl font-bold mb-4 text-orange-700 dark:text-orange-300">
                  Cookies esenciales
                </h3>
                <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Cookies de sesión para mantener tu sesión activa
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Cookies de autenticación para verificar tu identidad
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Cookies de seguridad para proteger contra ataques CSRF
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 p-6 rounded-2xl border border-amber-200 dark:border-amber-700">
                <h3 className="text-xl font-bold mb-4 text-amber-700 dark:text-amber-300">
                  Cookies de funcionalidad
                </h3>
                <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Preferencias de tema (modo oscuro/claro)
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Configuración de idioma
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Preferencias de visualización del dashboard
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-6 rounded-2xl border border-yellow-200 dark:border-yellow-700">
                <h3 className="text-xl font-bold mb-4 text-yellow-700 dark:text-yellow-300">
                  Cookies analíticas
                </h3>
                <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Estadísticas de uso del sitio web
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Análisis de rendimiento de enlaces
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Métricas de navegación y comportamiento del usuario
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6 text-orange-600 dark:text-orange-400">
              3. Cookies de terceros
            </h2>
            <p className="text-lg leading-relaxed mb-6">
              Utilizamos servicios de terceros que pueden establecer sus propias
              cookies:
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 p-4 rounded-xl border border-orange-200 dark:border-orange-700">
                <strong className="text-orange-700 dark:text-orange-300">
                  Google OAuth:
                </strong>
                <span className="text-gray-700 dark:text-gray-300 ml-2">
                  Para la autenticación con cuentas de Google
                </span>
              </div>
              <div className="bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 p-4 rounded-xl border border-amber-200 dark:border-amber-700">
                <strong className="text-amber-700 dark:text-amber-300">
                  Discord OAuth:
                </strong>
                <span className="text-gray-700 dark:text-gray-300 ml-2">
                  Para la autenticación con cuentas de Discord
                </span>
              </div>
              <div className="bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 p-4 rounded-xl border border-yellow-200 dark:border-yellow-700">
                <strong className="text-yellow-700 dark:text-yellow-300">
                  GitHub OAuth:
                </strong>
                <span className="text-gray-700 dark:text-gray-300 ml-2">
                  Para la autenticación con cuentas de GitHub
                </span>
              </div>
              <div className="bg-gradient-to-r from-orange-100 to-yellow-100 dark:from-orange-900/30 dark:to-yellow-900/30 p-4 rounded-xl border border-orange-200 dark:border-yellow-700">
                <strong className="text-orange-700 dark:text-orange-300">
                  NextAuth.js:
                </strong>
                <span className="text-gray-700 dark:text-gray-300 ml-2">
                  Para la gestión de sesiones de usuario
                </span>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6 text-orange-600 dark:text-orange-400">
              4. Duración de las cookies
            </h2>
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 p-6 rounded-xl border-l-4 border-orange-500">
                <strong className="text-lg text-orange-700 dark:text-orange-300">
                  Cookies de sesión:
                </strong>
                <p className="text-gray-700 dark:text-gray-300 mt-2">
                  Se eliminan cuando cierras el navegador
                </p>
              </div>
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 p-6 rounded-xl border-l-4 border-amber-500">
                <strong className="text-lg text-amber-700 dark:text-amber-300">
                  Cookies persistentes:
                </strong>
                <p className="text-gray-700 dark:text-gray-300 mt-2">
                  Permanecen hasta 30 días para recordar tus preferencias
                </p>
              </div>
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-6 rounded-xl border-l-4 border-yellow-500">
                <strong className="text-lg text-yellow-700 dark:text-yellow-300">
                  Cookies de autenticación:
                </strong>
                <p className="text-gray-700 dark:text-gray-300 mt-2">
                  Duran hasta que cierres sesión o expiren automáticamente
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6 text-orange-600 dark:text-orange-400">
              5. Gestión de cookies
            </h2>
            <p className="text-lg leading-relaxed mb-6">
              Puedes controlar y gestionar las cookies de varias maneras:
            </p>
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 p-6 rounded-xl">
                <strong className="text-lg text-orange-700 dark:text-orange-300">
                  Configuración del navegador:
                </strong>
                <p className="text-gray-700 dark:text-gray-300 mt-2">
                  La mayoría de navegadores permiten bloquear o eliminar cookies
                </p>
              </div>
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 p-6 rounded-xl">
                <strong className="text-lg text-amber-700 dark:text-amber-300">
                  Cerrar sesión:
                </strong>
                <p className="text-gray-700 dark:text-gray-300 mt-2">
                  Elimina las cookies de autenticación
                </p>
              </div>
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-6 rounded-xl">
                <strong className="text-lg text-yellow-700 dark:text-yellow-300">
                  Borrar datos del navegador:
                </strong>
                <p className="text-gray-700 dark:text-gray-300 mt-2">
                  Elimina todas las cookies almacenadas
                </p>
              </div>
            </div>
            <div className="mt-6 p-4 bg-amber-100 dark:bg-amber-900/30 rounded-xl border border-amber-300 dark:border-amber-700">
              <p className="text-amber-800 dark:text-amber-200">
                <strong>⚠️ Nota importante:</strong> Deshabilitar las cookies
                esenciales puede afectar el funcionamiento del sitio web.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6 text-orange-600 dark:text-orange-400">
              6. Cookies y privacidad
            </h2>
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 p-8 rounded-2xl border border-orange-200 dark:border-orange-700">
              <p className="text-lg leading-relaxed">
                Las cookies que utilizamos no contienen información personal
                identificable directamente. Los datos analíticos se procesan de
                forma agregada y anónima. Para más información sobre cómo
                protegemos tu privacidad, consulta nuestra{' '}
                <a
                  href="/privacy-policy"
                  className="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 underline font-semibold"
                >
                  Política de Privacidad
                </a>
                .
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6 text-orange-600 dark:text-orange-400">
              7. Actualizaciones de esta política
            </h2>
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-8 rounded-2xl border border-amber-200 dark:border-amber-700">
              <p className="text-lg leading-relaxed">
                Podemos actualizar esta política de cookies ocasionalmente para
                reflejar cambios en nuestras prácticas o por razones legales. Te
                notificaremos sobre cambios significativos a través del sitio
                web.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6 text-orange-600 dark:text-orange-400">
              8. Contacto
            </h2>
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 p-8 rounded-2xl border border-yellow-200 dark:border-yellow-700 text-center">
              <p className="text-lg leading-relaxed mb-4">
                Si tienes preguntas sobre nuestra política de cookies:
              </p>

              <a
                href="/contacto"
                target="_blank"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                📧 Contactar con Soporte
              </a>
            </div>
          </section>
        </div>
      </div>
    </main>
  </div>
);

export default CookiesPolicy;
