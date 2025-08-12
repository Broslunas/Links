'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { FaGithub, FaGoogle } from 'react-icons/fa';

export default function SignInForm() {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const handleSignIn = async (provider: 'github' | 'google') => {
    setIsLoading(provider);
    setError(null);
    
    try {
      // Use NextAuth's built-in redirect handling
      await signIn(provider, { 
        callbackUrl,
        redirect: true // Let NextAuth handle the redirect
      });
    } catch (error) {
      console.error('Error signing in:', error);
      setError('Error al iniciar sesión. Por favor, inténtalo de nuevo.');
      setIsLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}
      
      <button
        onClick={() => handleSignIn('github')}
        disabled={isLoading !== null}
        className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <span className="absolute left-0 inset-y-0 flex items-center pl-3">
          <FaGithub className="h-5 w-5" />
        </span>
        {isLoading === 'github' ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Conectando...
          </div>
        ) : (
          'Continuar con GitHub'
        )}
      </button>

      <button
        onClick={() => handleSignIn('google')}
        disabled={isLoading !== null}
        className="group relative w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
      >
        <span className="absolute left-0 inset-y-0 flex items-center pl-3">
          <FaGoogle className="h-5 w-5 text-red-500" />
        </span>
        {isLoading === 'google' ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 mr-2 dark:border-white"></div>
            Conectando...
          </div>
        ) : (
          'Continuar con Google'
        )}
      </button>
    </div>
  );
}