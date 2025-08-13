import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidad',
  description: 'Conoce cómo Broslunas Links protege tu privacidad. Información sobre recopilación, uso y protección de datos personales según RGPD.',
  keywords: ['política de privacidad', 'protección de datos', 'rgpd', 'privacidad', 'datos personales', 'cookies'],
  openGraph: {
    title: 'Política de Privacidad - Broslunas Links',
    description: 'Información completa sobre cómo protegemos tu privacidad y manejamos tus datos personales.',
  },
  twitter: {
    title: 'Política de Privacidad - Broslunas Links',
    description: 'Información completa sobre cómo protegemos tu privacidad y manejamos tus datos personales.',
  },
  robots: {
    index: true,
    follow: false,
  },
};

const PrivacyPolicy: React.FC = () => (
  <main className="max-w-3xl mx-auto py-12 px-4 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
    <h1 className="text-4xl font-bold mb-8 text-center">
      Política de Privacidad
    </h1>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-3">1. Datos que Recopilamos</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          Correo electrónico y nombre de usuario, obtenidos a través de Google,
          Discord, GitHub y otros proveedores OAuth.
        </li>
        <li>Cookies para gestionar sesiones y mejorar el servicio.</li>
        <li>
          Datos de ubicación cuando un usuario accede a un enlace, para
          analíticas detalladas.
        </li>
      </ul>
    </section>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-3">2. Uso de los Datos</h2>
      <p className="mb-2">
        Usamos los datos para generar estadísticas de enlaces y métricas
        generales, siempre con medidas de privacidad y cifrado.
      </p>
    </section>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-3">3. Compartición de Datos</h2>
      <p className="mb-2">
        No compartimos ni vendemos tus datos a terceros. Toda la información se
        mantiene dentro de Broslunas.
      </p>
    </section>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-3">4. Seguridad</h2>
      <p className="mb-2">
        Implementamos cifrado y medidas técnicas para proteger tus datos frente
        a accesos no autorizados.
      </p>
    </section>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-3">5. Retención de Datos</h2>
      <p className="mb-2">
        Conservamos los datos mientras la cuenta esté activa. Puedes solicitar
        su eliminación escribiendo a{' '}
        <a href="mailto:pablo@broslunas.com" className="text-blue-500">
          pablo@broslunas.com
        </a>
        .
      </p>
    </section>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-3">
        6. Derechos del Usuario (RGPD)
      </h2>
      <ul className="list-disc pl-6 space-y-2">
        <li>Acceder a tus datos.</li>
        <li>Rectificarlos.</li>
        <li>Solicitar su eliminación.</li>
        <li>Oponerte a su tratamiento.</li>
      </ul>
    </section>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-3">7. Edad Mínima</h2>
      <p className="mb-2">
        El servicio está recomendado para mayores de 14 años, aunque no existe
        una restricción técnica.
      </p>
    </section>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-3">
        8. Cambios en esta Política
      </h2>
      <p className="mb-2">
        Podemos actualizar esta política en cualquier momento. Notificaremos
        cambios importantes en la web o por correo electrónico.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-semibold mb-3">9. Contacto</h2>
      <p>
        Para consultas sobre privacidad:{' '}
        <a href="mailto:pablo@broslunas.com" className="text-blue-500">
          pablo@broslunas.com
        </a>
      </p>
    </section>
  </main>
);

export default PrivacyPolicy;
