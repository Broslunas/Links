'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '../ui/Button';
import { ThemeToggle } from '../ui/ThemeToggle';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Sidebar } from './Sidebar';
import { Menu, LogOut } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

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
      <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top navigation */}
        <header className="sticky top-0 z-30 bg-gradient-to-r from-background/95 via-background/98 to-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 border-b border-border/50 shadow-lg shadow-primary/5">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 relative">
            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              <Button
                ref={mobileMenuButtonRef}
                variant="ghost"
                size="icon"
                className="lg:hidden focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 hover:bg-gradient-to-r hover:from-primary/10 hover:to-primary/5 transition-all duration-300 hover:scale-105 rounded-xl"
                onClick={handleSidebarOpen}
                aria-label="Abrir barra lateral de navegación"
                aria-expanded={sidebarOpen}
                aria-controls="mobile-sidebar"
              >
                <Menu className="h-6 w-6 transition-all duration-300" />
              </Button>

              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent lg:hidden transition-all duration-300 hover:scale-105">
                Broslunas Links
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-xl hover:bg-gradient-to-r hover:from-primary/10 hover:to-primary/5 transition-all duration-300 hover:scale-105">
                <ThemeToggle />
              </div>

              {/* User menu */}
              <div className="flex items-center space-x-3 bg-gradient-to-r from-card/50 to-card/30 backdrop-blur-sm rounded-2xl p-3 border border-border/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                {session?.user?.image && (
                  <div className="relative">
                    <Image
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full ring-2 ring-primary/20 hover:ring-primary/40 transition-all duration-300"
                    />
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                  </div>
                )}
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-foreground hover:text-primary transition-colors duration-300">
                    {session?.user?.name}
                  </p>
                  <p className="text-xs text-muted-foreground/80 font-medium">
                    {session?.user?.email}
                  </p>
                </div>

                {/* Logout button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-xl transition-all duration-300 hover:scale-110 group"
                  aria-label="Cerrar sesión y salir del dashboard"
                  title="Cerrar Sesión"
                >
                  <LogOut className="h-5 w-5 transition-all duration-300 group-hover:rotate-12" />
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
    </div>
  );
};

export { DashboardLayout };
