'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '../ui/Button';
import { ThemeToggle } from '../ui/ThemeToggle';
import { mainNavigation } from '@/lib/navigation';
import { isActiveNavItem, normalizePathname } from '@/lib/navigation-utils';
import LogoutButton from '../auth/LogoutButton';

interface GlobalHeaderProps {
  currentPath?: string;
}

const GlobalHeader: React.FC<GlobalHeaderProps> = ({ currentPath }) => {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);

  const activePath = normalizePathname(currentPath || pathname || '/');

  const isActive = (href: string) => {
    return isActiveNavItem({ label: '', href }, activePath);
  };

  // Handle keyboard navigation for mobile menu
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!mobileMenuOpen) return;

      const menuItems = mobileMenuRef.current?.querySelectorAll('a, button') as NodeListOf<HTMLElement>;
      if (!menuItems || menuItems.length === 0) return;

      const currentIndex = Array.from(menuItems).findIndex(item => item === document.activeElement);

      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          setMobileMenuOpen(false);
          mobileMenuButtonRef.current?.focus();
          break;
        case 'ArrowDown':
          event.preventDefault();
          const nextIndex = currentIndex < menuItems.length - 1 ? currentIndex + 1 : 0;
          menuItems[nextIndex]?.focus();
          break;
        case 'ArrowUp':
          event.preventDefault();
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : menuItems.length - 1;
          menuItems[prevIndex]?.focus();
          break;
        case 'Home':
          event.preventDefault();
          menuItems[0]?.focus();
          break;
        case 'End':
          event.preventDefault();
          menuItems[menuItems.length - 1]?.focus();
          break;
        case 'Tab':
          // Allow normal tab behavior but trap focus within menu
          const firstItem = menuItems[0];
          const lastItem = menuItems[menuItems.length - 1];
          
          if (event.shiftKey && document.activeElement === firstItem) {
            event.preventDefault();
            lastItem?.focus();
          } else if (!event.shiftKey && document.activeElement === lastItem) {
            event.preventDefault();
            firstItem?.focus();
          }
          break;
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Focus first menu item when menu opens
      setTimeout(() => {
        const firstMenuItem = mobileMenuRef.current?.querySelector('a, button') as HTMLElement;
        firstMenuItem?.focus();
      }, 0);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        !mobileMenuButtonRef.current?.contains(event.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-gray-200 dark:bg-gray-900/95 dark:supports-[backdrop-filter]:bg-gray-900/60 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md"
              aria-label="Broslunas Links - Ir al inicio"
            >
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <img
                  src="https://cdn.broslunas.com/favicon.png"
                  alt="Broslunas Logo"
                />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                Broslunas Links
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav
            id="main-navigation"
            className="hidden md:flex items-center space-x-8"
            role="navigation"
            aria-label="Navegación principal"
          >
            {mainNavigation.items.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-base font-medium transition-colors hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-2 py-1 ${
                  isActive(item.href)
                    ? 'text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
                aria-current={isActive(item.href) ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right side - Theme toggle and Auth buttons */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />

            {/* Authentication buttons */}
            <div className="hidden md:flex items-center space-x-3">
              {status === 'loading' ? (
                <div className="h-9 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ) : session ? (
                <div className="flex items-center space-x-3">
                  <Link href="/dashboard">
                    <Button variant="default" size="sm">
                      Ir al Dashboard
                    </Button>
                  </Link>
                  <LogoutButton />
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link href="/auth/signin">
                    <Button variant="default" size="sm">
                      Acceder
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <Button
              ref={mobileMenuButtonRef}
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={
                mobileMenuOpen
                  ? 'Cerrar menú de navegación'
                  : 'Abrir menú de navegación'
              }
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <nav 
            className="md:hidden" 
            id="mobile-menu" 
            ref={mobileMenuRef}
            role="navigation"
            aria-label="Menú de navegación móvil"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
              {mainNavigation.items.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-3 py-2 text-base font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    isActive(item.href)
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 font-semibold'
                      : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              ))}

              {/* Mobile Auth buttons */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                {status === 'loading' ? (
                  <div className="px-3 py-2">
                    <div className="h-9 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                ) : session ? (
                  <div className="space-y-2">
                    <Link
                      href="/dashboard"
                      className="block px-3 py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button variant="default" size="sm" className="w-full">
                        Ir al Dashboard
                      </Button>
                    </Link>
                    <div className="px-3 py-2" onClick={() => setMobileMenuOpen(false)}>
                      <LogoutButton />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link
                      href="/auth/signin"
                      className="block px-3 py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button variant="default" size="sm" className="w-full">
                        Iniciar Sesión
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export { GlobalHeader };
