// Shared maintenance state for in-memory storage
// In production, this should be replaced with a proper database or Redis

interface MaintenanceState {
    isActive: boolean;
    message: string | null;
    estimatedDuration: number | null;
    activatedBy: string | null;
    activatedAt: string | null;
}

let maintenanceState: MaintenanceState = {
    isActive: false,
    message: null,
    estimatedDuration: null,
    activatedBy: null,
    activatedAt: null
};

export function getMaintenanceState(): MaintenanceState {
    return { ...maintenanceState };
}

export function setMaintenanceState(newState: Partial<MaintenanceState>): MaintenanceState {
    maintenanceState = { ...maintenanceState, ...newState };
    console.log('Maintenance state updated:', maintenanceState);
    return { ...maintenanceState };
}

export function resetMaintenanceState(): MaintenanceState {
    maintenanceState = {
        isActive: false,
        message: null,
        estimatedDuration: null,
        activatedBy: null,
        activatedAt: null
    };
    return { ...maintenanceState };
}