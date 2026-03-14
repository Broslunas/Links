'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './Button';
import { cn } from '@/lib/utils';
import { AlertTriangle, Clock, XCircle, Ban, UserX, Home, ArrowLeft } from 'lucide-react';

type ErrorType = '404' | 'click-limit' | 'time-restriction' | 'admin-disabled' | 'user-inactive' | 'custom-domain-error';

interface ErrorPageProps {
  type: ErrorType;
  message?: string;
  className?: string;
}

const errorConfig = {
  '404': {
    icon: XCircle,
    color: 'text-red-500',
    title: 'Enlace no encontrado',
    defaultMessage: 'El enlace que buscas no existe o ha sido eliminado del sistema.'
  },
  'click-limit': {
    icon: AlertTriangle,
    color: 'text-amber-500',
    title: 'Límite de clicks alcanzado',
    defaultMessage: 'Este enlace ha alcanzado su límite de tráfico máximo permitido.'
  },
  'time-restriction': {
    icon: Clock,
    color: 'text-blue-500',
    title: 'Acceso restringido',
    defaultMessage: 'Este enlace solo está disponible durante una franja horaria específica.'
  },
  'admin-disabled': {
    icon: Ban,
    color: 'text-red-500',
    title: 'Enlace suspendido',
    defaultMessage: 'Este enlace ha sido deshabilitado por el administrador del sistema.'
  },
  'user-inactive': {
    icon: UserX,
    color: 'text-gray-500',
    title: 'Cuenta inactiva',
    defaultMessage: 'El acceso a este enlace está suspendido debido a la inactividad de la cuenta propietaria.'
  },
  'custom-domain-error': {
    icon: Ban,
    color: 'text-red-500',
    title: 'Error de dominio',
    defaultMessage: 'El dominio personalizado configurado para este enlace no es válido o está bloqueado.'
  }
};

export const ErrorPage: React.FC<ErrorPageProps> = ({
  type,
  message,
  className
}) => {
  const config = errorConfig[type];
  const Icon = config.icon;

  return (
    <div className={cn(
      "fixed inset-0 flex flex-col items-center justify-center overflow-hidden bg-[#000] text-white selection:bg-red-500/30",
      className
    )}>
      {/* Immersive Error Background */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full bg-red-600/20 blur-[180px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.05, 0.15, 0.05],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-destructive/10 blur-[150px]" 
        />
        
        {/* Technical Layers */}
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:100px_100px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-overlay" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full h-full flex flex-col items-center justify-between py-16 px-6"
      >
        {/* Top Status */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center"
        >
          <div className="px-5 py-2 rounded-full bg-red-500/10 border border-red-500/20 backdrop-blur-xl flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500/80">Incidencia Detectada</span>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex flex-col items-center text-center space-y-12 max-w-4xl w-full">
          <motion.div
            initial={{ rotate: -10, scale: 0.5 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", damping: 10, stiffness: 100, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -inset-8 bg-red-500/20 blur-3xl rounded-full opacity-50" />
            <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-3xl flex items-center justify-center shadow-2xl">
              <Icon className={cn("h-16 w-16 md:h-20 md:w-20", config.color)} />
            </div>
          </motion.div>

          <div className="space-y-6">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-5xl md:text-[7rem] font-black tracking-tighter leading-none"
            >
              {config.title}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl md:text-3xl text-white/50 font-medium max-w-2xl mx-auto leading-tight"
            >
              {message || config.defaultMessage}
            </motion.p>
          </div>

          {/* Large Action Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-6 w-full max-w-md"
          >
            <Button
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="flex-1 h-20 rounded-full border-white/10 bg-white/5 hover:bg-white/10 text-white font-black text-lg transition-all"
            >
              <Home className="mr-3 h-6 w-6" />
              INICIO
            </Button>
            <Button
              variant="default"
              onClick={() => window.history.back()}
              className="flex-1 h-20 rounded-full bg-white text-black hover:bg-white/90 font-black text-lg shadow-2xl transition-all hover:scale-[1.05] active:scale-[0.95]"
            >
              <ArrowLeft className="mr-3 h-6 w-6" />
              VOLVER
            </Button>
          </motion.div>
        </div>

        {/* Footer Technical Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col items-center space-y-4"
        >
          <div className="h-px w-20 bg-red-500/20" />
          <p className="text-[10px] uppercase tracking-[0.5em] font-black text-white/10">
            REFID: ERROR_{type.toUpperCase().replace(/-/g, '_')}
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};