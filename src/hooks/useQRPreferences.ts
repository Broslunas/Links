'use client';

import { useState, useEffect } from 'react';
import {
  QRCustomizationOptions,
  defaultQROptions,
} from '../components/features/QRCustomizer';

const QR_PREFERENCES_KEY = 'brl-qr-preferences';

export function useQRPreferences() {
  const [preferences, setPreferences] =
    useState<QRCustomizationOptions>(defaultQROptions);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(QR_PREFERENCES_KEY);
      if (saved) {
        const parsedPreferences = JSON.parse(saved) as QRCustomizationOptions;
        // Validate that all required properties exist
        const validatedPreferences: QRCustomizationOptions = {
          fgColor: parsedPreferences.fgColor || defaultQROptions.fgColor,
          bgColor: parsedPreferences.bgColor || defaultQROptions.bgColor,
          size: parsedPreferences.size || defaultQROptions.size,
          level: parsedPreferences.level || defaultQROptions.level,
          style: parsedPreferences.style || defaultQROptions.style,
        };
        setPreferences(validatedPreferences);
      }
    } catch (error) {
      console.warn('Error loading QR preferences from localStorage:', error);
      // If there's an error, use default preferences
      setPreferences(defaultQROptions);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save preferences to localStorage whenever they change
  const updatePreferences = (newPreferences: QRCustomizationOptions) => {
    try {
      setPreferences(newPreferences);
      localStorage.setItem(QR_PREFERENCES_KEY, JSON.stringify(newPreferences));
    } catch (error) {
      console.warn('Error saving QR preferences to localStorage:', error);
    }
  };

  // Reset preferences to default
  const resetPreferences = () => {
    try {
      setPreferences(defaultQROptions);
      localStorage.setItem(
        QR_PREFERENCES_KEY,
        JSON.stringify(defaultQROptions)
      );
    } catch (error) {
      console.warn('Error resetting QR preferences:', error);
    }
  };

  // Clear preferences from localStorage
  const clearPreferences = () => {
    try {
      localStorage.removeItem(QR_PREFERENCES_KEY);
      setPreferences(defaultQROptions);
    } catch (error) {
      console.warn('Error clearing QR preferences:', error);
    }
  };

  return {
    preferences,
    updatePreferences,
    resetPreferences,
    clearPreferences,
    isLoaded,
  };
}

// Helper function to validate color format
export function isValidColor(color: string): boolean {
  // Check if it's a valid hex color
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  if (hexRegex.test(color)) {
    return true;
  }

  // Check if it's a valid CSS color name or rgb/rgba
  const tempDiv = document.createElement('div');
  tempDiv.style.color = color;
  return tempDiv.style.color !== '';
}

// Helper function to get contrasting text color
export function getContrastColor(backgroundColor: string): string {
  // Convert hex to RGB
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return black or white based on luminance
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

// Helper function to generate random color
export function generateRandomColor(): string {
  const colors = [
    '#1E40AF',
    '#059669',
    '#7C3AED',
    '#DC2626',
    '#EA580C',
    '#DB2777',
    '#0891B2',
    '#65A30D',
    '#C2410C',
    '#BE185D',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
