'use client';

import { signOut } from 'next-auth/react';
import { Button } from '../ui/Button';

export default function LogoutButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => signOut({ callbackUrl: '/dashboard/' })}
    >
      Cerrar Sesión
    </Button>
  );
}
