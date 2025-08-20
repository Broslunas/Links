'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
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
import { Search, HelpCircle, BookOpen, ArrowLeft, MessageCircle, Home } from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// Animated Category Card Component
const AnimatedCategoryCard = ({ category, itemCount }: { category: any; itemCount: number }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;

    const card = cardRef.current;

    // Entrance animation
    gsap.fromTo(card, 
      { 
        opacity: 0, 
        y: 50,
        scale: 0.9
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: card,
          start: "top 80%",
          toggleActions: "play none none reverse"
        }
      }
    );

    // Hover animations
    const handleMouseEnter = () => {
      gsap.to(card, {
        y: -10,
        scale: 1.05,
        duration: 0.3,
        ease: "power2.out"
      });
    };

    const handleMouseLeave = () => {
      gsap.to(card, {
        y: 0,
        scale: 1,
        duration: 0.3,
        ease: "power2.out"
      });
    };

    card.addEventListener('mouseenter', handleMouseEnter);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mouseenter', handleMouseEnter);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div ref={cardRef} className="group cursor-pointer">
      <div className="relative overflow-hidden rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 p-8 h-full transition-all duration-300 hover:bg-white/20 hover:border-white/30">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Icon */}
        <div className="relative z-10 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
            <category.icon className="w-8 h-8 text-white" />
          </div>
        </div>
        
        {/* Content */}
        <div className="relative z-10">
          <h3 className="text-xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 transition-all duration-300">
            {category.title}
          </h3>
          <p className="text-gray-300 mb-4 leading-relaxed">
            {category.description}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-300 font-medium">
              {itemCount} recursos disponibles
            </span>
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors duration-300">
              <svg className="w-4 h-4 text-white transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Dynamic Background Component
const DynamicBackground = () => {
  const backgroundRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!backgroundRef.current) return;

    const container = backgroundRef.current;
    const orbs: HTMLDivElement[] = [];

    // Create floating orbs
    for (let i = 0; i < 6; i++) {
      const orb = document.createElement('div');
      orb.className = 'absolute rounded-full opacity-20 blur-xl';
      
      const size = Math.random() * 300 + 100;
      const colors = [
        'bg-blue-500',
        'bg-purple-500', 
        'bg-pink-500',
        'bg-indigo-500',
        'bg-cyan-500'
      ];
      
      orb.classList.add(colors[Math.floor(Math.random() * colors.length)]);
      orb.style.width = `${size}px`;
      orb.style.height = `${size}px`;
      orb.style.left = `${Math.random() * 100}%`;
      orb.style.top = `${Math.random() * 100}%`;
      
      container.appendChild(orb);
      orbs.push(orb);

      // Animate orbs
      gsap.to(orb, {
        x: `+=${Math.random() * 200 - 100}`,
        y: `+=${Math.random() * 200 - 100}`,
        duration: Math.random() * 20 + 10,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
    }

    return () => {
      orbs.forEach(orb => orb.remove());
    };
  }, []);

  return (
    <div ref={backgroundRef} className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" />
    </div>
  );
};

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'faq' | 'guides'>('all');
  const heroRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    // Hero section animation
    if (heroRef.current) {
      const tl = gsap.timeline();
      
      tl.fromTo(heroRef.current.querySelector('h1'),
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 1, ease: "power3.out" }
      )
      .fromTo(heroRef.current.querySelector('p'),
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" },
        "-=0.5"
      )
      .fromTo(heroRef.current.querySelector('.search-container'),
        { opacity: 0, y: 30, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "power3.out" },
        "-=0.3"
      );
    }

    // Categories stagger animation
    if (categoriesRef.current) {
      gsap.fromTo(categoriesRef.current.querySelectorAll('.category-item'),
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: categoriesRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse"
          }
        }
      );
    }
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <DynamicBackground />
      
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-16">
          {/* Header */}
          <div ref={heroRef} className="max-w-4xl mx-auto text-center mb-16">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent leading-tight">
              Centro de Ayuda
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-12 leading-relaxed max-w-3xl mx-auto">
              Encuentra respuestas a tus preguntas y aprende a usar{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent font-semibold">
                Broslunas Links
              </span>
            </p>

            {/* Search Box */}
            <div className="search-container relative max-w-2xl mx-auto">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-xl" />
                <div className="relative bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-2">
                  <SearchBox onSearch={handleSearch} className="!bg-transparent !border-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Categories */}
          {!searchQuery && !selectedCategory && (
            <div ref={categoriesRef} className="max-w-7xl mx-auto mb-20">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Explora por Categorías
                </h2>
                <p className="text-gray-400 text-lg">
                  Encuentra exactamente lo que necesitas
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {helpCategories.map((category, index) => {
                  const categoryFAQs = getFAQByCategory(category.id);
                  const categoryGuides = getGuidesByCategory(category.id);
                  const totalItems = categoryFAQs.length + categoryGuides.length;

                  return (
                    <div key={category.id} className="category-item" onClick={() => handleCategorySelect(category.id)}>
                      <AnimatedCategoryCard
                        category={category}
                        itemCount={totalItems}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Content Tabs - Solo mostrar cuando hay búsqueda o categoría seleccionada */}
          {(searchQuery || selectedCategory) && (
            <div className="max-w-6xl mx-auto">
              {/* Breadcrumb */}
              <div className="mb-8">
                <nav className="flex items-center space-x-3 text-sm">
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory(null);
                    }}
                    className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors duration-200 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10"
                  >
                    <Home className="w-4 h-4" />
                    <span>Centro de Ayuda</span>
                  </button>
                  {selectedCategory && (
                    <>
                      <span className="text-gray-500">/</span>
                      <span className="text-white bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/20">
                        {helpCategories.find(cat => cat.id === selectedCategory)?.title}
                      </span>
                    </>
                  )}
                  {searchQuery && (
                    <>
                      <span className="text-gray-500">/</span>
                      <span className="text-white bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/20">
                        Resultados para "{searchQuery}"
                      </span>
                    </>
                  )}
                </nav>
              </div>

              {/* Tabs */}
              <div className="mb-12">
                <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-2">
                  <nav className="flex space-x-2">
                    <button
                      onClick={() => setActiveTab('all')}
                      className={cn(
                        'flex-1 py-3 px-6 rounded-xl font-medium text-sm transition-all duration-200',
                        activeTab === 'all'
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      )}
                    >
                      Todo ({filteredContent.faqs.length + filteredContent.guides.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('faq')}
                      className={cn(
                        'flex-1 py-3 px-6 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center space-x-2',
                        activeTab === 'faq'
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      )}
                    >
                      <HelpCircle className="w-4 h-4" />
                      <span>FAQ ({filteredContent.faqs.length})</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('guides')}
                      className={cn(
                        'flex-1 py-3 px-6 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center space-x-2',
                        activeTab === 'guides'
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      )}
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>Guías ({filteredContent.guides.length})</span>
                    </button>
                  </nav>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-16">
                {/* FAQs */}
                {(activeTab === 'all' || activeTab === 'faq') &&
                  filteredContent.faqs.length > 0 && (
                    <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-8">
                      <h3 className="text-2xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center space-x-3">
                        <HelpCircle className="w-6 h-6 text-blue-400" />
                        <span>Preguntas Frecuentes</span>
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
                    <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-8">
                      <h3 className="text-2xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center space-x-3">
                        <BookOpen className="w-6 h-6 text-purple-400" />
                        <span>Guías Paso a Paso</span>
                      </h3>
                      <GuideList guides={filteredContent.guides} />
                    </div>
                  )}

                {/* No results */}
                {filteredContent.faqs.length === 0 &&
                  filteredContent.guides.length === 0 && (
                    <div className="text-center py-20">
                      <div className="relative mb-8">
                        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10">
                          <Search className="w-12 h-12 text-gray-400" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-xl" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-4">
                        No se encontraron resultados
                      </h3>
                      <p className="text-gray-400 mb-8 text-lg max-w-md mx-auto">
                        Intenta con otros términos de búsqueda o explora las categorías.
                      </p>
                      <Button
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedCategory(null);
                        }}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        Ver todas las categorías
                      </Button>
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="max-w-4xl mx-auto mt-20">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-xl" />
              <div className="relative bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-12 text-center">
                <div className="mb-6">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                    <MessageCircle className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  ¿No encuentras lo que buscas?
                </h3>
                <p className="text-gray-300 mb-8 text-lg leading-relaxed max-w-2xl mx-auto">
                  Nuestro equipo de soporte está aquí para ayudarte con cualquier pregunta o problema que tengas.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="https://broslunas.com/contacto">
                    <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105">
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Contactar Soporte
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button className="bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30 px-8 py-4 rounded-xl font-medium transition-all duration-200 backdrop-blur-sm">
                      Ir al Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Back to Home */}
          <div className="text-center mt-12">
            <Link href="/">
              <Button className="bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 hover:border-white/20 px-6 py-3 rounded-xl font-medium transition-all duration-200 backdrop-blur-sm flex items-center space-x-2 mx-auto">
                <ArrowLeft className="w-4 h-4" />
                <span>Volver al Inicio</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
