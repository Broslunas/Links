'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface UserStatusCheckProps {
    children: React.ReactNode;
}

export default function UserStatusCheck({ children }: UserStatusCheckProps) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const checkUserStatus = async () => {
            if (status === 'loading') return;

            if (!session?.user) {
                setIsChecking(false);
                return;
            }

            try {
                const response = await fetch('/api/user/status');
                if (response.ok) {
                    const data = await response.json();
                    if (!data.isActive) {
                        router.push('/account-inactive');
                        return;
                    }
                }
            } catch (error) {
                console.error('Error checking user status:', error);
                // Continue on error to avoid blocking access
            }

            setIsChecking(false);
        };

        checkUserStatus();
    }, [session, status, router]);

    if (isChecking) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return <>{children}</>;
}