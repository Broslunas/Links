import { useState, useEffect } from 'react';

interface MaintenanceState {
    isActive: boolean;
    message?: string;
    estimatedDuration?: number;
    activatedBy?: string;
    activatedAt?: string;
}

export function useMaintenanceSimple() {
    const [maintenanceState, setMaintenanceState] = useState<MaintenanceState>({
        isActive: false,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const response = await fetch('/api/maintenance/status');
                const data = await response.json();
                setMaintenanceState(data);
            } catch (error) {
                console.error('Error fetching maintenance status:', error);
                // Default to safe state
                setMaintenanceState({ isActive: false });
            } finally {
                setLoading(false);
            }
        };

        fetchStatus();
    }, []);

    return { maintenanceState, loading };
}