'use client';

import React, { useRef, useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { Modal } from '../ui/Modal';
import { Button } from '../ui';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title?: string;
}

export function QRCodeModal({ isOpen, onClose, url, title }: QRCodeModalProps) {
  const qrCodeRef = useRef<HTMLDivElement>(null);
  
  // Prepare URL for QR code
  const getEnhancedUrl = () => {
    // Add protocol if missing to ensure proper scanning
    let enhancedUrl = url;
    if (!/^https?:\/\//i.test(enhancedUrl)) {
      enhancedUrl = 'https://' + enhancedUrl;
    }
    return enhancedUrl;
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
      const qrSize = 240; // Match the QR code size
      const margin = 30; // Margin between QR code and text
      
      canvas.width = qrSize;
      canvas.height = qrSize + margin; // Increase canvas height to accommodate margin and text
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Fill with white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw QR code directly from SVG
      const svgString = new XMLSerializer().serializeToString(svgElement);
      const img = new Image();
      
      img.onload = () => {
        // Draw QR code
        ctx.drawImage(img, 0, 0, qrSize, qrSize);
        
        // Add text at the bottom with favicon icon
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#444444';
        ctx.textAlign = 'center';
        
        // Position for text - now below the QR code with margin
        const textY = qrSize + margin/2 + 5; // Position text in the middle of the margin area
        const textX = qrSize / 2;
        
        // Draw text centered
        ctx.fillText('Creado con broslunas.link', textX, textY);
        
        // Convert to PNG
        try {
          const pngUrl = canvas.toDataURL('image/png');
          
          // Create a download link
          const downloadLink = document.createElement('a');
          downloadLink.href = pngUrl;
          downloadLink.download = 'qrcode.png';
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
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
    } catch (error) {
      console.error('Error in downloadQRCode:', error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || 'Código QR'}
      description="Escanea este código para acceder al enlace"
      size="sm"
    >
      <div className="p-6 flex flex-col items-center">
        <div className="bg-white p-4 rounded-lg mb-4 shadow-lg border border-gray-200">
          <div ref={qrCodeRef} className="p-4 bg-white">
            <QRCode 
              value={getEnhancedUrl()} 
              size={240} 
              level="Q" // Quarter error correction level (25%)
              fgColor="#000000"
              bgColor="#FFFFFF"
            />
          </div>
          <p className="text-center text-sm mt-2" style={{ color: '#444444' }}>
            Creado con broslunas.link
          </p>
        </div>
        <p className="text-sm text-muted-foreground text-center break-all mb-4">
          {url}
        </p>
        <Button 
          onClick={downloadQRCode} 
          variant="outline" 
          size="sm"
          className="flex items-center gap-1"
        >
          <svg
            className="h-4 w-4"
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
          Descargar PNG
        </Button>
      </div>
    </Modal>
  );
}