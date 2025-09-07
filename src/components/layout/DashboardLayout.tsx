'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '../ui/Button';
import { ThemeToggle } from '../ui/ThemeToggle';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Sidebar } from './Sidebar';
import UserProfileEditModal from '../dashboard/UserProfileEditModal';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Recuperar la preferencia del usuario del localStorage si está disponible
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('sidebarCollapsed');
      return savedState === 'true';
    }
    return false;
  });
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // User session handling

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/dashboard/' });
  };

  const handleSidebarOpen = () => {
    // Store the currently focused element
    previousFocusRef.current = document.activeElement as HTMLElement;
    setSidebarOpen(true);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
    // Return focus to the mobile menu button
    setTimeout(() => {
      mobileMenuButtonRef.current?.focus();
    }, 0);
  };

  const handleToggleCollapse = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    // Guardar la preferencia del usuario en localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarCollapsed', String(newState));
    }
  };

  // Handle keyboard navigation for mobile sidebar
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!sidebarOpen) return;

      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          handleSidebarClose();
          break;
      }
    };

    if (sidebarOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when sidebar is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [sidebarOpen]);

  // Get user role from session
  React.useEffect(() => {
    if (session?.user?.role) {
      setUserRole(session.user.role);
    } else {
      setUserRole(null);
    }
  }, [session]);

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);


  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Cargando..." />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Skip Navigation Links */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        Saltar al contenido principal
      </a>
      <a
        href="#dashboard-navigation"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-48 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        Saltar a la navegación del dashboard
      </a>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={handleSidebarClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={handleSidebarClose} 
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Main content */}
      <div className={`transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        {/* Top navigation */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              <Button
                ref={mobileMenuButtonRef}
                variant="ghost"
                size="icon"
                className="lg:hidden focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                onClick={handleSidebarOpen}
                aria-label="Abrir barra lateral de navegación"
                aria-expanded={sidebarOpen}
                aria-controls="mobile-sidebar"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </Button>
              
              {/* Desktop collapse toggle button */}
              <Button
                variant="ghost"
                size="icon"
                className="hidden lg:flex focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                onClick={handleToggleCollapse}
                aria-label={sidebarCollapsed ? "Expandir barra lateral" : "Colapsar barra lateral"}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={sidebarCollapsed ? "M13 5l7 7-7 7M5 5l7 7-7 7" : "M11 19l-7-7 7-7m8 14l-7-7 7-7"}
                  />
                </svg>
              </Button>

              <h1 className="text-xl font-semibold text-foreground lg:hidden">
                Broslunas Links
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <ThemeToggle />

              {/* User menu */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  title="Editar perfil"
                >
                  {session?.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                      <svg className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-foreground">
                      {session?.user?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {session?.user?.email}
                    </p>
                  </div>
                </button>

                {/* Logout button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  aria-label="Cerrar sesión y salir del dashboard"
                  title="Cerrar Sesión"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </Button>
              </div>
            </div>
          </div>
        </header>


        {/* Page content */}
        <main id="main-content" className="flex-1">
          <div className="px-4 py-8 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>

      {/* User Profile Edit Modal */}
      <UserProfileEditModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onProfileUpdate={() => {
          // Refresh the session to get updated user data
          window.location.reload();
        }}
      />
    </div>
  );
};

export { DashboardLayout };
