'use client';

import React from 'react';
import { GlobalHeader } from './GlobalHeader';
import { GlobalFooter } from './GlobalFooter';
import { AnimatedBackground } from '../ui/AnimatedBackground';

interface GlobalLayoutProps {
    children: React.ReactNode;
}

const GlobalLayout: React.FC<GlobalLayoutProps> = ({ children }) => {
    return (
        <AnimatedBackground className="flex flex-col">
            {/* Skip Navigation Links */}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
                Saltar al contenido principal
            </a>
            <a
                href="#main-navigation"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-48 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
                Saltar a la navegación
            </a>
            
            {/* Global Header */}
            <GlobalHeader />

            {/* Main Content */}
            <main id="main-content" className="flex-1">
                {children}
            </main>

            {/* Global Footer */}
            <GlobalFooter />
        </AnimatedBackground>
    );
};

export { GlobalLayout };