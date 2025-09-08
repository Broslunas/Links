'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import CustomDomainManager from '@/components/features/CustomDomainManager';

export default function DomainsPage() {
  const { data: session, status } = useSession();

  // Handle authentication state
  useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.href =
        '/auth/signin?callbackUrl=' + encodeURIComponent(window.location.href);
    }
  }, [status]);

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dominios Personalizados
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestiona tus dominios personalizados para enlaces cortos
          </p>
        </div>
      </div>
      
      <CustomDomainManager />
    </div>
  );
}