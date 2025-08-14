'use client';

import React from 'react';
import { GlobalHeader } from './GlobalHeader';
import { GlobalFooter } from './GlobalFooter';

interface GlobalLayoutProps {
    children: React.ReactNode;
}

const GlobalLayout: React.FC<GlobalLayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen flex flex-col bg-background">
            {/* Global Header */}
            <GlobalHeader />

            {/* Main Content */}
            <main className="flex-1">
                {children}
            </main>

            {/* Global Footer */}
            <GlobalFooter />
        </div>
    );
};

export { GlobalLayout };