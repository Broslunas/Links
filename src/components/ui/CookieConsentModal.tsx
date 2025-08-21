"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

const COOKIE_KEY = 'cookieConsentAccepted';

const CookieConsentModal: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const accepted = localStorage.getItem(COOKIE_KEY);
    if (!accepted) {
      setOpen(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_KEY, 'true');
    setOpen(false);
  };

  const handleReject = () => {
    localStorage.setItem(COOKIE_KEY, 'rejected');
    setOpen(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Auto-show again after 30 seconds if not accepted/rejected
    setTimeout(() => {
      const accepted = localStorage.getItem(COOKIE_KEY);
      if (!accepted) {
        setIsVisible(true);
      }
    }, 30000);
  };

  if (!open || !isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 transform transition-transform duration-300 ease-in-out">
      <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Este sitio utiliza cookies</span> para mejorar tu experiencia de navegación y analizar el tráfico. 
                    <Link href="/cookies" className="text-blue-600 dark:text-blue-400 hover:underline ml-1">
                      Más información
                    </Link>
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded transition-colors"
                aria-label="Cerrar temporalmente"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <button
                onClick={handleReject}
                className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Rechazar
              </button>
              <button
                onClick={handleAccept}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsentModal;
