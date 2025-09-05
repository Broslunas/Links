'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '../ui/Button';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserRole {
  role: 'user' | 'admin';
}

const navigation = [
  {
    name: 'Panel de Control',
    href: '/dashboard',
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z"
        />
      </svg>
    ),
  },
  {
    name: 'Crear Enlace',
    href: '/dashboard/new',
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4v16m8-8H4"
        />
      </svg>
    ),
  },
  {
    name: 'Mis Enlaces',
    href: '/dashboard/links',
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
        />
      </svg>
    ),
  },
  {
    name: 'Analíticas',
    href: '/dashboard/analytics',
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
  {
    name: 'Tiempo Real',
    href: '/dashboard/realtime',
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
  },
  {
    name: 'Ajustes',
    href: '/dashboard/settings',
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
  {
    name: 'Términos y Servicios',
    href: '/terms-and-services',
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 17l4 4 4-4m-4-5v9"
        />
      </svg>
    ),
  },
  {
    name: 'Política de Privacidad',
    href: '/privacy-policy',
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 11c0-1.104.896-2 2-2s2 .896 2 2-2 2-2 2-2-.896-2-2zm0 0V7a4 4 0 118 0v4a4 4 0 01-8 0z"
        />
      </svg>
    ),
  },
];

const adminNavigation = {
  name: 'Administración',
  href: '/dashboard/admin',
  icon: (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  ),
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [userRole, setUserRole] = useState<'user' | 'admin'>('user');

  // Verificar el rol del usuario
  useEffect(() => {
    const checkUserRole = async () => {
      if (!session?.user) return;

      try {
        // Primero intentar obtener el rol de la sesión
        if (session.user.role) {
          setUserRole(session.user.role as 'user' | 'admin');
          return;
        }

        // Fallback: obtener rol del API
        const response = await fetch('/api/user/role');
        if (response.ok) {
          const data = await response.json();
          setUserRole(data.role || 'user');
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        setUserRole('user'); // Default to user role on error
      }
    };

    checkUserRole();
  }, [session]);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/dashboard/' });
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col"
        role="complementary"
        aria-label="Barra lateral de navegación del dashboard"
      >
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-card border-r border-border px-6 py-4">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center">
            <Link
              href="/dashboard"
              className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md"
              aria-label="Broslunas Links - Ir al dashboard"
            >
              <div className="h-8 w-8 rounded-lg flex items-center justify-center">
                <img
                  src="https://cdn.broslunas.com/favicon.png"
                  alt="Broslunas Logo"
                  width="32"
                  height="32"
                />
              </div>
              <span className="text-xl font-bold text-card-foreground">
                Broslunas Links
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav id="dashboard-navigation" className="flex flex-1 flex-col" role="navigation" aria-label="Navegación principal del dashboard">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <h2 className="sr-only">Enlaces de navegación</h2>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map(item => {
                    const isActive =
                      pathname === item.href ||
                      (pathname?.startsWith(item.href + '/') || false);
                    return (
                      <li key={item.name} role="listitem">
                        <Link
                          href={item.href}
                          className={cn(
                            'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                            isActive
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                          )}
                          aria-current={isActive ? 'page' : undefined}
                          aria-label={`Ir a ${item.name}`}
                        >
                          <span aria-hidden="true">{item.icon}</span>
                          <span>{item.name}</span>
                        </Link>
                      </li>
                    );
                  })}
                  {userRole === 'admin' && (
                    <li key={adminNavigation.name} role="listitem">
                      <Link
                        href={adminNavigation.href}
                        className={cn(
                          'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                          (pathname === adminNavigation.href || (pathname?.startsWith(adminNavigation.href + '/') || false))
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        )}
                        aria-current={(pathname === adminNavigation.href || (pathname?.startsWith(adminNavigation.href + '/') || false)) ? 'page' : undefined}
                        aria-label={`Ir a ${adminNavigation.name}`}
                      >
                        <span aria-hidden="true">{adminNavigation.icon}</span>
                        <span>{adminNavigation.name}</span>
                      </Link>
                    </li>
                  )}
                </ul>
              </li>

              {/* Sign out button */}
              <li className="mt-auto" role="listitem">
                <h2 className="sr-only">Acciones de cuenta</h2>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  onClick={handleSignOut}
                  aria-label="Cerrar sesión y salir del dashboard"
                >
                  <svg
                    className="h-5 w-5 mr-3"
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
                  <span>Cerrar Sesión</span>
                </Button>
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 z-50 flex w-64 flex-col transition-transform duration-300 ease-in-out lg:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        role="complementary"
        aria-label="Barra lateral móvil de navegación del dashboard"
      >
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-card border-r border-border px-6 py-4">
          {/* Close button */}
          <div className="flex h-16 shrink-0 items-center justify-between">
            <Link
              href="/dashboard"
              className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md"
              onClick={onClose}
              aria-label="Broslunas Links - Ir al dashboard"
            >
              <div className="h-8 w-8 rounded-lg flex items-center justify-center">
                <img
                  src="https://cdn.broslunas.com/favicon.png"
                  alt="Broslunas Logo"
                  width="32"
                  height="32"
                />
              </div>
              <span className="text-xl font-bold text-card-foreground">
                Broslunas Links
              </span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Cerrar barra lateral"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col" role="navigation" aria-label="Navegación principal del dashboard móvil">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <h2 className="sr-only">Enlaces de navegación</h2>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map(item => {
                    const isActive =
                      pathname === item.href ||
                      (pathname?.startsWith(item.href + '/') || false);
                    return (
                      <li key={item.name} role="listitem">
                        <Link
                          href={item.href}
                          onClick={onClose}
                          className={cn(
                            'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                            isActive
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                          )}
                          aria-current={isActive ? 'page' : undefined}
                          aria-label={`Ir a ${item.name}`}
                        >
                          <span aria-hidden="true">{item.icon}</span>
                          <span>{item.name}</span>
                        </Link>
                      </li>
                    );
                  })}
                  {userRole === 'admin' && (
                    <li key={adminNavigation.name} role="listitem">
                      <Link
                        href={adminNavigation.href}
                        onClick={onClose}
                        className={cn(
                          'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                          (pathname === adminNavigation.href || (pathname?.startsWith(adminNavigation.href + '/') || false))
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        )}
                        aria-current={(pathname === adminNavigation.href || (pathname?.startsWith(adminNavigation.href + '/') || false)) ? 'page' : undefined}
                        aria-label={`Ir a ${adminNavigation.name}`}
                      >
                        <span aria-hidden="true">{adminNavigation.icon}</span>
                        <span>{adminNavigation.name}</span>
                      </Link>
                    </li>
                  )}
                </ul>
              </li>

              {/* Sign out button */}
              <li className="mt-auto" role="listitem">
                <h2 className="sr-only">Acciones de cuenta</h2>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  onClick={handleSignOut}
                  aria-label="Cerrar sesión y salir del dashboard"
                >
                  <svg
                    className="h-5 w-5 mr-3"
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
                  <span>Cerrar Sesión</span>
                </Button>
              </li>
            </ul>
          </nav>
        </div>
      </aside>
    </>
  );
};

export { Sidebar };
