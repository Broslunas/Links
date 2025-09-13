import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth-simple';
import { reportSuspiciousActivity, reportDisabledUserAccess } from './notification-service';
import User from '../models/User';
import { connectDB } from './mongodb';

export interface ActivityContext {
    userId?: string;
    userEmail?: string;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isActive: boolean;
    ipAddress?: string;
    userAgent?: string;
    path: string;
    method: string;
}

class ActivityMonitor {
    // Track user activity and detect suspicious patterns
    async trackActivity(request: NextRequest, context: ActivityContext) {
        try {
            const { userId, isAuthenticated, isActive, path, method } = context;

            // Skip monitoring for non-user activities
            if (!userId || !isAuthenticated) return;

            // Check for disabled user access attempts
            if (!isActive) {
                await this.handleDisabledUserAccess(userId, {
                    path,
                    method,
                    ipAddress: context.ipAddress,
                    userAgent: context.userAgent,
                });
                return;
            }

            // Monitor suspicious activities for warned users
            await this.checkSuspiciousActivity(userId, {
                path,
                method,
                ipAddress: context.ipAddress,
                userAgent: context.userAgent,
            });

        } catch (error) {
            console.error('Error tracking activity:', error);
        }
    }

    // Handle disabled user access attempts
    private async handleDisabledUserAccess(userId: string, metadata: any) {
        const attemptType = this.categorizeAccessAttempt(metadata.path, metadata.method);

        await reportDisabledUserAccess(userId, attemptType, {
            ...metadata,
            timestamp: new Date().toISOString(),
        });
    }

    // Check for suspicious activity patterns
    private async checkSuspiciousActivity(userId: string, metadata: any) {
        const activityType = this.categorizeActivity(metadata.path, metadata.method);

        // Define suspicious activity patterns
        const suspiciousPatterns = [
            'admin_access_attempt',
            'bulk_operations',
            'api_abuse',
            'unusual_endpoint_access',
            'rapid_requests',
        ];

        if (suspiciousPatterns.includes(activityType)) {
            await reportSuspiciousActivity(userId, activityType, {
                ...metadata,
                timestamp: new Date().toISOString(),
            });
        }
    }

    // Categorize access attempts for disabled users
    private categorizeAccessAttempt(path: string, method: string): string {
        if (path.includes('/admin')) {
            return 'admin_panel_access';
        }

        if (path.includes('/api/')) {
            return 'api_access';
        }

        if (method === 'POST' && path.includes('/auth/')) {
            return 'authentication_attempt';
        }

        if (path.includes('/dashboard') || path.includes('/profile')) {
            return 'dashboard_access';
        }

        return 'general_access';
    }

    // Categorize activity types for suspicious behavior detection
    private categorizeActivity(path: string, method: string): string {
        // Admin access attempts by non-admin users
        if (path.includes('/admin')) {
            return 'admin_access_attempt';
        }

        // Bulk operations
        if (method === 'POST' && (
            path.includes('/bulk') ||
            path.includes('/batch') ||
            path.includes('/multiple')
        )) {
            return 'bulk_operations';
        }

        // API abuse patterns
        if (path.includes('/api/') && (
            path.includes('/users/') ||
            path.includes('/links/') ||
            path.includes('/analytics/')
        )) {
            return 'api_access';
        }

        // Unusual endpoint access
        if (path.includes('/internal/') || path.includes('/debug/')) {
            return 'unusual_endpoint_access';
        }

        // File operations
        if (method === 'POST' && (
            path.includes('/upload') ||
            path.includes('/download') ||
            path.includes('/export')
        )) {
            return 'file_operations';
        }

        return 'general_activity';
    }

    // Extract activity context from request
    async extractActivityContext(request: NextRequest): Promise<ActivityContext> {
        try {
            const session = await getServerSession(authOptions);
            const path = new URL(request.url).pathname;
            const method = request.method;

            // Get IP address
            const ipAddress = request.headers.get('x-forwarded-for') ||
                request.headers.get('x-real-ip') ||
                'unknown';

            // Get user agent
            const userAgent = request.headers.get('user-agent') || 'unknown';

            let context: ActivityContext = {
                isAuthenticated: !!session?.user,
                isAdmin: false,
                isActive: true,
                ipAddress,
                userAgent,
                path,
                method,
            };

            if (session?.user?.email) {
                await connectDB();
                const user = await User.findOne({ email: session.user.email });

                if (user) {
                    context.userId = user._id?.toString() || '';
                    context.userEmail = user.email;
                    context.isAdmin = user.role === 'admin';
                    context.isActive = user.isActive ?? true;
                }
            }

            return context;
        } catch (error) {
            console.error('Error extracting activity context:', error);
            return {
                isAuthenticated: false,
                isAdmin: false,
                isActive: true,
                path: new URL(request.url).pathname,
                method: request.method,
            };
        }
    }
}

// Singleton instance
export const activityMonitor = new ActivityMonitor();

// Helper function to monitor request
export const monitorRequest = async (request: NextRequest) => {
    const context = await activityMonitor.extractActivityContext(request);
    await activityMonitor.trackActivity(request, context);
    return context;
};

export default ActivityMonitor;