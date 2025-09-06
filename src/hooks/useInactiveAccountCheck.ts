'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

interface UseInactiveAccountCheckReturn {
  isAccountInactive: boolean;
  shouldShowModal: boolean;
  isLoading: boolean;
  closeModal: () => void;
}

// Rutas permitidas cuando la cuenta está inactiva
const ALLOWED_ROUTES = [
  '/',
  '/dashboard/settings',
  '/help',
  '/auth/signin',
  '/auth/signout',
  '/account-inactive',
  '/features',
  '/status',
  '/contacto',
  '/terms-and-services',
  '/privacy-policy',
  '/cookies',
  '/gdpr',
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAccountInactive, setIsAccountInactive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

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
          const isInactive = !userIsActive;
          setIsAccountInactive(isInactive);
          
          // Si el usuario está inactivo y está en una ruta protegida, redirigir
          if (isInactive && !isRouteAllowed(pathname)) {
            // Verificar si viene del dashboard
            const fromDashboard = pathname.startsWith('/dashboard');
            
            if (fromDashboard) {
              // Redirigir a home con parámetro para mostrar modal
              router.push('/?blocked=dashboard');
            } else {
              // Solo redirigir sin mostrar modal
              router.push('/');
            }
          }
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
  }, [session, status, pathname, router]);

  // Verificar si se debe mostrar el modal basado en parámetros URL
  useEffect(() => {
    const blocked = searchParams.get('blocked');
    if (blocked === 'dashboard' && isAccountInactive && pathname === '/') {
      setShowModal(true);
    }
  }, [searchParams, isAccountInactive, pathname]);

  const closeModal = () => {
    setShowModal(false);
    // Limpiar el parámetro de la URL
    const url = new URL(window.location.href);
    url.searchParams.delete('blocked');
    router.replace(url.pathname + url.search);
  };

  // Solo mostrar modal si estamos en home y viene de dashboard
  const shouldShowModal = showModal && pathname === '/' && isAccountInactive;

  return {
    isAccountInactive,
    shouldShowModal,
    isLoading,
    closeModal,
  };
};
