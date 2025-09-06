'use client';

import React from 'react';
import InactiveAccountModal from '../ui/InactiveAccountModal';
import { useInactiveAccountCheck } from '@/hooks/useInactiveAccountCheck';

interface InactiveAccountProviderProps {
  children: React.ReactNode;
}

const InactiveAccountProvider: React.FC<InactiveAccountProviderProps> = ({ children }) => {
  const { shouldShowModal, closeModal } = useInactiveAccountCheck();

  return (
    <>
      {children}
      <InactiveAccountModal isOpen={shouldShowModal} onClose={closeModal} />
    </>
  );
};

export default InactiveAccountProvider;