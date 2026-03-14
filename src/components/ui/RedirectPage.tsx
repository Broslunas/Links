'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, ArrowRight, ShieldCheck, Globe, Clock } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

interface RedirectPageProps {
  destinationUrl: string;
  title?: string;
  redirectDelay?: number;
  className?: string;
}

type RedirectState = 'waiting' | 'redirecting' | 'failed' | 'manual';

const RedirectPage: React.FC<RedirectPageProps> = ({
  destinationUrl,
  title,
  redirectDelay = 3000,
  className,
}) => {
  const [countdown, setCountdown] = useState(redirectDelay / 1000);
  const [redirectState, setRedirectState] = useState<RedirectState>('waiting');
  const [isHovered, setIsHovered] = useState(false);

  // Parse domain for display
  const displayDomain = useMemo(() => {
    try {
      const url = new URL(destinationUrl);
      return url.hostname;
    } catch {
      return destinationUrl;
    }
  }, [destinationUrl]);

  const isValidUrl = useCallback((url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }, []);

  const performRedirect = useCallback(
    async (url: string, attempt: number = 1) => {
      if (!isValidUrl(url)) {
        setRedirectState('failed');
        return;
      }

      setRedirectState('redirecting');
      
      try {
        // Multi-attempt redirect logic
        if (attempt === 1) window.location.assign(url);
        else if (attempt === 2) window.location.href = url;
        else {
          const a = document.createElement('a');
          a.href = url;
          a.rel = 'noopener noreferrer';
          a.click();
        }
      } catch (e) {
        if (attempt < 3) {
          setTimeout(() => performRedirect(url, attempt + 1), 500);
        } else {
          setRedirectState('failed');
        }
      }
    },
    [isValidUrl]
  );

  useEffect(() => {
    if (redirectState !== 'waiting') return;

    if (countdown <= 0) {
      performRedirect(destinationUrl);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 0.1));
    }, 100);

    return () => clearInterval(timer);
  }, [countdown, redirectState, destinationUrl, performRedirect]);

  const handleManualRedirect = () => {
    setRedirectState('manual');
    performRedirect(destinationUrl);
  };

  // Progress for the circular indicator (0 to 100)
  const progress = (1 - countdown / (redirectDelay / 1000)) * 100;

  return (
    <div className={cn(
      "fixed inset-0 flex flex-col items-center justify-center overflow-hidden bg-[#000] text-white selection:bg-primary/30",
      className
    )}>
      {/* Dynamic Immersive Background */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        {/* Massive Ambient Glows */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.25, 0.15],
            x: [0, 50, 0],
            y: [0, -30, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-primary/30 blur-[150px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.2, 0.1],
            x: [0, -40, 0],
            y: [0, 40, 0]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear", delay: 2 }}
          className="absolute -bottom-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-blue-600/20 blur-[180px]" 
        />
        
        {/* Technical Grid Layer */}
        <div 
          className="absolute inset-0 opacity-[0.05]"
          style={{ 
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
            backgroundSize: '100px 100px'
          }} 
        />
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{ 
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }} 
        />

        {/* Noise overlay for texture */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-overlay" />
      </div>

      {/* Full Screen Content Layout */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-between py-12 px-6 md:py-20">
        
        {/* Top Branding Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center space-y-4"
        >
          <div className="flex items-center gap-3 px-6 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-2xl">
            <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
            <span className="text-xs font-black uppercase tracking-[0.4em] text-white/60">Sistema de Redirección</span>
          </div>
        </motion.div>

        {/* Central Core (The main interaction area, but now open) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center text-center space-y-12 md:space-y-16 w-full max-w-4xl"
        >
          {/* Progress Visualizer */}
          <div className="relative">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-16 border border-white/5 rounded-full pointer-events-none"
            />
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-24 border border-white/[0.02] rounded-full pointer-events-none"
            />
            
            <div className="relative h-40 w-40 md:h-56 md:w-56">
              <svg className="h-full w-full -rotate-90 drop-shadow-[0_0_30px_rgba(var(--primary),0.3)]">
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="transparent"
                  className="text-white/5"
                />
                <motion.circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="transparent"
                  strokeDasharray="100 100"
                  animate={{ strokeDashoffset: 100 - progress }}
                  transition={{ duration: 0.1, ease: "linear" }}
                  className="text-primary"
                  style={{ strokeDasharray: '283', strokeDashoffset: '283' }}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <AnimatePresence mode="wait">
                  {redirectState === 'waiting' ? (
                    <motion.div
                      key="countdown"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-center"
                    >
                      <span className="text-5xl md:text-7xl font-black font-mono tracking-tighter block">
                        {Math.ceil(countdown)}
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/30">Segundos</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="status"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-primary flex flex-col items-center"
                    >
                      <Globe className="h-16 w-16 md:h-20 md:w-20 animate-pulse" />
                      <span className="text-[10px] mt-2 uppercase tracking-[0.2em] font-bold">Saltando...</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <motion.h1 
                className="text-4xl md:text-7xl font-black tracking-tighter leading-none"
              >
                {title || 'Redirigiendo...'}
              </motion.h1>
              <p className="text-white/40 text-lg md:text-xl font-medium">Lanzando conexión segura hacia el destino</p>
            </div>

            {/* Destination URL Display */}
            <motion.div 
              className="flex flex-col items-center space-y-4"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <div className="flex items-center gap-4 text-white/80 group cursor-pointer">
                <ShieldCheck className={cn("h-6 w-6 transition-colors", isHovered ? "text-primary" : "text-white/20")} />
                <span className="text-xl md:text-3xl font-mono tracking-tight underline decoration-white/10 underline-offset-8 decoration-2 hover:decoration-primary/50 transition-all duration-300">
                  {displayDomain}
                </span>
                <ExternalLink className={cn("h-6 w-6 transition-all", isHovered ? "translate-x-1 translate-y-[-4px] text-primary" : "text-white/20")} />
              </div>
            </motion.div>
          </div>

          {/* Large Action Area */}
          <div className="w-full flex flex-col items-center space-y-8 pt-8">
            <Button
              onClick={handleManualRedirect}
              variant="default"
              size="lg"
              className="group relative h-20 px-12 md:px-20 rounded-full text-xl font-black bg-primary hover:bg-white text-white hover:text-black transition-all duration-500 overflow-hidden"
              loading={redirectState === 'redirecting' || redirectState === 'manual'}
            >
              <motion.div 
                className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"
              />
              <span className="relative z-10 flex items-center gap-3">
                {redirectState === 'redirecting' ? 'PROCESANDO...' : 'IR AL SITIO'}
                {!redirectState.includes('redirecting') && <ArrowRight className="h-6 w-6" />}
              </span>
            </Button>

            {redirectState === 'failed' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md p-6 rounded-3xl bg-red-500/10 border border-red-500/20 backdrop-blur-xl text-center"
              >
                <p className="text-red-400 font-bold mb-2 uppercase text-xs tracking-widest">Error de Salto</p>
                <p className="text-white/60 text-sm mb-4">La secuencia automática falló. Prueba el enlace directo:</p>
                <a href={destinationUrl} className="text-primary font-mono text-sm break-all hover:underline">{destinationUrl}</a>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Bottom Status Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="w-full flex flex-col items-center space-y-8"
        >
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-4 px-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-white/5 border border-white/5">
                <ShieldCheck className="h-5 w-5 text-green-500/50" />
              </div>
              <div className="text-left">
                <p className="text-[10px] uppercase tracking-widest font-black text-white/20">Seguridad</p>
                <p className="text-xs font-bold text-white/60">SSL Verificado</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-white/5 border border-white/5">
                <Clock className="h-5 w-5 text-blue-500/50" />
              </div>
              <div className="text-left">
                <p className="text-[10px] uppercase tracking-widest font-black text-white/20">Latencia</p>
                <p className="text-xs font-bold text-white/60">Optimizado</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-white/5 border border-white/5">
                <Globe className="h-5 w-5 text-primary/50" />
              </div>
              <div className="text-left">
                <p className="text-[10px] uppercase tracking-widest font-black text-white/20">DNS</p>
                <p className="text-xs font-bold text-white/60">Global Edge</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
             <span className="text-[9px] uppercase tracking-[0.6em] font-black text-white/10">BRLNS.ES INFRASTRUCTURE</span>
          </div>
        </motion.div>
      </div>

      {/* Interactive Floating Particles (Visual Flair) */}
      <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * 100 + "%", 
              y: Math.random() * 100 + "%",
              opacity: 0,
              scale: 0
            }}
            animate={{ 
              y: [null, "-20%", "120%"],
              opacity: [0, 0.2, 0],
              scale: [0, 1, 0.5]
            }}
            transition={{ 
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              delay: Math.random() * 20
            }}
            className="absolute w-1 h-1 bg-primary rounded-full blur-[1px]"
          />
        ))}
      </div>

      {/* No-JS Fallback */}
      <noscript>
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-6 text-center">
          <div className="max-w-md space-y-6">
            <h1 className="text-4xl font-black tracking-tighter">BRLNS.ES</h1>
            <p className="text-white/60 leading-relaxed">Estamos redirigiéndote. Si la página no carga en 3 segundos, usa el botón de abajo.</p>
            <a 
              href={destinationUrl}
              className="inline-block px-12 py-5 bg-white text-black rounded-full font-black text-lg hover:scale-105 transition-transform"
            >
              CONTINUAR AL SITIO
            </a>
          </div>
        </div>
      </noscript>
    </div>
  );
};

export { RedirectPage };