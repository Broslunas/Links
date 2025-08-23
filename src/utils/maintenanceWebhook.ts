import { IMaintenanceState } from '@/models/MaintenanceState';

/**
 * Webhook URL for maintenance mode notifications
 */
const WEBHOOK_URL = 'https://hook.eu2.make.com/ygeht1i692ek9jlu89xhcn6e3nuy6gf3';

/**
 * Interface for webhook payload
 */
interface MaintenanceWebhookPayload {
    isActive: boolean;
    activatedBy: string;
    activatedAt: string;
    message?: string;
    estimatedDuration?: number;
    timestamp: string;
    action: 'activated' | 'deactivated';
}

/**
 * Sends maintenance status change notification to webhook
 * @param maintenanceState - The current maintenance state
 * @param previousState - The previous maintenance state (optional)
 */
export async function sendMaintenanceWebhook(
    maintenanceState: IMaintenanceState,
    previousState?: { isActive: boolean }
): Promise<void> {
    try {
        // Determine the action based on state change
        const action = maintenanceState.isActive ? 'activated' : 'deactivated';

        // Only send webhook if state actually changed
        if (previousState && previousState.isActive === maintenanceState.isActive) {
            console.log('Maintenance state unchanged, skipping webhook notification');
            return;
        }

        const payload: MaintenanceWebhookPayload = {
            isActive: maintenanceState.isActive,
            activatedBy: maintenanceState.activatedBy,
            activatedAt: maintenanceState.activatedAt.toISOString(),
            message: maintenanceState.message || undefined,
            estimatedDuration: maintenanceState.estimatedDuration || undefined,
            timestamp: new Date().toISOString(),
            action
        };

        console.log('Sending maintenance webhook notification', {
            action,
            isActive: payload.isActive,
            hasMessage: !!payload.message,
            hasEstimatedDuration: !!payload.estimatedDuration,
            timestamp: payload.timestamp
        });

        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            // Add timeout to prevent hanging
            signal: AbortSignal.timeout(10000) // 10 seconds timeout
        });

        if (!response.ok) {
            throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`);
        }

        console.log('Maintenance webhook notification sent successfully', {
            action,
            status: response.status,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        // Log error but don't throw - webhook failures shouldn't break maintenance functionality
        console.error('Failed to send maintenance webhook notification:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * Sends a test webhook notification
 * @param testData - Optional test data to send
 */
export async function sendTestMaintenanceWebhook(testData?: Partial<MaintenanceWebhookPayload>): Promise<boolean> {
    try {
        const payload: MaintenanceWebhookPayload = {
            isActive: false,
            activatedBy: 'test@example.com',
            activatedAt: new Date().toISOString(),
            message: 'Test webhook notification',
            estimatedDuration: 30,
            timestamp: new Date().toISOString(),
            action: 'deactivated',
            ...testData
        };

        console.log('Sending test maintenance webhook notification');

        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(10000)
        });

        if (!response.ok) {
            throw new Error(`Test webhook request failed: ${response.status} ${response.statusText}`);
        }

        console.log('Test maintenance webhook notification sent successfully', {
            status: response.status
        });

        return true;
    } catch (error) {
        console.error('Failed to send test maintenance webhook notification:', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return false;
    }
}