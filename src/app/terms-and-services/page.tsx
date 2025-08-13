import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Términos de Servicio',
  description: 'Términos y condiciones de uso de Broslunas Links. Conoce las normas, derechos y responsabilidades al usar nuestro acortador de URLs.',
  keywords: ['términos de servicio', 'condiciones de uso', 'normas', 'legal', 'acortador urls', 'responsabilidades'],
  openGraph: {
    title: 'Términos de Servicio - Broslunas Links',
    description: 'Términos y condiciones de uso del servicio. Información legal sobre derechos y responsabilidades.',
  },
  twitter: {
    title: 'Términos de Servicio - Broslunas Links',
    description: 'Términos y condiciones de uso del servicio. Información legal sobre derechos y responsabilidades.',
  },
  robots: {
    index: true,
    follow: false,
  },
};

const TermsAndServices: React.FC = () => (
  <main className="max-w-3xl mx-auto py-12 px-4 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
    <h1 className="text-4xl font-bold mb-8 text-center">
      Términos de Servicio
    </h1>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-3">
        1. Descripción del Servicio
      </h2>
      <p className="mb-2">
        Broslunas Link (
        <a
          href="https://broslunas.link"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-600 font-medium underline underline-offset-2 transition-colors duration-200"
        >
          broslunas.link
        </a>
        ) es un acortador de enlaces con analíticas avanzadas y amplias
        configuraciones. El uso del servicio implica la aceptación de estos
        términos.
      </p>
    </section>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-3">2. Registro y Cuentas</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li>El registro es obligatorio para usar el servicio.</li>
        <li>
          Se puede iniciar sesión mediante Google, Discord, GitHub y otros
          proveedores que se añadan en el futuro.
        </li>
        <li>
          El usuario debe proporcionar correo electrónico y nombre de usuario
          mediante OAuth.
        </li>
        <li>El usuario es responsable de la seguridad de su cuenta.</li>
      </ul>
    </section>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-3">3. Uso Permitido</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li>El servicio solo puede usarse para compartir enlaces lícitos.</li>
        <li>
          No se permite contenido ilegal, malicioso o que viole derechos de
          terceros.
        </li>
        <li>Podemos suspender cuentas que incumplan estas normas.</li>
      </ul>
    </section>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-3">4. Edad Mínima</h2>
      <p className="mb-2">
        Recomendamos que los usuarios tengan al menos 14 años. No se publica
        contenido explícito ni anuncios.
      </p>
    </section>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-3">5. Contenido de Usuario</h2>
      <p className="mb-2">
        Los enlaces creados por los usuarios siguen siendo suyos, pero conceden
        a Broslunas el derecho a almacenarlos y analizarlos para estadísticas.
        No nos responsabilizamos del contenido de dichos enlaces.
      </p>
    </section>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-3">
        6. Limitación de Responsabilidad
      </h2>
      <p className="mb-2">
        Broslunas Link se ofrece “tal cual”, sin garantías de disponibilidad o
        ausencia de errores. No somos responsables de pérdidas o daños derivados
        del uso del servicio.
      </p>
    </section>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-3">7. Jurisdicción</h2>
      <p className="mb-2">
        Estos términos se rigen por las leyes de España. Cualquier disputa será
        resuelta en los tribunales de Santa Cruz de Tenerife, España.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-semibold mb-3">8. Contacto</h2>
      <p>
        Para consultas legales:{' '}
        <a href="mailto:pablo@broslunas.com" className="text-blue-500">
          pablo@broslunas.com
        </a>
      </p>
    </section>
  </main>
);

export default TermsAndServices;
