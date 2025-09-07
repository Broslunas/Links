'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { FaGithub, FaGoogle, FaDiscord, FaTwitch } from 'react-icons/fa';

type Provider = 'github' | 'google' | 'discord' | 'twitch';

interface ProviderConfig {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  bgColor: string;
  hoverColor: string;
  textColor: string;
}

const providers: Record<Provider, ProviderConfig> = {
  github: {
    name: 'GitHub',
    icon: FaGithub,
    bgColor: 'bg-gray-900 dark:bg-gray-800',
    hoverColor: 'hover:bg-gray-800 dark:hover:bg-gray-700',
    textColor: 'text-white'
  },
  google: {
    name: 'Google',
    icon: FaGoogle,
    bgColor: 'bg-red-600',
    hoverColor: 'hover:bg-red-700',
    textColor: 'text-white'
  },
  discord: {
    name: 'Discord',
    icon: FaDiscord,
    bgColor: 'bg-indigo-600',
    hoverColor: 'hover:bg-indigo-700',
    textColor: 'text-white'
  },
  twitch: {
    name: 'Twitch',
    icon: FaTwitch,
    bgColor: 'bg-purple-600',
    hoverColor: 'hover:bg-purple-700',
    textColor: 'text-white'
  }
};

export default function SignInForm() {
  const [isLoading, setIsLoading] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (provider: Provider) => {
    try {
      setIsLoading(provider);
      setError(null);
      await signIn(provider, { callbackUrl: '/dashboard' });
    } catch (error) {
      console.error('Error signing in:', error);
      setError('Error al iniciar sesión. Por favor, inténtalo de nuevo.');
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
          <div className="flex items-center space-x-2">
            <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-red-700 dark:text-red-400 font-medium">
              {error}
            </span>
          </div>
        </div>
      )}
      
      <div className="space-y-4">
        {Object.entries(providers).map(([key, config]) => {
          const provider = key as Provider;
          const Icon = config.icon;
          const isCurrentLoading = isLoading === provider;
          
          return (
            <button
              key={provider}
              onClick={() => handleSignIn(provider)}
              disabled={isLoading !== null}
              className={`group relative w-full flex items-center justify-center py-3 sm:py-4 px-4 sm:px-6 border border-transparent text-sm font-semibold rounded-lg sm:rounded-xl ${config.bgColor} ${config.hoverColor} ${config.textColor} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-white/50 disabled:opacity-75 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] touch-manipulation overflow-hidden ${isCurrentLoading ? 'animate-shimmer' : ''}`}
            >
              {/* Loading overlay */}
              {isCurrentLoading && (
                <div className="absolute inset-0 bg-black/10 animate-pulse" />
              )}
              
              <span className="absolute left-0 inset-y-0 flex items-center pl-4 sm:pl-6 z-10">
                {isCurrentLoading ? (
                  <div className="relative">
                    <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-2 border-white border-t-transparent"></div>
                    <div className="absolute inset-0 rounded-full h-5 w-5 sm:h-6 sm:w-6 border-2 border-white/30 animate-ping"></div>
                  </div>
                ) : (
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" />
                )}
              </span>
              
              <span className={`ml-2 sm:ml-3 text-sm sm:text-base z-10 transition-all duration-300 ${isCurrentLoading ? 'animate-pulse' : ''}`}>
                {isCurrentLoading ? (
                  <span className="flex items-center space-x-2">
                    <span>Conectando</span>
                    <span className="flex space-x-1">
                      <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                      <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                      <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                    </span>
                  </span>
                ) : (
                  `Continuar con ${config.name}`
                )}
              </span>
              
              {/* Success indicator (could be used for future success states) */}
              {!isCurrentLoading && (
                <span className="absolute right-4 sm:right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <svg className="h-4 w-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>
      
      <div className="text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Al continuar, aceptas nuestros términos de servicio y política de privacidad
        </p>
      </div>
    </div>
  );
}
