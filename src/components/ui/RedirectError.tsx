'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AlertCircle, Clock, ServerCrash, Home, LayoutDashboard, RefreshCcw, ShieldAlert } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

export interface RedirectErrorProps {
  type: 'not_found' | 'expired' | 'server_error';
  slug?: string;
  message?: string;
  expirationDate?: Date;
}

const RedirectError: React.FC<RedirectErrorProps> = ({
  type,
  slug,
  message,
  expirationDate
}) => {
  const getErrorContent = () => {
    switch (type) {
      case 'not_found':
        return {
          icon: AlertCircle,
          title: '404',
          heading: 'Enlace no encontrado',
          description: message || 'El enlace que buscas no existe, ha sido eliminado o la URL es incorrecta.',
          errorCode: 'LINK_NOT_FOUND',
          color: 'text-red-500',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20'
        };
      case 'expired':
        return {
          icon: Clock,
          title: 'Expirado',
          heading: 'Enlace caducado',
          description: message || `Este enlace temporal ha expirado${expirationDate ? ` el ${expirationDate.toLocaleDateString('es-ES')}` : ''}.`,
          errorCode: 'LINK_EXPIRED',
          color: 'text-amber-500',
          bgColor: 'bg-amber-500/10',
          borderColor: 'border-amber-500/20'
        };
      case 'server_error':
        return {
          icon: ServerCrash,
          title: '500',
          heading: 'Error del sistema',
          description: message || 'Ha ocurrido un error inesperado al procesar la redirección.',
          errorCode: 'REDIRECT_SERVER_ERROR',
          color: 'text-destructive',
          bgColor: 'bg-destructive/10',
          borderColor: 'border-destructive/20'
        };
      default:
        return {
          icon: ShieldAlert,
          title: 'Error',
          heading: 'Error de Redirección',
          description: message || 'Ha ocurrido un error al procesar la redirección.',
          errorCode: 'REDIRECT_ERROR',
          color: 'text-gray-500',
          bgColor: 'bg-white/5',
          borderColor: 'border-white/10'
        };
    }
  };

  const content = getErrorContent();
  const Icon = content.icon;
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden bg-[#000] text-white p-6">
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        <div className={cn("absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[180px] opacity-20", content.bgColor)} />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-overlay" />
        <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:100px_100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full h-full flex flex-col items-center justify-between py-16 px-6"
      >
        {/* Header Status */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center"
        >
          <div className={cn("px-5 py-2 rounded-full border backdrop-blur-3xl flex items-center gap-2", content.bgColor, content.borderColor)}>
            <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", content.color.replace('text', 'bg'))} />
            <span className={cn("text-[10px] font-black uppercase tracking-[0.3em]", content.color)}>Salto Interrumpido</span>
          </div>
        </motion.div>

        {/* Core Content */}
        <div className="flex flex-col items-center text-center space-y-12 max-w-4xl w-full">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", delay: 0.2 }}
            className={cn("w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] border flex items-center justify-center backdrop-blur-3xl", content.bgColor, content.borderColor)}
          >
            <Icon className={cn("h-16 w-16 md:h-20 md:w-20", content.color)} />
          </motion.div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className="text-5xl md:text-[8rem] font-black tracking-tighter leading-none mb-4">{content.title}</h1>
              <h2 className="text-2xl md:text-4xl font-bold text-white/90">{content.heading}</h2>
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-white/40 text-lg md:text-2xl font-medium max-w-2xl mx-auto leading-relaxed"
            >
              {content.description}
            </motion.p>
          </div>

          {slug && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="py-3 px-6 rounded-2xl bg-white/5 border border-white/10"
            >
              <p className="text-xs md:text-sm font-mono text-white/40 tracking-tight">
                IDENTIFICADOR: <span className="text-white/80 font-bold">/{slug}</span>
              </p>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-6 w-full max-w-lg"
          >
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full h-20 rounded-full border-white/10 bg-white/5 hover:bg-white/10 text-white font-black text-lg transition-all">
                <Home className="mr-3 h-6 w-6" />
                INICIO
              </Button>
            </Link>
            <Link href="/dashboard" className="flex-1">
              <Button variant="default" className="w-full h-20 rounded-full bg-white text-black hover:bg-white/90 font-black text-lg shadow-2xl transition-all hover:scale-[1.05] active:scale-[0.95]">
                <LayoutDashboard className="mr-3 h-6 w-6" />
                PANEL
              </Button>
            </Link>
          </motion.div>

          {type === 'server_error' && (
            <Button
              variant="ghost"
              className="h-12 rounded-xl text-white/30 hover:text-white"
              onClick={() => window.location.reload()}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              REINTENTAR SECUENCIA
            </Button>
          )}
        </div>

        {/* Technical Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="flex flex-col items-center space-y-4"
        >
          <div className="h-px w-20 bg-white/10" />
          <p className="text-[10px] uppercase tracking-[0.6em] font-black text-white/10">
            {content.errorCode} // BRLNS.ES
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export { RedirectError };