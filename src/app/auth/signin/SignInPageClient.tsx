'use client';

import React from 'react';
import SignInForm from '../../../components/auth/SignInForm';
import { ThemeToggle } from '../../../components/ui/ThemeToggle';

export default function SignInPageClient() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Inicia sesión en tu cuenta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Usa tu cuenta de GitHub, Google o Discord para acceder
          </p>
        </div>
        <SignInForm />
      </div>
    </div>
  );
}