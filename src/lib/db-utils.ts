import crypto from 'crypto';
import connectDB from './mongodb';

// Re-export connectDB for convenience
export { default as connectDB } from './mongodb';

/**
 * Hash IP address for privacy protection
 * @deprecated Use hashIP from analytics.ts instead
 */
export function hashIP(ip: string): string {
    const secret = process.env.IP_HASH_SECRET || 'default-secret-change-in-production';
    return crypto.createHash('sha256').update(ip + secret).digest('hex');
}

/**
 * Generate a random slug
 */
export function generateSlug(length: number = 6): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Ensure database connection and return connection instance
 */
export async function ensureDBConnection() {
    return await connectDB();
}

/**
 * Parse user agent to extract device type
 */
export function parseDeviceType(userAgent: string): 'mobile' | 'tablet' | 'desktop' {
    const ua = userAgent.toLowerCase();

    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
        return 'mobile';
    }

    if (ua.includes('tablet') || ua.includes('ipad')) {
        return 'tablet';
    }

    return 'desktop';
}

/**
 * Parse user agent to extract browser name
 */
export function parseBrowser(userAgent: string): string {
    const ua = userAgent.toLowerCase();

    if (ua.includes('chrome')) return 'Chrome';
    if (ua.includes('firefox')) return 'Firefox';
    if (ua.includes('safari')) return 'Safari';
    if (ua.includes('edge')) return 'Edge';
    if (ua.includes('opera')) return 'Opera';

    return 'Unknown';
}

/**
 * Parse user agent to extract OS name
 */
export function parseOS(userAgent: string): string {
    const ua = userAgent.toLowerCase();

    if (ua.includes('windows')) return 'Windows';
    if (ua.includes('mac')) return 'macOS';
    if (ua.includes('linux')) return 'Linux';
    if (ua.includes('android')) return 'Android';
    if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) return 'iOS';

    return 'Unknown';
}