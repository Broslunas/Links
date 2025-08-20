'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';

interface UseInactiveAccountCheckReturn {
  isAccountInactive: boolean;
  shouldShowModal: boolean;
  isLoading: boolean;
}

// Rutas permitidas cuando la cuenta está inactiva
const ALLOWED_ROUTES = [
  '/',
  '/dashboard/settings',
  '/help',
  '/auth/signin',
  '/auth/signout',
  '/account-inactive'
];

// Función para verificar si una ruta está permitida
const isRouteAllowed = (pathname: string): boolean => {
  return ALLOWED_ROUTES.some(route => {
    if (route === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(route);
  });
};

export const useInactiveAccountCheck = (): UseInactiveAccountCheckReturn => {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isAccountInactive, setIsAccountInactive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAccountStatus = async () => {
      // Si no hay sesión o está cargando, no hacer nada
      if (status === 'loading' || !session?.user) {
        setIsLoading(status === 'loading');
        return;
      }

      try {
        // Hacer una petición para obtener el estado actual del usuario
        const response = await fetch('/api/user/status');
        
        if (response.ok) {
          const data = await response.json();
          const userIsActive = data.isActive ?? true; // Por defecto true si no está definido
          setIsAccountInactive(!userIsActive);
        } else {
          // Si hay error en la petición, asumir que la cuenta está activa
          setIsAccountInactive(false);
        }
      } catch (error) {
        console.error('Error checking account status:', error);
        // En caso de error, asumir que la cuenta está activa
        setIsAccountInactive(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccountStatus();
  }, [session, status]);

  // Determinar si se debe mostrar el modal
  const shouldShowModal = isAccountInactive && 
                         !isLoading && 
                         status === 'authenticated' && 
                         !isRouteAllowed(pathname);

  return {
    isAccountInactive,
    shouldShowModal,
    isLoading
  };
};