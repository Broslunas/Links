import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Cookies',
  description: 'Información sobre el uso de cookies en Broslunas Links. Conoce qué cookies utilizamos, para qué las usamos y cómo puedes gestionarlas.',
  keywords: ['política de cookies', 'cookies', 'privacidad', 'seguimiento', 'analíticas', 'sesiones'],
  openGraph: {
    title: 'Política de Cookies - Broslunas Links',
    description: 'Información completa sobre el uso de cookies en nuestro servicio de acortado de enlaces.',
  },
  twitter: {
    title: 'Política de Cookies - Broslunas Links',
    description: 'Información completa sobre el uso de cookies en nuestro servicio de acortado de enlaces.',
  },
  robots: {
    index: true,
    follow: false,
  },
};

const CookiesPolicy: React.FC = () => (
  <main className="max-w-3xl mx-auto py-12 px-4 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
    <h1 className="text-4xl font-bold mb-8 text-center">
      Política de Cookies
    </h1>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-3">1. ¿Qué son las cookies?</h2>
      <p className="mb-2">
        Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo 
        cuando visitas un sitio web. Nos ayudan a mejorar tu experiencia de usuario 
        y a proporcionar funcionalidades esenciales del servicio.
      </p>
    </section>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-3">2. Tipos de cookies que utilizamos</h2>
      
      <div className="mb-6">
        <h3 className="text-xl font-medium mb-2">Cookies esenciales</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>Cookies de sesión para mantener tu sesión activa</li>
          <li>Cookies de autenticación para verificar tu identidad</li>
          <li>Cookies de seguridad para proteger contra ataques CSRF</li>
        </ul>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-medium mb-2">Cookies de funcionalidad</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>Preferencias de tema (modo oscuro/claro)</li>
          <li>Configuración de idioma</li>
          <li>Preferencias de visualización del dashboard</li>
        </ul>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-medium mb-2">Cookies analíticas</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>Estadísticas de uso del sitio web</li>
          <li>Análisis de rendimiento de enlaces</li>
          <li>Métricas de navegación y comportamiento del usuario</li>
        </ul>
      </div>
    </section>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-3">3. Cookies de terceros</h2>
      <p className="mb-4">
        Utilizamos servicios de terceros que pueden establecer sus propias cookies:
      </p>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>Google OAuth:</strong> Para la autenticación con cuentas de Google
        </li>
        <li>
          <strong>Discord OAuth:</strong> Para la autenticación con cuentas de Discord
        </li>
        <li>
          <strong>GitHub OAuth:</strong> Para la autenticación con cuentas de GitHub
        </li>
        <li>
          <strong>NextAuth.js:</strong> Para la gestión de sesiones de usuario
        </li>
      </ul>
    </section>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-3">4. Duración de las cookies</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>Cookies de sesión:</strong> Se eliminan cuando cierras el navegador
        </li>
        <li>
          <strong>Cookies persistentes:</strong> Permanecen hasta 30 días para recordar 
          tus preferencias
        </li>
        <li>
          <strong>Cookies de autenticación:</strong> Duran hasta que cierres sesión 
          o expiren automáticamente
        </li>
      </ul>
    </section>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-3">5. Gestión de cookies</h2>
      <p className="mb-4">
        Puedes controlar y gestionar las cookies de varias maneras:
      </p>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>Configuración del navegador:</strong> La mayoría de navegadores 
          permiten bloquear o eliminar cookies
        </li>
        <li>
          <strong>Cerrar sesión:</strong> Elimina las cookies de autenticación
        </li>
        <li>
          <strong>Borrar datos del navegador:</strong> Elimina todas las cookies 
          almacenadas
        </li>
      </ul>
      <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        <strong>Nota:</strong> Deshabilitar las cookies esenciales puede afectar 
        el funcionamiento del sitio web.
      </p>
    </section>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-3">6. Cookies y privacidad</h2>
      <p className="mb-2">
        Las cookies que utilizamos no contienen información personal identificable 
        directamente. Los datos analíticos se procesan de forma agregada y anónima. 
        Para más información sobre cómo protegemos tu privacidad, consulta nuestra{' '}
        <a href="/privacy-policy" className="text-blue-500 hover:text-blue-600 underline">
          Política de Privacidad
        </a>.
      </p>
    </section>

    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-3">7. Actualizaciones de esta política</h2>
      <p className="mb-2">
        Podemos actualizar esta política de cookies ocasionalmente para reflejar 
        cambios en nuestras prácticas o por razones legales. Te notificaremos 
        sobre cambios significativos a través del sitio web.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-semibold mb-3">8. Contacto</h2>
      <p>
        Si tienes preguntas sobre nuestra política de cookies:{' '}
        <a href="mailto:pablo@broslunas.com" className="text-blue-500 hover:text-blue-600 underline">
          pablo@broslunas.com
        </a>
      </p>
    </section>
  </main>
);

export default CookiesPolicy;