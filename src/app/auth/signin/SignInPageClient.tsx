'use client';

import React from 'react';
import SignInForm from '../../../components/auth/SignInForm';

export default function SignInPageClient() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900" />

      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-sm sm:max-w-md w-full space-y-6 sm:space-y-8">
          {/* Logo/Brand section */}
          <div className="text-center animate-fade-in-up">
            {/* Welcome Message */}
            <div className="space-y-2 animate-fade-in-up animate-stagger-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Bienvenido de vuelta
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base px-2">
                Conecta con tu plataforma favorita y continúa compartiendo
              </p>
            </div>
          </div>

          {/* Form container with glass effect */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 p-6 sm:p-8 animate-fade-in-scale animate-stagger-4 hover:shadow-2xl transition-all duration-500">
            <SignInForm />
          </div>

          {/* Footer */}
          <div className="text-center animate-fade-in-up animate-stagger-4 px-2">
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              ¿Primera vez aquí?{' '}
              <span className="text-blue-600 dark:text-blue-400 font-medium hover:text-blue-500 dark:hover:text-blue-300 transition-colors duration-200">
                ¡Solo inicia sesión y comenzarás!
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
