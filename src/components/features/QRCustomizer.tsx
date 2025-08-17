'use client';

import React from 'react';
import { Button } from '../ui';

export interface QRCustomizationOptions {
  fgColor: string;
  bgColor: string;
  size: number;
  level: 'L' | 'M' | 'Q' | 'H';
  style: 'squares' | 'dots' | 'rounded';
}

interface QRCustomizerProps {
  options: QRCustomizationOptions;
  onChange: (options: QRCustomizationOptions) => void;
  onReset: () => void;
}

const presetColors = [
  { name: 'Clásico', fg: '#000000', bg: '#FFFFFF' },
  { name: 'Azul', fg: '#1E40AF', bg: '#DBEAFE' },
  { name: 'Verde', fg: '#059669', bg: '#D1FAE5' },
  { name: 'Púrpura', fg: '#7C3AED', bg: '#EDE9FE' },
  { name: 'Rojo', fg: '#DC2626', bg: '#FEE2E2' },
  { name: 'Naranja', fg: '#EA580C', bg: '#FED7AA' },
  { name: 'Rosa', fg: '#DB2777', bg: '#FCE7F3' },
  { name: 'Oscuro', fg: '#FFFFFF', bg: '#111827' },
];

const sizeOptions = [
  { value: 128, label: 'XS', description: 'Muy pequeño' },
  { value: 192, label: 'S', description: 'Pequeño' },
  { value: 256, label: 'M', description: 'Mediano' },
  { value: 320, label: 'L', description: 'Grande' },
  { value: 384, label: 'XL', description: 'Muy grande' },
  { value: 512, label: 'XXL', description: 'Extra grande' }
];

const levelOptions = [
  { label: 'Bajo (L)', value: 'L' as const, description: '~7% corrección' },
  { label: 'Medio (M)', value: 'M' as const, description: '~15% corrección' },
  { label: 'Alto (Q)', value: 'Q' as const, description: '~25% corrección' },
  { label: 'Máximo (H)', value: 'H' as const, description: '~30% corrección' },
];

export function QRCustomizer({ options, onChange, onReset }: QRCustomizerProps) {
  const handleColorPreset = (fg: string, bg: string) => {
    onChange({ ...options, fgColor: fg, bgColor: bg });
  };

  const handleCustomColor = (type: 'fg' | 'bg', color: string) => {
    if (type === 'fg') {
      onChange({ ...options, fgColor: color });
    } else {
      onChange({ ...options, bgColor: color });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Colores Predefinidos */}
      <div>
        <h4 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-2 sm:mb-3">
          Combinaciones de Colores
        </h4>
        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
          {presetColors.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handleColorPreset(preset.fg, preset.bg)}
              className={`flex items-center gap-2 p-2 sm:p-2 rounded-lg border transition-all hover:shadow-sm active:scale-95 touch-manipulation ${
                options.fgColor === preset.fg && options.bgColor === preset.bg
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex">
                <div
                  className="w-3 h-3 sm:w-4 sm:h-4 rounded-l border"
                  style={{ backgroundColor: preset.bg }}
                />
                <div
                  className="w-3 h-3 sm:w-4 sm:h-4 rounded-r border"
                  style={{ backgroundColor: preset.fg }}
                />
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {preset.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Colores Personalizados */}
      <div>
        <h4 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-2 sm:mb-3">
          Colores Personalizados
        </h4>
        <div className="grid grid-cols-1 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Color Principal
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={options.fgColor}
                onChange={(e) => handleCustomColor('fg', e.target.value)}
                className="w-10 h-8 sm:w-8 sm:h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer touch-manipulation"
              />
              <input
                type="text"
                value={options.fgColor}
                onChange={(e) => handleCustomColor('fg', e.target.value)}
                className="flex-1 px-2 py-1.5 sm:py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="#000000"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Color de Fondo
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={options.bgColor}
                onChange={(e) => handleCustomColor('bg', e.target.value)}
                className="w-10 h-8 sm:w-8 sm:h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer touch-manipulation"
              />
              <input
                type="text"
                value={options.bgColor}
                onChange={(e) => handleCustomColor('bg', e.target.value)}
                className="flex-1 px-2 py-1.5 sm:py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="#FFFFFF"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tamaño */}
      <div>
        <h4 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-2 sm:mb-3">
          Tamaño
        </h4>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2">
          {sizeOptions.map((size) => (
            <button
              key={size.value}
              onClick={() => onChange({ ...options, size: size.value })}
              className={`p-2 sm:p-3 text-xs font-medium rounded-lg border transition-all active:scale-95 touch-manipulation min-h-[60px] sm:min-h-[70px] ${
                options.size === size.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              title={`${size.description} (${size.value}px)`}
            >
              <div className="text-center">
                <div className="font-bold text-sm sm:text-base">{size.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{size.value}px</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Nivel de Corrección de Errores */}
      <div>
        <h4 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-2 sm:mb-3">
          Corrección de Errores
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
          {levelOptions.map((level) => (
            <button
              key={level.value}
              onClick={() => onChange({ ...options, level: level.value })}
              className={`p-2 sm:p-3 text-center rounded-lg border transition-all active:scale-95 touch-manipulation min-h-[60px] ${
                options.level === level.value
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              title={level.description}
            >
              <div className="text-center">
                <div className="text-lg sm:text-xl font-bold">{level.value}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{level.label}</div>
              </div>
            </button>
          ))}
        </div>
      </div>



      {/* Botón de Reset */}
      <div className="pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          onClick={onReset}
          variant="outline"
          size="sm"
          className="w-full text-xs touch-manipulation active:scale-95"
        >
          Restablecer a valores por defecto
        </Button>
      </div>
    </div>
  );
}

// Valores por defecto
export const defaultQROptions: QRCustomizationOptions = {
  fgColor: '#000000',
  bgColor: '#FFFFFF',
  size: 256,
  level: 'M',
  style: 'squares',
};