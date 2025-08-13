'use client';

import React from 'react';
import QRCode from 'react-qr-code';
import { Modal } from '../ui/Modal';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title?: string;
}

export function QRCodeModal({ isOpen, onClose, url, title }: QRCodeModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || 'Código QR'}
      description="Escanea este código para acceder al enlace"
      size="sm"
    >
      <div className="p-6 flex flex-col items-center">
        <div className="bg-white p-4 rounded-lg mb-4">
          <QRCode value={url} size={200} />
        </div>
        <p className="text-sm text-muted-foreground text-center break-all">
          {url}
        </p>
      </div>
    </Modal>
  );
}