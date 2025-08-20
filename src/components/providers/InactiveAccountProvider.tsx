'use client';

import React from 'react';
import InactiveAccountModal from '../ui/InactiveAccountModal';
import { useInactiveAccountCheck } from '@/hooks/useInactiveAccountCheck';

interface InactiveAccountProviderProps {
  children: React.ReactNode;
}

const InactiveAccountProvider: React.FC<InactiveAccountProviderProps> = ({ children }) => {
  const { shouldShowModal } = useInactiveAccountCheck();

  return (
    <>
      {children}
      <InactiveAccountModal isOpen={shouldShowModal} />
    </>
  );
};

export default InactiveAccountProvider;