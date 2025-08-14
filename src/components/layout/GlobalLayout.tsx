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
            {/* Global Header */}
            <GlobalHeader />

            {/* Main Content */}
            <main className="flex-1">
                {children}
            </main>

            {/* Global Footer */}
            <GlobalFooter />
        </AnimatedBackground>
    );
};

export { GlobalLayout };