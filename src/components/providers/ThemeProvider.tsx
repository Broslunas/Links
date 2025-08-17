'use client';

import { ReactNode } from 'react';

interface ThemeProviderProps {
  children: ReactNode;
}

// Simple wrapper component that doesn't do anything special
// The actual theme logic is handled by the useTheme hook
export function ThemeProvider({ children }: ThemeProviderProps) {
  return <>{children}</>;
}