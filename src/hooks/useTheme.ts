import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Get theme from localStorage or default to system
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
      setThemeState(savedTheme);
    }
  }, []);

  useEffect(() => {
    const updateTheme = () => {
      let effectiveTheme: 'light' | 'dark';

      if (theme === 'dark') {
        effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)')
          .matches
          ? 'dark'
          : 'light';
      } else {
        effectiveTheme = theme;
      }

      setResolvedTheme(effectiveTheme);

      // Update document class
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(effectiveTheme);

      // Save to localStorage
      localStorage.setItem('theme', theme);
    };

    updateTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'dark') {
        updateTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return {
    theme,
    resolvedTheme,
    setTheme,
  };
}
