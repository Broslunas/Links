'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { TempLinkCreator } from '@/components/TempLinkCreator';
import VideoPlayer from '@/components/VideoPlayer';
import { useEffect, useRef } from 'react';
import { Session } from 'next-auth';
import { GlobalStats } from './api/stats/global/route';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TextPlugin } from 'gsap/TextPlugin';

// Registrar plugins de GSAP
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, TextPlugin);
}

interface GSAPLandingProps {
  session: Session | null;
  globalStats: GlobalStats;
}

const AnimatedFeatureCard = ({
  icon,
  title,
  description,
  index,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current || !iconRef.current || !contentRef.current) return;

    const card = cardRef.current;
    const icon = iconRef.current;
    const content = contentRef.current;

    // Animación inicial
    gsap.set(card, { y: 100, opacity: 0, rotationX: -15 });
    gsap.set(icon, { scale: 0, rotation: -180 });
    gsap.set(content, { y: 30, opacity: 0 });

    // Animación de entrada con ScrollTrigger
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: card,
        start: 'top 80%',
        end: 'bottom 20%',
        toggleActions: 'play none none reverse',
      },
    });

    tl.to(card, {
      y: 0,
      opacity: 1,
      rotationX: 0,
      duration: 0.8,
      ease: 'back.out(1.7)',
      delay: index * 0.2,
    })
      .to(
        icon,
        {
          scale: 1,
          rotation: 0,
          duration: 0.6,
          ease: 'elastic.out(1, 0.5)',
        },
        '-=0.4'
      )
      .to(
        content,
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          ease: 'power2.out',
        },
        '-=0.3'
      );

    // Animaciones de hover
    const handleMouseEnter = () => {
      gsap.to(card, {
        y: -10,
        scale: 1.05,
        duration: 0.3,
        ease: 'power2.out',
      });
      gsap.to(icon, {
        rotation: 360,
        scale: 1.1,
        duration: 0.5,
        ease: 'power2.out',
      });
    };

    const handleMouseLeave = () => {
      gsap.to(card, {
        y: 0,
        scale: 1,
        duration: 0.3,
        ease: 'power2.out',
      });
      gsap.to(icon, {
        rotation: 0,
        scale: 1,
        duration: 0.5,
        ease: 'power2.out',
      });
    };

    card.addEventListener('mouseenter', handleMouseEnter);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mouseenter', handleMouseEnter);
      card.removeEventListener('mouseleave', handleMouseLeave);
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [index]);

  return (
    <div
      ref={cardRef}
      className="group relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden cursor-pointer"
    >
      {/* Gradient overlay animado */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Efecto de brillo */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

      {/* Icon */}
      <div
        ref={iconRef}
        className="relative z-10 w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg"
      >
        {icon}
      </div>

      {/* Content */}
      <div ref={contentRef} className="relative z-10 text-center">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
          {title}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
};

const AnimatedStatCard = ({
  number,
  label,
  color,
  index,
}: {
  number: string;
  label: string;
  color: string;
  index: number;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const numberRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current || !numberRef.current) return;

    const card = cardRef.current;
    const numberEl = numberRef.current;

    // Animación inicial
    gsap.set(card, { scale: 0, opacity: 0 });

    // Animación de entrada
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: card,
        start: 'top 85%',
        toggleActions: 'play none none reverse',
      },
    });

    tl.to(card, {
      scale: 1,
      opacity: 1,
      duration: 0.6,
      ease: 'back.out(1.7)',
      delay: index * 0.1,
    });

    // Animación del número si no es porcentaje
    if (number !== '99.9%') {
      const targetNumber = parseInt(number.replace(/[^0-9]/g, ''));
      if (targetNumber > 0) {
        gsap.to(
          { value: 0 },
          {
            value: targetNumber,
            duration: 2,
            ease: 'power2.out',
            delay: index * 0.1 + 0.5,
            onUpdate: function () {
              numberEl.textContent =
                Math.floor(this.targets()[0].value).toLocaleString() + '+';
            },
          }
        );
      }
    }

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [number, index]);

  return (
    <div ref={cardRef} className="text-center">
      <div
        ref={numberRef}
        className={`text-4xl md:text-5xl font-bold ${color} mb-2`}
      >
        {number === '99.9%' ? number : '0'}
      </div>
      <div className="text-gray-600 dark:text-gray-400 font-medium">
        {label}
      </div>
    </div>
  );
};

export default function GSAPLanding({
  session,
  globalStats,
}: GSAPLandingProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (
      !heroRef.current ||
      !titleRef.current ||
      !subtitleRef.current ||
      !ctaRef.current
    )
      return;

    const hero = heroRef.current;
    const title = titleRef.current;
    const subtitle = subtitleRef.current;
    const cta = ctaRef.current;
    const background = backgroundRef.current;

    // Configuración inicial
    gsap.set([title, subtitle, cta], { opacity: 0, y: 100 });
    gsap.set(background, { scale: 1.2, opacity: 0 });

    // Timeline principal del hero
    const masterTl = gsap.timeline({ delay: 0.5 });

    // Animación del fondo
    masterTl.to(background, {
      scale: 1,
      opacity: 1,
      duration: 2,
      ease: 'power2.out',
    });

    // Animación del título con efecto de escritura
    masterTl.to(
      title,
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
      },
      '-=1.5'
    );

    // Animación del subtítulo
    masterTl.to(
      subtitle,
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out',
      },
      '-=0.5'
    );

    // Animación del CTA
    masterTl.to(
      cta,
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'back.out(1.7)',
      },
      '-=0.3'
    );

    // Efecto de parallax en el scroll
    gsap.to(hero, {
      yPercent: -50,
      ease: 'none',
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });

    // Partículas flotantes
    const createFloatingElements = () => {
      for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'absolute w-2 h-2 bg-blue-400/30 rounded-full';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        hero.appendChild(particle);

        gsap.to(particle, {
          y: -100,
          x: Math.random() * 200 - 100,
          opacity: 0,
          duration: Math.random() * 3 + 2,
          repeat: -1,
          delay: Math.random() * 2,
          ease: 'power1.out',
        });
      }
    };

    createFloatingElements();

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  const features = [
    {
      icon: (
        <svg
          className="w-10 h-10 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
          />
        </svg>
      ),
      title: 'Acortamiento Inteligente',
      description:
        'URLs personalizables con dominios propios y aliases únicos para una mejor marca personal y profesional.',
    },
    {
      icon: (
        <svg
          className="w-10 h-10 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      title: 'Análisis Avanzado',
      description:
        'Estadísticas detalladas con geolocalización, dispositivos, referrers y análisis temporal en tiempo real.',
    },
    {
      icon: (
        <svg
          className="w-10 h-10 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      ),
      title: 'Códigos QR Dinámicos',
      description:
        'Genera códigos QR personalizables que se actualizan automáticamente con tus enlaces y diseños únicos.',
    },
  ];

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Fondo animado */}
      <div
        ref={backgroundRef}
        className="fixed inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20 dark:from-blue-900/40 dark:via-purple-900/40 dark:to-pink-900/40 pointer-events-none"
      />

      <div className="relative z-10">
        {/* Hero Section */}
        <section
          ref={heroRef}
          className="relative min-h-screen flex items-center justify-center overflow-hidden"
        >
          {/* Background SVG */}
          <div className="absolute inset-0 opacity-60">
            <img
              src="/hero-bg.svg"
              alt=""
              className="w-full h-full object-cover"
              style={{ mixBlendMode: 'screen' }}
            />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h1
              ref={titleRef}
              className="text-6xl md:text-8xl lg:text-9xl font-bold mb-8"
            >
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Broslunas
              </span>
              <br />
              <span className="text-gray-900 dark:text-white">Links</span>
            </h1>

            <p
              ref={subtitleRef}
              className="text-xl md:text-2xl lg:text-3xl text-gray-600 dark:text-gray-300 mb-12 max-w-5xl mx-auto leading-relaxed"
            >
              El acortador de URLs más avanzado con animaciones espectaculares,
              <br className="hidden md:block" />
              análisis en tiempo real y gestión profesional de enlaces.
            </p>

            <div
              ref={ctaRef}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            >
              {session ? (
                <Link href="/dashboard">
                  <Button
                    size="lg"
                    className="text-xl px-12 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-2xl transform hover:scale-105 transition-all duration-300"
                  >
                    Ir al Dashboard
                  </Button>
                </Link>
              ) : (
                <Link href="/auth/signin">
                  <Button
                    size="lg"
                    className="text-xl px-12 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-2xl transform hover:scale-105 transition-all duration-300"
                  >
                    Comenzar Gratis
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-32 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-8">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Números que Impresionan
                </span>
              </h2>
              <p className="text-2xl text-gray-600 dark:text-gray-300">
                La confianza de miles de usuarios en cifras reales
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-32">
              <AnimatedStatCard
                number={globalStats.totalLinks.toString()}
                label="Enlaces Creados"
                color="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent"
                index={0}
              />
              <AnimatedStatCard
                number={globalStats.totalClicks.toString()}
                label="Clics Registrados"
                color="bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent"
                index={1}
              />
              <AnimatedStatCard
                number={globalStats.activeUsers.toString()}
                label="Usuarios Activos"
                color="bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent"
                index={2}
              />
              <AnimatedStatCard
                number={globalStats.uptime}
                label="Tiempo Activo"
                color="bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent"
                index={3}
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-32 relative overflow-hidden">
          {/* Features Background SVG */}
          <div className="absolute inset-0 opacity-40">
            <img
              src="/features-bg.svg"
              alt=""
              className="w-full h-full object-cover"
              style={{ mixBlendMode: 'multiply' }}
            />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-20">
              <h2 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-8">
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Características
                </span>
                <br />
                <span className="text-gray-900 dark:text-white">
                  Principales
                </span>
              </h2>
              <p className="text-2xl text-gray-600 dark:text-gray-300">
                Todo lo que necesitas para gestionar tus enlaces de forma
                profesional
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-12 mb-20">
              {features.map((feature, index) => (
                <AnimatedFeatureCard key={index} {...feature} index={index} />
              ))}
            </div>

            <div className="text-center mb-20">
              <Link href="/features">
                <Button
                  variant="outline"
                  size="lg"
                  className="text-xl px-10 py-5 border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold transform hover:scale-105 transition-all duration-300"
                >
                  Ver Todas las Características
                </Button>
              </Link>
            </div>

            {/* Demo Videos Section */}
            <div className="grid md:grid-cols-2 gap-12">
              <VideoPlayer
                title="Demo: Creación de Enlaces"
                description="Aprende cómo crear y personalizar enlaces cortos en segundos"
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg shadow-xl border border-gray-200/50 dark:border-gray-700/50"
                poster="/demo-link-creation-poster.jpg"
              />

              <VideoPlayer
                title="Demo: Análisis Avanzado"
                description="Descubre insights detallados sobre el rendimiento de tus enlaces"
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg shadow-xl border border-gray-200/50 dark:border-gray-700/50"
                poster="/demo-analytics-poster.jpg"
              />
            </div>
          </div>
        </section>

        {/* Try It Now Section */}
        {!session && (
          <section className="py-32 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 dark:from-blue-400/10 dark:to-purple-400/10" />
            <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-3xl p-16 shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
                <div className="text-center mb-16">
                  <h2 className="text-5xl md:text-6xl font-bold mb-8">
                    <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                      Pruébalo Ahora
                    </span>
                  </h2>
                  <p className="text-2xl text-gray-600 dark:text-gray-300">
                    Crea tu primer enlace temporal sin necesidad de registro
                  </p>
                </div>

                <div className="max-w-md mx-auto">
                  <TempLinkCreator />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Video Showcase Section */}
        <section className="py-32 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500 rounded-full blur-3xl animate-pulse"></div>
            <div
              className="absolute bottom-20 right-10 w-40 h-40 bg-purple-500 rounded-full blur-3xl animate-pulse"
              style={{ animationDelay: '1s' }}
            ></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-20">
              <h2 className="text-5xl md:text-6xl font-bold mb-6">
                <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                  Ve Broslunas Link en Acción
                </span>
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Descubre cómo nuestras herramientas pueden transformar tu
                gestión de enlaces
              </p>
            </div>

            {/* Main Feature Video */}
            <div className="mb-20">
              <VideoPlayer
                src="https://ia903405.us.archive.org/27/items/archive-video-files/test.mp4"
                title="Tour Completo de Broslunas Link"
                description="Una guía completa de todas las características y funcionalidades de la plataforma"
                className="max-w-4xl mx-auto shadow-2xl"
                poster="https://fotografias.lasexta.com/clipping/cmsimages01/2019/05/29/9B89AC82-4176-4127-89A2-F38F13E0A84E/98.jpg?crop=1280,720,x0,y0&width=1900&height=1069&optimize=high&format=webply"
              />
            </div>

            {/* Tutorial Grid */}
            <div className="grid md:grid-cols-3 gap-8">
              <VideoPlayer
                title="Configuración Inicial"
                description="Cómo configurar tu cuenta y primeros pasos"
                className="shadow-xl"
                poster="https://fotografias.lasexta.com/clipping/cmsimages01/2019/05/29/9B89AC82-4176-4127-89A2-F38F13E0A84E/98.jpg?crop=1280,720,x0,y0&width=1900&height=1069&optimize=high&format=webply"
              />

              <VideoPlayer
                title="QR Codes Dinámicos"
                description="Genera y personaliza códigos QR para tus enlaces"
                className="shadow-xl"
                poster="https://fotografias.lasexta.com/clipping/cmsimages01/2019/05/29/9B89AC82-4176-4127-89A2-F38F13E0A84E/98.jpg?crop=1280,720,x0,y0&width=1900&height=1069&optimize=high&format=webply"
              />

              <VideoPlayer
                title="Análisis Detallado"
                description="Interpreta las métricas y optimiza tu estrategia"
                className="shadow-xl"
                poster="https://fotografias.lasexta.com/clipping/cmsimages01/2019/05/29/9B89AC82-4176-4127-89A2-F38F13E0A84E/98.jpg?crop=1280,720,x0,y0&width=1900&height=1069&optimize=high&format=webply"
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-16 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-black/10" />
              <div className="relative z-10">
                <h2 className="text-5xl md:text-6xl font-bold mb-8">
                  ¿Listo para optimizar tus enlaces?
                </h2>
                <p className="text-2xl mb-12 opacity-90">
                  Únete a miles de usuarios que ya confían en Broslunas Links
                  <br className="hidden md:block" />
                  para gestionar sus URLs de forma profesional
                </p>
                <div className="flex flex-col sm:flex-row gap-8 justify-center items-center">
                  {!session && (
                    <Link href="/auth/signin">
                      <Button
                        size="lg"
                        className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-12 py-6 text-xl transform hover:scale-105 transition-all duration-300"
                      >
                        Crear Cuenta Gratis
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
