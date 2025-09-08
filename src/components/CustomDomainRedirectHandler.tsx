'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface CustomDomainRedirectHandlerProps {
  children: React.ReactNode;
}

export default function CustomDomainRedirectHandler({ children }: CustomDomainRedirectHandlerProps) {
  const router = useRouter();

  useEffect(() => {
    const checkAndRedirect = async () => {
      // Only run on client side
      if (typeof window === 'undefined') return;
      
      const currentDomain = window.location.hostname;
      const currentPath = window.location.pathname;
      const mainDomain = process.env.NEXT_PUBLIC_APP_URL || 'https://broslunas.link';
      
      // Skip if we're already on the main domain or localhost
      if (currentDomain === 'localhost' || 
          currentDomain === '127.0.0.1' || 
          currentDomain.includes('broslunas.link') || 
          currentDomain.includes('vercel.app') ||
          currentDomain.includes('localhost')) {
        return;
      }
      
      // Skip API routes and static files
      if (currentPath.startsWith('/api') || 
          currentPath.startsWith('/_next') || 
          currentPath.startsWith('/favicon') ||
          currentPath.startsWith('/robots') ||
          currentPath.startsWith('/sitemap')) {
        return;
      }
      
      try {
        // Check if this is a custom domain and if we should redirect
        const response = await fetch('/api/custom-domain-check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: currentDomain,
            path: currentPath
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.shouldRedirect && data.redirectUrl) {
            window.location.href = data.redirectUrl;
            return;
          }
        }
      } catch (error) {
        console.error('Error checking custom domain redirect:', error);
      }
    };
    
    checkAndRedirect();
  }, [router]);

  return <>{children}</>;
}