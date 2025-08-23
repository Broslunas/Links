'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useMaintenanceStatus } from '@/hooks/useMaintenance';

export default function MaintenanceDebug() {
    const { data: session } = useSession();
    const { maintenanceState, loading, refresh } = useMaintenanceStatus();
    const [apiTest, setApiTest] = useState<any>(null);

    const testAPI = async () => {
        try {
            const response = await fetch('/api/maintenance/status');
            const data = await response.json();
            setApiTest({ success: true, data });
        } catch (error) {
            setApiTest({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
        }
    };

    return (
        <div className="bg-gray-100 p-4 m-4 rounded border">
            <h3 className="font-bold mb-2">Debug Info:</h3>
            <div className="space-y-2 text-sm">
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={refresh}
                        className="px-3 py-1 bg-blue-500 text-white rounded text-xs"
                    >
                        Refresh Hook
                    </button>
                    <button
                        onClick={testAPI}
                        className="px-3 py-1 bg-green-500 text-white rounded text-xs"
                    >
                        Test API Direct
                    </button>
                </div>

                <div>
                    <strong>Session:</strong>
                    <pre className="bg-white p-2 rounded text-xs overflow-auto">
                        {JSON.stringify({
                            hasSession: !!session,
                            email: session?.user?.email,
                            role: session?.user?.role,
                            user: session?.user
                        }, null, 2)}
                    </pre>
                </div>

                <div>
                    <strong>Hook Maintenance State:</strong>
                    <pre className="bg-white p-2 rounded text-xs overflow-auto">
                        {JSON.stringify({
                            loading,
                            maintenanceState
                        }, null, 2)}
                    </pre>
                </div>

                {apiTest && (
                    <div>
                        <strong>Direct API Test:</strong>
                        <pre className="bg-white p-2 rounded text-xs overflow-auto">
                            {JSON.stringify(apiTest, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}