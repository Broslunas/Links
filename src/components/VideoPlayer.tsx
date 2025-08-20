'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface VideoPlayerProps {
  src?: string;
  poster?: string;
  title: string;
  description?: string;
  className?: string;
  autoPlay?: boolean;
}

export default function VideoPlayer({ 
  src, 
  poster, 
  title, 
  description, 
  className = '',
  autoPlay = false 
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playButtonRef = useRef<HTMLDivElement>(null);
  const placeholderButtonRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  // Animate video when it loads
  useEffect(() => {
    if (isLoaded && videoRef.current && playButtonRef.current) {
      // Animate video fade in
      gsap.fromTo(videoRef.current, 
        {
          opacity: 0,
          scale: 1.1
        },
        {
          opacity: 1,
          scale: 1,
          duration: 0.8,
          ease: "power2.out"
        }
      );

      // Animate play button entrance
      gsap.fromTo(playButtonRef.current,
        {
          scale: 0,
          opacity: 0,
          rotation: -360
        },
        {
          scale: 1,
          opacity: 1,
          rotation: 0,
          duration: 0.6,
          ease: "back.out(1.7)",
          delay: 0.3
        }
      );
    }
  }, [isLoaded]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Set initial state
    gsap.set(container, {
      opacity: 0,
      y: 100,
      scale: 0.9,
      rotationX: -15
    });

    // Animate container on scroll with enhanced effects
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: "top 85%",
        end: "bottom 15%",
        toggleActions: "play none none reverse",
        onEnter: () => {
          // Trigger video loading when animation starts
          if (!showVideo) {
            setShowVideo(true);
          }
        }
      }
    });

    tl.to(container, {
      opacity: 1,
      y: 0,
      scale: 1,
      rotationX: 0,
      duration: 1.2,
      ease: "back.out(1.7)"
    });

    // Add floating animation on hover
    const handleMouseEnter = () => {
      gsap.to(container, {
        y: -10,
        scale: 1.02,
        duration: 0.4,
        ease: "power2.out"
      });
    };

    const handleMouseLeave = () => {
      gsap.to(container, {
        y: 0,
        scale: 1,
        duration: 0.4,
        ease: "power2.out"
      });
    };

    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);

    // Lazy load video when in viewport (fallback)
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !showVideo) {
            setShowVideo(true);
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(container);

    return () => {
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
      observer.disconnect();
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [showVideo]);

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
      
      // Animate play button out with enhanced effects
      if (playButtonRef.current) {
        gsap.to(playButtonRef.current, {
          scale: 0,
          opacity: 0,
          rotation: 180,
          duration: 0.4,
          ease: "back.in(1.7)"
        });
      }
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
    
    // Animate play button back in with enhanced effects
    if (playButtonRef.current) {
      gsap.fromTo(playButtonRef.current, 
        {
          scale: 0,
          opacity: 0,
          rotation: -180
        },
        {
          scale: 1,
          opacity: 1,
          rotation: 0,
          duration: 0.5,
          ease: "elastic.out(1, 0.5)"
        }
      );
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative group cursor-pointer overflow-hidden rounded-2xl ${className}`}
      onClick={!isPlaying ? handlePlay : undefined}
    >
      {/* Video or Placeholder */}
      {showVideo && src ? (
        <video
          ref={videoRef}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          poster={poster}
          onLoadedData={() => setIsLoaded(true)}
          onPlay={() => setIsPlaying(true)}
          onPause={handlePause}
          onEnded={handlePause}
          muted
          loop={autoPlay}
          playsInline
        >
          <source src={src} type="video/mp4" />
          Tu navegador no soporta el elemento video.
        </video>
      ) : (
        <div className="aspect-video bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
          <div className="text-center">
            <div ref={placeholderButtonRef} className="w-16 h-16 mx-auto mb-4 bg-blue-600 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110">
              <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
            <p className="text-gray-600 dark:text-gray-300 font-medium">
              {src ? 'Cargando video...' : 'Video próximamente'}
            </p>
          </div>
        </div>
      )}

      {/* Play Button Overlay */}
      {showVideo && src && !isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity duration-300">
          <div ref={playButtonRef} className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 hover:bg-white">
            <svg className="w-10 h-10 text-gray-800 ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {showVideo && src && !isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Video Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
        <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
        {description && (
          <p className="text-gray-200 text-sm">{description}</p>
        )}
      </div>

      {/* Hover Effects */}
      <div className="absolute inset-0 bg-gradient-to-t from-blue-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
}