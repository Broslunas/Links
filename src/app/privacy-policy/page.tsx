import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidad - Broslunas Link',
  description:
    'Política de privacidad de Broslunas Link. Información sobre cómo recopilamos, usamos y protegemos tus datos.',
  keywords:
    'política de privacidad, protección de datos, GDPR, cookies, Broslunas Link',
};

const PrivacyPolicy: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
    {/* Hero Section */}
    <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white">
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
            Política de Privacidad
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
            Tu privacidad es nuestra prioridad. Conoce cómo protegemos y
            utilizamos tus datos.
          </p>
        </div>
      </div>
    </section>

    <main className="max-w-6xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-12">
        <div className="space-y-12">
          <section className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-8">
            <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white flex items-center">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold mr-4">
                1
              </span>
              Datos que Recopilamos
            </h2>
            <ul className="space-y-4 text-gray-700 dark:text-gray-300">
              <li className="flex items-start">
                <span className="text-blue-500 mr-3 mt-1">•</span>
                <span>
                  Correo electrónico y nombre de usuario, obtenidos a través de
                  Google, Discord, GitHub y otros proveedores OAuth.
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-3 mt-1">•</span>
                <span>
                  Cookies para gestionar sesiones y mejorar el servicio.
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-3 mt-1">•</span>
                <span>
                  Datos de ubicación cuando un usuario accede a un enlace, para
                  analíticas detalladas.
                </span>
              </li>
            </ul>
          </section>

          <section className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-8">
            <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white flex items-center">
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold mr-4">
                2
              </span>
              Uso de los Datos
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Usamos los datos para generar estadísticas de enlaces y métricas
              generales, siempre con medidas de privacidad y cifrado.
            </p>
          </section>

          <section className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-2xl p-8">
            <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white flex items-center">
              <span className="bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold mr-4">
                3
              </span>
              Compartición de Datos
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              No compartimos ni vendemos tus datos a terceros. Toda la
              información se mantiene dentro de Broslunas.
            </p>
          </section>

          <section className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl p-8">
            <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white flex items-center">
              <span className="bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold mr-4">
                4
              </span>
              Seguridad
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Implementamos cifrado y medidas técnicas para proteger tus datos
              frente a accesos no autorizados.
            </p>
          </section>

          <section className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-2xl p-8">
            <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white flex items-center">
              <span className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold mr-4">
                5
              </span>
              Retención de Datos
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Conservamos los datos mientras la cuenta esté activa. Puedes
              solicitar su eliminación escribiendo a{' '}
              <a
                href="mailto:pablo@broslunas.com"
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-semibold transition-colors"
              >
                pablo@broslunas.com
              </a>
              .
            </p>
          </section>

          <section className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-2xl p-8">
            <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white flex items-center">
              <span className="bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold mr-4">
                6
              </span>
              Derechos del Usuario (RGPD)
            </h2>
            <ul className="space-y-4 text-gray-700 dark:text-gray-300">
              <li className="flex items-start">
                <span className="text-pink-500 mr-3 mt-1">•</span>
                <span>Acceder a tus datos.</span>
              </li>
              <li className="flex items-start">
                <span className="text-pink-500 mr-3 mt-1">•</span>
                <span>Rectificarlos.</span>
              </li>
              <li className="flex items-start">
                <span className="text-pink-500 mr-3 mt-1">•</span>
                <span>Solicitar su eliminación.</span>
              </li>
              <li className="flex items-start">
                <span className="text-pink-500 mr-3 mt-1">•</span>
                <span>Oponerte a su tratamiento.</span>
              </li>
            </ul>
          </section>

          <section className="bg-gradient-to-r from-teal-50 to-green-50 dark:from-teal-900/20 dark:to-green-900/20 rounded-2xl p-8">
            <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white flex items-center">
              <span className="bg-gradient-to-r from-teal-600 to-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold mr-4">
                7
              </span>
              Edad Mínima
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              El servicio está recomendado para mayores de 14 años, aunque no
              existe una restricción técnica.
            </p>
          </section>

          <section className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl p-8">
            <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white flex items-center">
              <span className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold mr-4">
                8
              </span>
              Cambios en esta Política
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Podemos actualizar esta política en cualquier momento.
              Notificaremos cambios importantes en la web o por correo
              electrónico.
            </p>
          </section>

          <section className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-8">
            <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white flex items-center">
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold mr-4">
                9
              </span>
              Contacto
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Para consultas sobre privacidad:{' '}
              <a
                href="mailto:pablo@broslunas.com"
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-semibold transition-colors"
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

export default PrivacyPolicy;
