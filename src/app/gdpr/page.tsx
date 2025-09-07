import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GDPR - Reglamento General de Protección de Datos',
  description:
    'Información sobre el cumplimiento del GDPR en Broslunas Links. Conoce tus derechos y cómo ejercerlos según el Reglamento General de Protección de Datos.',
  keywords: [
    'gdpr',
    'rgpd',
    'protección de datos',
    'derechos',
    'privacidad',
    'reglamento europeo',
  ],
  openGraph: {
    title: 'GDPR - Reglamento General de Protección de Datos - Broslunas Links',
    description:
      'Información completa sobre el cumplimiento del GDPR y tus derechos de protección de datos.',
  },
  twitter: {
    title: 'GDPR - Reglamento General de Protección de Datos - Broslunas Links',
    description:
      'Información completa sobre el cumplimiento del GDPR y tus derechos de protección de datos.',
  },
  robots: {
    index: true,
    follow: false,
  },
};

const GDPRPage: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-green-900/20 dark:to-teal-900/20">
    {/* Hero Section */}
    <section className="relative overflow-hidden bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white">
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent">
            GDPR - Reglamento General de Protección de Datos
          </h1>
          <p className="text-xl md:text-2xl text-green-100 max-w-3xl mx-auto leading-relaxed">
            Tu privacidad y derechos están protegidos bajo el Reglamento General
            de Protección de Datos.
          </p>
        </div>
      </div>
    </section>

    <main className="max-w-6xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-12">
        <div className="space-y-12 text-gray-900 dark:text-gray-100">
          <section>
            <h2 className="text-3xl font-bold mb-6 text-green-600 dark:text-green-400">
              1. Introducción
            </h2>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-2xl">
              <p className="text-lg leading-relaxed">
                Broslunas Links cumple con el Reglamento General de Protección
                de Datos (GDPR) de la Unión Europea. Este documento explica tus
                derechos y cómo los respetamos.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6 text-green-600 dark:text-green-400">
              2. Tus Derechos bajo el GDPR
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="bg-white dark:bg-gray-700 p-6 rounded-2xl shadow-lg border border-green-100 dark:border-green-800">
                <h3 className="text-xl font-semibold mb-3 text-green-600 dark:text-green-400">
                  Derecho de Acceso (Artículo 15)
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Tienes derecho a obtener confirmación sobre si procesamos tus
                  datos personales y, en caso afirmativo, acceder a dichos datos
                  y a información sobre su tratamiento.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-700 p-6 rounded-2xl shadow-lg border border-green-100 dark:border-green-800">
                <h3 className="text-xl font-semibold mb-3 text-green-600 dark:text-green-400">
                  Derecho de Rectificación (Artículo 16)
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Puedes solicitar la corrección de datos personales inexactos o
                  incompletos que tengamos sobre ti.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-700 p-6 rounded-2xl shadow-lg border border-green-100 dark:border-green-800">
                <h3 className="text-xl font-semibold mb-3 text-green-600 dark:text-green-400">
                  Derecho de Supresión (Artículo 17)
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  También conocido como "derecho al olvido", puedes solicitar la
                  eliminación de tus datos personales en determinadas
                  circunstancias.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-700 p-6 rounded-2xl shadow-lg border border-green-100 dark:border-green-800">
                <h3 className="text-xl font-semibold mb-3 text-green-600 dark:text-green-400">
                  Derecho a la Limitación del Tratamiento (Artículo 18)
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Puedes solicitar que limitemos el procesamiento de tus datos
                  personales en ciertas situaciones específicas.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-700 p-6 rounded-2xl shadow-lg border border-green-100 dark:border-green-800">
                <h3 className="text-xl font-semibold mb-3 text-green-600 dark:text-green-400">
                  Derecho a la Portabilidad (Artículo 20)
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Tienes derecho a recibir tus datos personales en un formato
                  estructurado, de uso común y lectura mecánica, y a
                  transmitirlos a otro responsable.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-700 p-6 rounded-2xl shadow-lg border border-green-100 dark:border-green-800">
                <h3 className="text-xl font-semibold mb-3 text-green-600 dark:text-green-400">
                  Derecho de Oposición (Artículo 21)
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Puedes oponerte al tratamiento de tus datos personales por
                  motivos relacionados con tu situación particular.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6 text-green-600 dark:text-green-400">
              3. Base Legal para el Tratamiento
            </h2>
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-6 rounded-2xl">
              <p className="text-lg mb-6">
                Procesamos tus datos personales basándonos en las siguientes
                bases legales:
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <strong className="text-green-600 dark:text-green-400">
                      Consentimiento (Artículo 6(1)(a))
                    </strong>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Para cookies no esenciales y marketing
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <strong className="text-green-600 dark:text-green-400">
                      Ejecución de contrato (Artículo 6(1)(b))
                    </strong>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Para proporcionar nuestros servicios
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <strong className="text-green-600 dark:text-green-400">
                      Interés legítimo (Artículo 6(1)(f))
                    </strong>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Para análisis y mejora del servicio
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <strong className="text-green-600 dark:text-green-400">
                      Cumplimiento legal (Artículo 6(1)(c))
                    </strong>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Para cumplir obligaciones legales
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6 text-green-600 dark:text-green-400">
              4. Transferencias Internacionales
            </h2>
            <div className="bg-white dark:bg-gray-700 p-6 rounded-2xl shadow-lg border border-green-100 dark:border-green-800">
              <p className="text-lg leading-relaxed">
                Algunos de nuestros proveedores de servicios pueden estar
                ubicados fuera del Espacio Económico Europeo (EEE). En estos
                casos, nos aseguramos de que existan garantías adecuadas para
                proteger tus datos personales.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6 text-green-600 dark:text-green-400">
              5. Retención de Datos
            </h2>
            <div className="bg-gradient-to-r from-teal-50 to-green-50 dark:from-teal-900/20 dark:to-green-900/20 p-6 rounded-2xl">
              <p className="text-lg mb-6">
                Conservamos tus datos personales solo durante el tiempo
                necesario para los fines para los que fueron recopilados, o
                según lo requiera la ley aplicable.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-white dark:bg-gray-700 p-4 rounded-xl shadow-sm">
                  <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">
                    Datos de cuenta
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Mientras tu cuenta esté activa
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-700 p-4 rounded-xl shadow-sm">
                  <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">
                    Datos de enlaces
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Según la configuración de retención que elijas
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-700 p-4 rounded-xl shadow-sm">
                  <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">
                    Datos de análisis
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Hasta 26 meses
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-700 p-4 rounded-xl shadow-sm">
                  <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">
                    Logs del sistema
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Hasta 12 meses
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6 text-green-600 dark:text-green-400">
              6. Cómo Ejercer tus Derechos
            </h2>
            <div className="bg-white dark:bg-gray-700 p-6 rounded-2xl shadow-lg border border-green-100 dark:border-green-800">
              <p className="text-lg mb-6">
                Para ejercer cualquiera de tus derechos bajo el GDPR, puedes:
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 dark:text-green-400 font-semibold text-sm">
                      1
                    </span>
                  </div>
                  <p>Acceder a tu configuración de cuenta en el dashboard</p>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 dark:text-green-400 font-semibold text-sm">
                      2
                    </span>
                  </div>
                  <p>
                    Contactarnos directamente en{' '}
                    <a
                      href="mailto:pablo@broslunas.com"
                      className="text-green-600 dark:text-green-400 hover:underline font-semibold"
                    >
                      pablo@broslunas.com
                    </a>
                  </p>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 dark:text-green-400 font-semibold text-sm">
                      3
                    </span>
                  </div>
                  <p>
                    Usar los controles de privacidad disponibles en la
                    plataforma
                  </p>
                </div>
              </div>
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <p className="text-green-800 dark:text-green-200 font-medium">
                  ⏱️ Responderemos a tu solicitud dentro de un mes desde su
                  recepción.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6 text-green-600 dark:text-green-400">
              7. Autoridad de Control
            </h2>
            <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 p-6 rounded-2xl border border-red-100 dark:border-red-800">
              <p className="text-lg mb-4">
                Si consideras que el tratamiento de tus datos personales
                infringe el GDPR, tienes derecho a presentar una reclamación
                ante la autoridad de control competente.
              </p>
              <p className="mb-6 font-semibold">
                En España, la autoridad de control es la Agencia Española de
                Protección de Datos (AEPD):
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="bg-white dark:bg-gray-700 p-4 rounded-xl shadow-sm">
                  <h4 className="font-semibold text-red-600 dark:text-red-400 mb-2">
                    🌐 Sitio web
                  </h4>
                  <a
                    href="https://www.aepd.es"
                    className="text-green-600 dark:text-green-400 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    www.aepd.es
                  </a>
                </div>
                <div className="bg-white dark:bg-gray-700 p-4 rounded-xl shadow-sm">
                  <h4 className="font-semibold text-red-600 dark:text-red-400 mb-2">
                    📞 Teléfono
                  </h4>
                  <p>901 100 099</p>
                </div>
                <div className="bg-white dark:bg-gray-700 p-4 rounded-xl shadow-sm">
                  <h4 className="font-semibold text-red-600 dark:text-red-400 mb-2">
                    📍 Dirección
                  </h4>
                  <p className="text-sm">
                    C/ Jorge Juan, 6<br />
                    28001 Madrid
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6 text-green-600 dark:text-green-400">
              8. Delegado de Protección de Datos
            </h2>
            <div className="bg-white dark:bg-gray-700 p-6 rounded-2xl shadow-lg border border-green-100 dark:border-green-800">
              <p className="text-lg leading-relaxed">
                Aunque no estamos obligados a designar un Delegado de Protección
                de Datos (DPO), puedes contactar directamente con nuestro equipo
                de privacidad para cualquier consulta relacionada con la
                protección de datos.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6 text-green-600 dark:text-green-400">
              9. Actualizaciones
            </h2>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-2xl">
              <p className="text-lg leading-relaxed">
                Esta información sobre GDPR puede actualizarse periódicamente
                para reflejar cambios en nuestras prácticas o en la legislación
                aplicable. Te notificaremos sobre cambios significativos.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6 text-green-600 dark:text-green-400">
              10. Contacto
            </h2>
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-8 rounded-2xl text-center">
              <h3 className="text-2xl font-bold mb-4">
                ¿Tienes alguna pregunta?
              </h3>
              <p className="text-xl mb-6">
                Para cualquier consulta sobre GDPR o protección de datos:
              </p>
              <a
                href="/contacto"
                target="_blank"
                className="inline-flex items-center px-6 py-3 bg-white text-green-600 font-semibold rounded-xl hover:bg-green-50 transition-colors duration-200 shadow-lg"
              >
                Contactar con Soporte
              </a>
              <p className="mt-6 text-green-100 text-sm">
                Última actualización: {new Date().toLocaleDateString('es-ES')}
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  </div>
);

export default GDPRPage;
