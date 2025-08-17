import { UAParser } from 'ua-parser-js';
import crypto from 'crypto';
import { AnalyticsData } from '../types';

/**
 * Hash IP address for privacy protection
 */
export function hashIP(ip: string): string {
    const secret = process.env.IP_HASH_SECRET || 'default-secret-change-in-production';
    return crypto.createHash('sha256').update(ip + secret).digest('hex');
}

/**
 * Get client IP address from request headers
 */
export function getClientIP(request: Request): string {
    // Check various headers for the real IP
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const cfConnectingIP = request.headers.get('cf-connecting-ip');

    if (forwarded) {
        // x-forwarded-for can contain multiple IPs, take the first one
        return forwarded.split(',')[0].trim();
    }

    if (realIP) {
        return realIP;
    }

    if (cfConnectingIP) {
        return cfConnectingIP;
    }

    // Fallback to a default IP for development
    return '127.0.0.1';
}

/**
 * Get geographic information from IP address
 */
export async function getGeoInfo(ip: string) {
    // For localhost/development, return default values
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
        return {
            country: 'Unknown',
            city: 'Unknown',
            region: 'Unknown'
        };
    }

    try {
        // Dynamic import to avoid build-time issues
        const geoipModule = await import('geoip-lite');
        const geoip = geoipModule.default || geoipModule;

        // Check if geoip is properly loaded
        if (!geoip || typeof geoip.lookup !== 'function') {
            console.warn('GeoIP module not properly loaded');
            return {
                country: 'Unknown',
                city: 'Unknown',
                region: 'Unknown'
            };
        }

        const geo = geoip.lookup(ip);

        if (!geo) {
            return {
                country: 'Unknown',
                city: 'Unknown',
                region: 'Unknown'
            };
        }

        return {
            country: geo.country || 'Unknown',
            city: geo.city || 'Unknown',
            region: geo.region || 'Unknown'
        };
    } catch (error) {
        console.warn('GeoIP lookup failed, using fallback:', error instanceof Error ? error.message : String(error));
        return {
            country: 'Unknown',
            city: 'Unknown',
            region: 'Unknown'
        };
    }
}

/**
 * Parse user agent to extract device, OS, and browser information
 */
export function parseUserAgent(userAgent: string) {
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    // Determine device type
    let device: 'mobile' | 'tablet' | 'desktop' = 'desktop';

    if (result.device.type === 'mobile') {
        device = 'mobile';
    } else if (result.device.type === 'tablet') {
        device = 'tablet';
    }

    return {
        device,
        os: result.os.name || 'Unknown',
        browser: result.browser.name || 'Unknown'
    };
}

/**
 * Get browser language from Accept-Language header
 */
export function getBrowserLanguage(request: Request): string {
    const acceptLanguage = request.headers.get('accept-language');

    if (!acceptLanguage) {
        return 'en';
    }

    // Parse the Accept-Language header and get the first language
    const languages = acceptLanguage.split(',');
    const primaryLanguage = languages[0]?.split(';')[0]?.trim();

    return primaryLanguage || 'en';
}

/**
 * Extract analytics data from request
 */
export async function extractAnalyticsData(request: Request): Promise<AnalyticsData> {
    const ip = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || '';
    const referrer = request.headers.get('referer') || undefined;
    const language = getBrowserLanguage(request);

    const geoInfo = await getGeoInfo(ip);
    const userAgentInfo = parseUserAgent(userAgent);

    return {
        country: geoInfo.country,
        city: geoInfo.city,
        region: geoInfo.region,
        language,
        userAgent,
        device: userAgentInfo.device,
        os: userAgentInfo.os,
        browser: userAgentInfo.browser,
        referrer
    };
}