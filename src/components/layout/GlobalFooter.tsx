'use client';

import React from 'react';
import Link from 'next/link';

interface NavigationItem {
  label: string;
  href: string;
  external?: boolean;
}

interface NavigationSection {
  title: string;
  items: NavigationItem[];
}

const footerSections: NavigationSection[] = [
  {
    title: 'Producto',
    items: [
      { label: 'Características', href: '/features' },
      { label: 'API', href: '/api' },
    ],
  },
  {
    title: 'Soporte',
    items: [
      { label: 'Ayuda', href: '/help' },
      {
        label: 'Contacto',
        href: 'https://broslunas.com/contacto',
        external: true,
      },
      { label: 'Estado del Servicio', href: '/status', external: true },
    ],
  },
  {
    title: 'Legal',
    items: [
      { label: 'Términos de Servicio', href: '/terms-and-services' },
      { label: 'Política de Privacidad', href: '/privacy-policy' },
      { label: 'Política de Cookies', href: '/cookies' },
      { label: 'GDPR', href: '/gdpr' },
    ],
  },
];

const GlobalFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="bg-gray-900 text-white"
      role="contentinfo"
      aria-labelledby="footer-heading"
    >
      <h2 id="footer-heading" className="sr-only">
        Información del pie de página
      </h2>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Information */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <img
                  src="https://cdn.broslunas.com/favicon.png"
                  alt="Broslunas Links"
                  width="32"
                  height="32"
                />
              </div>
              <span className="text-xl font-bold">Broslunas Links</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              Un acortador de URLs moderno con análisis avanzados, dominios
              personalizados y potentes funciones de gestión de enlaces.
            </p>
            <div
              className="flex space-x-4"
              role="list"
              aria-label="Enlaces de redes sociales"
            >
              {/* Social Media Links */}
              <a
                href="/x"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-md p-1"
                aria-label="Síguenos en Twitter (se abre en una nueva ventana)"
                role="listitem"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a
                href="/github"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-md p-1"
                aria-label="Visita nuestro repositorio en GitHub (se abre en una nueva ventana)"
                role="listitem"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Navigation Sections */}
          {footerSections.map(section => (
            <nav
              key={section.title}
              className="lg:col-span-1"
              aria-labelledby={`footer-${section.title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <h3
                id={`footer-${section.title.toLowerCase().replace(/\s+/g, '-')}`}
                className="text-lg font-semibold mb-4"
              >
                {section.title}
              </h3>
              <ul className="space-y-3" role="list">
                {section.items.map(item => (
                  <li key={item.href}>
                    {item.external ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-base text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-md"
                        aria-label={`${item.label} (se abre en una nueva ventana)`}
                      >
                        {item.label}
                      </a>
                    ) : (
                      <Link
                        href={item.href}
                        className="text-base text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-md"
                      >
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Copyright Bar */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm" role="contentinfo">
              © {currentYear} Broslunas Links. Todos los derechos reservados.
            </p>
            <nav
              className="flex space-x-6 mt-4 md:mt-0"
              aria-label="Enlaces legales"
            >
              <Link
                href="/terms-and-services"
                className="text-gray-400 hover:text-white text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-md"
              >
                Términos
              </Link>
              <Link
                href="/privacy-policy"
                className="text-gray-400 hover:text-white text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-md"
              >
                Privacidad
              </Link>
              <Link
                href="/cookies"
                className="text-gray-400 hover:text-white text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-md"
              >
                Cookies
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
};

export { GlobalFooter };
