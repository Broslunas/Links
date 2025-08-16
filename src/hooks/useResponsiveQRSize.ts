import { useState, useEffect } from 'react';

interface ResponsiveQRSizeOptions {
  baseSize: number;
  showCustomizer: boolean;
  maxWidth?: number;
  minSize?: number;
  maxSize?: number;
}

interface ResponsiveQRSizeResult {
  qrSize: number;
  containerSize: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export const useResponsiveQRSize = ({
  baseSize,
  showCustomizer,
  maxWidth,
  minSize = 128,
  maxSize = 512
}: ResponsiveQRSizeOptions): ResponsiveQRSizeResult => {
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Detectar tipo de dispositivo
  const isMobile = dimensions.width < 640; // sm breakpoint
  const isTablet = dimensions.width >= 640 && dimensions.width < 1024; // md-lg breakpoint
  const isDesktop = dimensions.width >= 1024; // xl breakpoint

  // Calcular tamaño del QR basado en el dispositivo y contexto
  const calculateQRSize = (): number => {
    let calculatedSize = baseSize;
    
    if (showCustomizer) {
      // En modo customizer, ajustar según el espacio disponible
      if (isMobile) {
        // En móvil, usar casi todo el ancho disponible
        calculatedSize = Math.min(
          baseSize,
          dimensions.width - 80, // Margen de 40px a cada lado
          300 // Máximo en móvil
        );
      } else if (isTablet) {
        // En tablet, usar la mitad del ancho disponible
        calculatedSize = Math.min(
          baseSize,
          (dimensions.width / 2) - 100, // Espacio para el customizer
          350 // Máximo en tablet
        );
      } else {
        // En desktop, usar un tamaño fijo más pequeño para dejar espacio al customizer
        calculatedSize = Math.min(
          baseSize,
          280, // Tamaño fijo en desktop con customizer
          (dimensions.width / 2) - 150
        );
      }
    } else {
      // En modo normal (sin customizer)
      if (isMobile) {
        calculatedSize = Math.min(
          baseSize,
          dimensions.width - 60, // Margen más pequeño
          280 // Máximo en móvil sin customizer
        );
      } else if (isTablet) {
        calculatedSize = Math.min(
          baseSize,
          400 // Tamaño cómodo en tablet
        );
      } else {
        // En desktop sin customizer, usar el tamaño base
        calculatedSize = baseSize;
      }
    }

    // Aplicar límites mínimos y máximos
    calculatedSize = Math.max(minSize, Math.min(maxSize, calculatedSize));
    
    // Asegurar que sea múltiplo de 4 para mejor renderizado
    return Math.floor(calculatedSize / 4) * 4;
  };

  // Calcular tamaño del contenedor (puede ser diferente al QR)
  const calculateContainerSize = (): number => {
    const qrSize = calculateQRSize();
    // El contenedor debe ser un poco más grande para el padding
    return qrSize + (isMobile ? 16 : 32);
  };

  return {
    qrSize: calculateQRSize(),
    containerSize: calculateContainerSize(),
    isMobile,
    isTablet,
    isDesktop
  };
};

export default useResponsiveQRSize;