'use client';

import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { motion } from 'framer-motion';

export default function Loading() {
    return (
        <div className="fixed inset-0 bg-[#000] flex flex-col items-center justify-between py-24 overflow-hidden">
            {/* Immersive Background */}
            <div className="absolute inset-0 z-0">
                <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
                    transition={{ duration: 8, repeat: Infinity }}
                    className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/20 blur-[150px]" 
                />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-overlay" />
            </div>

            <div className="w-full flex justify-center">
                <span className="text-[10px] uppercase font-black tracking-[0.5em] text-white/20">BRLNS.ES REDIRECT SYSTEM</span>
            </div>

            <div className="relative z-10 text-center space-y-12">
                <div className="relative">
                    <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full" />
                    <LoadingSpinner size="xl" className="text-primary relative" />
                </div>
                
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white">
                        INICIANDO SALTO
                    </h1>
                    <p className="text-sm md:text-base text-white/40 uppercase tracking-[0.3em] font-black">
                        Estableciendo conexión con el destino
                    </p>
                </div>
            </div>

            <div className="w-full flex flex-col items-center space-y-4">
                <div className="h-0.5 w-12 bg-primary/30 rounded-full" />
                <span className="text-[9px] font-bold text-white/10 uppercase tracking-widest">Latencia Optimizada</span>
            </div>
        </div>
    );
}