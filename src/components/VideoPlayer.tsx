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
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Animate container on scroll
    gsap.fromTo(container, 
      {
        opacity: 0,
        y: 100,
        scale: 0.9
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: container,
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play none none reverse"
        }
      }
    );

    // Lazy load video when in viewport
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
      observer.disconnect();
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [showVideo]);

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
      
      // Animate play button out
      gsap.to('.play-button', {
        scale: 0,
        opacity: 0,
        duration: 0.3,
        ease: "power2.in"
      });
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
    
    // Animate play button back in
    gsap.to('.play-button', {
      scale: 1,
      opacity: 1,
      duration: 0.3,
      ease: "power2.out"
    });
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
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-600 rounded-full flex items-center justify-center play-button transition-all duration-300 hover:scale-110">
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
          <div className="play-button w-20 h-20 bg-white/90 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 hover:bg-white">
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