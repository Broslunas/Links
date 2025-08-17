"use client";
import React, { useEffect, useState } from 'react';

const COOKIE_KEY = 'cookieConsentAccepted';

const CookieConsentModal: React.FC = () => {
  const [open, setOpen] = useState(false);

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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70">
      <div className="bg-white dark:bg-gray-900 p-6 rounded shadow-lg max-w-md w-full text-center border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-bold mb-2 text-gray-900 dark:text-gray-100">Usamos cookies</h2>
        <p className="mb-4 text-sm text-gray-700 dark:text-gray-300">
          Este sitio utiliza cookies para mejorar tu experiencia. Al continuar navegando, aceptas nuestra política de cookies.
        </p>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          onClick={handleAccept}
        >
          Aceptar
        </button>
      </div>
    </div>
  );
};

export default CookieConsentModal;
