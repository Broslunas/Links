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
  content: string;
  code?: string;
  tip?: string;
  image?: string;
}

export interface Guide {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'Principiante' | 'Intermedio' | 'Avanzado';
  steps: GuideStep[];
  estimatedTime: string;
}

// Categorías de ayuda
export const helpCategories: HelpCategory[] = [
  {
    id: 'getting-started',
    title: 'Primeros Pasos',
    description: 'Aprende lo básico para comenzar a usar Broslunas Links',
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
    id: 'what-is-broslunas-link',
    question: '¿Qué es Broslunas Links?',
    answer:
      'Broslunas Links es un acortador de URLs avanzado que te permite crear enlaces cortos personalizados, rastrear estadísticas detalladas y gestionar todos tus enlaces desde un dashboard intuitivo.',
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
    question: '¿Es gratis usar Broslunas Links?',
    answer:
      'Sí, Broslunas Links ofrece un plan gratuito generoso que incluye enlaces ilimitados, estadísticas básicas y personalización de enlaces. También tenemos planes premium con funciones avanzadas.',
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
      'Sí, puedes crear enlaces personalizados como broslunas.link/mi-enlace. Solo asegúrate de que el nombre no esté ya en uso.',
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
    id: 'crear-primer-enlace',
    slug: 'crear-primer-enlace',
    title: 'Crear tu primer enlace',
    description:
      'Aprende a crear y personalizar tu primer enlace corto paso a paso',
    category: 'getting-started',
    difficulty: 'Principiante',
    estimatedTime: '2 minutos',
    steps: [
      {
        title: 'Accede a tu dashboard',
        content:
          'Inicia sesión en tu cuenta y ve al dashboard principal donde verás el formulario de creación de enlaces.\n\nUna vez que hayas iniciado sesión, serás redirigido automáticamente a tu panel de control personal.',
        tip: 'Si es tu primera vez, tómate un momento para familiarizarte con la interfaz.',
      },
      {
        title: 'Pega tu URL',
        content:
          'En el campo "Enlace original", pega la URL larga que deseas acortar. Asegúrate de incluir http:// o https://.\n\nEjemplo de URL válida: https://www.ejemplo.com/pagina-muy-larga-con-parametros',
        code: 'https://www.ejemplo.com/mi-pagina-larga?param1=valor&param2=otro-valor',
        tip: 'Las URLs sin protocolo (http/https) pueden no funcionar correctamente.',
      },
      {
        title: 'Personaliza (opcional)',
        content:
          'Si deseas un enlace personalizado, escribe tu texto preferido en el campo "Enlace personalizado". Debe ser único.\n\nPor ejemplo, en lugar de broslunas.link/abc123, puedes tener broslunas.link/mi-enlace',
        tip: 'Los enlaces personalizados son más fáciles de recordar y compartir.',
      },
      {
        title: 'Agrega título y descripción',
        content:
          'Añade un título descriptivo y una descripción opcional para organizar mejor tus enlaces.\n\nEsto te ayudará a identificar rápidamente tus enlaces en el dashboard.',
        tip: 'Un buen título te ahorrará tiempo cuando busques enlaces específicos más tarde.',
      },
      {
        title: 'Crea el enlace',
        content:
          'Haz clic en "Crear Enlace" y tu enlace corto estará listo para usar y compartir.\n\nEl sistema verificará que tu enlace personalizado esté disponible y creará el enlace inmediatamente.',
        tip: 'Copia el enlace inmediatamente después de crearlo para empezar a usarlo.',
      },
    ],
  },
  {
    id: 'entender-estadisticas',
    slug: 'entender-estadisticas',
    title: 'Entender tus estadísticas',
    description:
      'Aprende a interpretar y usar los datos de análisis de tus enlaces para optimizar tu estrategia',
    category: 'analytics',
    difficulty: 'Intermedio',
    estimatedTime: '5 minutos',
    steps: [
      {
        title: 'Accede a las estadísticas',
        content:
          'En tu dashboard, haz clic en cualquier enlace para ver su página de estadísticas detalladas.\n\nTambién puedes usar el botón "Ver Analytics" que aparece al pasar el cursor sobre cada enlace.',
        tip: 'Los enlaces con más clics aparecen primero en tu dashboard.',
      },
      {
        title: 'Revisa los clics totales',
        content:
          'El número principal muestra todos los clics. Los "clics únicos" muestran visitantes únicos basados en IP.\n\nLa diferencia entre ambos te indica si tienes visitantes recurrentes.',
        tip: 'Un alto ratio de clics únicos vs totales indica contenido viral o de una sola visita.',
      },
      {
        title: 'Analiza la geografía',
        content:
          'El mapa muestra de dónde vienen tus visitantes. Útil para entender tu audiencia global.\n\nPuedes hacer clic en cada país para ver estadísticas más detalladas.',
        tip: 'Usa esta información para adaptar tu contenido a diferentes regiones.',
      },
      {
        title: 'Examina dispositivos y navegadores',
        content:
          'Ve qué dispositivos y navegadores usan tus visitantes para optimizar tu contenido.\n\nEsta información es crucial para el diseño responsive.',
        tip: 'Si la mayoría usa móviles, asegúrate de que tu sitio de destino sea mobile-friendly.',
      },
      {
        title: 'Usa los gráficos temporales',
        content:
          'Los gráficos muestran la actividad a lo largo del tiempo. Identifica patrones y picos de tráfico.\n\nPuedes cambiar el rango de fechas para análisis más específicos.',
        tip: 'Los picos de tráfico pueden indicar cuándo tu audiencia está más activa.',
      },
    ],
  },
  {
    id: 'crear-enlaces-masivos',
    slug: 'crear-enlaces-masivos',
    title: 'Crear enlaces en lote',
    description:
      'Aprende a crear múltiples enlaces de forma eficiente usando herramientas avanzadas',
    category: 'link-management',
    difficulty: 'Intermedio',
    estimatedTime: '8 minutos',
    steps: [
      {
        title: 'Prepara tu lista de URLs',
        content:
          'Organiza todas las URLs que deseas acortar en un archivo CSV o lista de texto.\n\nCada línea debe contener una URL válida con su protocolo (http/https).',
        code: 'https://ejemplo.com/pagina1\nhttps://ejemplo.com/pagina2\nhttps://ejemplo.com/pagina3',
        tip: 'Verifica que todas las URLs sean válidas antes de proceder.',
      },
      {
        title: 'Accede a la herramienta de lote',
        content:
          'En tu dashboard, busca la opción "Crear en lote" o "Bulk Creation" en el menú de herramientas.\n\nEsta función está disponible para usuarios con plan premium.',
        tip: 'Si no ves esta opción, considera actualizar tu plan para acceder a funciones avanzadas.',
      },
      {
        title: 'Carga tu archivo',
        content:
          'Sube tu archivo CSV o pega tu lista de URLs en el campo de texto proporcionado.\n\nEl sistema validará automáticamente cada URL antes de procesarla.',
        tip: 'Puedes procesar hasta 1000 URLs de una vez con el plan premium.',
      },
      {
        title: 'Configura opciones globales',
        content:
          'Define configuraciones que se aplicarán a todos los enlaces: prefijo personalizado, etiquetas, fecha de expiración.\n\nEstas opciones te ayudarán a organizar mejor tus enlaces masivos.',
        tip: 'Usa etiquetas descriptivas para poder filtrar fácilmente tus enlaces después.',
      },
      {
        title: 'Procesa y descarga resultados',
        content:
          'Inicia el proceso de creación masiva y descarga el archivo con todos los enlaces cortos generados.\n\nEl archivo incluirá la URL original, el enlace corto y cualquier error encontrado.',
        tip: 'Guarda el archivo de resultados como respaldo de todos tus enlaces creados.',
      },
    ],
  },
  {
    id: 'dominios-personalizados',
    slug: 'dominios-personalizados',
    title: 'Configurar dominios personalizados',
    description: 'Usa tu propio dominio para crear enlaces cortos con tu marca',
    category: 'account',
    difficulty: 'Avanzado',
    estimatedTime: '15 minutos',
    steps: [
      {
        title: 'Prepara tu dominio',
        content:
          'Necesitas tener un dominio propio y acceso a su configuración DNS.\n\nPuedes usar un subdominio como links.tudominio.com o un dominio completamente nuevo.',
        tip: 'Los subdominios son más fáciles de configurar y no afectan tu sitio web principal.',
      },
      {
        title: 'Agrega el dominio en Broslunas Links',
        content:
          'Ve a Configuración > Dominios personalizados y agrega tu dominio.\n\nEl sistema te proporcionará los registros DNS que necesitas configurar.',
        code: 'Tipo: CNAME\nNombre: links\nValor: custom.broslunas.link',
        tip: 'Copia exactamente los valores proporcionados para evitar errores de configuración.',
      },
      {
        title: 'Configura los registros DNS',
        content:
          'En tu proveedor de DNS, agrega los registros CNAME proporcionados por Broslunas Links.\n\nLos cambios DNS pueden tardar hasta 24 horas en propagarse completamente.',
        tip: 'Usa herramientas como nslookup o dig para verificar que los cambios se hayan aplicado.',
      },
      {
        title: 'Verifica la configuración',
        content:
          'Regresa a Broslunas Links y verifica tu dominio. El sistema confirmará que la configuración es correcta.\n\nUna vez verificado, podrás usar tu dominio personalizado inmediatamente.',
        tip: 'Si la verificación falla, espera unas horas más para que se complete la propagación DNS.',
      },
      {
        title: 'Crea enlaces con tu dominio',
        content:
          'Al crear nuevos enlaces, selecciona tu dominio personalizado de la lista desplegable.\n\nTodos los enlaces futuros usarán tu dominio por defecto si así lo configuras.',
        tip: 'Los enlaces con dominio personalizado se ven más profesionales y generan más confianza.',
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
