'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { DashboardLayout } from './DashboardLayout';
import { GlobalLayout } from './GlobalLayout';
import { RedirectLayout } from './RedirectLayout';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

const ConditionalLayout: React.FC<ConditionalLayoutProps> = ({ children }) => {
  const pathname = usePathname();

  // Define known routes that should not be treated as redirect routes
  const knownRoutes = [
    '/dashboard',
    '/auth',
    '/api',
    '/help',
    '/features',
    '/pricing',
    '/privacy-policy',
    '/terms-and-services',
    '/cookies',
    '/gdpr',
    '/stats',
    '/status',
    '/temp-links',
    '/robots.txt',
    '/sitemap.xml',
    '/favicon.ico',
  ];

  // Determine if current route is a dashboard route
  const isDashboardRoute = pathname?.startsWith('/dashboard') || false;

  // Determine if current route is a redirect route (slug-based)
  const isRedirectRoute = () => {
    // Skip root path or null pathname
    if (!pathname || pathname === '/') {
      return false;
    }

    // Check if pathname starts with any known route
    const isKnownRoute = knownRoutes.some(route => pathname.startsWith(route));

    if (isKnownRoute) {
      return false;
    }

    // If it's not a known route and not root, it's likely a slug-based redirect route
    // Additional validation: should be a single segment path (no nested paths)
    const pathSegments = pathname
      .split('/')
      .filter(segment => segment.length > 0);

    // Must be exactly one segment and not contain special characters that would indicate it's not a slug
    if (pathSegments.length !== 1) {
      return false;
    }

    // Additional check: the segment should look like a slug (lowercase letters, numbers, hyphens, underscores)
    // This matches the validation used in the actual slug handler
    const slug = pathSegments[0];
    const slugPattern = /^[a-z0-9_-]+$/;
    return slugPattern.test(slug) && slug.length >= 1 && slug.length <= 50;
  };

  // Apply appropriate layout based on route
  if (isDashboardRoute) {
    return <DashboardLayout>{children}</DashboardLayout>;
  }

  if (isRedirectRoute()) {
    return <RedirectLayout>{children}</RedirectLayout>;
  }

  return <GlobalLayout>{children}</GlobalLayout>;
};

export { ConditionalLayout };
