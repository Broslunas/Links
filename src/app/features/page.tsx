'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const AnimatedFeatureCard = ({
  icon,
  title,
  description,
  features,
  index,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
  index: number;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    const icon = iconRef.current;
    const content = contentRef.current;
    
    if (!card || !icon || !content) return;

    // Set initial states
    gsap.set(card, {
      opacity: 0,
      y: 60,
      scale: 0.9,
      rotationX: 15
    });

    gsap.set(icon, {
      scale: 0,
      rotation: -180
    });

    gsap.set(content.children, {
      opacity: 0,
      y: 20
    });

    // Create entrance animation
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: card,
        start: "top 85%",
        end: "bottom 15%",
        toggleActions: "play none none reverse"
      }
    });

    tl.to(card, {
      opacity: 1,
      y: 0,
      scale: 1,
      rotationX: 0,
      duration: 0.8,
      ease: "back.out(1.7)",
      delay: index * 0.1
    })
    .to(icon, {
      scale: 1,
      rotation: 0,
      duration: 0.6,
      ease: "back.out(2)"
    }, "-=0.4")
    .to(content.children, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      stagger: 0.1,
      ease: "power2.out"
    }, "-=0.3");

    // Hover animations
    const handleMouseEnter = () => {
      gsap.to(card, {
        y: -10,
        scale: 1.02,
        duration: 0.3,
        ease: "power2.out"
      });
      gsap.to(icon, {
        scale: 1.1,
        rotation: 5,
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
      gsap.to(icon, {
        scale: 1,
        rotation: 0,
        duration: 0.3,
        ease: "power2.out"
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
      className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 dark:border-gray-700/20 overflow-hidden cursor-pointer"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-all duration-500" />
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-r from-blue-400/20 to-purple-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
      <div className="absolute -bottom-20 -left-20 w-32 h-32 bg-gradient-to-r from-purple-400/20 to-pink-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />

      {/* Icon */}
      <div 
        ref={iconRef}
        className="relative z-10 w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl"
      >
        {icon}
      </div>

      {/* Content */}
      <div ref={contentRef} className="relative z-10 text-center">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
          {title}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
          {description}
        </p>
        <ul className="space-y-3 text-left">
          {features.map((feature, featureIndex) => (
            <li
              key={featureIndex}
              className="flex items-center text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors duration-300"
            >
              <div className="w-5 h-5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const AnimatedStatCard = ({
  number,
  label,
  suffix = '',
  index,
}: {
  number: string;
  label: string;
  suffix?: string;
  index: number;
}) => {
  const [count, setCount] = useState(0);
  const statRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stat = statRef.current;
    if (!stat) return;

    gsap.set(stat, {
      opacity: 0,
      y: 30,
      scale: 0.8
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: stat,
        start: "top 90%",
        toggleActions: "play none none reverse"
      }
    });

    tl.to(stat, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.6,
      ease: "back.out(1.7)",
      delay: index * 0.1,
      onComplete: () => {
        // Animate counter
        const target = parseInt(number.replace(/[^0-9]/g, ''));
        const duration = 2000;
        const steps = 60;
        const increment = target / steps;
        let current = 0;

        const timer = setInterval(() => {
          current += increment;
          if (current >= target) {
            setCount(target);
            clearInterval(timer);
          } else {
            setCount(Math.floor(current));
          }
        }, duration / steps);
      }
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [number, index]);

  return (
    <div ref={statRef} className="text-center group">
      <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">
        {count.toLocaleString()}
        {suffix}
      </div>
      <div className="text-gray-600 dark:text-gray-400 font-medium group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors duration-300">
        {label}
      </div>
    </div>
  );
};

export default function FeaturesPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const hero = heroRef.current;
    const title = titleRef.current;
    const subtitle = subtitleRef.current;
    
    if (!container || !hero || !title || !subtitle) return;

    // Create floating elements
    const createFloatingElements = () => {
      for (let i = 0; i < 15; i++) {
        const element = document.createElement('div');
        element.className = 'fixed pointer-events-none z-0';
        element.style.width = Math.random() * 6 + 2 + 'px';
        element.style.height = element.style.width;
        element.style.background = `linear-gradient(45deg, 
          hsl(${Math.random() * 60 + 200}, 70%, 60%), 
          hsl(${Math.random() * 60 + 280}, 70%, 60%))`;
        element.style.borderRadius = '50%';
        element.style.opacity = '0.1';
        element.style.left = Math.random() * 100 + '%';
        element.style.top = Math.random() * 100 + '%';
        
        document.body.appendChild(element);
        
        gsap.to(element, {
          y: -100,
          x: Math.random() * 200 - 100,
          duration: Math.random() * 20 + 10,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: Math.random() * 5
        });
      }
    };

    // Set initial states
    gsap.set(hero, {
      opacity: 0,
      y: 50
    });

    gsap.set(title, {
      opacity: 0,
      y: -30,
      scale: 0.9
    });

    gsap.set(subtitle, {
      opacity: 0,
      y: 30
    });

    // Hero entrance animation
    const heroTl = gsap.timeline({ delay: 0.2 });
    
    heroTl.to(hero, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: "power3.out"
    })
    .to(title, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.8,
      ease: "back.out(1.7)"
    }, "-=0.6")
    .to(subtitle, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: "power2.out"
    }, "-=0.4");

    // Parallax effect
    gsap.to(hero, {
      yPercent: -50,
      ease: "none",
      scrollTrigger: {
        trigger: container,
        start: "top bottom",
        end: "bottom top",
        scrub: true
      }
    });

    createFloatingElements();

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      // Clean up floating elements
      document.querySelectorAll('.fixed.pointer-events-none').forEach(el => el.remove());
    };
  }, []);

  const features = [
    {
      icon: (
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
      title: 'Acortador Inteligente',
      description: 'Transforma URLs largas en enlaces cortos y memorables con nuestro algoritmo avanzado de generación de slugs.',
      features: [
        'Slugs personalizados y únicos',
        'Generación automática inteligente',
        'Validación en tiempo real',
        'Soporte para URLs complejas',
      ],
    },
    {
      icon: (
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: 'Análisis Avanzados',
      description: 'Obtén insights detallados sobre el rendimiento de tus enlaces con métricas en tiempo real y reportes completos.',
      features: [
        'Estadísticas de clics en tiempo real',
        'Análisis geográfico detallado',
        'Dispositivos y navegadores',
        'Gráficos interactivos y exportables',
      ],
    },
    {
      icon: (
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      title: 'Seguridad Premium',
      description: 'Protege tus enlaces y datos con nuestras medidas de seguridad de nivel empresarial y cifrado avanzado.',
      features: [
        'Cifrado de extremo a extremo',
        'Protección contra spam y malware',
        'Autenticación OAuth segura',
        'Cumplimiento GDPR completo',
      ],
    },
    {
      icon: (
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Códigos QR Dinámicos',
      description: 'Genera códigos QR personalizables para tus enlaces con diseños únicos y seguimiento completo.',
      features: [
        'Generación instantánea de QR',
        'Personalización de colores y logos',
        'Descarga en múltiples formatos',
        'Seguimiento de escaneos',
      ],
    },
    {
      icon: (
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      title: 'API Potente',
      description: 'Integra nuestro servicio en tus aplicaciones con nuestra API RESTful completa y documentación detallada.',
      features: [
        'API RESTful completa',
        'Autenticación con tokens',
        'Rate limiting inteligente',
        'Documentación interactiva',
      ],
    },
    {
      icon: (
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: 'Rendimiento Extremo',
      description: 'Disfruta de velocidades de redirección ultrarrápidas con nuestra infraestructura global optimizada.',
      features: [
        'Redirecciones en <50ms',
        'CDN global distribuido',
        'Uptime del 99.9%',
        'Escalabilidad automática',
      ],
    },
  ];

  return (
    <div ref={containerRef} className="min-h-screen relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-pink-50/50 dark:from-blue-900/20 dark:via-purple-900/10 dark:to-pink-900/20" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/20 via-transparent to-transparent dark:from-blue-900/10" />
      
      {/* Animated Background Orbs */}
      <div className="fixed top-20 left-20 w-72 h-72 bg-gradient-to-r from-blue-400/10 to-purple-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="fixed top-40 right-20 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="fixed bottom-20 left-1/3 w-80 h-80 bg-gradient-to-r from-pink-400/10 to-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />

      <div className="relative z-10 container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div ref={heroRef} className="max-w-6xl mx-auto text-center mb-20">
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full text-blue-800 dark:text-blue-200 text-sm font-medium mb-8 backdrop-blur-sm border border-blue-200/50 dark:border-blue-700/50">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            Potenciado por tecnología de vanguardia
          </div>

          <h1 ref={titleRef} className="text-5xl md:text-7xl font-bold mb-8">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Características
            </span>
            <br />
            <span className="text-gray-900 dark:text-white">
              Espectaculares
            </span>
          </h1>

          <p ref={subtitleRef} className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
            Descubre el poder de la tecnología más avanzada en acortamiento de enlaces.
            <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-semibold">
              Cada función diseñada para maximizar tu productividad y resultados.
            </span>
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            <AnimatedStatCard number="99" label="Uptime Garantizado" suffix="%" index={0} />
            <AnimatedStatCard number="50" label="Velocidad de Redirección" suffix="ms" index={1} />
            <AnimatedStatCard number="100" label="Países Soportados" suffix="+" index={2} />
            <AnimatedStatCard number="24" label="Soporte Técnico" suffix="/7" index={3} />
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-7xl mx-auto mb-20">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <AnimatedFeatureCard key={index} {...feature} index={index} />
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative group">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl" />
            
            {/* Floating Orbs */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full blur-2xl opacity-30 animate-pulse" />
            <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full blur-2xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }} />
            
            <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white overflow-hidden">
              <div className="absolute inset-0 bg-black/10" />
              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  ¿Listo para experimentar la diferencia?
                </h2>
                <p className="text-xl mb-8 opacity-90">
                  Únete a miles de usuarios que ya confían en Broslunas Links para
                  gestionar sus enlaces de manera profesional.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/dashboard">
                    <Button
                      size="lg"
                      className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-8 py-4 text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
                    >
                      Comenzar Gratis
                    </Button>
                  </Link>
                  <Link href="/help">
                    <Button
                      variant="outline"
                      size="lg"
                      className="border-2 border-white text-white hover:bg-white/10 font-semibold px-8 py-4 text-lg backdrop-blur-sm transform hover:scale-105 transition-all duration-300"
                    >
                      Ver Documentación
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
