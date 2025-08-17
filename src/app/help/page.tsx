'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import {
  SearchBox,
  CategoryCard,
  FAQList,
  GuideList,
  helpCategories,
  faqData,
  guides,
  searchFAQ,
  getFAQByCategory,
  getGuidesByCategory,
} from '@/components/help-center';
import { cn } from '@/lib/utils';

// Metadata se maneja en layout.tsx o se puede mover a un componente separado
// para páginas client-side

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'faq' | 'guides'>('all');

  // Filtrar contenido basado en búsqueda y categoría
  const filteredContent = useMemo(() => {
    let filteredFAQs = faqData;
    let filteredGuides = guides;

    // Aplicar filtro de búsqueda
    if (searchQuery) {
      filteredFAQs = searchFAQ(searchQuery, selectedCategory || undefined);
      filteredGuides = guides.filter(
        guide =>
          guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          guide.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          !selectedCategory ||
          guide.category === selectedCategory
      );
    } else if (selectedCategory) {
      filteredFAQs = getFAQByCategory(selectedCategory);
      filteredGuides = getGuidesByCategory(selectedCategory);
    }

    return { faqs: filteredFAQs, guides: filteredGuides };
  }, [searchQuery, selectedCategory]);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
    setSearchQuery(''); // Limpiar búsqueda al seleccionar categoría
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSelectedCategory(null); // Limpiar categoría al buscar
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Centro de Ayuda
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Encuentra respuestas a tus preguntas y aprende a usar Broslunas
            Links
          </p>

          {/* Search Box */}
          <SearchBox onSearch={handleSearch} className="mb-8" />
        </div>

        {/* Categories */}
        {!searchQuery && !selectedCategory && (
          <div className="max-w-6xl mx-auto mb-16">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
              Explora por Categorías
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {helpCategories.map(category => {
                const categoryFAQs = getFAQByCategory(category.id);
                const categoryGuides = getGuidesByCategory(category.id);
                const totalItems = categoryFAQs.length + categoryGuides.length;

                return (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    showCount
                    itemCount={totalItems}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Content Tabs - Solo mostrar cuando hay búsqueda o categoría seleccionada */}
        {(searchQuery || selectedCategory) && (
          <div className="max-w-6xl mx-auto">
            {/* Breadcrumb */}
            <div className="mb-6">
              <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory(null);
                  }}
                  className="hover:text-gray-700 dark:hover:text-gray-200"
                >
                  Centro de Ayuda
                </button>
                {selectedCategory && (
                  <>
                    <span>/</span>
                    <span className="text-gray-900 dark:text-white">
                      {
                        helpCategories.find(cat => cat.id === selectedCategory)
                          ?.title
                      }
                    </span>
                  </>
                )}
                {searchQuery && (
                  <>
                    <span>/</span>
                    <span className="text-gray-900 dark:text-white">
                      Resultados para "{searchQuery}"
                    </span>
                  </>
                )}
              </nav>
            </div>

            {/* Tabs */}
            <div className="mb-8">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={cn(
                      'py-2 px-1 border-b-2 font-medium text-sm',
                      activeTab === 'all'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                    )}
                  >
                    Todo (
                    {filteredContent.faqs.length +
                      filteredContent.guides.length}
                    )
                  </button>
                  <button
                    onClick={() => setActiveTab('faq')}
                    className={cn(
                      'py-2 px-1 border-b-2 font-medium text-sm',
                      activeTab === 'faq'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                    )}
                  >
                    Preguntas Frecuentes ({filteredContent.faqs.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('guides')}
                    className={cn(
                      'py-2 px-1 border-b-2 font-medium text-sm',
                      activeTab === 'guides'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                    )}
                  >
                    Guías ({filteredContent.guides.length})
                  </button>
                </nav>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-12">
              {/* FAQs */}
              {(activeTab === 'all' || activeTab === 'faq') &&
                filteredContent.faqs.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                      Preguntas Frecuentes
                    </h3>
                    <FAQList
                      faqs={filteredContent.faqs}
                      showCategory={!selectedCategory}
                    />
                  </div>
                )}

              {/* Guides */}
              {(activeTab === 'all' || activeTab === 'guides') &&
                filteredContent.guides.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                      Guías Paso a Paso
                    </h3>
                    <GuideList guides={filteredContent.guides} />
                  </div>
                )}

              {/* No results */}
              {filteredContent.faqs.length === 0 &&
                filteredContent.guides.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No se encontraron resultados
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                      Intenta con otros términos de búsqueda o explora las
                      categorías.
                    </p>
                    <Button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory(null);
                      }}
                      variant="outline"
                    >
                      Ver todas las categorías
                    </Button>
                  </div>
                )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="max-w-4xl mx-auto mt-16 text-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              ¿No encuentras lo que buscas?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Nuestro equipo de soporte está aquí para ayudarte.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="https://broslunas.com/contacto">
                <Button variant="default" size="lg">
                  Contactar Soporte
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" size="lg">
                  Ir al Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-8">
          <Link href="/">
            <Button variant="outline">← Volver al Inicio</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
