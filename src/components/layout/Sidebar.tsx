'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '../ui/Button';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Link as LinkIcon, 
  BarChart3, 
  Settings, 
  FileText, 
  Shield, 
  ShieldCheck,
  LogOut,
  X
} from 'lucide-react';

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
    icon: LayoutDashboard,
    gradient: 'from-blue-500 to-purple-600',
  },
  {
    name: 'Mis Enlaces',
    href: '/dashboard/links',
    icon: LinkIcon,
    gradient: 'from-green-500 to-teal-600',
  },
  {
    name: 'Analíticas',
    href: '/dashboard/analytics',
    icon: BarChart3,
    gradient: 'from-orange-500 to-red-600',
  },
  {
    name: 'Ajustes',
    href: '/dashboard/settings',
    icon: Settings,
    gradient: 'from-gray-500 to-slate-600',
  },
  {
    name: 'Términos y Servicios',
    href: '/terms-and-services',
    icon: FileText,
    gradient: 'from-indigo-500 to-blue-600',
  },
  {
    name: 'Política de Privacidad',
    href: '/privacy-policy',
    icon: Shield,
    gradient: 'from-purple-500 to-pink-600',
  },
];

const adminNavigation = {
  name: 'Administración',
  href: '/dashboard/admin',
  icon: ShieldCheck,
  gradient: 'from-red-500 to-orange-600',
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
        <div className="flex grow flex-col gap-y-6 overflow-y-auto bg-gradient-to-b from-card via-card to-card/95 backdrop-blur-sm border-r border-border/50 px-6 py-6 shadow-xl">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center">
            <Link 
              href="/dashboard" 
              className="group flex items-center space-x-3 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-xl p-2 transition-all duration-300 hover:bg-primary/5"
              aria-label="Broslunas Links - Ir al dashboard"
            >
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <img 
                  src="https://cdn.broslunas.com/favicon.png" 
                  alt="Broslunas Logo" 
                  width="24"
                  height="24"
                  className="rounded-md"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-card-foreground group-hover:text-primary transition-colors duration-300">
                  Broslunas
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  Links
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav id="dashboard-navigation" className="flex flex-1 flex-col" role="navigation" aria-label="Navegación principal del dashboard">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <h2 className="sr-only">Enlaces de navegación</h2>
                <ul role="list" className="-mx-2 space-y-2">
                  {navigation.map(item => {
                    const isActive =
                      pathname === item.href ||
                      (pathname?.startsWith(item.href + '/') || false);
                    const IconComponent = item.icon;
                    return (
                      <li key={item.name} role="listitem">
                        <Link
                          href={item.href}
                          className={cn(
                            'group flex gap-x-3 rounded-xl p-3 text-sm leading-6 font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 relative overflow-hidden',
                            isActive
                              ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg shadow-primary/25 scale-[1.02]`
                              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50 hover:shadow-md hover:scale-[1.01]'
                          )}
                          aria-current={isActive ? 'page' : undefined}
                          aria-label={`Ir a ${item.name}`}
                        >
                          <div className={cn(
                            'flex items-center justify-center w-5 h-5 transition-all duration-300',
                            isActive ? 'text-white' : 'text-muted-foreground group-hover:text-foreground'
                          )}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <span className="transition-all duration-300">{item.name}</span>
                          {isActive && (
                            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-20 rounded-xl" />
                          )}
                        </Link>
                      </li>
                    );
                  })}
                  {userRole === 'admin' && (
                    <li key={adminNavigation.name} role="listitem">
                      <div className="mt-4 pt-4 border-t border-border/50">
                        <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2 px-3">
                          Admin
                        </p>
                        <Link
                          href={adminNavigation.href}
                          className={cn(
                            'group flex gap-x-3 rounded-xl p-3 text-sm leading-6 font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 relative overflow-hidden',
                            (pathname === adminNavigation.href || (pathname?.startsWith(adminNavigation.href + '/') || false))
                              ? `bg-gradient-to-r ${adminNavigation.gradient} text-white shadow-lg shadow-red-500/25 scale-[1.02]`
                              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50 hover:shadow-md hover:scale-[1.01]'
                          )}
                          aria-current={(pathname === adminNavigation.href || (pathname?.startsWith(adminNavigation.href + '/') || false)) ? 'page' : undefined}
                          aria-label={`Ir a ${adminNavigation.name}`}
                        >
                          <div className={cn(
                             'flex items-center justify-center w-5 h-5 transition-all duration-300',
                             (pathname === adminNavigation.href || (pathname?.startsWith(adminNavigation.href + '/') || false)) ? 'text-white' : 'text-muted-foreground group-hover:text-foreground'
                           )}>
                             <ShieldCheck className="w-5 h-5" />
                           </div>
                          <span className="transition-all duration-300">{adminNavigation.name}</span>
                          {(pathname === adminNavigation.href || (pathname?.startsWith(adminNavigation.href + '/') || false)) && (
                            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-20 rounded-xl" />
                          )}
                        </Link>
                      </div>
                    </li>
                  )}
                </ul>
              </li>

              {/* Sign out button */}
              <li className="mt-auto" role="listitem">
                <div className="pt-4 border-t border-border/50">
                  <h2 className="sr-only">Acciones de cuenta</h2>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-xl p-3 transition-all duration-300 group"
                    onClick={handleSignOut}
                    aria-label="Cerrar sesión y salir del dashboard"
                  >
                    <LogOut className="h-5 w-5 mr-3 transition-all duration-300 group-hover:scale-110" />
                    <span className="font-semibold">Cerrar Sesión</span>
                  </Button>
                </div>
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
        <div className="flex grow flex-col gap-y-6 overflow-y-auto bg-gradient-to-b from-card via-card to-card/95 backdrop-blur-sm border-r border-border/50 px-6 py-6 shadow-xl">
          {/* Close button */}
          <div className="flex h-16 shrink-0 items-center justify-between">
            <Link
              href="/dashboard"
              className="group flex items-center space-x-3 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-xl p-2 transition-all duration-300 hover:bg-primary/5"
              onClick={onClose}
              aria-label="Broslunas Links - Ir al dashboard"
            >
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <img 
                  src="https://cdn.broslunas.com/favicon.png" 
                  alt="Broslunas Logo" 
                  width="24"
                  height="24"
                  className="rounded-md"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-card-foreground group-hover:text-primary transition-colors duration-300">
                  Broslunas
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  Links
                </span>
              </div>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Cerrar barra lateral"
              className="rounded-xl hover:bg-accent/50 transition-all duration-300 hover:scale-105"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col" role="navigation" aria-label="Navegación principal del dashboard móvil">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <h2 className="sr-only">Enlaces de navegación</h2>
                <ul role="list" className="-mx-2 space-y-2">
                  {navigation.map(item => {
                    const isActive =
                      pathname === item.href ||
                      (pathname?.startsWith(item.href + '/') || false);
                    const IconComponent = item.icon;
                    return (
                      <li key={item.name} role="listitem">
                        <Link
                          href={item.href}
                          onClick={onClose}
                          className={cn(
                            'group flex gap-x-3 rounded-xl p-3 text-sm leading-6 font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 relative overflow-hidden',
                            isActive
                              ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg shadow-primary/25 scale-[1.02]`
                              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50 hover:shadow-md hover:scale-[1.01]'
                          )}
                          aria-current={isActive ? 'page' : undefined}
                          aria-label={`Ir a ${item.name}`}
                        >
                          <div className={cn(
                            'flex items-center justify-center w-5 h-5 transition-all duration-300',
                            isActive ? 'text-white' : 'text-muted-foreground group-hover:text-foreground'
                          )}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <span className="transition-all duration-300">{item.name}</span>
                          {isActive && (
                            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-20 rounded-xl" />
                          )}
                        </Link>
                      </li>
                    );
                  })}
                  {userRole === 'admin' && (
                    <li key={adminNavigation.name} role="listitem">
                      <div className="mt-4 pt-4 border-t border-border/50">
                        <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2 px-3">
                          Admin
                        </p>
                        <Link
                          href={adminNavigation.href}
                          onClick={onClose}
                          className={cn(
                            'group flex gap-x-3 rounded-xl p-3 text-sm leading-6 font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 relative overflow-hidden',
                            (pathname === adminNavigation.href || (pathname?.startsWith(adminNavigation.href + '/') || false))
                              ? `bg-gradient-to-r ${adminNavigation.gradient} text-white shadow-lg shadow-red-500/25 scale-[1.02]`
                              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50 hover:shadow-md hover:scale-[1.01]'
                          )}
                          aria-current={(pathname === adminNavigation.href || (pathname?.startsWith(adminNavigation.href + '/') || false)) ? 'page' : undefined}
                          aria-label={`Ir a ${adminNavigation.name}`}
                        >
                          <div className={cn(
                             'flex items-center justify-center w-5 h-5 transition-all duration-300',
                             (pathname === adminNavigation.href || (pathname?.startsWith(adminNavigation.href + '/') || false)) ? 'text-white' : 'text-muted-foreground group-hover:text-foreground'
                           )}>
                             <ShieldCheck className="w-5 h-5" />
                           </div>
                          <span className="transition-all duration-300">{adminNavigation.name}</span>
                          {(pathname === adminNavigation.href || (pathname?.startsWith(adminNavigation.href + '/') || false)) && (
                            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-20 rounded-xl" />
                          )}
                        </Link>
                      </div>
                    </li>
                  )}
                </ul>
              </li>

              {/* Sign out button */}
              <li className="mt-auto" role="listitem">
                <div className="pt-4 border-t border-border/50">
                  <h2 className="sr-only">Acciones de cuenta</h2>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-xl p-3 transition-all duration-300 group"
                    onClick={handleSignOut}
                    aria-label="Cerrar sesión y salir del dashboard"
                  >
                    <LogOut className="h-5 w-5 mr-3 transition-all duration-300 group-hover:scale-110" />
                    <span className="font-semibold">Cerrar Sesión</span>
                  </Button>
                </div>
              </li>
            </ul>
          </nav>
        </div>
      </aside>
     </>
   );
 };

export { Sidebar };
