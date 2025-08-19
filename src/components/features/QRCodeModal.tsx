'use client';

import React, { useRef, useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { Modal } from '../ui/Modal';
import { Button } from '../ui';
import { QRCustomizer, QRCustomizationOptions, defaultQROptions } from './QRCustomizer';
import { useQRPreferences } from '../../hooks/useQRPreferences';
import { useResponsiveQRSize } from '../../hooks/useResponsiveQRSize';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title?: string;
}

export function QRCodeModal({ isOpen, onClose, url, title }: QRCodeModalProps) {
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const { preferences, updatePreferences, resetPreferences, isLoaded } = useQRPreferences();
  const [qrOptions, setQrOptions] = useState<QRCustomizationOptions>(defaultQROptions);
  const [showCustomizer, setShowCustomizer] = useState(false);

  // Hook para tamaño responsive
  const { qrSize, containerSize, isMobile, isTablet, isDesktop } = useResponsiveQRSize({
    baseSize: qrOptions.size,
    showCustomizer,
    minSize: 192,
    maxSize: 192
  });

  // Load user preferences when component mounts or preferences are loaded
  useEffect(() => {
    if (isLoaded) {
      setQrOptions(preferences);
    }
  }, [isLoaded, preferences]);

  // Prepare URL for QR code
  const getEnhancedUrl = () => {
    // Add protocol if missing to ensure proper scanning
    let enhancedUrl = url;
    if (!/^https?:\/\//i.test(enhancedUrl)) {
      enhancedUrl = 'https://' + enhancedUrl;
    }
    return enhancedUrl;
  };

  // Extract slug from URL for filename
  const getSlugFromUrl = () => {
    try {
      const urlObj = new URL(getEnhancedUrl());
      const pathname = urlObj.pathname;
      // Remove leading slash and get the first segment
      const slug = pathname.replace(/^\//, '').split('/')[0];
      return slug || 'qrcode';
    } catch {
      // If URL parsing fails, try to extract from the original url
      const parts = url.split('/');
      return parts[parts.length - 1] || 'qrcode';
    }
  };

  // Function to download QR code
  const downloadQRCode = () => {
    if (!qrCodeRef.current) return;

    try {
      // Find the SVG element within the container
      const svgElement = qrCodeRef.current.querySelector('svg');
      if (!svgElement) return;

      // Create a canvas element
      const canvas = document.createElement('canvas');
      const downloadSize = qrOptions.size; // Use the actual QR size for download (not the responsive size)
      const margin = 30; // Always include margin for branding

      canvas.width = downloadSize;
      canvas.height = downloadSize + margin; // Increase canvas height to accommodate margin and text

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Fill with custom background color
      ctx.fillStyle = qrOptions.bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw QR code directly from SVG
      const svgString = new XMLSerializer().serializeToString(svgElement);
      const img = new Image();

      img.onload = () => {
        // Draw QR code
        ctx.drawImage(img, 0, 0, downloadSize, downloadSize);

        // Add text at the bottom with margin
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#444444';
        ctx.textAlign = 'center';

        // Position for text - now below the QR code with margin
        const textY = downloadSize + margin / 2 + 5; // Position text in the middle of the margin area
        const textX = downloadSize / 2;

        // Draw text centered
        ctx.fillText('Creado con broslunas.link', textX, textY);

        // Convert to PNG
        try {
          const pngUrl = canvas.toDataURL('image/png');

          // Create a download link
          const downloadLink = document.createElement('a');
          downloadLink.href = pngUrl;
          downloadLink.download = `${getSlugFromUrl()} - Broslunas Link.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        } catch (error) {
          console.error('Error generating QR code PNG:', error);
        }
      };

      img.onerror = () => {
        console.error('Error loading QR code image');
      };

      // Set the source of the image to the SVG data
      img.src =
        'data:image/svg+xml;base64,' +
        btoa(unescape(encodeURIComponent(svgString)));
    } catch (error) {
      console.error('Error in downloadQRCode:', error);
    }
  };

  // Handle QR options change and save to preferences
  const handleQROptionsChange = (newOptions: QRCustomizationOptions) => {
    setQrOptions(newOptions);
    updatePreferences(newOptions);
  };

  // Reset QR options to default
  const resetQROptions = () => {
    setQrOptions(defaultQROptions);
    resetPreferences();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || 'Código QR Personalizable'}
      description="Escanea este código para acceder al enlace"
      size={showCustomizer ? "xl" : "sm"}
    >
      <div className={`${showCustomizer ? 'flex flex-col xl:grid xl:grid-cols-2 gap-4 md:gap-6' : 'flex flex-col items-center'} p-4 md:p-6 max-h-[90vh] overflow-y-auto`}>
        {/* QR Code Preview */}
        <div className="flex flex-col items-center order-1 xl:order-none">
          <div 
            className="p-2 sm:p-4 rounded-lg mb-4 shadow-lg border border-gray-200 max-w-full"
            style={{ backgroundColor: qrOptions.bgColor }}
          >
            <div ref={qrCodeRef} className="p-2 sm:p-4 flex justify-center" style={{ backgroundColor: qrOptions.bgColor }}>
              <QRCode
                value={getEnhancedUrl()}
                size={qrSize}
                level={qrOptions.level}
                fgColor={qrOptions.fgColor}
                bgColor={qrOptions.bgColor}
              />
            </div>
            <p className="text-center text-xs sm:text-sm mt-2" style={{ color: '#444444' }}>
              Creado con broslunas.link
            </p>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground text-center break-all mb-4 px-2">
            {url}
          </p>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 w-full max-w-sm">
            <Button
              onClick={() => setShowCustomizer(!showCustomizer)}
              variant={showCustomizer ? "default" : "outline"}
              size="sm"
              className="flex items-center justify-center gap-2 text-xs sm:text-sm py-2 px-3"
            >
              <svg
                className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="hidden sm:inline">{showCustomizer ? 'Ocultar Opciones' : 'Personalizar'}</span>
              <span className="sm:hidden">{showCustomizer ? 'Ocultar' : 'Opciones'}</span>
            </Button>
            
            <Button
              onClick={downloadQRCode}
              variant="outline"
              size="sm"
              className="flex items-center justify-center gap-2 text-xs sm:text-sm py-2 px-3"
            >
              <svg
                className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              <span className="hidden sm:inline">Descargar PNG</span>
              <span className="sm:hidden">Descargar</span>
            </Button>
          </div>
        </div>

        {/* Customization Panel */}
        {showCustomizer && (
          <div className="border-t xl:border-t-0 xl:border-l border-gray-200 dark:border-gray-700 pt-4 md:pt-6 xl:pt-0 xl:pl-6 order-2 xl:order-none">
            <div className="sticky top-0 bg-white dark:bg-gray-800 pb-2 mb-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                Opciones de Personalización
              </h3>
            </div>
            <div className="max-h-[60vh] xl:max-h-[70vh] overflow-y-auto pr-2">
              <QRCustomizer
                 options={qrOptions}
                 onChange={handleQROptionsChange}
                 onReset={resetQROptions}
               />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
