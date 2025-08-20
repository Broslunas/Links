import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GDPR - Reglamento General de Protección de Datos',
  description: 'Información sobre el cumplimiento del GDPR en Broslunas Links. Conoce tus derechos y cómo ejercerlos según el Reglamento General de Protección de Datos.',
  keywords: ['gdpr', 'rgpd', 'protección de datos', 'derechos', 'privacidad', 'reglamento europeo'],
  openGraph: {
    title: 'GDPR - Reglamento General de Protección de Datos - Broslunas Links',
    description: 'Información completa sobre el cumplimiento del GDPR y tus derechos de protección de datos.',
  },
  twitter: {
    title: 'GDPR - Reglamento General de Protección de Datos - Broslunas Links',
    description: 'Información completa sobre el cumplimiento del GDPR y tus derechos de protección de datos.',
  },
  robots: {
    index: true,
    follow: false,
  },
};

const GDPRPage: React.FC = () => (
  <main className="max-w-3xl mx-auto py-12 px-4 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
    <h1 className="text-4xl font-bold mb-8 text-center">
      GDPR - Reglamento General de Protección de Datos
    </h1>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-3">1. Introducción</h2>
      <p className="mb-2">
        Broslunas Links cumple con el Reglamento General de Protección de Datos (GDPR) 
        de la Unión Europea. Este documento explica tus derechos y cómo los respetamos.
      </p>
    </section>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-3">2. Tus Derechos bajo el GDPR</h2>
      
      <div className="mb-6">
        <h3 className="text-xl font-medium mb-2">Derecho de Acceso (Artículo 15)</h3>
        <p className="mb-2">
          Tienes derecho a obtener confirmación sobre si procesamos tus datos personales 
          y, en caso afirmativo, acceder a dichos datos y a información sobre su tratamiento.
        </p>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-medium mb-2">Derecho de Rectificación (Artículo 16)</h3>
        <p className="mb-2">
          Puedes solicitar la corrección de datos personales inexactos o incompletos 
          que tengamos sobre ti.
        </p>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-medium mb-2">Derecho de Supresión (Artículo 17)</h3>
        <p className="mb-2">
          También conocido como "derecho al olvido", puedes solicitar la eliminación 
          de tus datos personales en determinadas circunstancias.
        </p>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-medium mb-2">Derecho a la Limitación del Tratamiento (Artículo 18)</h3>
        <p className="mb-2">
          Puedes solicitar que limitemos el procesamiento de tus datos personales 
          en ciertas situaciones específicas.
        </p>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-medium mb-2">Derecho a la Portabilidad (Artículo 20)</h3>
        <p className="mb-2">
          Tienes derecho a recibir tus datos personales en un formato estructurado, 
          de uso común y lectura mecánica, y a transmitirlos a otro responsable.
        </p>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-medium mb-2">Derecho de Oposición (Artículo 21)</h3>
        <p className="mb-2">
          Puedes oponerte al tratamiento de tus datos personales por motivos 
          relacionados con tu situación particular.
        </p>
      </div>
    </section>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-3">3. Base Legal para el Tratamiento</h2>
      <p className="mb-2">
        Procesamos tus datos personales basándonos en las siguientes bases legales:
      </p>
      <ul className="list-disc pl-6 space-y-2">
        <li>Consentimiento (Artículo 6(1)(a)) - Para cookies no esenciales y marketing</li>
        <li>Ejecución de contrato (Artículo 6(1)(b)) - Para proporcionar nuestros servicios</li>
        <li>Interés legítimo (Artículo 6(1)(f)) - Para análisis y mejora del servicio</li>
        <li>Cumplimiento legal (Artículo 6(1)(c)) - Para cumplir obligaciones legales</li>
      </ul>
    </section>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-3">4. Transferencias Internacionales</h2>
      <p className="mb-2">
        Algunos de nuestros proveedores de servicios pueden estar ubicados fuera del 
        Espacio Económico Europeo (EEE). En estos casos, nos aseguramos de que existan 
        garantías adecuadas para proteger tus datos personales.
      </p>
    </section>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-3">5. Retención de Datos</h2>
      <p className="mb-2">
        Conservamos tus datos personales solo durante el tiempo necesario para los 
        fines para los que fueron recopilados, o según lo requiera la ley aplicable.
      </p>
      <ul className="list-disc pl-6 space-y-2">
        <li>Datos de cuenta: Mientras tu cuenta esté activa</li>
        <li>Datos de enlaces: Según la configuración de retención que elijas</li>
        <li>Datos de análisis: Hasta 26 meses</li>
        <li>Logs del sistema: Hasta 12 meses</li>
      </ul>
    </section>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-3">6. Cómo Ejercer tus Derechos</h2>
      <p className="mb-2">
        Para ejercer cualquiera de tus derechos bajo el GDPR, puedes:
      </p>
      <ul className="list-disc pl-6 space-y-2">
        <li>Acceder a tu configuración de cuenta en el dashboard</li>
        <li>Contactarnos directamente en{' '}
          <a href="mailto:pablo@broslunas.com" className="text-blue-500">
            pablo@broslunas.com
          </a>
        </li>
        <li>Usar los controles de privacidad disponibles en la plataforma</li>
      </ul>
      <p className="mt-4 mb-2">
        Responderemos a tu solicitud dentro de un mes desde su recepción.
      </p>
    </section>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-3">7. Autoridad de Control</h2>
      <p className="mb-2">
        Si consideras que el tratamiento de tus datos personales infringe el GDPR, 
        tienes derecho a presentar una reclamación ante la autoridad de control competente.
      </p>
      <p className="mb-2">
        En España, la autoridad de control es la Agencia Española de Protección de Datos (AEPD):
      </p>
      <ul className="list-disc pl-6 space-y-2">
        <li>Sitio web: <a href="https://www.aepd.es" className="text-blue-500" target="_blank" rel="noopener noreferrer">www.aepd.es</a></li>
        <li>Teléfono: 901 100 099</li>
        <li>Dirección: C/ Jorge Juan, 6, 28001 Madrid</li>
      </ul>
    </section>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-3">8. Delegado de Protección de Datos</h2>
      <p className="mb-2">
        Aunque no estamos obligados a designar un Delegado de Protección de Datos (DPO), 
        puedes contactar directamente con nuestro equipo de privacidad para cualquier 
        consulta relacionada con la protección de datos.
      </p>
    </section>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-3">9. Actualizaciones</h2>
      <p className="mb-2">
        Esta información sobre GDPR puede actualizarse periódicamente para reflejar 
        cambios en nuestras prácticas o en la legislación aplicable. Te notificaremos 
        sobre cambios significativos.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-semibold mb-3">10. Contacto</h2>
      <p>
        Para cualquier consulta sobre GDPR o protección de datos:{' '}
        <a href="mailto:pablo@broslunas.com" className="text-blue-500">
          pablo@broslunas.com
        </a>
      </p>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Última actualización: {new Date().toLocaleDateString('es-ES')}
      </p>
    </section>
  </main>
);

export default GDPRPage;