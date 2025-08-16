// Datos del centro de ayuda - FAQ y guías

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
}

export interface HelpCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

export interface GuideStep {
  title: string;
  description: string;
  image?: string;
}

export interface Guide {
  id: string;
  title: string;
  description: string;
  category: string;
  steps: GuideStep[];
  estimatedTime: string;
}

// Categorías de ayuda
export const helpCategories: HelpCategory[] = [
  {
    id: 'getting-started',
    title: 'Primeros Pasos',
    description: 'Aprende lo básico para comenzar a usar BRL Links',
    icon: 'rocket',
    color: 'blue',
  },
  {
    id: 'link-management',
    title: 'Gestión de Enlaces',
    description: 'Crea, edita y organiza tus enlaces cortos',
    icon: 'link',
    color: 'green',
  },
  {
    id: 'analytics',
    title: 'Análisis y Estadísticas',
    description: 'Comprende el rendimiento de tus enlaces',
    icon: 'chart',
    color: 'purple',
  },
  {
    id: 'account',
    title: 'Cuenta y Configuración',
    description: 'Gestiona tu perfil y preferencias',
    icon: 'user',
    color: 'orange',
  },
  {
    id: 'troubleshooting',
    title: 'Solución de Problemas',
    description: 'Resuelve problemas comunes',
    icon: 'wrench',
    color: 'red',
  },
];

// Preguntas frecuentes
export const faqData: FAQItem[] = [
  // Primeros Pasos
  {
    id: 'what-is-brl-links',
    question: '¿Qué es BRL Links?',
    answer:
      'BRL Links es un acortador de URLs avanzado que te permite crear enlaces cortos personalizados, rastrear estadísticas detalladas y gestionar todos tus enlaces desde un dashboard intuitivo.',
    category: 'getting-started',
    tags: ['básico', 'introducción'],
  },
  {
    id: 'how-to-create-account',
    question: '¿Cómo creo una cuenta?',
    answer:
      'Puedes crear una cuenta haciendo clic en "Acceder" en la parte superior de la página. Ofrecemos registro con Google, GitHub, Discord o email tradicional.',
    category: 'getting-started',
    tags: ['cuenta', 'registro'],
  },
  {
    id: 'is-free',
    question: '¿Es gratis usar BRL Links?',
    answer:
      'Sí, BRL Links ofrece un plan gratuito generoso que incluye enlaces ilimitados, estadísticas básicas y personalización de enlaces. También tenemos planes premium con funciones avanzadas.',
    category: 'getting-started',
    tags: ['precio', 'gratis', 'planes'],
  },

  // Gestión de Enlaces
  {
    id: 'how-to-shorten-link',
    question: '¿Cómo acorto un enlace?',
    answer:
      'En tu dashboard, pega la URL larga en el campo "Enlace original", personaliza el enlace corto si deseas, y haz clic en "Crear Enlace". Tu enlace corto estará listo al instante.',
    category: 'link-management',
    tags: ['crear', 'acortar', 'básico'],
  },
  {
    id: 'custom-slugs',
    question: '¿Puedo personalizar mis enlaces cortos?',
    answer:
      'Sí, puedes crear enlaces personalizados como brl.ink/mi-enlace. Solo asegúrate de que el nombre no esté ya en uso.',
    category: 'link-management',
    tags: ['personalización', 'slug', 'custom'],
  },
  {
    id: 'edit-links',
    question: '¿Puedo editar un enlace después de crearlo?',
    answer:
      'Puedes editar el título, descripción y URL de destino de tus enlaces. El enlace corto no se puede cambiar una vez creado para mantener la consistencia.',
    category: 'link-management',
    tags: ['editar', 'modificar'],
  },
  {
    id: 'delete-links',
    question: '¿Cómo elimino un enlace?',
    answer:
      'En tu dashboard, encuentra el enlace que deseas eliminar y haz clic en el botón de eliminar (icono de papelera). Confirma la acción. Una vez eliminado, el enlace dejará de funcionar.',
    category: 'link-management',
    tags: ['eliminar', 'borrar'],
  },

  // Análisis y Estadísticas
  {
    id: 'view-analytics',
    question: '¿Cómo veo las estadísticas de mis enlaces?',
    answer:
      'En tu dashboard, haz clic en cualquier enlace para ver sus estadísticas detalladas, incluyendo clics totales, ubicaciones geográficas, dispositivos y más.',
    category: 'analytics',
    tags: ['estadísticas', 'análisis', 'clics'],
  },
  {
    id: 'analytics-data',
    question: '¿Qué datos de análisis puedo ver?',
    answer:
      'Puedes ver clics totales, clics únicos, ubicaciones geográficas, dispositivos, navegadores, fuentes de tráfico y gráficos de actividad a lo largo del tiempo.',
    category: 'analytics',
    tags: ['datos', 'métricas', 'información'],
  },

  // Cuenta y Configuración
  {
    id: 'change-password',
    question: '¿Cómo cambio mi contraseña?',
    answer:
      'Ve a Configuración en tu dashboard, busca la sección "Seguridad" y haz clic en "Cambiar contraseña". Si usas OAuth (Google, GitHub, etc.), gestiona tu contraseña en esa plataforma.',
    category: 'account',
    tags: ['contraseña', 'seguridad'],
  },
  {
    id: 'delete-account',
    question: '¿Cómo elimino mi cuenta?',
    answer:
      'En Configuración, ve a la sección "Cuenta" y busca "Eliminar cuenta". Esta acción es irreversible y eliminará todos tus enlaces y datos.',
    category: 'account',
    tags: ['eliminar', 'cuenta', 'datos'],
  },

  // Solución de Problemas
  {
    id: 'link-not-working',
    question: 'Mi enlace no funciona, ¿qué hago?',
    answer:
      'Verifica que el enlace original sea válido y esté activo. Si el problema persiste, revisa si el enlace fue eliminado o si hay problemas de conectividad.',
    category: 'troubleshooting',
    tags: ['error', 'no funciona', 'problema'],
  },
  {
    id: 'slow-redirects',
    question: '¿Por qué mis enlaces redirigen lentamente?',
    answer:
      'Nuestros enlaces normalmente redirigen en menos de 50ms. Si experimentas lentitud, puede ser debido a problemas de red o del sitio de destino.',
    category: 'troubleshooting',
    tags: ['lento', 'velocidad', 'rendimiento'],
  },
  {
    id: 'contact-support',
    question: '¿Cómo contacto al soporte?',
    answer:
      'Puedes contactarnos a través del formulario de contacto en nuestro sitio web o enviando un email a soporte@broslunas.com. Respondemos en menos de 24 horas.',
    category: 'troubleshooting',
    tags: ['soporte', 'contacto', 'ayuda'],
  },
];

// Guías paso a paso
export const guides: Guide[] = [
  {
    id: 'first-link',
    title: 'Crear tu primer enlace',
    description: 'Aprende a crear y personalizar tu primer enlace corto',
    category: 'getting-started',
    estimatedTime: '2 minutos',
    steps: [
      {
        title: 'Accede a tu dashboard',
        description:
          'Inicia sesión en tu cuenta y ve al dashboard principal donde verás el formulario de creación de enlaces.',
      },
      {
        title: 'Pega tu URL',
        description:
          'En el campo "Enlace original", pega la URL larga que deseas acortar. Asegúrate de incluir http:// o https://.',
      },
      {
        title: 'Personaliza (opcional)',
        description:
          'Si deseas un enlace personalizado, escribe tu texto preferido en el campo "Enlace personalizado". Debe ser único.',
      },
      {
        title: 'Agrega título y descripción',
        description:
          'Añade un título descriptivo y una descripción opcional para organizar mejor tus enlaces.',
      },
      {
        title: 'Crea el enlace',
        description:
          'Haz clic en "Crear Enlace" y tu enlace corto estará listo para usar y compartir.',
      },
    ],
  },
  {
    id: 'analytics-guide',
    title: 'Entender tus estadísticas',
    description:
      'Aprende a interpretar y usar los datos de análisis de tus enlaces',
    category: 'analytics',
    estimatedTime: '5 minutos',
    steps: [
      {
        title: 'Accede a las estadísticas',
        description:
          'En tu dashboard, haz clic en cualquier enlace para ver su página de estadísticas detalladas.',
      },
      {
        title: 'Revisa los clics totales',
        description:
          'El número principal muestra todos los clics. Los "clics únicos" muestran visitantes únicos basados en IP.',
      },
      {
        title: 'Analiza la geografía',
        description:
          'El mapa muestra de dónde vienen tus visitantes. Útil para entender tu audiencia global.',
      },
      {
        title: 'Examina dispositivos y navegadores',
        description:
          'Ve qué dispositivos y navegadores usan tus visitantes para optimizar tu contenido.',
      },
      {
        title: 'Usa los gráficos temporales',
        description:
          'Los gráficos muestran la actividad a lo largo del tiempo. Identifica patrones y picos de tráfico.',
      },
    ],
  },
  {
    id: 'api-setup',
    title: 'Configurar la API',
    description: 'Configura y usa la API de BRL Links en tus aplicaciones',
    category: 'api',
    estimatedTime: '10 minutos',
    steps: [
      {
        title: 'Genera tu token API',
        description:
          'Ve a Configuración > API en tu dashboard y genera un nuevo token de acceso. Guárdalo de forma segura.',
      },
      {
        title: 'Configura la autenticación',
        description:
          'Incluye tu token en el header Authorization: Bearer tu-token-aqui en todas las solicitudes.',
      },
      {
        title: 'Prueba la conexión',
        description:
          'Haz una solicitud GET a /api/user/profile para verificar que tu token funciona correctamente.',
      },
      {
        title: 'Crea enlaces via API',
        description:
          'Usa POST /api/links con los datos del enlace para crear enlaces programáticamente.',
      },
      {
        title: 'Consulta estadísticas',
        description:
          'Usa GET /api/links/:id/analytics para obtener datos de análisis de tus enlaces.',
      },
    ],
  },
];

// Función para buscar en FAQ
export const searchFAQ = (query: string, category?: string): FAQItem[] => {
  const searchTerm = query.toLowerCase();

  return faqData.filter(item => {
    const matchesCategory = !category || item.category === category;
    const matchesSearch =
      item.question.toLowerCase().includes(searchTerm) ||
      item.answer.toLowerCase().includes(searchTerm) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchTerm));

    return matchesCategory && matchesSearch;
  });
};

// Función para obtener FAQ por categoría
export const getFAQByCategory = (category: string): FAQItem[] => {
  return faqData.filter(item => item.category === category);
};

// Función para obtener guías por categoría
export const getGuidesByCategory = (category: string): Guide[] => {
  return guides.filter(guide => guide.category === category);
};
