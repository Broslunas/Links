'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { DashboardLayout } from './DashboardLayout';
import { GlobalLayout } from './GlobalLayout';

interface ConditionalLayoutProps {
    children: React.ReactNode;
}

const ConditionalLayout: React.FC<ConditionalLayoutProps> = ({ children }) => {
    const pathname = usePathname();

    // Determine if current route is a dashboard route
    const isDashboardRoute = pathname.startsWith('/dashboard');

    // Apply appropriate layout based on route
    if (isDashboardRoute) {
        return <DashboardLayout>{children}</DashboardLayout>;
    }

    return <GlobalLayout>{children}</GlobalLayout>;
};

export { ConditionalLayout };