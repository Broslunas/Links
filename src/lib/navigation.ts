import { MainNavigation, FooterNavigation } from '@/types/navigation';

// Main navigation configuration for header
export const mainNavigation: MainNavigation = {
  items: [
    {
      label: 'Inicio',
      href: '/',
    },
    {
      label: 'Características',
      href: '/features',
    },
    {
      label: 'Precios',
      href: '/pricing',
    },
    {
      label: 'API',
      href: '/docs',
    },
    {
      label: 'Ayuda',
      href: '/help',
    },
  ],
};

// Footer navigation configuration
export const footerNavigation: FooterNavigation = {
  sections: [
    {
      title: 'Producto',
      items: [
        {
          label: 'Características',
          href: '/features',
        },
        {
          label: 'Precios',
          href: '/pricing',
        },
        {
          label: 'API',
          href: '/docs',
        },
        {
          label: 'Integraciones',
          href: '/integrations',
        },
      ],
    },
    {
      title: 'Soporte',
      items: [
        {
          label: 'Ayuda',
          href: '/help',
        },
        {
          label: 'Documentación',
          href: '/docs',
        },
        {
          label: 'Contacto',
          href: 'https://broslunas.com/contacto',
        },
        {
          label: 'Estado del Servicio',
          href: '/status',
          external: true,
        },
      ],
    },
    {
      title: 'Legal',
      items: [
        {
          label: 'Términos de Servicio',
          href: '/terms',
        },
        {
          label: 'Política de Privacidad',
          href: '/privacy',
        },
        {
          label: 'Política de Cookies',
          href: '/cookies',
        },
      ],
    },
  ],
  companyInfo: {
    name: 'Broslunas Links',
    description:
      'La plataforma más confiable para acortar y gestionar tus enlaces con análisis avanzados.',
  },
  copyright: {
    year: new Date().getFullYear(),
    text: 'Todos los derechos reservados.',
  },
};
